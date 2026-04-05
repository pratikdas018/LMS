import { useCallback, useContext, useEffect, useMemo, useState } from "react";
import { Link, useParams } from "react-router-dom";
import api from "../utils/axios";
import VideoPlayer from "../components/VideoPlayer";
import LectureSidebar from "../components/LectureSidebar";
import { AuthContext } from "../context/AuthContext";

const getInitialLecture = (modules, lastWatchedLecture) => {
  const allLectures = modules.flatMap((moduleItem) => moduleItem.lectures || []);
  const playableLectures = allLectures.filter((lecture) => !lecture.locked && lecture.videoUrl);

  if (lastWatchedLecture) {
    const matched = playableLectures.find(
      (lecture) => lecture._id.toString() === lastWatchedLecture.toString()
    );

    if (matched) return matched;
  }

  return playableLectures[0] || allLectures[0] || null;
};

export default function CoursePlayer() {
  const { courseId } = useParams();
  const { user } = useContext(AuthContext);

  const [courseContent, setCourseContent] = useState({
    courseTitle: "",
    modules: [],
    isEnrolled: false,
    canAccessFullContent: false
  });
  const [progress, setProgress] = useState({
    completedLectures: [],
    completedLectureCount: 0,
    totalLectures: 0,
    percent: 0,
    lastWatchedLecture: null
  });
  const [selectedLecture, setSelectedLecture] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [markingComplete, setMarkingComplete] = useState(false);

  const canTrackProgress = user?.role === "student";

  const allLectures = useMemo(
    () => courseContent.modules.flatMap((moduleItem) => moduleItem.lectures || []),
    [courseContent.modules]
  );

  const playableLectures = useMemo(
    () => allLectures.filter((lecture) => !lecture.locked && lecture.videoUrl),
    [allLectures]
  );

  const completedLectureIds = useMemo(
    () => (Array.isArray(progress.completedLectures) ? progress.completedLectures.map((id) => id.toString()) : []),
    [progress.completedLectures]
  );

  const completedSet = useMemo(() => new Set(completedLectureIds), [completedLectureIds]);

  const syncLectureProgress = useCallback(
    async (lectureId, completed = false) => {
      if (!canTrackProgress || !lectureId) return null;

      try {
        const { data } = await api.post("/progress/mark-complete", {
          courseId,
          lectureId,
          completed
        });

        setProgress((prev) => ({
          ...prev,
          ...data
        }));

        return data;
      } catch {
        return null;
      }
    },
    [canTrackProgress, courseId]
  );

  const loadCourseData = useCallback(async () => {
    try {
      setLoading(true);
      setError("");

      const [contentRes, progressRes] = await Promise.all([
        api.get(`/course/${courseId}/content`),
        api
          .get(`/progress/${courseId}`)
          .then((res) => res)
          .catch(() => ({ data: null }))
      ]);

      const contentPayload = contentRes.data || {};
      const progressPayload =
        progressRes.data ||
        {
          completedLectures: [],
          completedLectureCount: 0,
          totalLectures: 0,
          percent: 0,
          lastWatchedLecture: null
        };

      const normalizedModules = Array.isArray(contentPayload.modules)
        ? contentPayload.modules
        : [];

      const normalizedContent = {
        courseTitle: contentPayload.courseTitle || "Course Player",
        modules: normalizedModules,
        isEnrolled: Boolean(contentPayload.isEnrolled),
        canAccessFullContent: Boolean(contentPayload.canAccessFullContent)
      };

      setCourseContent(normalizedContent);
      setProgress((prev) => ({ ...prev, ...progressPayload }));

      const firstLecture = getInitialLecture(normalizedModules, progressPayload.lastWatchedLecture);
      setSelectedLecture(firstLecture);

      if (firstLecture && canTrackProgress && !firstLecture.locked) {
        await syncLectureProgress(firstLecture._id, false);
      }
    } catch (err) {
      setError(err.response?.data?.message || "Failed to load course content");
      setCourseContent({
        courseTitle: "",
        modules: [],
        isEnrolled: false,
        canAccessFullContent: false
      });
      setProgress({
        completedLectures: [],
        completedLectureCount: 0,
        totalLectures: 0,
        percent: 0,
        lastWatchedLecture: null
      });
      setSelectedLecture(null);
    } finally {
      setLoading(false);
    }
  }, [canTrackProgress, courseId, syncLectureProgress]);

  useEffect(() => {
    if (!courseId) return;
    loadCourseData();
  }, [courseId, loadCourseData]);

  const handleSelectLecture = (lecture) => {
    if (!lecture || lecture.locked) return;
    setSelectedLecture(lecture);
    void syncLectureProgress(lecture._id, false);
  };

  const handleMarkComplete = async () => {
    if (!selectedLecture || selectedLecture.locked || !canTrackProgress) return;

    try {
      setMarkingComplete(true);
      await syncLectureProgress(selectedLecture._id, true);
    } finally {
      setMarkingComplete(false);
    }
  };

  const handleAutoNext = async () => {
    if (!selectedLecture || selectedLecture.locked) return;

    if (canTrackProgress) {
      await syncLectureProgress(selectedLecture._id, true);
    }

    const currentIndex = playableLectures.findIndex(
      (lecture) => lecture._id.toString() === selectedLecture._id.toString()
    );

    if (currentIndex >= 0 && currentIndex < playableLectures.length - 1) {
      const nextLecture = playableLectures[currentIndex + 1];
      setSelectedLecture(nextLecture);
      void syncLectureProgress(nextLecture._id, false);
    }
  };

  const progressPercent = Math.max(0, Math.min(100, Number(progress.percent) || 0));
  const completedCount = Number(progress.completedLectureCount) || completedLectureIds.length;
  const totalCount = Number(progress.totalLectures) || playableLectures.length || 0;

  const lastWatchedLectureTitle = useMemo(() => {
    if (!progress.lastWatchedLecture) return "Not started";

    const found = allLectures.find(
      (lecture) => lecture._id.toString() === progress.lastWatchedLecture.toString()
    );

    return found?.title || "Previously watched lecture";
  }, [allLectures, progress.lastWatchedLecture]);

  if (loading) {
    return <div className="p-6 text-sm text-slate-600">Loading lecture content...</div>;
  }

  if (error) {
    return (
      <div className="rounded-2xl border border-rose-200 bg-rose-50 p-6">
        <p className="text-sm font-semibold text-rose-700">{error}</p>
        <Link
          to="/dashboard/my-courses"
          className="mt-4 inline-flex rounded-lg bg-rose-600 px-4 py-2 text-sm font-semibold text-white hover:bg-rose-700"
        >
          Back to My Courses
        </Link>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <section className="rounded-3xl border border-blue-100 bg-gradient-to-r from-blue-50 via-cyan-50 to-white p-6 sm:p-8">
        <p className="text-xs font-semibold tracking-[0.12em] text-blue-700">VIDEO LEARNING</p>
        <h2 className="mt-2 text-2xl sm:text-3xl font-black text-slate-900">{courseContent.courseTitle}</h2>
        <p className="mt-2 text-sm text-slate-600 max-w-3xl">
          Watch lectures in sequence, track completion, and resume from where you left off.
        </p>

        <div className="mt-5 grid grid-cols-2 md:grid-cols-4 gap-3 text-center">
          <div className="rounded-xl border border-blue-100 bg-white p-3">
            <p className="text-xs text-slate-500">Progress</p>
            <p className="text-xl font-black text-blue-700">{progressPercent}%</p>
          </div>
          <div className="rounded-xl border border-blue-100 bg-white p-3">
            <p className="text-xs text-slate-500">Completed</p>
            <p className="text-xl font-black text-slate-900">{completedCount}</p>
          </div>
          <div className="rounded-xl border border-blue-100 bg-white p-3">
            <p className="text-xs text-slate-500">Total Lectures</p>
            <p className="text-xl font-black text-slate-900">{totalCount}</p>
          </div>
          <div className="rounded-xl border border-blue-100 bg-white p-3">
            <p className="text-xs text-slate-500">Access</p>
            <p className="text-sm font-bold text-slate-900">
              {courseContent.canAccessFullContent ? "Full Course" : "Preview Only"}
            </p>
          </div>
        </div>

        <div className="mt-4 h-2.5 rounded-full bg-slate-100 overflow-hidden">
          <div
            className="h-2.5 rounded-full bg-gradient-to-r from-blue-600 to-cyan-500 transition-all"
            style={{ width: `${progressPercent}%` }}
          />
        </div>

        <p className="mt-2 text-xs text-slate-500">Last watched: {lastWatchedLectureTitle}</p>

        {!courseContent.canAccessFullContent && (
          <div className="mt-4 rounded-xl border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-700">
            You are currently viewing preview lectures only. Enroll in this course to unlock all videos.
          </div>
        )}
      </section>

      <div className="grid grid-cols-1 xl:grid-cols-[2fr_1fr] gap-6">
        <div className="space-y-4">
          <VideoPlayer lecture={selectedLecture} onEnded={handleAutoNext} />

          <section className="rounded-2xl border border-slate-200 bg-white p-4 sm:p-5 shadow-sm">
            <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-3">
              <div>
                <h3 className="text-lg font-extrabold text-slate-900">
                  {selectedLecture?.title || "Select a lecture"}
                </h3>
                <p className="text-sm text-slate-600 mt-1">
                  {selectedLecture?.isPreview ? "Preview Lecture" : "Course Lecture"}
                </p>
              </div>

              {selectedLecture && canTrackProgress && !selectedLecture.locked && (
                <button
                  type="button"
                  onClick={handleMarkComplete}
                  disabled={markingComplete}
                  className="rounded-lg bg-emerald-600 px-4 py-2 text-sm font-semibold text-white hover:bg-emerald-700 disabled:opacity-60"
                >
                  {completedSet.has(selectedLecture._id.toString())
                    ? "Completed"
                    : markingComplete
                    ? "Saving..."
                    : "Mark as Complete"}
                </button>
              )}
            </div>
          </section>
        </div>

        <LectureSidebar
          modules={courseContent.modules}
          selectedLectureId={selectedLecture?._id}
          onSelectLecture={handleSelectLecture}
          completedLectureIds={completedLectureIds}
        />
      </div>
    </div>
  );
}
