import api from "../utils/axios";
import { useContext, useMemo, useState } from "react";
import { AuthContext } from "../context/AuthContext";

export default function Profile() {
  const { user } = useContext(AuthContext);
  const [oldPass, setOldPass] = useState("");
  const [newPass, setNewPass] = useState("");
  const [saving, setSaving] = useState(false);
  const [status, setStatus] = useState({ type: "", message: "" });

  const initials = useMemo(() => {
    const name = user?.name || "User";
    return name
      .split(" ")
      .map((part) => part[0])
      .join("")
      .slice(0, 2)
      .toUpperCase();
  }, [user?.name]);

  const changePassword = async (event) => {
    event.preventDefault();
    setStatus({ type: "", message: "" });

    if (!oldPass || !newPass) {
      setStatus({ type: "error", message: "Both old and new password are required." });
      return;
    }

    if (newPass.length < 6) {
      setStatus({ type: "error", message: "New password must be at least 6 characters." });
      return;
    }

    try {
      setSaving(true);
      await api.post("/users/change-password", {
        oldPassword: oldPass,
        newPassword: newPass
      });

      setOldPass("");
      setNewPass("");
      setStatus({ type: "success", message: "Password updated successfully." });
    } catch (error) {
      setStatus({
        type: "error",
        message: error?.response?.data?.message || "Failed to update password."
      });
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="space-y-6">
      <section className="rounded-3xl border border-cyan-100 bg-gradient-to-r from-cyan-50 via-sky-50 to-white p-6 sm:p-8">
        <p className="text-xs font-semibold tracking-[0.12em] text-cyan-700">ACCOUNT CENTER</p>
        <h2 className="mt-2 text-2xl sm:text-3xl font-black text-slate-900">Profile & Security</h2>
        <p className="mt-2 text-sm text-slate-600 max-w-3xl">
          Manage your personal details and keep your account secure with regular
          password updates.
        </p>
      </section>

      <div className="grid grid-cols-1 lg:grid-cols-[1fr_1.2fr] gap-5">
        <article className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
          <div className="flex items-center gap-4">
            <div className="h-16 w-16 rounded-2xl bg-gradient-to-br from-cyan-600 to-blue-600 text-white flex items-center justify-center text-xl font-black">
              {initials}
            </div>
            <div>
              <h3 className="text-xl font-extrabold text-slate-900">{user?.name || "User"}</h3>
              <p className="text-sm text-slate-600">{user?.email || "No email"}</p>
              <span className="inline-flex mt-2 rounded-full bg-slate-100 px-3 py-1 text-xs font-semibold text-slate-700">
                Role: {(user?.role || "student").toUpperCase()}
              </span>
            </div>
          </div>

          <div className="mt-6 rounded-xl border border-slate-200 bg-slate-50 p-4">
            <p className="text-sm font-semibold text-slate-800">Security Note</p>
            <p className="text-xs text-slate-600 mt-1">
              Use a strong password with letters, numbers, and symbols. Avoid reusing
              old passwords.
            </p>
          </div>
        </article>

        <article className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
          <h3 className="text-xl font-extrabold text-slate-900">Change Password</h3>
          <p className="text-sm text-slate-600 mt-1">Update your password to keep your account protected.</p>

          <form onSubmit={changePassword} className="mt-5 space-y-4">
            <div>
              <label className="block text-xs font-semibold text-slate-600 mb-1">Current Password</label>
              <input
                className="w-full border border-slate-300 rounded-xl px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-cyan-400"
                placeholder="Enter current password"
                type="password"
                value={oldPass}
                onChange={(e) => setOldPass(e.target.value)}
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-600 mb-1">New Password</label>
              <input
                className="w-full border border-slate-300 rounded-xl px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-cyan-400"
                placeholder="Enter new password"
                type="password"
                value={newPass}
                onChange={(e) => setNewPass(e.target.value)}
              />
            </div>

            {status.message && (
              <div
                className={`text-sm rounded-xl px-3 py-2 border ${
                  status.type === "success"
                    ? "bg-emerald-50 border-emerald-200 text-emerald-700"
                    : "bg-rose-50 border-rose-200 text-rose-700"
                }`}
              >
                {status.message}
              </div>
            )}

            <button
              type="submit"
              disabled={saving}
              className="w-full rounded-xl bg-cyan-600 text-white py-2.5 text-sm font-semibold hover:bg-cyan-700 disabled:opacity-60 transition"
            >
              {saving ? "Updating..." : "Update Password"}
            </button>
          </form>
        </article>
      </div>
    </div>
  );
}
