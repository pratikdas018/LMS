import User from "../models/User.js";
import Course from "../models/Course.js";
import Progress from "../models/Progress.js";
import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";
import sendEmail from "../utils/sendEmail.js";

const isBrevoIpBlockedError = (message = "") =>
  /unrecognised ip address|unrecognized ip address|authorised ips/i.test(
    message.toLowerCase()
  );

export const register = async (req, res) => {
  try {
    const { name, email, password, role } = req.body;
    console.log("🔹 Register Request:", req.body);

    if (!name || !email || !password) {
       return res.status(400).json({ message: "All fields are required" });
    }

    if (password.length < 6) {
      return res.status(400).json({ message: "Password must be at least 6 characters" });
    }

    // Remove all whitespace/newlines to prevent copy-paste errors
    const lowerEmail = email ? email.toLowerCase().trim() : "";

    const existingUser = await User.findOne({ email: lowerEmail });
    if (existingUser) {
      return res.status(400).json({ message: "User already exists" });
    }

    const hashed = await bcrypt.hash(password, 10);

    const otp = Math.floor(100000 + Math.random() * 900000).toString();

    const user = await User.create({
      name,
      email: lowerEmail,
      password: hashed,
      role: role || "student",
      isVerified: false,
      loginOtp: otp,
      loginOtpExpire: Date.now() + 10 * 60 * 1000,
      lastOtpResentAt: Date.now()
    });

    console.log("✅ User registered:", user.email);

    // Send Verification OTP via Brevo
    try {
      await sendEmail({
        email: lowerEmail,
        subject: "Verify Your Account",
        message: `<p>Your account verification code is: <strong style="font-size: 1.2em; color: #2563eb;">${otp}</strong></p><p>This code expires in 10 minutes.</p>`,
        templateId: process.env.BREVO_OTP_TEMPLATE_ID,
        params: { otp }
      });
    } catch (emailError) {
      console.error("❌ Registration OTP Email Error:", emailError.message);
    }

    res.status(201).json({ message: "Verification code sent to your email", email: lowerEmail });
  } catch (err) {
    console.error("❌ Registration Error:", err);
    res.status(500).json({ message: "Registration failed" });
  }
};

