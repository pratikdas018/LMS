import { useEffect, useMemo, useState } from "react";
import api from "../utils/axios";
import TeacherTasks from "./TeacherTasks";
import TeacherAnalytics from "./TeacherAnalytics";
import TeacherQuiz from "./TeacherQuiz";
import TeacherQuizReview from "./TeacherQuizReview";

export default function TeacherDashboard() {
  const [courses, setCourses] = useState([]);
  const [selectedCourse, setSelectedCourse] = useState("");

  useEffect(() => {
    api
      .get("/courses")
      .then((res) => setCourses(Array.isArray(res.data) ? res.data : []))
      .catch(() => setCourses([]));
  }, []);

  const selectedCourseTitle = useMemo(() => {
    const found = courses.find((course) => course._id === selectedCourse);
    return found?.title || "No course selected";
  }, [courses, selectedCourse]);

  return (
    <div className="space-y-6">
      <section className="rounded-3xl border border-emerald-100 bg-gradient-to-r from-emerald-50 via-sky-50 to-white p-6 sm:p-8">
        <p className="text-xs font-semibold tracking-[0.12em] text-emerald-700">TEACHER WORKSPACE</p>
        <h2 className="mt-2 text-2xl sm:text-3xl font-black text-slate-900">Course Management Hub</h2>
        <p className="mt-2 text-sm text-slate-600 max-w-3xl">
          Create tasks and quizzes, review student submissions, and monitor performance
          from one focused dashboard.
        </p>

        <div className="mt-5 grid grid-cols-1 md:grid-cols-[1fr_auto] gap-4 items-end">
          <div className="grid grid-cols-2 gap-3 text-center">
            <div className="rounded-xl border border-emerald-100 bg-white p-3">
              <p className="text-xs text-slate-500">Courses</p>
              <p className="text-xl font-black text-slate-900">{courses.length}</p>
            </div>
            <div className="rounded-xl border border-emerald-100 bg-white p-3">
              <p className="text-xs text-slate-500">Active Course</p>
              <p className="text-sm font-bold text-emerald-700 truncate">{selectedCourse ? "Selected" : "None"}</p>
            </div>
          </div>

          <div className="w-full md:w-80">
            <label className="block text-xs font-semibold text-slate-600 mb-1">Choose Course</label>
            <select
              className="w-full rounded-xl border border-slate-300 bg-white px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-400"
              value={selectedCourse}
              onChange={(e) => setSelectedCourse(e.target.value)}
            >
              <option value="">Select a course</option>
              {courses.map((course) => (
                <option key={course._id} value={course._id}>
                  {course.title}
                </option>
              ))}
            </select>
          </div>
        </div>
      </section>

      {!selectedCourse ? (
        <div className="rounded-2xl border border-slate-200 bg-white p-10 text-center">
          <h3 className="text-lg font-bold text-slate-900">Select a course to continue</h3>
          <p className="text-sm text-slate-600 mt-1">
            Once selected, you can create tasks/quizzes and review student work.
          </p>
        </div>
      ) : (
        <div className="space-y-6">
          <div className="rounded-xl border border-slate-200 bg-slate-50 px-4 py-2 text-sm text-slate-700">
            Managing: <span className="font-bold text-slate-900">{selectedCourseTitle}</span>
          </div>

          <section className="rounded-2xl border border-slate-200 bg-white p-4 sm:p-6 shadow-sm">
            <h3 className="text-lg sm:text-xl font-extrabold text-slate-900 mb-4">Tasks</h3>
            <TeacherTasks courseId={selectedCourse} />
          </section>

          <section className="rounded-2xl border border-slate-200 bg-white p-4 sm:p-6 shadow-sm">
            <h3 className="text-lg sm:text-xl font-extrabold text-slate-900 mb-4">Quiz Management</h3>
            <TeacherQuiz courseId={selectedCourse} />
          </section>

          <section className="grid grid-cols-1 xl:grid-cols-2 gap-6">
            <div className="rounded-2xl border border-slate-200 bg-white p-4 sm:p-6 shadow-sm">
              <h3 className="text-lg sm:text-xl font-extrabold text-slate-900 mb-4">Quiz Review</h3>
              <TeacherQuizReview courseId={selectedCourse} />
            </div>

            <div className="rounded-2xl border border-slate-200 bg-white p-4 sm:p-6 shadow-sm">
              <h3 className="text-lg sm:text-xl font-extrabold text-slate-900 mb-4">Analytics</h3>
              <TeacherAnalytics courseId={selectedCourse} />
            </div>
          </section>
        </div>
      )}
    </div>
  );
}
