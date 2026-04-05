export default function AppLoader({
  message = "Loading...",
  compact = false,
  className = ""
}) {
  return (
    <div className={className}>
      <div
        className={`mx-auto rounded-2xl border border-slate-200 bg-white/90 shadow-sm backdrop-blur ${
          compact ? "max-w-sm p-4" : "max-w-lg p-6"
        }`}
      >
        <div className="flex items-center gap-3">
          <div
            className={`relative shrink-0 ${
              compact ? "h-10 w-10" : "h-14 w-14"
            }`}
          >
            <span className="lms-loader-ring" />
            <span className="lms-loader-orbit" />
            <span className="lms-loader-core" />
          </div>

          <div className="flex-1">
            <p
              className={`font-semibold text-slate-700 ${
                compact ? "text-sm" : "text-base"
              }`}
            >
              {message}
            </p>

            <div className="mt-2 h-1.5 w-full rounded-full bg-slate-200 overflow-hidden">
              <div className="h-full w-1/2 lms-loader-shimmer" />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

