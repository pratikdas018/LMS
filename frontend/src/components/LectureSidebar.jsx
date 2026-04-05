const formatDuration = (seconds = 0) => {
  const safeSeconds = Math.max(0, Number(seconds) || 0);
  const mins = Math.floor(safeSeconds / 60);
  const secs = Math.floor(safeSeconds % 60)
    .toString()
    .padStart(2, "0");
  return `${mins}:${secs}`;
};

export default function LectureSidebar({
  modules = [],
  selectedLectureId,
  onSelectLecture,
  completedLectureIds = []
}) {
  const completedSet = new Set(completedLectureIds.map((id) => id.toString()));

  return (
    <aside className="rounded-2xl border border-slate-200 bg-white shadow-sm">
      <div className="border-b border-slate-200 px-4 py-3">
        <h3 className="text-base font-extrabold text-slate-900">Course Content</h3>
      </div>

      <div className="max-h-[70vh] overflow-y-auto p-3 space-y-3">
        {modules.length === 0 && (
          <div className="rounded-xl border border-dashed border-slate-300 bg-slate-50 p-4 text-sm text-slate-500">
            No modules created yet.
          </div>
        )}

        {modules.map((moduleItem) => (
          <div key={moduleItem._id} className="rounded-xl border border-slate-200 bg-slate-50">
            <div className="border-b border-slate-200 px-3 py-2">
              <p className="text-sm font-bold text-slate-900">{moduleItem.title}</p>
            </div>

            <div className="space-y-1 p-2">
              {(moduleItem.lectures || []).map((lecture) => {
                const isSelected = lecture._id === selectedLectureId;
                const isCompleted = completedSet.has(lecture._id.toString());
                const isLocked = Boolean(lecture.locked);

                return (
                  <button
                    key={lecture._id}
                    type="button"
                    onClick={() => !isLocked && onSelectLecture(lecture)}
                    className={`w-full rounded-lg border px-3 py-2 text-left transition ${
                      isSelected
                        ? "border-blue-300 bg-blue-50"
                        : "border-transparent bg-white hover:border-slate-200"
                    } ${isLocked ? "opacity-60 cursor-not-allowed" : ""}`}
                    disabled={isLocked}
                  >
                    <div className="flex items-start justify-between gap-2">
                      <p className="text-sm font-semibold text-slate-800 line-clamp-2">{lecture.title}</p>
                      <div className="flex items-center gap-1.5">
                        {lecture.isPreview && (
                          <span className="rounded-full border border-emerald-200 bg-emerald-50 px-2 py-0.5 text-[10px] font-bold text-emerald-700">
                            Preview
                          </span>
                        )}
                        {isCompleted && (
                          <span className="inline-flex h-5 w-5 items-center justify-center rounded-full bg-emerald-500 text-white text-[11px]">
                            ?
                          </span>
                        )}
                      </div>
                    </div>

                    <div className="mt-1 flex items-center justify-between text-[11px] text-slate-500">
                      <span>{isLocked ? "Locked" : "Playable"}</span>
                      <span>{formatDuration(lecture.duration)}</span>
                    </div>
                  </button>
                );
              })}
            </div>
          </div>
        ))}
      </div>
    </aside>
  );
}
