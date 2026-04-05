import multer from "multer";

const MAX_VIDEO_SIZE_MB = 200;
const allowedVideoMimes = [
  "video/mp4",
  "video/webm",
  "video/quicktime",
  "video/x-matroska",
  "video/ogg"
];

const upload = multer({
  storage: multer.memoryStorage(),
  limits: {
    fileSize: MAX_VIDEO_SIZE_MB * 1024 * 1024
  },
  fileFilter: (req, file, cb) => {
    if (!allowedVideoMimes.includes(file.mimetype)) {
      cb(new Error("Only video files are allowed."));
      return;
    }

    cb(null, true);
  }
});

export const uploadVideoMiddleware = (req, res, next) => {
  upload.single("video")(req, res, (err) => {
    if (err) {
      return res.status(400).json({
        message: err.message || "Video upload failed"
      });
    }

    return next();
  });
};

