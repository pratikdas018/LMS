import api from "../utils/axios";
import { useState, useEffect } from "react";
import { useNavigate, Link } from "react-router-dom";
import LoadingOverlay from "../components/LoadingOverlay";

const REGISTER_UNLOCK_KEY = "lms_register_unlocked";
const REGISTER_REDIRECTED_ONCE_KEY = "lms_register_redirected_once";

export default function Register() {
  const navigate = useNavigate();

  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [showOtp, setShowOtp] = useState(false);
  const [otp, setOtp] = useState("");
  const [timer, setTimer] = useState(0);
  const [loadingStatus, setLoadingStatus] = useState("loading");
  const [allowRegisterPage, setAllowRegisterPage] = useState(false);

  useEffect(() => {
    const isUnlocked = sessionStorage.getItem(REGISTER_UNLOCK_KEY) === "true";
    const redirectedOnce = sessionStorage.getItem(REGISTER_REDIRECTED_ONCE_KEY) === "true";

    if (isUnlocked || redirectedOnce) {
      setAllowRegisterPage(true);
      return;
    }

    sessionStorage.setItem(REGISTER_REDIRECTED_ONCE_KEY, "true");
    navigate("/", { replace: true });
  }, [navigate]);

  useEffect(() => {
    let interval;
    if (timer > 0) {
      interval = setInterval(() => {
        setTimer((prev) => prev - 1);
      }, 1000);
    }
    return () => clearInterval(interval);
  }, [timer]);

  const register = async () => {
    setIsSubmitting(true);
    setLoadingStatus("loading");

    try {
      await api.post("/auth/register", {
        name,
        email,
        password
      });

      setLoadingStatus("success");
      setTimeout(() => {
        setShowOtp(true);
        setTimer(60);
        setIsSubmitting(false);
      }, 1200);
    } catch (error) {
      alert(error.response?.data?.message || "Registration failed");
      setIsSubmitting(false);
    }
  };

  const handleResendOtp = async () => {
    if (timer > 0) return;

    setIsSubmitting(true);
    setLoadingStatus("loading");
    try {
      await api.post("/auth/resend-registration-otp", {
        email: email.toLowerCase().trim()
      });
      setLoadingStatus("success");
      setTimer(60);
      setTimeout(() => setIsSubmitting(false), 1200);
    } catch (error) {
      alert(error.response?.data?.message || "Failed to resend OTP");
      setIsSubmitting(false);
    }
  };

  const handleVerifyOtp = async () => {
    setIsSubmitting(true);
    setLoadingStatus("loading");

    try {
      await api.post("/auth/verify-registration", {
        email: email.toLowerCase().trim(),
        otp
      });
      setLoadingStatus("success");
      setTimeout(() => navigate("/login"), 1200);
    } catch (error) {
      alert(error.response?.data?.message || "Verification failed");
      setIsSubmitting(false);
    }
  };

  if (!allowRegisterPage) {
    return null;
  }

  return (
    <div className="home-shell home-font-body min-h-screen px-4 py-10 sm:px-6">
      <div className="max-w-7xl mx-auto grid grid-cols-1 xl:grid-cols-[1.05fr_1fr] gap-8 items-stretch">
        <section className="hidden xl:flex relative overflow-hidden rounded-[2rem] bg-slate-950 text-white p-10 border border-slate-800">
          <div className="home-orb home-orb-one" />
          <div className="home-orb home-orb-two" />
          <div className="home-grid-pattern" />

          <div className="relative z-10 flex flex-col justify-between">
            <div>
              <p className="inline-flex rounded-full border border-white/30 bg-white/10 px-3 py-1 text-xs tracking-wide">
                New Learner Onboarding
              </p>
              <h1 className="home-font-title mt-4 text-4xl leading-tight font-extrabold">
                Join LMS and start building your skills.
              </h1>
              <p className="mt-4 text-slate-300 text-sm max-w-lg">
                Create your account, verify email, and unlock a modern workflow for courses,
                tasks, quizzes, and certificates.
              </p>
            </div>

            <div className="space-y-3 text-sm text-slate-200">
              <p className="rounded-xl border border-white/15 bg-white/10 px-4 py-3">Role-based access for student, teacher, and admin</p>
              <p className="rounded-xl border border-white/15 bg-white/10 px-4 py-3">Progress tracking with certificate readiness</p>
              <p className="rounded-xl border border-white/15 bg-white/10 px-4 py-3">Secure OTP verification for new registrations</p>
              <Link to="/" className="inline-flex mt-2 text-cyan-300 hover:text-cyan-200 font-semibold">
                See platform overview first
              </Link>
            </div>
          </div>
        </section>

        <section className="rounded-[2rem] border border-slate-200 bg-white/95 p-6 sm:p-8 shadow-xl backdrop-blur">
          <div className="flex items-start justify-between gap-4 mb-6">
            <div>
              <p className="text-xs font-semibold tracking-[0.12em] text-emerald-700">ACCOUNT SETUP</p>
              <h2 className="home-font-title mt-1 text-3xl font-extrabold text-slate-900">
                {showOtp ? "Verify your email" : "Create your account"}
              </h2>
            </div>
            <Link to="/" className="text-xs font-semibold text-slate-600 hover:text-slate-900">
              Back to Overview
            </Link>
          </div>

          {!showOtp ? (
            <>
              <div className="space-y-4">
                <div>
                  <label className="block text-xs font-semibold text-slate-600 mb-1">Full Name</label>
                  <input
                    className="w-full rounded-xl border border-slate-300 px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-400"
                    placeholder="Enter your full name"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-600 mb-1">Email</label>
                  <input
                    className="w-full rounded-xl border border-slate-300 px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-400"
                    placeholder="you@example.com"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-600 mb-1">Password</label>
                  <input
                    className="w-full rounded-xl border border-slate-300 px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-400"
                    type="password"
                    placeholder="Create a strong password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                  />
                </div>
              </div>

              <button
                onClick={register}
                className="w-full mt-5 rounded-xl bg-emerald-600 text-white py-2.5 font-semibold hover:bg-emerald-700 transition"
              >
                Create Account
              </button>
            </>
          ) : (
            <>
              <div className="rounded-xl border border-emerald-100 bg-emerald-50 p-3 mb-4">
                <p className="text-sm text-emerald-700">
                  Enter the verification code sent to <span className="font-semibold">{email}</span>
                </p>
              </div>

              <label className="block text-xs font-semibold text-slate-600 mb-1">Verification Code</label>
              <input
                className="w-full rounded-xl border border-slate-300 px-3 py-3 mb-4 text-center tracking-[0.3em] text-lg focus:outline-none focus:ring-2 focus:ring-emerald-400"
                placeholder="000000"
                maxLength={6}
                value={otp}
                onChange={(e) => setOtp(e.target.value)}
              />

              <button
                onClick={handleVerifyOtp}
                className="w-full rounded-xl bg-blue-600 text-white py-2.5 font-semibold hover:bg-blue-700 transition"
              >
                Verify and Activate
              </button>

              <div className="flex justify-between items-center mt-4 text-sm">
                <button
                  onClick={() => setShowOtp(false)}
                  className="text-slate-500 hover:text-slate-800"
                >
                  Back
                </button>
                <button
                  onClick={handleResendOtp}
                  disabled={timer > 0}
                  className={`${timer > 0 ? "text-slate-400 cursor-not-allowed" : "text-blue-600 hover:underline"}`}
                >
                  {timer > 0 ? `Resend in ${timer}s` : "Resend OTP"}
                </button>
              </div>
            </>
          )}

          <p className="text-center mt-5 text-sm text-slate-600">
            Already have an account?{" "}
            <Link to="/login" className="text-blue-600 font-semibold hover:underline">
              Login
            </Link>
          </p>
        </section>
      </div>

      {isSubmitting && (
        <LoadingOverlay
          message={loadingStatus === "success" ? (showOtp ? "Verified" : "OTP Sent") : (showOtp ? "Verifying..." : "Creating account...")}
          status={loadingStatus}
          soundUrl={loadingStatus === "success" ? "https://assets.mixkit.co/active_storage/sfx/2013/2013-preview.mp3" : ""}
          onCancel={loadingStatus === "loading" ? () => setIsSubmitting(false) : null}
        />
      )}
    </div>
  );
}
