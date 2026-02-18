import { useContext, useState, useEffect } from "react";
import { AuthContext } from "../context/AuthContext";
import { useNavigate, Link } from "react-router-dom";
import LoadingOverlay from "../components/LoadingOverlay";

export default function Login() {
  const { login, verifyOtp } = useContext(AuthContext);
  const navigate = useNavigate();

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [otp, setOtp] = useState("");
  const [step, setStep] = useState(1);
  const [rememberMe, setRememberMe] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState("");
  const [timer, setTimer] = useState(0);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [loadingMessage, setLoadingMessage] = useState("");
  const [loadingStatus, setLoadingStatus] = useState("loading");
  const [soundUrl, setSoundUrl] = useState("");

  const BASE_API_URL = (import.meta.env.VITE_API_URL || "http://localhost:5000").replace(/\/api\/?$/, "");

  useEffect(() => {
    let interval;
    if (timer > 0) {
      interval = setInterval(() => {
        setTimer((prev) => prev - 1);
      }, 1000);
    }
    return () => clearInterval(interval);
  }, [timer]);

  const handleLogin = async () => {
    setIsSubmitting(true);
    setLoadingMessage("Logging in...");
    setLoadingStatus("loading");
    setSoundUrl("");
    setError("");

    try {
      const res = await login({ email, password, rememberMe });
      if (res.requireOtp) {
        setLoadingMessage("Verification code sent");
        setLoadingStatus("success");
        setSoundUrl("https://assets.mixkit.co/active_storage/sfx/2354/2354-preview.mp3");
        setTimeout(() => {
          setStep(2);
          setTimer(60);
          setIsSubmitting(false);
        }, 1200);
      } else {
        setLoadingMessage("Login successful");
        setLoadingStatus("success");
        setSoundUrl("https://assets.mixkit.co/active_storage/sfx/2013/2013-preview.mp3");
        setTimeout(() => navigate("/dashboard"), 1200);
      }
    } catch (err) {
      const errorMessage = err.response?.data?.message || "Invalid credentials";

      if (err.response?.status === 403 && errorMessage.toLowerCase().includes("verify")) {
        setLoadingMessage("Verification required");
        setLoadingStatus("success");
        setTimeout(() => {
          setStep(2);
          setTimer(60);
          setIsSubmitting(false);
        }, 1200);
        return;
      }

      if (err.response?.status === 403 && errorMessage.toLowerCase().includes("locked")) {
        setError(errorMessage);
      } else {
        alert(errorMessage);
      }

      setIsSubmitting(false);
    }
  };

  const handleVerifyOtp = async () => {
    setIsSubmitting(true);
    setLoadingMessage("Verifying code...");
    setLoadingStatus("loading");
    setSoundUrl("");
    setError("");

    try {
      await verifyOtp({ email, otp, rememberMe });
      setLoadingMessage("Verification successful");
      setLoadingStatus("success");
      setSoundUrl("https://assets.mixkit.co/active_storage/sfx/2013/2013-preview.mp3");
      setTimeout(() => navigate("/dashboard"), 1200);
    } catch (err) {
      const errorMessage = err.response?.data?.message || "Invalid or expired OTP";
      if (err.response?.status === 403 && errorMessage.toLowerCase().includes("locked")) {
        setError(errorMessage);
      } else {
        alert(errorMessage);
      }
      setIsSubmitting(false);
    }
  };

  const handleResendOtp = async () => {
    if (timer > 0) return;

    setIsSubmitting(true);
    setLoadingMessage("Resending code...");
    setLoadingStatus("loading");
    setError("");
    setSoundUrl("");

    try {
      const res = await login({ email, password, rememberMe });
      if (res.requireOtp) {
        setLoadingMessage("Code resent");
        setLoadingStatus("success");
        setSoundUrl("https://assets.mixkit.co/active_storage/sfx/2354/2354-preview.mp3");
        setTimer(60);
        setTimeout(() => setIsSubmitting(false), 1200);
      }
    } catch (err) {
      const errorMessage = err.response?.data?.message || "Failed to resend code";
      if (err.response?.status === 403 && errorMessage.toLowerCase().includes("locked")) {
        setError(errorMessage);
      } else {
        alert(errorMessage);
      }
      setIsSubmitting(false);
    }
  };

  const handleGoogleLogin = (e) => {
    e.preventDefault();
    const audio = new Audio("https://assets.mixkit.co/active_storage/sfx/2354/2354-preview.mp3");
    audio.play().catch(() => {});

    setIsSubmitting(true);
    setLoadingMessage("Redirecting to Google...");
    setLoadingStatus("loading");

    setTimeout(() => {
      window.location.href = `${BASE_API_URL}/api/auth/google`;
    }, 900);
  };

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
                Welcome Back
              </p>
              <h1 className="home-font-title mt-4 text-4xl leading-tight font-extrabold">
                Continue your learning journey.
              </h1>
              <p className="mt-4 text-slate-300 text-sm max-w-lg">
                Access your courses, complete tasks, and track progress with a modern learning experience.
              </p>
            </div>

            <div className="space-y-3 text-sm text-slate-200">
              <p className="rounded-xl border border-white/15 bg-white/10 px-4 py-3">Structured courses and guided progression</p>
              <p className="rounded-xl border border-white/15 bg-white/10 px-4 py-3">Task-first quiz unlocking workflow</p>
              <p className="rounded-xl border border-white/15 bg-white/10 px-4 py-3">Certificates and progress analytics</p>
              <Link to="/" className="inline-flex mt-2 text-cyan-300 hover:text-cyan-200 font-semibold">
                View platform overview
              </Link>
            </div>
          </div>
        </section>

        <section className="rounded-[2rem] border border-slate-200 bg-white/95 p-6 sm:p-8 shadow-xl backdrop-blur">
          <div className="flex items-start justify-between gap-4 mb-6">
            <div>
              <p className="text-xs font-semibold tracking-[0.12em] text-blue-700">AUTHENTICATION</p>
              <h2 className="home-font-title mt-1 text-3xl font-extrabold text-slate-900">
                {step === 1 ? "Sign in to LMS" : "Verify your login"}
              </h2>
            </div>
            <Link to="/" className="text-xs font-semibold text-slate-600 hover:text-slate-900">
              Back to Overview
            </Link>
          </div>

          {error && (
            <div className="bg-rose-50 border border-rose-200 text-rose-700 p-3 rounded-xl mb-4 text-sm font-medium">
              {error}
            </div>
          )}

          {step === 1 ? (
            <>
              <div className="space-y-4">
                <div>
                  <label className="block text-xs font-semibold text-slate-600 mb-1">Email</label>
                  <input
                    className="w-full rounded-xl border border-slate-300 px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-400"
                    placeholder="you@example.com"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-600 mb-1">Password</label>
                  <div className="relative">
                    <input
                      className="w-full rounded-xl border border-slate-300 px-3 py-2.5 pr-10 text-sm focus:outline-none focus:ring-2 focus:ring-blue-400"
                      type={showPassword ? "text" : "password"}
                      placeholder="Enter password"
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                    />
                    <button
                      type="button"
                      className="absolute inset-y-0 right-0 px-3 text-slate-500 hover:text-slate-800"
                      onClick={() => setShowPassword(!showPassword)}
                    >
                      {showPassword ? "Hide" : "Show"}
                    </button>
                  </div>
                </div>
              </div>

              <div className="flex items-center justify-between mt-4 mb-5">
                <label className="flex items-center text-sm text-slate-600 cursor-pointer">
                  <input
                    type="checkbox"
                    className="mr-2"
                    checked={rememberMe}
                    onChange={(e) => setRememberMe(e.target.checked)}
                  />
                  Remember me
                </label>
                <Link to="/forgot-password" className="text-sm text-blue-600 hover:underline">
                  Forgot password?
                </Link>
              </div>

              <button
                onClick={handleLogin}
                className="w-full rounded-xl bg-blue-600 hover:bg-blue-700 text-white py-2.5 font-semibold transition"
              >
                Login
              </button>

              <div className="my-5 flex items-center">
                <div className="flex-grow border-t border-slate-300" />
                <span className="mx-4 text-xs text-slate-500 font-semibold">OR</span>
                <div className="flex-grow border-t border-slate-300" />
              </div>

              <a
                href={`${BASE_API_URL}/api/auth/google`}
                onClick={handleGoogleLogin}
                className="w-full rounded-xl border border-slate-300 py-2.5 flex items-center justify-center gap-2 hover:bg-slate-50 transition font-medium text-slate-700"
              >
                <img src="https://www.svgrepo.com/show/475656/google-color.svg" alt="Google" className="w-5 h-5" />
                <span>Sign in with Google</span>
              </a>

              <p className="text-center mt-5 text-sm text-slate-600">
                New here?{" "}
                <Link to="/register" className="text-blue-600 font-semibold hover:underline">
                  Create account
                </Link>
              </p>
            </>
          ) : (
            <>
              <div className="rounded-xl border border-blue-100 bg-blue-50 p-3 mb-4">
                <p className="text-sm text-blue-700">
                  Verification code sent to <span className="font-semibold">{email}</span>
                </p>
              </div>

              <label className="block text-xs font-semibold text-slate-600 mb-1">One-Time Password</label>
              <input
                className="w-full rounded-xl border border-slate-300 px-3 py-3 mb-4 text-center tracking-[0.3em] text-lg focus:outline-none focus:ring-2 focus:ring-blue-400"
                placeholder="000000"
                maxLength={6}
                value={otp}
                onChange={(e) => setOtp(e.target.value)}
              />

              <button
                onClick={handleVerifyOtp}
                className="w-full rounded-xl bg-emerald-600 text-white py-2.5 font-semibold hover:bg-emerald-700 transition"
              >
                Verify and Login
              </button>

              <div className="flex justify-between items-center mt-4 text-sm">
                <button
                  onClick={() => {
                    setStep(1);
                    setError("");
                  }}
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
        </section>
      </div>

      {isSubmitting && (
        <LoadingOverlay
          message={loadingMessage}
          status={loadingStatus}
          soundUrl={soundUrl}
          onCancel={loadingStatus === "loading" ? () => setIsSubmitting(false) : null}
        />
      )}
    </div>
  );
}
