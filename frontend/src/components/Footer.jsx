import { useContext } from "react";
import { Link } from "react-router-dom";
import { AuthContext } from "../context/AuthContext";

const REGISTER_UNLOCK_KEY = "lms_register_unlocked";

export default function Footer() {
  const { user } = useContext(AuthContext);

  const dashboardRoute = user
    ? user.role === "teacher"
      ? "/dashboard/teacher"
      : user.role === "admin"
      ? "/dashboard/admin"
      : "/dashboard/my-courses"
    : "/login";

  const coursesRoute = user?.role === "student" ? "/dashboard/courses" : dashboardRoute;
  const year = new Date().getFullYear();

  const handleRegisterIntent = () => {
    sessionStorage.setItem(REGISTER_UNLOCK_KEY, "true");
  };

  return (
    <footer className="mt-auto bg-slate-950 text-slate-200 border-t border-slate-800">
      <div className="h-1 w-full bg-gradient-to-r from-cyan-500 via-blue-500 to-emerald-500" />

      <div className="max-w-7xl mx-auto px-4 sm:px-6 py-8">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div>
            <h3 className="text-xl font-black text-white">LMS</h3>
            <p className="mt-2 text-sm text-slate-400 max-w-sm">
              Modern learning platform for students, teachers, and admins to manage
              courses, tasks, quizzes, and certificates in one place.
            </p>
          </div>

          <div>
            <h4 className="text-sm font-bold tracking-wide text-slate-300">Quick Links</h4>
            <div className="mt-3 flex flex-col gap-2 text-sm">
              <Link to="/" className="hover:text-white transition">Home</Link>
              <Link to={coursesRoute} className="hover:text-white transition">Courses</Link>
              <Link to="/dashboard/progress" className="hover:text-white transition">Progress</Link>
              <Link to="/dashboard/certificates" className="hover:text-white transition">Certificates</Link>
            </div>
          </div>

          <div>
            <h4 className="text-sm font-bold tracking-wide text-slate-300">Workspace</h4>
            <div className="mt-3 flex flex-col gap-2 text-sm">
              <Link to={dashboardRoute} className="hover:text-white transition">Dashboard</Link>
              {user?.role === "student" && (
                <Link to="/dashboard/my-courses" className="hover:text-white transition">
                  My Courses
                </Link>
              )}
              <Link to="/dashboard/profile" className="hover:text-white transition">Profile</Link>
              {!user && (
                <Link to="/register" onClick={handleRegisterIntent} className="hover:text-white transition">
                  Create Account
                </Link>
              )}
            </div>
          </div>
        </div>

        <div className="mt-8 pt-4 border-t border-slate-800 text-xs text-slate-400 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2">
          <p>(c) {year} LMS. All rights reserved.</p>
          <p>
            Built by <span className="font-bold text-cyan-400">@pratik</span>
          </p>
        </div>
      </div>
    </footer>
  );
}
