import { useEffect, useMemo, useState } from "react";
import api from "../utils/axios";

export default function TeacherLectureManager({ courseId }) {
  const [modules, setModules] = useState([]);
  const [courseTitle, setCourseTitle] = useState("");
  const [loading, setLoading] = useState(true);

  const [moduleTitle, setModuleTitle] = useState("");
  const [creatingModule, setCreatingModule] = useState(false);

  const [lectureForm, setLectureForm] = useState({
    title: "",
    moduleId: "",
    duration: "",
    order: "",
    isPreview: false
  });
  const [sourceType, setSourceType] = useState("upload");
  const [youtubeUrl, setYoutubeUrl] = useState("");
  const [videoFile, setVideoFile] = useState(null);
  const [creatingLecture, setCreatingLecture] = useState(false);

  const loadContent = async () => {
    if (!courseId) return;

    try {
      setLoading(true);
      const { data } = await api.get(`/course/${courseId}/content`);
      setModules(Array.isArray(data.modules) ? data.modules : []);
      setCourseTitle(data.courseTitle || "Selected Course");
    } catch {
      setModules([]);
      setCourseTitle("Selected Course");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (!courseId) return;
    loadContent();
  }, [courseId]);

  const totalLectures = useMemo(
    () => modules.reduce((count, moduleItem) => count + (moduleItem.lectures?.length || 0), 0),
    [modules]
  );

  const handleCreateModule = async (e) => {
    e.preventDefault();
    if (!moduleTitle.trim()) return;

    try {
      setCreatingModule(true);
      await api.post("/module/create", {
        title: moduleTitle.trim(),
        courseId
      });
      setModuleTitle("");
      await loadContent();
    } catch (err) {
      alert(err.response?.data?.message || "Failed to create module");
    } finally {
      setCreatingModule(false);
    }
  };

  const handleCreateLecture = async (e) => {
    e.preventDefault();

    if (!lectureForm.title.trim() || !lectureForm.moduleId) {
      alert("Lecture title and module are required.");
      return;
    }

    try {
      setCreatingLecture(true);
      let resolvedVideoUrl = "";
      let resolvedDuration = Number(lectureForm.duration) || 0;

      if (sourceType === "upload") {
        if (!videoFile) {
          alert("Please choose a video file.");
          setCreatingLecture(false);
          return;
        }

        const formData = new FormData();
        formData.append("video", videoFile);

        const uploadRes = await api.post("/lecture/upload", formData, {
          headers: {
            "Content-Type": "multipart/form-data"
          }
        });

        resolvedVideoUrl = uploadRes.data.videoUrl;
        if (!resolvedDuration) {
          resolvedDuration = Number(uploadRes.data.duration) || 0;
        }
      } else {
        if (!youtubeUrl.trim()) {
          alert("Please enter a YouTube URL.");
          setCreatingLecture(false);
          return;
        }

        resolvedVideoUrl = youtubeUrl.trim();
      }

      await api.post("/lecture/create", {
        title: lectureForm.title.trim(),
        moduleId: lectureForm.moduleId,
        courseId,
        videoUrl: resolvedVideoUrl,
        duration: resolvedDuration,
        order: lectureForm.order === "" ? undefined : Number(lectureForm.order),
        isPreview: lectureForm.isPreview
      });

      setLectureForm((prev) => ({
        ...prev,
        title: "",
        duration: "",
        order: "",
        isPreview: false
      }));
      setVideoFile(null);
      setYoutubeUrl("");
      setSourceType("upload");
      await loadContent();
    } catch (err) {
      alert(err.response?.data?.message || "Failed to create lecture");
    } finally {
      setCreatingLecture(false);
    }
  };

  return (
    <div className="space-y-5">
      <div className="rounded-2xl border border-violet-100 bg-gradient-to-r from-violet-50 via-fuchsia-50 to-white p-5">
        <p className="text-xs font-semibold tracking-[0.12em] text-violet-700">VIDEO CONTENT</p>
        <h4 className="mt-1 text-xl font-extrabold text-slate-900">{courseTitle}</h4>
        <div className="mt-4 grid grid-cols-2 gap-3 text-center">
          <div className="rounded-xl border border-violet-100 bg-white p-3">
            <p className="text-xs text-slate-500">Modules</p>
            <p className="text-xl font-black text-slate-900">{modules.length}</p>
          </div>
          <div className="rounded-xl border border-violet-100 bg-white p-3">
            <p className="text-xs text-slate-500">Lectures</p>
            <p className="text-xl font-black text-violet-700">{totalLectures}</p>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 xl:grid-cols-2 gap-5">
        <form onSubmit={handleCreateModule} className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
          <h5 className="text-base font-extrabold text-slate-900">Create Module</h5>
          <p className="mt-1 text-xs text-slate-500">Modules organize your course lectures.</p>

          <input
            type="text"
            value={moduleTitle}
            onChange={(e) => setModuleTitle(e.target.value)}
            placeholder="Module title"
            className="mt-4 w-full rounded-xl border border-slate-300 px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-violet-400"
            required
          />

          <button
            type="submit"
            disabled={creatingModule}
            className="mt-4 rounded-xl bg-violet-600 px-4 py-2 text-sm font-semibold text-white hover:bg-violet-700 disabled:opacity-60"
          >
            {creatingModule ? "Creating..." : "Create Module"}
          </button>
        </form>

        <form onSubmit={handleCreateLecture} className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
          <h5 className="text-base font-extrabold text-slate-900">Create Lecture</h5>
          <p className="mt-1 text-xs text-slate-500">
            Upload via Cloudinary or add a YouTube URL for free preview lecture.
          </p>

          <div className="mt-4 rounded-xl border border-slate-200 bg-slate-50 p-3">
            <p className="text-xs font-semibold text-slate-600 mb-2">Video Source</p>
            <div className="flex flex-wrap gap-3 text-sm">
              <label className="inline-flex items-center gap-2 text-slate-700">
                <input
                  type="radio"
                  name="sourceType"
                  value="upload"
                  checked={sourceType === "upload"}
                  onChange={() => setSourceType("upload")}
                />
                Upload File
              </label>
              <label className="inline-flex items-center gap-2 text-slate-700">
                <input
                  type="radio"
                  name="sourceType"
                  value="youtube"
                  checked={sourceType === "youtube"}
                  onChange={() => {
                    setSourceType("youtube");
                    setLectureForm((prev) => ({ ...prev, isPreview: true }));
                  }}
                />
                YouTube URL
              </label>
            </div>
          </div>

          <div className="mt-3 space-y-3">
            <input
              type="text"
              value={lectureForm.title}
              onChange={(e) => setLectureForm((prev) => ({ ...prev, title: e.target.value }))}
              placeholder="Lecture title"
              className="w-full rounded-xl border border-slate-300 px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-violet-400"
              required
            />

            <select
              value={lectureForm.moduleId}
              onChange={(e) => setLectureForm((prev) => ({ ...prev, moduleId: e.target.value }))}
              className="w-full rounded-xl border border-slate-300 bg-white px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-violet-400"
              required
            >
              <option value="">Select module</option>
              {modules.map((moduleItem) => (
                <option key={moduleItem._id} value={moduleItem._id}>
                  {moduleItem.title}
                </option>
              ))}
            </select>

            <div className="grid grid-cols-2 gap-3">
              <input
                type="number"
                min="0"
                value={lectureForm.duration}
                onChange={(e) => setLectureForm((prev) => ({ ...prev, duration: e.target.value }))}
                placeholder="Duration (sec)"
                className="w-full rounded-xl border border-slate-300 px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-violet-400"
              />

              <input
                type="number"
                min="1"
                value={lectureForm.order}
                onChange={(e) => setLectureForm((prev) => ({ ...prev, order: e.target.value }))}
                placeholder="Order"
                className="w-full rounded-xl border border-slate-300 px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-violet-400"
              />
            </div>

            <label className="flex items-center gap-2 rounded-xl border border-slate-200 bg-slate-50 px-3 py-2 text-sm text-slate-700">
              <input
                type="checkbox"
                checked={lectureForm.isPreview}
                onChange={(e) =>
                  setLectureForm((prev) => ({
                    ...prev,
                    isPreview: e.target.checked
                  }))
                }
              />
              Set as preview lecture
            </label>

            {sourceType === "upload" ? (
              <input
                type="file"
                accept="video/*"
                onChange={(e) => setVideoFile(e.target.files?.[0] || null)}
                className="w-full rounded-xl border border-slate-300 px-3 py-2 text-sm file:mr-3 file:rounded-lg file:border-0 file:bg-violet-100 file:px-3 file:py-1.5 file:text-violet-700"
                required={sourceType === "upload"}
              />
            ) : (
              <input
                type="url"
                value={youtubeUrl}
                onChange={(e) => setYoutubeUrl(e.target.value)}
                placeholder="https://www.youtube.com/watch?v=..."
                className="w-full rounded-xl border border-slate-300 px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-violet-400"
                required={sourceType === "youtube"}
              />
            )}
          </div>

          <button
            type="submit"
            disabled={creatingLecture || modules.length === 0}
            className="mt-4 rounded-xl bg-emerald-600 px-4 py-2 text-sm font-semibold text-white hover:bg-emerald-700 disabled:opacity-60"
          >
            {creatingLecture ? "Uploading & Saving..." : "Create Lecture"}
          </button>
        </form>
      </div>

      <section className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
        <h5 className="text-base font-extrabold text-slate-900">Current Modules & Lectures</h5>

        {loading ? (
          <p className="mt-3 text-sm text-slate-500">Loading content...</p>
        ) : modules.length === 0 ? (
          <p className="mt-3 text-sm text-slate-500">No modules yet. Create your first module.</p>
        ) : (
          <div className="mt-4 space-y-3">
            {modules.map((moduleItem) => (
              <article key={moduleItem._id} className="rounded-xl border border-slate-200 bg-slate-50 p-4">
                <h6 className="text-sm font-bold text-slate-900">{moduleItem.title}</h6>

                <div className="mt-2 space-y-2">
                  {(moduleItem.lectures || []).map((lecture) => (
                    <div
                      key={lecture._id}
                      className="rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm flex items-center justify-between"
                    >
                      <span className="font-medium text-slate-800">{lecture.title}</span>
                      <span className="text-xs text-slate-500">
                        {lecture.isPreview ? "Preview" : "Paid"} | {Math.round(lecture.duration || 0)}s
                      </span>
                    </div>
                  ))}

                  {(moduleItem.lectures || []).length === 0 && (
                    <p className="text-xs text-slate-500">No lectures in this module yet.</p>
                  )}
                </div>
              </article>
            ))}
          </div>
        )}
      </section>
    </div>
  );
}
