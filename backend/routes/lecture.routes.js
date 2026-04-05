import express from "express";
import { protect } from "../middleware/auth.middleware.js";
import { uploadVideoMiddleware } from "../middleware/videoUpload.middleware.js";
import {
  createLecture,
  uploadLectureVideo
} from "../controllers/lecture.controller.js";

const router = express.Router();

router.post("/create", protect(["teacher"]), createLecture);
router.post("/upload", protect(["teacher"]), uploadVideoMiddleware, uploadLectureVideo);

export default router;
