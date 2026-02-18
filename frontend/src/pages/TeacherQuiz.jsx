import { useEffect, useMemo, useState } from "react";
import api from "../utils/axios";

export default function TeacherQuiz({ courseId }) {
  const [question, setQuestion] = useState("");
  const [options, setOptions] = useState(["", "", "", ""]);
  const [correctAnswer, setCorrectAnswer] = useState(0);
  const [quizzes, setQuizzes] = useState([]);
  const [saving, setSaving] = useState(false);

  const loadQuizzes = async () => {
    if (!courseId) return;

    try {
      const res = await api.get(`/quiz/questions/${courseId}`);
      setQuizzes(Array.isArray(res.data) ? res.data : []);
    } catch {
      setQuizzes([]);
    }
  };

  useEffect(() => {
    loadQuizzes();
  }, [courseId]);

  const createQuiz = async () => {
    if (!question.trim() || options.some((opt) => !opt.trim())) {
      alert("Please fill question and all options.");
      return;
    }

    try {
      setSaving(true);
      await api.post("/quiz", {
        courseId,
        question: question.trim(),
        options: options.map((opt) => opt.trim()),
        correctAnswer
      });

      setQuestion("");
      setOptions(["", "", "", ""]);
      setCorrectAnswer(0);
      await loadQuizzes();
    } catch {
      alert("Failed to create quiz");
    } finally {
      setSaving(false);
    }
  };

  const totalQuestions = quizzes.length;
  const latestQuestion = useMemo(() => quizzes[quizzes.length - 1]?.question || "N/A", [quizzes]);

  return (
    <div className="space-y-5">
      <div className="rounded-2xl border border-cyan-100 bg-gradient-to-r from-cyan-50 via-sky-50 to-white p-5">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
          <div>
            <p className="text-xs font-semibold tracking-[0.12em] text-cyan-700">QUIZ BUILDER</p>
            <h4 className="mt-1 text-xl font-extrabold text-slate-900">Create Quiz Questions</h4>
          </div>
          <div className="grid grid-cols-2 gap-2 text-center">
            <div className="rounded-xl border border-cyan-100 bg-white px-3 py-2">
              <p className="text-[11px] text-slate-500">Total</p>
              <p className="text-lg font-black text-slate-900">{totalQuestions}</p>
            </div>
            <div className="rounded-xl border border-cyan-100 bg-white px-3 py-2">
              <p className="text-[11px] text-slate-500">Status</p>
              <p className="text-sm font-bold text-cyan-700">Active</p>
            </div>
          </div>
        </div>
      </div>

      <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
        <div>
          <label className="block text-xs font-semibold text-slate-600 mb-1">Question</label>
          <input
            className="w-full rounded-xl border border-slate-300 px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-cyan-400"
            placeholder="Enter quiz question"
            value={question}
            onChange={(e) => setQuestion(e.target.value)}
          />
        </div>

        <div className="mt-4 grid grid-cols-1 sm:grid-cols-2 gap-3">
          {options.map((opt, i) => (
            <div key={i}>
              <label className="block text-xs font-semibold text-slate-600 mb-1">Option {i + 1}</label>
              <input
                className="w-full rounded-xl border border-slate-300 px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-cyan-400"
                placeholder={`Option ${i + 1}`}
                value={opt}
                onChange={(e) => {
                  const copy = [...options];
                  copy[i] = e.target.value;
                  setOptions(copy);
                }}
              />
            </div>
          ))}
        </div>

        <div className="mt-4">
          <label className="block text-xs font-semibold text-slate-600 mb-1">Correct Answer</label>
          <select
            className="w-full rounded-xl border border-slate-300 bg-white px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-cyan-400"
            value={correctAnswer}
            onChange={(e) => setCorrectAnswer(Number(e.target.value))}
          >
            {options.map((_, i) => (
              <option key={i} value={i}>
                Correct Option {i + 1}
              </option>
            ))}
          </select>
        </div>

        <button
          onClick={createQuiz}
          disabled={saving}
          className="mt-5 rounded-xl bg-cyan-600 hover:bg-cyan-700 text-white px-5 py-2.5 text-sm font-semibold disabled:opacity-60 transition"
        >
          {saving ? "Saving..." : "Add Quiz Question"}
        </button>
      </div>

      <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
        <div className="flex items-center justify-between gap-3 mb-4">
          <h4 className="text-lg font-extrabold text-slate-900">Existing Questions</h4>
          <span className="rounded-full border border-slate-200 bg-slate-50 px-3 py-1 text-xs font-bold text-slate-700">
            Latest: {latestQuestion === "N/A" ? "N/A" : "Added"}
          </span>
        </div>

        {quizzes.length === 0 ? (
          <div className="rounded-xl border border-dashed border-slate-300 bg-slate-50 p-6 text-center text-sm text-slate-500">
            No quiz questions added yet for this course.
          </div>
        ) : (
          <div className="space-y-3">
            {quizzes.map((quiz, index) => (
              <article key={quiz._id} className="rounded-xl border border-slate-200 bg-slate-50 p-4">
                <p className="font-semibold text-slate-900">
                  <span className="text-cyan-700 mr-2">Q{index + 1}.</span>
                  {quiz.question}
                </p>

                <ul className="mt-3 grid grid-cols-1 sm:grid-cols-2 gap-2">
                  {quiz.options.map((option, idx) => (
                    <li
                      key={idx}
                      className={`rounded-lg border px-3 py-2 text-sm ${
                        idx === quiz.correctAnswer
                          ? "bg-emerald-50 border-emerald-200 text-emerald-700 font-semibold"
                          : "bg-white border-slate-200 text-slate-700"
                      }`}
                    >
                      {option}
                    </li>
                  ))}
                </ul>
              </article>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
