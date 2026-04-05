import express from "express";
import Progress from "../models/Progress.js";
import Course from "../models/Course.js";
import { protect } from "../middleware/auth.middleware.js";
import {
  getUserProgress,
  getCourseProgress,
  recalculateProgress,
  markLectureComplete,
  getCourseLectureProgress
} from "../controllers/progress.controller.js";

const router = express.Router();

/**
 * 📊 Student progress (used by StudentDashboard)
 */
router.get("/user/:userId", protect(["student"]), getUserProgress);

/**
 * 📊 Teacher/Admin course-wise analytics
 */
router.get("/course/:courseId", protect(["teacher", "admin"]), getCourseProgress);

/**
 * 🔄 Force Recalculate (Fix inconsistencies)
 */
router.post("/recalculate", protect(), recalculateProgress);

/**
 * Lecture progress APIs
 */
router.post("/mark-complete", protect(), markLectureComplete);

/**
 * 📈 Overall analytics
 */
router.get(
  "/analytics",
  protect(["teacher", "admin"]),
  async (req, res) => {
    try {
      const data = await Progress.aggregate([
        {
          $project: {
            courseId: 1,
            percent: {
              $cond: [
                { $eq: ["$totalTasks", 0] },
                0,
                {
                  $multiply: [
                    { $divide: ["$completedTasks", "$totalTasks"] },
                    100
                  ]
                }
              ]
            }
          }
        },
        {
          $group: {
            _id: "$courseId",
            averageProgress: { $avg: "$percent" }
          }
        }
      ]);

      const formatted = await Promise.all(
        data.map(async d => {
          const course = await Course.findById(d._id);
          return {
            course: course?.title || "Unknown",
            averageProgress: Math.round(d.averageProgress)
          };
        })
      );

      res.json(formatted);
    } catch (err) {
      res.status(500).json({ message: "Analytics failed" });
    }
  }
);

router.get("/:courseId", protect(), getCourseLectureProgress);

export default router;
