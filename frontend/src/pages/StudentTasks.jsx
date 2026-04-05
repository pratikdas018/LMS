import { useEffect, useMemo, useState } from "react";
import api from "../utils/axios";
import AppLoader from "../components/AppLoader";

export default function StudentTasks({ courseId, onAllTasksPassed }) {
  const [tasks, setTasks] = useState([]);
  const [stats, setStats] = useState({
    completedTasks: 0,
    totalTasks: 0
  });
  const [loading, setLoading] = useState(true);
  const [activeTask, setActiveTask] = useState(null);
  const [answerText, setAnswerText] = useState("");
  const [submitting, setSubmitting] = useState(false);

  const loadTasks = async () => {
    if (!courseId) return;

    setLoading(true);
    try {
      const res = await api.get(`/tasks/student/${courseId}`);
      const data = res.data || {};
      const taskList = Array.isArray(data.tasks) ? data.tasks : [];

      setTasks(taskList);
      setStats({
        completedTasks: data.completedTasks || 0,
        totalTasks: data.totalTasks || 0
      });

      const allPassed = data.totalTasks > 0 && data.completedTasks === data.totalTasks;
      if (onAllTasksPassed) onAllTasksPassed(allPassed);
    } catch {
      setTasks([]);
      setStats({ completedTasks: 0, totalTasks: 0 });
      if (onAllTasksPassed) onAllTasksPassed(false);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadTasks();
  }, [courseId]);

  const openSubmitModal = (task) => {
    setActiveTask(task);
    setAnswerText("");
  };

  const closeSubmitModal = () => {
    setActiveTask(null);
    setAnswerText("");
    setSubmitting(false);
  };

  const submitTask = async () => {
    if (!activeTask?._id) return;
    if (!answerText.trim()) {
      alert("Please write your answer before submitting.");
      return;
    }

    try {
      setSubmitting(true);
      await api.post("/tasks/submit", {
        taskId: activeTask._id,
        answer: answerText.trim()
      });
      closeSubmitModal();
      await loadTasks();
    } catch (err) {
      setSubmitting(false);
      alert(err.response?.data?.message || "Failed to submit task");
    }
  };

  const markAsRead = async (taskId) => {
    try {
      await api.put(`/tasks/${taskId}/read`);
      setTasks((prev) =>
        prev.map((task) => {
          if (task._id === taskId && task.submission) {
            return { ...task, submission: { ...task.submission, isViewed: true } };
          }
          return task;
        })
      );
    } catch (err) {
      console.error(err);
    }
  };

  const completionPercent = useMemo(() => {
    if (!stats.totalTasks) return 0;
    return Math.round((stats.completedTasks / stats.totalTasks) * 100);
  }, [stats.completedTasks, stats.totalTasks]);

  return (
    <section className="rounded-2xl border border-slate-200 bg-white p-5 sm:p-6 shadow-sm">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 mb-4">
        <div>
          <h3 className="text-xl font-extrabold text-slate-900">Tasks</h3>
          <p className="text-sm text-slate-600 mt-1">
            Complete and pass all tasks to unlock the final quiz.
          </p>
        </div>
        <div className="rounded-full border border-slate-200 bg-slate-50 px-3 py-1 text-xs font-bold text-slate-700">
          {stats.completedTasks}/{stats.totalTasks} Passed
        </div>
      </div>

      <div className="mb-5">
        <div className="w-full bg-slate-100 rounded-full h-2.5 overflow-hidden">
          <div
            className="h-2.5 rounded-full bg-gradient-to-r from-emerald-500 to-teal-500 transition-all"
            style={{ width: `${Math.max(0, Math.min(completionPercent, 100))}%` }}
          />
        </div>
      </div>

      {loading && <AppLoader compact message="Loading tasks..." className="py-2" />}
      {!loading && tasks.length === 0 && <p className="text-sm text-slate-500">No tasks assigned yet.</p>}

      <div className="space-y-3">
        {tasks.map((task) => {
          const status = task.submission?.status;
          const statusClass =
            status === "pass"
              ? "bg-emerald-50 text-emerald-700 border-emerald-200"
              : status === "fail"
              ? "bg-rose-50 text-rose-700 border-rose-200"
              : "bg-amber-50 text-amber-700 border-amber-200";

          return (
            <article key={task._id} className="rounded-xl border border-slate-200 bg-slate-50 p-4">
              <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-3">
                <div>
                  <h4 className="font-bold text-slate-900">{task.title}</h4>
                  <p className="text-sm text-slate-600 mt-1">{task.description}</p>
                  {task.deadline && (
                    <p className="text-xs text-slate-500 mt-2">
                      Deadline: {new Date(task.deadline).toLocaleDateString()}
                    </p>
                  )}
                </div>

                {status ? (
                  <span className={`inline-flex rounded-full border px-3 py-1 text-xs font-bold uppercase ${statusClass}`}>
                    {status}
                  </span>
                ) : (
                  <span className="inline-flex rounded-full border border-blue-200 bg-blue-50 px-3 py-1 text-xs font-bold text-blue-700">
                    Not Submitted
                  </span>
                )}
              </div>

              <div className="mt-3 flex flex-wrap gap-2">
                {!status && (
                  <button
                    onClick={() => openSubmitModal(task)}
                    className="rounded-lg bg-emerald-600 text-white px-3 py-1.5 text-sm font-semibold hover:bg-emerald-700 transition"
                  >
                    Submit Task
                  </button>
                )}

                {task.submission?.isViewed === false && (
                  <button
                    onClick={() => markAsRead(task._id)}
                    className="rounded-lg border border-blue-200 bg-blue-50 text-blue-700 px-3 py-1.5 text-sm font-semibold hover:bg-blue-100 transition"
                  >
                    Mark Feedback Read
                  </button>
                )}
              </div>

              {task.submission?.comment && (
                <div className="mt-3 rounded-lg border border-slate-200 bg-white p-3">
                  <p className="text-xs font-bold text-slate-700">Teacher Feedback</p>
                  <p className="text-sm text-slate-600 mt-1 whitespace-pre-wrap">{task.submission.comment}</p>
                </div>
              )}
            </article>
          );
        })}
      </div>

      {activeTask && (
        <div className="fixed inset-0 bg-black/45 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="w-full max-w-xl rounded-2xl border border-slate-200 bg-white p-5 shadow-2xl">
            <h4 className="text-lg font-extrabold text-slate-900">Submit Task Answer</h4>
            <p className="text-sm text-slate-600 mt-1">{activeTask.title}</p>

            <textarea
              rows={6}
              className="w-full mt-4 rounded-xl border border-slate-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-400"
              placeholder="Write your answer here..."
              value={answerText}
              onChange={(e) => setAnswerText(e.target.value)}
            />

            <div className="mt-4 flex justify-end gap-2">
              <button
                onClick={closeSubmitModal}
                className="rounded-lg border border-slate-300 px-4 py-2 text-sm font-semibold text-slate-700 hover:bg-slate-50"
              >
                Cancel
              </button>
              <button
                onClick={submitTask}
                disabled={submitting}
                className="rounded-lg bg-emerald-600 text-white px-4 py-2 text-sm font-semibold hover:bg-emerald-700 disabled:opacity-60"
              >
                {submitting ? "Submitting..." : "Submit"}
              </button>
            </div>
          </div>
        </div>
      )}
    </section>
  );
}
