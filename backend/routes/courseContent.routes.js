import express from "express";
import { protect } from "../middleware/auth.middleware.js";
import { getCourseContent } from "../controllers/course.controller.js";

const router = express.Router();

router.get("/:id/content", protect(), getCourseContent);

export default router;
