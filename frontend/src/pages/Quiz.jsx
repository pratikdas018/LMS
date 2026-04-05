import { useEffect, useState } from "react";
import { useParams } from "react-router-dom";
import api from "../utils/axios";
import StudentTasks from "./StudentTasks";
import AppLoader from "../components/AppLoader";

export default function Quiz() {
  const { courseId } = useParams();

  const [questions, setQuestions] = useState([]);
  const [answers, setAnswers] = useState([]);
  const [tasksCompleted, setTasksCompleted] = useState(false);
  const [progress, setProgress] = useState(0);
  const [attempted, setAttempted] = useState(false);
  const [score, setScore] = useState(null);
  const [error, setError] = useState("");
  const [loadingQuiz, setLoadingQuiz] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [refreshFlag, setRefreshFlag] = useState(0);

  const fetchQuiz = async () => {
    try {
      setLoadingQuiz(true);
      setError("");

      const res = await api.get(`/quiz/${courseId}`);
      const payload = res.data || {};
      const p = typeof payload.percent === "number" ? payload.percent : 0;
      setProgress(p);

      if (payload.locked) {
        setTasksCompleted(false);
        setAttempted(false);
        setQuestions([]);
        setAnswers([]);
        return;
      }

      setTasksCompleted(true);

      if (payload.attempted) {
        setAttempted(true);
        setScore(payload.score);
        setQuestions([]);
        setAnswers([]);
      } else {
        const questionList = Array.isArray(payload.questions) ? payload.questions : [];
        setAttempted(false);
        setQuestions(questionList);

        const previousAnswers = Array.isArray(payload.previousAnswers)
          ? payload.previousAnswers
          : [];
        const initialAnswers = new Array(questionList.length).fill(null);
        previousAnswers.forEach((ans, i) => {
          if (i < initialAnswers.length) initialAnswers[i] = ans;
        });
        setAnswers(initialAnswers);
      }
    } catch (err) {
      setQuestions([]);
      setAttempted(false);
      setError(err.response?.data?.message || "Quiz is currently unavailable");
    } finally {
      setLoadingQuiz(false);
    }
  };

  useEffect(() => {
    if (!courseId) return;
    fetchQuiz();
  }, [courseId, refreshFlag]);

  const selectOption = (qIndex, optionIndex) => {
    setAnswers((prev) => {
      const copy = [...prev];
      copy[qIndex] = optionIndex;
      return copy;
    });
  };

  const submitQuiz = async () => {
    const unanswered = answers.some((ans) => ans === null || ans === undefined);
    if (unanswered) {
      alert("Please answer all questions before submitting.");
      return;
    }

    try {
      setSubmitting(true);
      const res = await api.post("/quiz/submit", {
        courseId,
        answers
      });

      setAttempted(true);
      setScore(res.data.score);
      setQuestions([]);
      alert(`Score: ${res.data.score}/${res.data.total}`);
    } catch (err) {
      alert(err.response?.data?.message || "Quiz submission failed");
    } finally {
      setSubmitting(false);
    }
  };

  const handleTasksStatus = (allPassed) => {
    setTasksCompleted(allPassed);
    if (allPassed) {
      setRefreshFlag((prev) => prev + 1);
    }
  };

  return (
    <div className="space-y-6">
      <section className="rounded-3xl border border-blue-100 bg-gradient-to-r from-blue-50 via-cyan-50 to-white p-6 sm:p-8">
        <p className="text-xs font-semibold tracking-[0.12em] text-blue-700">ASSESSMENT CENTER</p>
        <h2 className="mt-2 text-2xl sm:text-3xl font-black text-slate-900">Course Tasks & Quiz</h2>
        <p className="mt-2 text-sm text-slate-600 max-w-3xl">
          Complete all required tasks first. Once approved, your quiz unlocks automatically.
        </p>

        <div className="mt-5 rounded-2xl border border-blue-100 bg-white p-4 sm:p-5">
          <div className="flex justify-between items-center gap-3 mb-2">
            <h3 className="text-lg font-extrabold text-slate-900">Course Progress</h3>
            <span className="rounded-full bg-blue-50 border border-blue-100 text-blue-700 px-3 py-1 text-xs font-bold">
              {progress}%
            </span>
          </div>
          <div className="w-full bg-slate-100 rounded-full h-3 overflow-hidden">
            <div
              className="bg-gradient-to-r from-blue-600 to-cyan-500 h-3 rounded-full transition-all duration-500"
              style={{ width: `${Math.max(0, Math.min(progress, 100))}%` }}
            />
          </div>
          <div className="mt-2 text-xs text-slate-500">
            {tasksCompleted ? "Tasks complete. Quiz unlocked." : "Finish all tasks to unlock quiz."}
          </div>
        </div>
      </section>

      <StudentTasks courseId={courseId} onAllTasksPassed={handleTasksStatus} />

      <section className="rounded-2xl border border-slate-200 bg-white p-5 sm:p-6 shadow-sm">
        <div className="flex items-start justify-between gap-3 mb-4">
          <div>
            <h3 className="text-xl font-extrabold text-slate-900">Quiz Section</h3>
            <p className="text-sm text-slate-600 mt-1">
              Answer all questions and submit once. Your attempt is recorded.
            </p>
          </div>
          <span className="text-xs font-semibold px-3 py-1 rounded-full border border-slate-200 bg-slate-50 text-slate-700">
            {questions.length} Questions
          </span>
        </div>

        {!tasksCompleted && (
          <div className="rounded-xl border border-amber-200 bg-amber-50 text-amber-700 px-4 py-3 text-sm font-semibold">
            Quiz is locked. Complete all tasks first.
          </div>
        )}

        {tasksCompleted && error && (
          <div className="rounded-xl border border-rose-200 bg-rose-50 text-rose-700 px-4 py-3 text-sm font-semibold">
            {error}
          </div>
        )}

        {tasksCompleted && loadingQuiz && (
          <AppLoader compact message="Loading quiz..." className="py-2" />
        )}

        {tasksCompleted && attempted && (
          <div className="rounded-xl border border-emerald-200 bg-emerald-50 px-4 py-3">
            <p className="text-sm font-semibold text-emerald-700">Quiz already submitted</p>
            <p className="text-sm text-emerald-800 mt-1">Your Score: {score}</p>
          </div>
        )}

        {tasksCompleted && !attempted && !loadingQuiz && questions.length > 0 && (
          <div className="space-y-4">
            {questions.map((q, qi) => (
              <article key={q._id} className="rounded-xl border border-slate-200 bg-slate-50 p-4">
                <p className="font-semibold text-slate-900">
                  Q{qi + 1}. {q.question}
                </p>

                <div className="mt-3 grid grid-cols-1 sm:grid-cols-2 gap-2">
                  {q.options.map((opt, oi) => (
                    <label
                      key={oi}
                      className={`rounded-lg border p-2.5 text-sm cursor-pointer transition ${
                        answers[qi] === oi
                          ? "border-blue-500 bg-blue-50 text-blue-800"
                          : "border-slate-200 bg-white text-slate-700 hover:border-blue-200"
                      }`}
                    >
                      <input
                        type="radio"
                        name={`q-${qi}`}
                        checked={answers[qi] === oi}
                        onChange={() => selectOption(qi, oi)}
                        className="mr-2"
                      />
                      {opt}
                    </label>
                  ))}
                </div>
              </article>
            ))}

            <button
              onClick={submitQuiz}
              disabled={submitting}
              className="rounded-xl bg-blue-600 text-white px-5 py-2.5 text-sm font-semibold hover:bg-blue-700 disabled:opacity-60 transition"
            >
              {submitting ? "Submitting..." : "Submit Quiz"}
            </button>
          </div>
        )}
      </section>
    </div>
  );
}
