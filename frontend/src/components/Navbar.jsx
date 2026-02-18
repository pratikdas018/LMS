import { useContext, useEffect, useMemo, useState } from "react";
import { Link, NavLink, useLocation, useNavigate } from "react-router-dom";
import { AuthContext } from "../context/AuthContext";
import api from "../utils/axios";
import LiveLink from "./LiveLink";

const REGISTER_UNLOCK_KEY = "lms_register_unlocked";

export default function Navbar() {
  const { user, logout } = useContext(AuthContext);
  const navigate = useNavigate();
  const location = useLocation();
  const [isOpen, setIsOpen] = useState(false);
  const [notificationCount, setNotificationCount] = useState(0);

  const BASE_API_URL = (import.meta.env.VITE_API_URL || "http://localhost:5000").replace(/\/api\/?$/, "");

  useEffect(() => {
    if (user?.role !== "student") {
      setNotificationCount(0);
      return;
    }

    api
      .get("/tasks/notifications")
      .then((res) => setNotificationCount(res.data.count || 0))
      .catch(() => setNotificationCount(0));
  }, [user]);

  useEffect(() => {
    setIsOpen(false);
  }, [location.pathname]);

  const dashboardRoute = useMemo(() => {
    if (!user) return "/login";
    if (user.role === "admin") return "/dashboard/admin";
    if (user.role === "teacher") return "/dashboard/teacher";
    return "/dashboard/my-courses";
  }, [user]);

  const coursesRoute = user?.role === "student" ? "/dashboard/courses" : user ? dashboardRoute : "/login";

  const userInitials = useMemo(() => {
    if (!user?.name) return "U";
    return user.name
      .split(" ")
      .filter(Boolean)
      .slice(0, 2)
      .map((part) => part[0]?.toUpperCase())
      .join("");
  }, [user?.name]);

  const handleLogout = () => {
    logout();
    navigate("/login");
    setIsOpen(false);
  };

  const handleGoogleLogin = (e) => {
    e.preventDefault();
    const audio = new Audio("https://assets.mixkit.co/active_storage/sfx/2354/2354-preview.mp3");
    audio.play().catch(() => {});

    setTimeout(() => {
      window.location.href = `${BASE_API_URL}/api/auth/google`;
    }, 800);
  };

  const handleRegisterIntent = () => {
    sessionStorage.setItem(REGISTER_UNLOCK_KEY, "true");
  };

  const desktopLinkClass = ({ isActive }) =>
    `inline-flex items-center rounded-xl px-3.5 py-2 text-sm font-semibold transition-all duration-200 ${
      isActive
        ? "bg-white text-slate-900 shadow-sm ring-1 ring-cyan-100"
        : "text-slate-600 hover:bg-white hover:text-slate-900"
    }`;

  const mobileLinkClass = ({ isActive }) =>
    `flex items-center justify-between rounded-xl px-3.5 py-2.5 text-sm font-semibold transition-all duration-200 ${
      isActive
        ? "bg-cyan-50 text-cyan-700 ring-1 ring-cyan-100"
        : "text-slate-700 hover:bg-slate-100 hover:text-slate-900"
    }`;

  return (
    <header className="home-font-body relative sticky top-0 z-50 border-b border-slate-200/80 bg-white/80 backdrop-blur-xl">
      <div className="pointer-events-none absolute inset-x-0 bottom-0 h-px bg-gradient-to-r from-transparent via-cyan-300/70 to-transparent" />

      <nav className="mx-auto flex max-w-7xl items-center justify-between gap-3 px-4 py-3 sm:px-6">
        <Link to="/" className="group flex items-center gap-2.5">
          <div className="relative flex h-10 w-10 items-center justify-center rounded-2xl bg-gradient-to-br from-cyan-500 via-blue-600 to-indigo-600 text-white shadow-lg shadow-cyan-500/25">
            <span className="text-lg font-black leading-none">L</span>
            <span className="absolute -inset-1 -z-10 rounded-2xl bg-cyan-400/35 opacity-0 blur-md transition-opacity duration-300 group-hover:opacity-100" />
          </div>
          <div className="leading-tight">
            <p className="home-font-title text-3xl font-extrabold text-blue-600">LMS</p>
            <p className="text-[10px] font-bold uppercase tracking-[0.24em] text-slate-400">Learn. Build. Grow.</p>
          </div>
        </Link>

        <div className="hidden md:flex items-center gap-1 rounded-2xl border border-slate-200/80 bg-slate-50/85 p-1.5 shadow-sm">
          <NavLink to="/" end className={desktopLinkClass}>
            Home
          </NavLink>
          <NavLink to={coursesRoute} className={desktopLinkClass}>
            Courses
          </NavLink>

          {user?.role === "student" && (
            <NavLink to="/dashboard/my-courses" className={desktopLinkClass}>
              <span className="inline-flex items-center gap-1.5">
                My Courses
                {notificationCount > 0 && (
                  <span className="inline-flex h-5 min-w-5 items-center justify-center rounded-full bg-rose-500 px-1.5 text-[10px] font-bold text-white">
                    {notificationCount}
                  </span>
                )}
              </span>
            </NavLink>
          )}

          {user?.role === "student" && (
            <NavLink to="/dashboard/progress" className={desktopLinkClass}>
              Progress
            </NavLink>
          )}
          {user?.role === "student" && (
            <NavLink to="/dashboard/certificates" className={desktopLinkClass}>
              Certificates
            </NavLink>
          )}

          {user ? (
            <>
              {user.role !== "student" && (
                <NavLink to={dashboardRoute} className={desktopLinkClass}>
                  Dashboard
                </NavLink>
              )}
              <NavLink to="/dashboard/profile" className={desktopLinkClass}>
                Profile
              </NavLink>
            </>
          ) : (
            <NavLink to="/login" className={desktopLinkClass}>
              Login
            </NavLink>
          )}
        </div>

        <div className="hidden md:flex items-center gap-2">
          {user ? (
            <>
              <NavLink
                to="/dashboard/profile"
                className="group hidden lg:inline-flex items-center gap-2 rounded-2xl border border-slate-200 bg-white px-2.5 py-1.5 transition hover:border-slate-300 hover:bg-slate-50"
              >
                <span className="inline-flex h-8 w-8 items-center justify-center rounded-xl bg-gradient-to-br from-cyan-500 to-blue-600 text-xs font-black text-white">
                  {userInitials}
                </span>
                <span className="max-w-[140px] truncate text-sm font-semibold text-slate-700">{user.name}</span>
              </NavLink>

              <button
                onClick={handleLogout}
                className="rounded-xl border border-rose-200 bg-rose-50 px-4 py-2 text-sm font-semibold text-rose-600 transition hover:bg-rose-100"
              >
                Logout
              </button>
            </>
          ) : (
            <>
              <LiveLink
                href="/register"
                className="rounded-xl bg-gradient-to-r from-blue-600 to-cyan-600 px-4 py-2 text-sm font-semibold text-white shadow-lg shadow-blue-500/25 transition hover:brightness-110"
                message="Creating Account..."
                onClick={handleRegisterIntent}
              >
                Register
              </LiveLink>
              <a
                href={`${BASE_API_URL}/api/auth/google`}
                onClick={handleGoogleLogin}
                className="inline-flex items-center gap-2 rounded-xl border border-slate-300 bg-white px-3.5 py-2 text-sm font-semibold text-slate-700 transition hover:bg-slate-50"
              >
                <img src="https://www.svgrepo.com/show/475656/google-color.svg" alt="Google" className="h-5 w-5" />
                <span>Google</span>
              </a>
            </>
          )}
        </div>

        <button
          className="md:hidden inline-flex items-center justify-center rounded-xl border border-slate-300 bg-white p-2.5 text-slate-700 transition hover:bg-slate-50"
          onClick={() => setIsOpen((prev) => !prev)}
          aria-label="Toggle menu"
          aria-expanded={isOpen}
        >
          <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            {isOpen ? (
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            ) : (
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
            )}
          </svg>
        </button>
      </nav>

      {isOpen && (
        <div className="md:hidden border-t border-slate-200/80 bg-white/95 px-4 py-4 shadow-2xl shadow-slate-900/5 backdrop-blur-xl sm:px-6">
          <div className="space-y-2 rounded-2xl border border-slate-200/80 bg-slate-50/70 p-3">
            <NavLink to="/" end className={mobileLinkClass}>
              Home
            </NavLink>
            <NavLink to={coursesRoute} className={mobileLinkClass}>
              Courses
            </NavLink>

            {user?.role === "student" && (
              <NavLink to="/dashboard/my-courses" className={mobileLinkClass}>
                <span>My Courses</span>
                {notificationCount > 0 && (
                  <span className="inline-flex h-5 min-w-5 items-center justify-center rounded-full bg-rose-500 px-1.5 text-[10px] font-bold text-white">
                    {notificationCount}
                  </span>
                )}
              </NavLink>
            )}

            {user?.role === "student" && (
              <NavLink to="/dashboard/progress" className={mobileLinkClass}>
                Progress
              </NavLink>
            )}
            {user?.role === "student" && (
              <NavLink to="/dashboard/certificates" className={mobileLinkClass}>
                Certificates
              </NavLink>
            )}

            {user ? (
              <>
                {user.role !== "student" && (
                  <NavLink to={dashboardRoute} className={mobileLinkClass}>
                    Dashboard
                  </NavLink>
                )}

                <NavLink to="/dashboard/profile" className={mobileLinkClass}>
                  Profile
                </NavLink>

                <div className="mt-2 rounded-xl border border-slate-200 bg-white p-3">
                  <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">Signed in as</p>
                  <div className="mt-2 flex items-center gap-2">
                    <span className="inline-flex h-8 w-8 items-center justify-center rounded-xl bg-gradient-to-br from-cyan-500 to-blue-600 text-xs font-black text-white">
                      {userInitials}
                    </span>
                    <p className="text-sm font-semibold text-slate-800">{user.name}</p>
                  </div>
                  <button
                    onClick={handleLogout}
                    className="mt-3 w-full rounded-xl border border-rose-200 bg-rose-50 px-4 py-2 text-sm font-semibold text-rose-600 transition hover:bg-rose-100"
                  >
                    Logout
                  </button>
                </div>
              </>
            ) : (
              <div className="mt-2 space-y-2 rounded-xl border border-slate-200 bg-white p-3">
                <LiveLink
                  href="/login"
                  className="block w-full rounded-xl border border-slate-300 px-4 py-2 text-center text-sm font-semibold text-slate-700 transition hover:bg-slate-50"
                  message="Logging In..."
                >
                  Login
                </LiveLink>
                <LiveLink
                  href="/register"
                  className="block w-full rounded-xl bg-gradient-to-r from-blue-600 to-cyan-600 px-4 py-2 text-center text-sm font-semibold text-white transition hover:brightness-110"
                  message="Creating Account..."
                  onClick={handleRegisterIntent}
                >
                  Register
                </LiveLink>
                <a
                  href={`${BASE_API_URL}/api/auth/google`}
                  onClick={handleGoogleLogin}
                  className="block w-full rounded-xl border border-slate-300 bg-white px-4 py-2 text-center text-sm font-semibold text-slate-700 transition hover:bg-slate-50"
                >
                  Sign in with Google
                </a>
              </div>
            )}
          </div>
        </div>
      )}
    </header>
  );
}
