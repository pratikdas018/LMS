import Progress from "../models/Progress.js";
import Certificate from "../models/Certificate.js";
import Task from "../models/Task.js";
import Course from "../models/Course.js";
import Lecture from "../models/Lecture.js";

const toPercent = (completed, total) => {
  if (!total) return 0;
  return Math.round((completed / total) * 100);
};

const hasEnrollment = async (courseId, userId) => {
  const [courseMatch, progressMatch] = await Promise.all([
    Course.exists({ _id: courseId, students: userId }),
    Progress.exists({ userId, courseId })
  ]);

  return Boolean(courseMatch || progressMatch);
};

const buildLectureProgressPayload = async ({ courseId, userId, canAccessFullContent }) => {
  const lectureFilter = canAccessFullContent ? { courseId } : { courseId, isPreview: true };

  const [progressDoc, accessibleLectures] = await Promise.all([
    Progress.findOne({ userId, courseId }).lean(),
    Lecture.find(lectureFilter).select("_id").lean()
  ]);

  const accessibleSet = new Set(accessibleLectures.map((lecture) => lecture._id.toString()));
  const completedLectures = (progressDoc?.completedLectures || []).filter((lectureId) =>
    accessibleSet.has(lectureId.toString())
  );

  const totalLectures = accessibleLectures.length;
  const percent = toPercent(completedLectures.length, totalLectures);

  const lastWatchedLecture = progressDoc?.lastWatchedLecture
    ? accessibleSet.has(progressDoc.lastWatchedLecture.toString())
      ? progressDoc.lastWatchedLecture
      : null
    : null;

  return {
    courseId,
    completedLectures,
    completedLectureCount: completedLectures.length,
    totalLectures,
    percent,
    lastWatchedLecture,
    isEnrolled: canAccessFullContent,
    canAccessFullContent
  };
};

/**
 * Get progress for a specific user (Student view)
 */
export const getUserProgress = async (req, res) => {
  try {
    const { userId } = req.params;

    const progress = await Progress.find({ userId }).populate("courseId", "title").lean();

    const progressWithPercent = progress.map((p) => {
      const total = p.totalTasks || 0;
      const completed = p.completedTasks || 0;
      const percent = toPercent(completed, total);
      return { ...p, percent, progress: percent };
    });

    res.json(progressWithPercent);
  } catch (err) {
    res.status(500).json({ message: "Failed to fetch user progress" });
  }
};

/**
 * Get progress of all students for a course (Teacher view)
 */
export const getCourseProgress = async (req, res) => {
  try {
    const { courseId } = req.params;

    const progress = await Progress.find({ courseId }).populate("userId", "name email").lean();

    const progressWithPercent = progress.map((p) => {
      const total = p.totalTasks || 0;
      const completed = p.completedTasks || 0;
      const percent = toPercent(completed, total);
      return { ...p, percent, progress: percent };
    });

    res.json(progressWithPercent);
  } catch (err) {
    res.status(500).json({ message: "Failed to fetch course progress" });
  }
};

/**
 * Update progress (used by quiz auto-update)
 */
export const updateProgress = async (req, res) => {
  try {
    const { userId, courseId, completedLessons, totalLessons } = req.body;

    const progressDoc = await Progress.findOneAndUpdate(
      { userId, courseId },
      { completedLessons, totalLessons },
      { new: true, upsert: true }
    );

    const p = progressDoc.toObject();
    const total = p.totalTasks || 0;
    const completed = p.completedTasks || 0;
    const percent = toPercent(completed, total);

    if (percent === 100) {
      const exists = await Certificate.findOne({ userId, courseId });
      if (!exists) {
        await Certificate.create({
          userId,
          courseId,
          issuedAt: new Date()
        });
      }
    }

    res.json({ ...p, percent, progress: percent });
  } catch (err) {
    res.status(500).json({ message: "Failed to update progress" });
  }
};

/**
 * Mark lecture complete + update last watched lecture.
 */
