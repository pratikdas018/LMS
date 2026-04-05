import api from "../utils/axios";
import { useContext, useEffect, useMemo, useState } from "react";
import { AuthContext } from "../context/AuthContext";
import ProgressBar from "../components/ProgressBar";
import AppLoader from "../components/AppLoader";

export default function Progress() {
  const { user } = useContext(AuthContext);
  const [progress, setProgress] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!user?._id) return;

    setLoading(true);
    api
      .get(`/progress/user/${user._id}`)
      .then((res) => setProgress(Array.isArray(res.data) ? res.data : []))
      .catch(() => setProgress([]))
      .finally(() => setLoading(false));
  }, [user?._id]);

  const summary = useMemo(() => {
    const totalCourses = progress.length;
    const avgProgress = totalCourses
      ? Math.round(progress.reduce((sum, item) => sum + (item.percent || 0), 0) / totalCourses)
      : 0;
    const completedCourses = progress.filter((item) => (item.percent || 0) >= 100).length;

    return { totalCourses, avgProgress, completedCourses };
  }, [progress]);

  if (loading) {
    return <AppLoader message="Loading progress..." className="p-6" />;
  }

  return (
    <div className="space-y-6">
      <section className="rounded-3xl border border-violet-100 bg-gradient-to-r from-violet-50 via-sky-50 to-white p-6 sm:p-8">
        <p className="text-xs font-semibold tracking-[0.12em] text-violet-700">LEARNING METRICS</p>
        <h2 className="mt-2 text-2xl sm:text-3xl font-black text-slate-900">Progress Overview</h2>
        <p className="mt-2 text-sm text-slate-600 max-w-3xl">
          Monitor course completion, track milestones, and stay consistent with your
          learning goals.
        </p>
        <div className="mt-5 grid grid-cols-2 md:grid-cols-3 gap-3 text-center">
          <div className="rounded-xl border border-violet-100 bg-white p-3">
            <p className="text-xs text-slate-500">Courses</p>
            <p className="text-xl font-black text-slate-900">{summary.totalCourses}</p>
          </div>
          <div className="rounded-xl border border-violet-100 bg-white p-3">
            <p className="text-xs text-slate-500">Avg Progress</p>
            <p className="text-xl font-black text-violet-700">{summary.avgProgress}%</p>
          </div>
          <div className="rounded-xl border border-violet-100 bg-white p-3 col-span-2 md:col-span-1">
            <p className="text-xs text-slate-500">Completed</p>
            <p className="text-xl font-black text-emerald-700">{summary.completedCourses}</p>
          </div>
        </div>
      </section>

      {progress.length === 0 ? (
        <div className="rounded-2xl border border-slate-200 bg-white p-8 text-center">
          <h3 className="text-lg font-bold text-slate-900">No progress found yet</h3>
          <p className="text-sm text-slate-600 mt-1">
            Enroll in courses and complete tasks to start tracking your journey.
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 gap-4">
          {progress.map((p) => {
            const percent = p.percent || 0;
            const completedTasks = p.completedTasks || 0;
            const totalTasks = p.totalTasks || 0;
            return (
              <article
                key={p._id}
                className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm hover:shadow-xl hover:-translate-y-1 transition"
              >
                <div className="flex items-start justify-between gap-3">
                  <div>
                    <h3 className="text-lg font-extrabold text-slate-900">
                      {p.courseId?.title || "Unknown Course"}
                    </h3>
                    <p className="text-xs text-slate-500 mt-1">
                      Tasks Completed: {completedTasks} / {totalTasks}
                    </p>
                  </div>
                  <span className="rounded-full bg-violet-50 text-violet-700 border border-violet-100 px-3 py-1 text-xs font-bold">
                    {percent}%
                  </span>
                </div>

                <div className="mt-4">
                  <ProgressBar value={percent} />
                </div>

                <div className="mt-3 flex justify-between items-center text-xs">
                  <span className="text-slate-500">
                    {percent >= 100 ? "Course Completed" : "In Progress"}
                  </span>
                  {percent >= 100 && (
                    <span className="font-bold text-emerald-700 bg-emerald-50 border border-emerald-100 rounded-full px-3 py-1">
                      Certificate Ready
                    </span>
                  )}
                </div>
              </article>
            );
          })}
        </div>
      )}
    </div>
  );
}
