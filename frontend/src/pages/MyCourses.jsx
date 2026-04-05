import { useContext, useEffect, useMemo, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import api from "../utils/axios";
import { AuthContext } from "../context/AuthContext";

export default function MyCourses() {
  const { user } = useContext(AuthContext);
  const navigate = useNavigate();
  const [courses, setCourses] = useState([]);
  const [progress, setProgress] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!user?._id) return;

    const load = async () => {
      try {
        const [enrolledRes, progressRes] = await Promise.all([
          api.get(`/courses/enrolled/${user._id}`),
          api.get(`/progress/user/${user._id}`)
        ]);

        setCourses(Array.isArray(enrolledRes.data) ? enrolledRes.data : []);
        setProgress(Array.isArray(progressRes.data) ? progressRes.data : []);
      } catch (error) {
        setCourses([]);
        setProgress([]);
      } finally {
        setLoading(false);
      }
    };

    load();
  }, [user?._id]);

  const progressMap = useMemo(() => {
    const map = {};
    progress.forEach((item) => {
      if (item?.courseId?._id) {
        map[item.courseId._id] = item.percent || 0;
      }
    });
    return map;
  }, [progress]);

  if (loading) {
    return <div className="p-6 text-sm text-slate-600">Loading your courses...</div>;
  }

  return (
    <div className="space-y-6">
      <section className="rounded-3xl border border-indigo-100 bg-gradient-to-r from-indigo-50 via-blue-50 to-white p-6 sm:p-8">
        <p className="text-xs font-semibold tracking-[0.12em] text-indigo-700">MY LEARNING</p>
        <h2 className="mt-2 text-2xl sm:text-3xl font-black text-slate-900">
          Enrolled Courses
        </h2>
        <p className="mt-2 text-sm text-slate-600 max-w-3xl">
          Track your active courses and continue from where you stopped. Start quiz
          once your course tasks are complete.
        </p>
        <div className="mt-5 flex flex-wrap gap-3 text-xs">
          <span className="rounded-full bg-white px-3 py-1 border border-indigo-100 text-slate-700">
            Enrolled: {courses.length}
          </span>
          <Link
            to="/dashboard/courses"
            className="rounded-full bg-slate-900 px-3 py-1 text-white hover:bg-slate-700 transition"
          >
            Browse More Courses
          </Link>
        </div>
      </section>

      {courses.length === 0 ? (
        <div className="rounded-2xl border border-slate-200 bg-white p-8 text-center">
          <h3 className="text-lg font-bold text-slate-900">No enrolled courses yet</h3>
          <p className="text-sm text-slate-600 mt-1">
            Start by enrolling in available courses and build your learning streak.
          </p>
          <Link
            to="/dashboard/courses"
            className="inline-flex mt-4 rounded-xl bg-blue-600 text-white px-4 py-2 text-sm font-semibold hover:bg-blue-700 transition"
          >
            Explore Courses
          </Link>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
          {courses.map((course) => {
            const percent = progressMap[course._id] || 0;
            return (
              <article
                key={course._id}
                className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm hover:shadow-xl hover:-translate-y-1 transition"
              >
                <div className="h-1.5 w-20 rounded-full bg-gradient-to-r from-indigo-500 to-sky-500" />
                <h3 className="mt-4 text-xl font-extrabold text-slate-900">{course.title}</h3>
                <p className="mt-2 text-sm text-slate-600 min-h-[2.6rem]">{course.description}</p>

                <div className="mt-4">
                  <div className="flex justify-between text-xs font-semibold text-slate-600">
                    <span>Progress</span>
                    <span>{percent}%</span>
                  </div>
                  <div className="mt-1 h-2 rounded-full bg-slate-100 overflow-hidden">
                    <div
                      className="h-full bg-gradient-to-r from-indigo-500 to-sky-500"
                      style={{ width: `${Math.min(100, Math.max(0, percent))}%` }}
                    />
                  </div>
                </div>

                <div className="mt-5 flex gap-3">
                  <button
                    onClick={() => navigate(`/dashboard/learn/${course._id}`)}
                    className="rounded-xl bg-emerald-600 text-white px-4 py-2 text-sm font-semibold hover:bg-emerald-700 transition"
                  >
                    Watch Lectures
                  </button>
                  <button
                    onClick={() => navigate(`/dashboard/quiz/${course._id}`)}
                    className="rounded-xl bg-blue-600 text-white px-4 py-2 text-sm font-semibold hover:bg-blue-700 transition"
                  >
                    Start Quiz
                  </button>
                  <Link
                    to="/dashboard/progress"
                    className="rounded-xl border border-slate-300 text-slate-700 px-4 py-2 text-sm font-semibold hover:bg-slate-50 transition"
                  >
                    View Progress
                  </Link>
                </div>
              </article>
            );
          })}
        </div>
      )}
    </div>
  );
}
