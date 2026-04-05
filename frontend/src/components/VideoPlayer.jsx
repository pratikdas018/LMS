import ReactPlayer from "react-player";

const normalizeVideoUrl = (rawUrl = "") => {
  try {
    const parsed = new URL(rawUrl);

    // Normalize short YouTube URLs for consistent embedding.
    if (parsed.hostname === "youtu.be") {
      const videoId = parsed.pathname.replace("/", "").trim();
      if (videoId) {
        return `https://www.youtube.com/watch?v=${videoId}`;
      }
    }

    return rawUrl;
  } catch (error) {
    return rawUrl;
  }
};

export default function VideoPlayer({ lecture, onEnded }) {
  if (!lecture) {
    return (
      <div className="aspect-video w-full rounded-2xl border border-slate-200 bg-slate-100 grid place-items-center text-slate-500 text-sm">
        No lecture selected.
      </div>
    );
  }

  if (lecture.locked || !lecture.videoUrl) {
    return (
      <div className="aspect-video w-full rounded-2xl border border-amber-200 bg-amber-50 grid place-items-center px-6 text-center">
        <div>
          <p className="text-base font-bold text-amber-700">Lecture Locked</p>
          <p className="mt-1 text-sm text-amber-600">
            Enroll in this course to unlock this lecture.
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="w-full overflow-hidden rounded-2xl border border-slate-200 bg-black shadow-sm">
      <div className="aspect-video w-full">
        <ReactPlayer
          src={normalizeVideoUrl(lecture.videoUrl)}
          controls
          width="100%"
          height="100%"
          onEnded={onEnded}
          playsInline
        />
      </div>
    </div>
  );
}
