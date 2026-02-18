import { useState } from "react";
import { Link } from "react-router-dom";
import api from "../utils/axios";
import LoadingOverlay from "../components/LoadingOverlay";

export default function ForgotPassword() {
  const [email, setEmail] = useState("");
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [loadingMessage, setLoadingMessage] = useState("");
  const [loadingStatus, setLoadingStatus] = useState("loading");
  const [soundUrl, setSoundUrl] = useState("");

  const handleSubmit = async (e) => {
    e.preventDefault();
    setMessage("");
    setError("");
    setIsSubmitting(true);
    setLoadingMessage("Sending password reset link...");
    setLoadingStatus("loading");
    setSoundUrl("");

    try {
      const res = await api.post("/auth/forgot-password", { email: email.trim() });
      setLoadingMessage("Link sent successfully");
      setLoadingStatus("success");
      setSoundUrl("https://assets.mixkit.co/active_storage/sfx/2354/2354-preview.mp3");

      setTimeout(() => {
        setMessage(res?.data?.message || "If this email exists, a reset link has been sent.");
        setIsSubmitting(false);
      }, 1200);
    } catch (err) {
      setError(err.response?.data?.message || "Something went wrong");
      setIsSubmitting(false);
    }
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
                Account Recovery
              </p>
              <h1 className="home-font-title mt-4 text-4xl leading-tight font-extrabold">
                Reset your password securely.
              </h1>
              <p className="mt-4 text-slate-300 text-sm max-w-lg">
                Enter your registered email address and we will send a secure reset link
                to help you regain access.
              </p>
            </div>

            <div className="space-y-3 text-sm text-slate-200">
              <p className="rounded-xl border border-white/15 bg-white/10 px-4 py-3">Secure token-based reset links</p>
              <p className="rounded-xl border border-white/15 bg-white/10 px-4 py-3">Email-based identity confirmation</p>
              <p className="rounded-xl border border-white/15 bg-white/10 px-4 py-3">Fast recovery to continue learning</p>
              <Link to="/" className="inline-flex mt-2 text-cyan-300 hover:text-cyan-200 font-semibold">
                Back to platform overview
              </Link>
            </div>
          </div>
        </section>

        <section className="rounded-[2rem] border border-slate-200 bg-white/95 p-6 sm:p-8 shadow-xl backdrop-blur">
          <div className="flex items-start justify-between gap-4 mb-6">
            <div>
              <p className="text-xs font-semibold tracking-[0.12em] text-blue-700">PASSWORD RESET</p>
              <h2 className="home-font-title mt-1 text-3xl font-extrabold text-slate-900">
                Forgot Password
              </h2>
              <p className="mt-2 text-sm text-slate-600">
                Enter your email and we will send a reset link.
              </p>
            </div>
            <Link to="/" className="text-xs font-semibold text-slate-600 hover:text-slate-900">
              Overview
            </Link>
          </div>

          {message && (
            <div className="bg-emerald-50 border border-emerald-200 text-emerald-700 p-3 rounded-xl mb-4 text-sm font-medium">
              {message}
            </div>
          )}

          {error && (
            <div className="bg-rose-50 border border-rose-200 text-rose-700 p-3 rounded-xl mb-4 text-sm font-medium">
              {error}
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-xs font-semibold text-slate-600 mb-1">Email Address</label>
              <input
                className="w-full rounded-xl border border-slate-300 px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-400"
                placeholder="you@example.com"
                type="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                onBlur={() => setEmail((prev) => prev.trim())}
              />
            </div>

            <button className="w-full rounded-xl bg-blue-600 text-white py-2.5 font-semibold hover:bg-blue-700 transition">
              Send Reset Link
            </button>
          </form>

          <div className="mt-5 text-center">
            <Link to="/login" className="text-sm text-blue-600 hover:underline font-semibold">
              Back to Login
            </Link>
          </div>
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