export const login = async (req, res) => {
  try {
    const { email, password, rememberMe } = req.body;
    console.log("🔹 Login Request:", req.body);

    if (!email || !password) {
        return res.status(400).json({ message: "Email and password are required" });
    }

    // Remove all whitespace/newlines to prevent copy-paste errors
    const lowerEmail = email ? email.toLowerCase().trim() : "";

    // 1. Try exact match (normalized)
    let user = await User.findOne({ email: lowerEmail });

    // 2. If not found, try case-insensitive regex (handles old/legacy data)
    if (!user) {
        user = await User.findOne({ email: { $regex: new RegExp(`^${lowerEmail}$`, 'i') } });
    }

    if (!user) {
      console.log("❌ Login failed: User not found for email:", lowerEmail);
      return res.status(401).json({ message: "Invalid credentials" });
    }

    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) {
      console.log("❌ Login failed: Password mismatch for user:", user.email);
      // Debug helper: Check if password looks unhashed
      if (!user.password.startsWith("$2")) {
          console.log("⚠️ WARNING: Stored password is not hashed. Please re-register this user.");
      }
      return res.status(401).json({ message: "Invalid credentials" });
    }

    // Check if OTP verification is needed (skip if verified within last 7 days)
    const SEVEN_DAYS_IN_MS = 7 * 24 * 60 * 60 * 1000;
    const isRecentlyVerified = user.isVerified && user.lastOtpVerification && (Date.now() - new Date(user.lastOtpVerification).getTime() < SEVEN_DAYS_IN_MS);

    if (isRecentlyVerified) {
       const token = jwt.sign(
        { id: user._id, role: user.role },
        process.env.JWT_SECRET,
        { expiresIn: rememberMe ? "30d" : "1d" }
      );

      console.log("✅ Login successful (OTP skipped):", user.email);
      
      user.password = undefined; 
      return res.status(200).json({ 
          success: true, 
          token, 
          user 
      });
    }

    // Check if account is locked
    if (user.lockUntil && user.lockUntil > Date.now()) {
      const remaining = Math.ceil((user.lockUntil - Date.now()) / 60000);
      return res.status(403).json({ message: `Account locked due to too many failed attempts. Try again in ${remaining} minutes.` });
    }

    // Rate limiting: 60 seconds cooldown between OTP sends
    const now = Date.now();
    const cooldown = 60 * 1000;
    if (user.lastOtpResentAt && (now - new Date(user.lastOtpResentAt).getTime() < cooldown)) {
      const secondsLeft = Math.ceil((cooldown - (now - new Date(user.lastOtpResentAt).getTime())) / 1000);
      return res.status(429).json({ message: `Please wait ${secondsLeft} seconds before requesting another code.` });
    }

    // Generate OTP
    const otp = Math.floor(100000 + Math.random() * 900000).toString();
    
    // Save OTP to user
    user.loginOtp = otp;
    user.loginOtpExpire = Date.now() + 10 * 60 * 1000; // 10 minutes
    user.lastOtpResentAt = now;
    user.otpAttempts = 0; // Reset attempts for the new OTP session
    await user.save({ validateBeforeSave: false });

    // Send OTP via Email
    try {
      await sendEmail({
        email: lowerEmail,
        subject: "CodeLMS Verification Code",
        message: `
          <div style="font-family: Arial, sans-serif; color: #333; padding: 20px; border: 1px solid #eee; border-radius: 10px; max-width: 600px; margin: 0 auto;">
            <h2 style="color: #2563eb; text-align: center;">Login Verification</h2>
            <p>Hello,</p>
            <p>To complete your login to CodeLMS, please use the following verification code:</p>
            <div style="font-size: 32px; font-weight: bold; letter-spacing: 8px; color: #2563eb; margin: 30px 0; text-align: center; background-color: #f8fafc; padding: 20px; border-radius: 8px; border: 1px dashed #cbd5e1;">${otp}</div>
            <p>This code will expire in <strong>10 minutes</strong>. If you did not request this code, please secure your account.</p>
            <hr style="border: none; border-top: 1px solid #eee;" />
            <p style="font-size: 12px; color: #777; text-align: center;">CodeLMS Support Team</p>
          </div>
        `,
        templateId: process.env.BREVO_OTP_TEMPLATE_ID,
        params: { otp }
      });

      console.log(`📧 OTP sent to ${lowerEmail}`);
      return res.status(200).json({
        success: true,
        requireOtp: true,
        message: "Verification code sent to your email",
        email: user.email
      });
    } catch (emailError) {
      const emailErrMessage = emailError?.message || "Email service unavailable";
      console.error("❌ Email Service Error:", emailErrMessage);

      if (isBrevoIpBlockedError(emailErrMessage)) {
        return res.status(503).json({
          message:
            "Email provider blocked this IP. Whitelist your IP in Brevo or configure SMTP fallback in backend/.env."
        });
      }

      return res.status(500).json({
        message: "Failed to send verification email. Please try again later.",
        error: emailErrMessage
      });
    }
  } catch (err) {
    console.error("❌ Login Error:", err);
    res.status(500).json({ message: "Login failed" });
  }
};

export const verifyRegisterOtp = async (req, res) => {
  try {
    const { email, otp } = req.body;

    if (!email || !otp) {
      return res.status(400).json({ message: "Email and OTP are required" });
    }

    const lowerEmail = email.toLowerCase().trim();
    const user = await User.findOne({ email: lowerEmail });

    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }

    // Check if account is locked
    if (user.lockUntil && user.lockUntil > Date.now()) {
      const remaining = Math.ceil((user.lockUntil - Date.now()) / 60000);
      return res.status(403).json({ message: `Account locked due to too many failed attempts. Try again in ${remaining} minutes.` });
    }

    // Validate OTP
    if (user.loginOtp !== otp || !user.loginOtpExpire || user.loginOtpExpire < Date.now()) {
      user.otpAttempts = (user.otpAttempts || 0) + 1;
      if (user.otpAttempts >= 5) {
        user.lockUntil = Date.now() + 30 * 60 * 1000; // Lock for 30 minutes
      }
      await user.save({ validateBeforeSave: false });
      return res.status(400).json({ 
        message: user.otpAttempts >= 5 
          ? "Too many failed attempts. Account locked for 30 minutes." 
          : "Invalid or expired OTP" 
      });
    }

    // Mark as verified and clear OTP
    user.isVerified = true;
    user.loginOtp = undefined;
    user.loginOtpExpire = undefined;
    user.otpAttempts = 0;
    user.lockUntil = undefined;
    user.lastOtpVerification = Date.now();
    await user.save({ validateBeforeSave: false });

    // Send Welcome Email now that they are verified
    try {
      await sendEmail({
        email: user.email,
        templateId: process.env.BREVO_WELCOME_TEMPLATE_ID,
        params: { name: user.name, loginUrl: `${process.env.CLIENT_URL || 'http://localhost:5173'}/login` }
      });
    } catch (emailError) {
      console.error("❌ Welcome Email Error:", emailError.message);
    }

    res.status(200).json({ success: true, message: "Account verified successfully. You can now login." });
  } catch (err) {
    console.error("❌ Verify Registration OTP Error:", err);
    res.status(500).json({ message: "Verification failed" });
  }
};

