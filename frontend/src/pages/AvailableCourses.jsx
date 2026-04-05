import { useContext, useEffect, useMemo, useState } from "react";
import { Link } from "react-router-dom";
import api from "../utils/axios";
import { AuthContext } from "../context/AuthContext";

export default function AvailableCourses() {
  const { user } = useContext(AuthContext);
  const [courses, setCourses] = useState([]);
  const [enrolledIds, setEnrolledIds] = useState([]);
  const [loading, setLoading] = useState(true);
  const [enrollingId, setEnrollingId] = useState("");

  useEffect(() => {
    if (!user?._id) return;

    const load = async () => {
      try {
        const [allCoursesRes, enrolledRes] = await Promise.all([
          api.get("/courses"),
          api.get(`/courses/enrolled/${user._id}`)
        ]);

        setCourses(Array.isArray(allCoursesRes.data) ? allCoursesRes.data : []);
        setEnrolledIds(
          Array.isArray(enrolledRes.data)
            ? enrolledRes.data.map((course) => course._id)
            : []
        );
      } catch (error) {
        setCourses([]);
        setEnrolledIds([]);
      } finally {
        setLoading(false);
      }
    };

    load();
  }, [user?._id]);

  const availableCourses = useMemo(
    () => courses.filter((course) => !enrolledIds.includes(course._id)),
    [courses, enrolledIds]
  );

  const handleEnroll = async (courseId) => {
    try {
      setEnrollingId(courseId);
      await api.post("/courses/enroll", { courseId, userId: user._id });
      setEnrolledIds((prev) => [...prev, courseId]);
    } catch (error) {
      alert(error?.response?.data?.message || "Failed to enroll");
    } finally {
      setEnrollingId("");
    }
  };

  if (loading) {
    return <div className="p-6 text-sm text-slate-600">Loading available courses...</div>;
  }

  return (
    <div className="space-y-6">
      <section className="rounded-3xl border border-cyan-100 bg-gradient-to-r from-cyan-50 via-sky-50 to-white p-6 sm:p-8">
        <p className="text-xs font-semibold tracking-[0.12em] text-cyan-700">DISCOVER COURSES</p>
        <h2 className="mt-2 text-2xl sm:text-3xl font-black text-slate-900">
          Explore Available Courses
        </h2>
        <p className="mt-2 text-sm text-slate-600 max-w-3xl">
          Find new subjects to grow your skills. Enroll in any course and start your
          learning path with tasks, quizzes, and certificates.
        </p>
        <div className="mt-5 flex flex-wrap gap-3 text-xs">
          <span className="rounded-full bg-white px-3 py-1 border border-cyan-100 text-slate-700">
            Total Courses: {courses.length}
          </span>
          <span className="rounded-full bg-white px-3 py-1 border border-cyan-100 text-slate-700">
            Available Now: {availableCourses.length}
          </span>
          <Link
            to="/dashboard/my-courses"
            className="rounded-full bg-slate-900 px-3 py-1 text-white hover:bg-slate-700 transition"
          >
            View My Courses
          </Link>
        </div>
      </section>

      {availableCourses.length === 0 ? (
        <div className="rounded-2xl border border-slate-200 bg-white p-8 text-center">
          <h3 className="text-lg font-bold text-slate-900">You are enrolled in all courses</h3>
          <p className="text-sm text-slate-600 mt-1">
            Great progress. Head to My Courses to continue learning.
          </p>
          <Link
            to="/dashboard/my-courses"
            className="inline-flex mt-4 rounded-xl bg-blue-600 text-white px-4 py-2 text-sm font-semibold hover:bg-blue-700 transition"
          >
            Go to My Courses
          </Link>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
          {availableCourses.map((course) => (
            <article
              key={course._id}
              className="group rounded-2xl border border-slate-200 bg-white p-5 shadow-sm hover:shadow-xl hover:-translate-y-1 transition"
            >
              <div className="h-1.5 w-20 rounded-full bg-gradient-to-r from-cyan-500 to-blue-600" />
              <h3 className="mt-4 text-xl font-extrabold text-slate-900">{course.title}</h3>
              <p className="mt-2 text-sm text-slate-600 min-h-[2.6rem]">{course.description}</p>

              <div className="mt-5 flex items-center justify-between gap-2">
                <span className="text-xs font-semibold text-slate-500">Self-paced learning</span>
                <div className="flex items-center gap-2">
                  <Link
                    to={`/dashboard/learn/${course._id}`}
                    className="rounded-xl border border-slate-300 text-slate-700 px-3 py-2 text-sm font-semibold hover:bg-slate-50 transition"
                  >
                    Preview
                  </Link>
                  <button
                    onClick={() => handleEnroll(course._id)}
                    disabled={enrollingId === course._id}
                    className="rounded-xl bg-emerald-600 text-white px-4 py-2 text-sm font-semibold hover:bg-emerald-700 disabled:opacity-60 transition"
                  >
                    {enrollingId === course._id ? "Enrolling..." : "Enroll Now"}
                  </button>
                </div>
              </div>
            </article>
          ))}
        </div>
      )}
    </div>
  );
}
