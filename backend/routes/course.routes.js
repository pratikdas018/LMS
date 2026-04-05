import express from "express";
import { protect } from "../middleware/auth.middleware.js";
import {
  enrollCourse,
  getAllCourses,
  getTeacherCourses,
  getEnrolledCourses,
  getCourseContent
} from "../controllers/course.controller.js";

const router = express.Router();

router.get("/", protect(), getAllCourses);
router.get("/teacher", protect(["teacher", "admin"]), getTeacherCourses);
router.get("/enrolled/:userId", protect(), getEnrolledCourses);
router.get("/:id/content", protect(), getCourseContent);
router.post("/enroll", protect(), enrollCourse);

export default router;