export const resendRegistrationOtp = async (req, res) => {
  try {
    const { email } = req.body;
    if (!email) return res.status(400).json({ message: "Email is required" });

    const lowerEmail = email.toLowerCase().trim();
    const user = await User.findOne({ email: lowerEmail });

    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }

    if (user.isVerified) {
      return res.status(400).json({ message: "Account is already verified. Please login." });
    }

    // Check if account is locked
    if (user.lockUntil && user.lockUntil > Date.now()) {
      const remaining = Math.ceil((user.lockUntil - Date.now()) / 60000);
      return res.status(403).json({ message: `Account locked due to too many failed attempts. Try again in ${remaining} minutes.` });
    }

    // Rate limiting: 60 seconds cooldown between resends
    const now = Date.now();
    const cooldown = 60 * 1000; // 60 seconds
    if (user.lastOtpResentAt && (now - new Date(user.lastOtpResentAt).getTime() < cooldown)) {
      const secondsLeft = Math.ceil((cooldown - (now - new Date(user.lastOtpResentAt).getTime())) / 1000);
      return res.status(429).json({ message: `Please wait ${secondsLeft} seconds before requesting another code.` });
    }

    const otp = Math.floor(100000 + Math.random() * 900000).toString();
    user.loginOtp = otp;
    user.loginOtpExpire = Date.now() + 10 * 60 * 1000;
    user.lastOtpResentAt = now;
    await user.save({ validateBeforeSave: false });

    try {
      await sendEmail({
        email: lowerEmail,
        subject: "Verify Your Account",
        message: `<p>Your account verification code is: <strong style="font-size: 1.2em; color: #2563eb;">${otp}</strong></p><p>This code expires in 10 minutes.</p>`,
        templateId: process.env.BREVO_OTP_TEMPLATE_ID,
        params: { otp }
      });
      res.status(200).json({ message: "OTP resent successfully" });
    } catch (emailError) {
      const emailErrMessage = emailError?.message || "Email service unavailable";
      console.error("❌ Resend Registration OTP Email Error:", emailErrMessage);

      if (isBrevoIpBlockedError(emailErrMessage)) {
        return res.status(503).json({
          message:
            "Email provider blocked this IP. Whitelist your IP in Brevo or configure SMTP fallback in backend/.env."
        });
      }

      res.status(500).json({ message: "Failed to send email" });
    }
  } catch (err) {
    console.error("❌ Resend Registration OTP Error:", err);
    res.status(500).json({ message: "Server error" });
  }
};

