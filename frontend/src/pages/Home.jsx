import { useContext } from "react";
import { Link, useNavigate } from "react-router-dom";
import { AuthContext } from "../context/AuthContext";

const rolePrimaryRoute = {
  student: "/dashboard/my-courses",
  teacher: "/dashboard/teacher",
  admin: "/dashboard/admin"
};

const overviewCards = [
  {
    title: "Student Experience",
    description: "Browse courses, submit tasks, complete quizzes, and earn certificates."
  },
  {
    title: "Teacher Workspace",
    description: "Create coursework, review submissions, and track class performance."
  },
  {
    title: "Admin Control",
    description: "Manage users, monitor activity, and maintain a smooth LMS operation."
  }
];

const flow = [
  "Enroll in a course",
  "Complete tasks and lessons",
  "Unlock and submit quiz",
  "Receive certificate and insights"
];

const REGISTER_UNLOCK_KEY = "lms_register_unlocked";

export default function Home() {
  const { user } = useContext(AuthContext);
  const navigate = useNavigate();

  const primaryRoute = user ? rolePrimaryRoute[user.role] || "/dashboard" : "/login";
  const roleLabel = user ? `${user.role.toUpperCase()} MODE` : "GUEST MODE";

  const goToRegister = () => {
    sessionStorage.setItem(REGISTER_UNLOCK_KEY, "true");
    navigate("/register");
  };

  return (
    <div className="home-shell home-font-body">
      <section className="max-w-7xl mx-auto px-4 sm:px-6 pt-10 pb-8 sm:pt-14 sm:pb-10">
        <div className="relative overflow-hidden rounded-[2rem] bg-slate-950 text-white shadow-2xl">
          <div className="home-orb home-orb-one" />
          <div className="home-orb home-orb-two" />
          <div className="home-grid-pattern" />

          <div className="relative z-10 grid grid-cols-1 lg:grid-cols-[1.3fr_1fr] gap-8 p-7 sm:p-10 lg:p-12">
            <div className="home-rise">
              <p className="inline-flex items-center rounded-full border border-white/30 bg-white/10 px-3 py-1 text-xs tracking-wide">
                Smart Learning Platform
              </p>
              <h1 className="home-font-title mt-4 text-3xl sm:text-5xl leading-tight font-extrabold">
                Build skills with clarity and momentum.
              </h1>
              <p className="mt-4 text-sm sm:text-base text-slate-200 max-w-2xl">
                Modern LMS for students, teachers, and admins with one unified
                workflow for learning, assessment, and progress visibility.
              </p>

              <div className="mt-8 flex flex-wrap gap-3">
                <button
                  onClick={() => navigate(primaryRoute)}
                  className="rounded-xl bg-emerald-300 text-slate-900 px-5 py-2.5 font-bold hover:bg-emerald-200 transition"
                >
                  {user ? "Open Dashboard" : "Start Learning"}
                </button>
              {user ? (
                <Link
                  to="/dashboard/profile"
                  className="rounded-xl border border-white/35 bg-white/10 px-5 py-2.5 font-semibold hover:bg-white/20 transition"
                >
                  My Profile
                </Link>
              ) : (
                <button
                  onClick={goToRegister}
                  className="rounded-xl border border-white/35 bg-white/10 px-5 py-2.5 font-semibold hover:bg-white/20 transition"
                >
                  Create Account
                </button>
              )}
            </div>
          </div>

            <div className="home-rise home-rise-delay-1">
              <div className="rounded-2xl border border-white/20 bg-white/10 p-5 backdrop-blur-md">
                <p className="text-xs tracking-[0.15em] text-slate-200">{roleLabel}</p>
                <h2 className="home-font-title mt-2 text-xl font-bold">Platform Overview</h2>
                <div className="mt-4 grid grid-cols-2 gap-3 text-sm">
                  <div className="rounded-xl bg-slate-900/55 p-3 border border-white/10">
                    <p className="text-slate-300">Courses</p>
                    <p className="mt-1 text-lg font-bold">Structured</p>
                  </div>
                  <div className="rounded-xl bg-slate-900/55 p-3 border border-white/10">
                    <p className="text-slate-300">Assessments</p>
                    <p className="mt-1 text-lg font-bold">Task-First</p>
                  </div>
                  <div className="rounded-xl bg-slate-900/55 p-3 border border-white/10">
                    <p className="text-slate-300">Progress</p>
                    <p className="mt-1 text-lg font-bold">Real-Time</p>
                  </div>
                  <div className="rounded-xl bg-slate-900/55 p-3 border border-white/10">
                    <p className="text-slate-300">Outcome</p>
                    <p className="mt-1 text-lg font-bold">Certificate</p>
                  </div>
                </div>
                <p className="mt-4 text-xs text-slate-300">
                  Overview: enroll, complete tasks, unlock quizzes, and track progress clearly.
                </p>
              </div>
            </div>
          </div>
        </div>
      </section>

      <section className="max-w-7xl mx-auto px-4 sm:px-6 pb-8">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
          {overviewCards.map((item, idx) => (
            <article
              key={item.title}
              className={`home-rise rounded-2xl border border-slate-200/70 bg-white/90 p-6 shadow-sm hover:shadow-xl hover:-translate-y-1 transition ${idx === 1 ? "home-rise-delay-1" : idx === 2 ? "home-rise-delay-2" : ""}`}
            >
              <h3 className="home-font-title text-lg font-bold text-slate-900">{item.title}</h3>
              <p className="mt-2 text-sm text-slate-600">{item.description}</p>
            </article>
          ))}
        </div>
      </section>

      <section className="max-w-7xl mx-auto px-4 sm:px-6 pb-14">
        <div className="rounded-3xl border border-slate-200 bg-white p-6 sm:p-8 shadow-sm">
          <div className="flex flex-col md:flex-row md:items-end md:justify-between gap-4">
            <div>
              <p className="text-xs tracking-[0.15em] text-slate-500">HOW IT WORKS</p>
              <h2 className="home-font-title text-2xl sm:text-3xl font-extrabold text-slate-900 mt-1">
                Learning Flow Overview
              </h2>
            </div>
            <Link
              to={user ? "/dashboard/courses" : "/login"}
              className="text-sm font-bold text-blue-700 hover:text-blue-900"
            >
              Explore Now
            </Link>
          </div>

          <div className="mt-6 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            {flow.map((step, idx) => (
              <div key={step} className="rounded-xl border border-slate-200 bg-slate-50 p-4">
                <span className="inline-flex h-7 w-7 items-center justify-center rounded-full bg-slate-900 text-white text-xs font-bold">
                  {idx + 1}
                </span>
                <p className="mt-3 text-sm font-semibold text-slate-800">{step}</p>
              </div>
            ))}
          </div>
        </div>
      </section>
    </div>
  );
}