export const markLectureComplete = async (req, res) => {
  try {
    const userId = req.user.id;
    const { courseId, lectureId, completed = true } = req.body;

    if (!courseId || !lectureId) {
      return res.status(400).json({ message: "courseId and lectureId are required" });
    }

    const lecture = await Lecture.findById(lectureId).lean();
    if (!lecture) {
      return res.status(404).json({ message: "Lecture not found" });
    }

    if (lecture.courseId.toString() !== courseId.toString()) {
      return res.status(400).json({ message: "Lecture does not belong to this course" });
    }

    const canAccessFullContent = await hasEnrollment(courseId, userId);

    if (!canAccessFullContent && !lecture.isPreview) {
      return res.status(403).json({ message: "Enroll in this course to access this lecture" });
    }

    const shouldMarkComplete = completed === true || completed === "true";

    const update = {
      $set: {
        lastWatchedLecture: lectureId
      },
      $setOnInsert: {
        userId,
        courseId
      }
    };

    if (shouldMarkComplete) {
      update.$addToSet = { completedLectures: lectureId };
    }

    const progressDoc = await Progress.findOneAndUpdate({ userId, courseId }, update, {
      new: true,
      upsert: true,
      setDefaultsOnInsert: true
    });

    const lectureProgress = await buildLectureProgressPayload({
      courseId,
      userId,
      canAccessFullContent
    });

    progressDoc.completedLessons = lectureProgress.completedLectureCount;
    progressDoc.totalLessons = lectureProgress.totalLectures;
    await progressDoc.save();

    res.json({
      message: "Progress updated",
      ...lectureProgress
    });
  } catch (err) {
    console.error("markLectureComplete error:", err);
    res.status(500).json({ message: "Failed to update lecture progress" });
  }
};

/**
 * Get current user's lecture progress for a course.
 */
export const getCourseLectureProgress = async (req, res) => {
  try {
    const userId = req.user.id;
    const { courseId } = req.params;

    const course = await Course.findById(courseId).lean();
    if (!course) {
      return res.status(404).json({ message: "Course not found" });
    }

    const canAccessFullContent = await hasEnrollment(courseId, userId);

    const lectureProgress = await buildLectureProgressPayload({
      courseId,
      userId,
      canAccessFullContent
    });

    res.json(lectureProgress);
  } catch (err) {
    res.status(500).json({ message: "Failed to fetch lecture progress" });
  }
};

/**
 * Force recalculate progress (Fix inconsistencies)
 */
export const recalculateProgress = async (req, res) => {
  try {
    const userId = req.user.id;
    const { courseId } = req.body;

    if (!courseId) {
      return res.status(400).json({ message: "Course ID required" });
    }

    const tasks = await Task.find({ courseId });
    let completedTasks = 0;

    tasks.forEach((task) => {
      const submissions = Array.isArray(task.submissions) ? task.submissions : [];
      const submission = submissions.find((s) => s.studentId.toString() === userId);
      if (submission?.status === "pass") {
        completedTasks++;
      }
    });

    const currentProgress = await Progress.findOne({ userId, courseId });
    const totalLessons = currentProgress?.totalLessons || 0;
    const completedLessons = currentProgress?.completedLessons || 0;

    const progressDoc = await Progress.findOneAndUpdate(
      { userId, courseId },
      {
        completedTasks,
        totalTasks: tasks.length,
        totalLessons,
        completedLessons
      },
      { new: true, upsert: true }
    );

    const p = progressDoc.toObject();
    const total = p.totalTasks || 0;
    const completed = p.completedTasks || 0;
    const percent = toPercent(completed, total);

    if (percent === 100) {
      const exists = await Certificate.findOne({ userId, courseId });
      if (!exists) {
        await Certificate.create({
          userId,
          courseId,
          issuedAt: new Date()
        });
      }
    }

    res.json({ ...p, percent, progress: percent });
  } catch (err) {
    console.error("Recalculate error:", err);
    res.status(500).json({ message: "Failed to recalculate progress" });
  }
};