export const verifyLoginOtp = async (req, res) => {
  try {
    const { email, otp, rememberMe } = req.body;

    if (!email || !otp) {
      return res.status(400).json({ message: "Email and OTP are required" });
    }

    const lowerEmail = email ? email.toLowerCase().trim() : "";
    const user = await User.findOne({ email: lowerEmail });

    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }

    // Check if account is locked
    if (user.lockUntil && user.lockUntil > Date.now()) {
      const remaining = Math.ceil((user.lockUntil - Date.now()) / 60000);
      return res.status(403).json({ message: `Account locked due to too many failed attempts. Try again in ${remaining} minutes.` });
    }

    // Validate OTP
    if (user.loginOtp !== otp || !user.loginOtpExpire || user.loginOtpExpire < Date.now()) {
      user.otpAttempts = (user.otpAttempts || 0) + 1;
      if (user.otpAttempts >= 5) {
        user.lockUntil = Date.now() + 30 * 60 * 1000; // Lock for 30 minutes
      }
      await user.save({ validateBeforeSave: false });
      return res.status(400).json({ 
        message: user.otpAttempts >= 5 
          ? "Too many failed attempts. Account locked for 30 minutes." 
          : "Invalid or expired OTP" 
      });
    }

    // Clear OTP
    user.loginOtp = undefined;
    user.loginOtpExpire = undefined;
    user.isVerified = true;
    user.otpAttempts = 0;
    user.lockUntil = undefined;
    user.lastOtpVerification = Date.now();
    await user.save({ validateBeforeSave: false });

    // 🔥 AUTO ENROLL FIRST COURSE (DEMO MODE)
    // 🔥 AUTO ENROLL (DEMO MODE ONLY)
    if (process.env.AUTO_ENROLL === "true") {
      const firstCourse = await Course.findOne();

      if (firstCourse && !firstCourse.students.includes(user._id)) {
        firstCourse.students.push(user._id);
        await firstCourse.save();

        const existingProgress = await Progress.findOne({
          userId: user._id,
          courseId: firstCourse._id
        });

        if (!existingProgress) {
          await Progress.create({
            userId: user._id,
            courseId: firstCourse._id,
            completedLessons: 0,
            totalLessons: 5
          });
        }
      }
    }

    const token = jwt.sign(
      { id: user._id, role: user.role },
      process.env.JWT_SECRET,
      { expiresIn: rememberMe ? "30d" : "1d" }
    );

    console.log("✅ Login successful:", user.email);
    
    // Send success flag and exclude password from response
    user.password = undefined; 
    res.status(200).json({ 
        success: true, 
        token, 
        user 
    });
  } catch (err) {
    console.error("❌ Verify OTP Error:", err);
    res.status(500).json({ message: "Verification failed" });
  }
};

export const resendOtp = async (req, res) => {
  try {
    const user = await User.findById(req.user.id);
    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }

    // Check if account is locked
    if (user.lockUntil && user.lockUntil > Date.now()) {
      const remaining = Math.ceil((user.lockUntil - Date.now()) / 60000);
      return res.status(403).json({ message: `Account locked due to too many failed attempts. Try again in ${remaining} minutes.` });
    }

    // Rate limiting: 60 seconds cooldown
    const now = Date.now();
    const cooldown = 60 * 1000;
    if (user.lastOtpResentAt && (now - new Date(user.lastOtpResentAt).getTime() < cooldown)) {
      const secondsLeft = Math.ceil((cooldown - (now - new Date(user.lastOtpResentAt).getTime())) / 1000);
      return res.status(429).json({ message: `Please wait ${secondsLeft} seconds before requesting another code.` });
    }

    // Generate OTP
    const otp = Math.floor(100000 + Math.random() * 900000).toString();
    
    // Save OTP to user
    user.loginOtp = otp;
    user.loginOtpExpire = Date.now() + 10 * 60 * 1000; // 10 minutes
    user.lastOtpResentAt = now;
    await user.save({ validateBeforeSave: false });

    try {
      await sendEmail({
        email: user.email,
        subject: "Your Verification Code",
        message: `<p>Your verification code is: <strong style="font-size: 1.2em; color: #2563eb;">${otp}</strong></p><p>This code expires in 10 minutes.</p>`,
        templateId: process.env.BREVO_OTP_TEMPLATE_ID,
        params: { otp }
      });

      return res.status(200).json({ message: "Verification code sent" });
    } catch (emailError) {
      const emailErrMessage = emailError?.message || "Email service unavailable";
      console.error("❌ Resend OTP Email Error:", emailErrMessage);

      if (isBrevoIpBlockedError(emailErrMessage)) {
        return res.status(503).json({
          message:
            "Email provider blocked this IP. Whitelist your IP in Brevo or configure SMTP fallback in backend/.env."
        });
      }

      return res.status(500).json({ message: "Email service unavailable" });
    }
  } catch (err) {
    console.error("❌ Resend OTP Error:", err);
    res.status(500).json({ message: "Failed to resend OTP" });
  }
};

// Add this to your existing imports if needed, or ensure User is imported
// import User from "../models/User.js";

export const getMe = async (req, res) => {
  try {
    // req.user is set by the 'protect' middleware. Token payload uses 'id'.
    const user = await User.findById(req.user.id).select("-password");
    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }
    res.json(user);
  } catch (error) {
    console.error("getMe Error:", error);
    res.status(500).json({ message: "Server error" });
  }
};
