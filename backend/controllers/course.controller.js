import Course from "../models/Course.js";
import Progress from "../models/Progress.js";
import Task from "../models/Task.js";
import Lecture from "../models/Lecture.js";
import Module from "../models/Module.js";

const hasStudentEnrollment = async (course, courseId, userId) => {
  if (!userId) return false;

  const listedInCourse =
    Array.isArray(course?.students) &&
    course.students.some((studentId) => studentId.toString() === userId.toString());

  if (listedInCourse) return true;

  const progressExists = await Progress.exists({ userId, courseId });
  return Boolean(progressExists);
};

/* All courses */
export const getAllCourses = async (req, res) => {
  try {
    const courses = await Course.find();
    res.json(courses);
  } catch (err) {
    res.status(500).json({ message: "Failed to fetch courses" });
  }
};

/* Courses teacher created */
export const getTeacherCourses = async (req, res) => {
  try {
    const isAdmin = req.user?.role === "admin";
    const filter = isAdmin
      ? {}
      : {
          $or: [{ instructor: req.user.id }, { teacherId: req.user.id }, { teacher: req.user.id }]
        };

    const courses = await Course.find(filter);
    res.json(courses);
  } catch (err) {
    res.status(500).json({ message: "Failed to fetch teacher courses" });
  }
};

export const enrollCourse = async (req, res) => {
  try {
    const { courseId, userId: requestedUserId } = req.body;
    const userId = requestedUserId || req.user.id;

    if (!courseId) {
      return res.status(400).json({ message: "Course ID is required" });
    }

    if (
      req.user.role !== "admin" &&
      requestedUserId &&
      requestedUserId.toString() !== req.user.id.toString()
    ) {
      return res.status(403).json({ message: "You can only enroll yourself" });
    }

    const course = await Course.findById(courseId);
    if (!course) {
      return res.status(404).json({ message: "Course not found" });
    }

    // Prevent duplicate enrollment.
    const exists = await Progress.findOne({ userId, courseId });
    if (exists) {
      await Course.findByIdAndUpdate(courseId, { $addToSet: { students: userId } });
      return res.status(400).json({ message: "Already enrolled" });
    }

    const [totalTasks, totalLessons] = await Promise.all([
      Task.countDocuments({ courseId }),
      Lecture.countDocuments({ courseId })
    ]);

    const progress = await Progress.create({
      userId,
      courseId,
      completedTasks: 0,
      totalTasks,
      completedLessons: 0,
      totalLessons,
      completedLectures: []
    });

    await Course.findByIdAndUpdate(courseId, { $addToSet: { students: userId } });

    res.status(201).json(progress);
  } catch (err) {
    res.status(500).json({ message: "Failed to enroll in course" });
  }
};

/* Courses student enrolled */
export const getEnrolledCourses = async (req, res) => {
  try {
    const { userId } = req.params;

    if (req.user.role !== "admin" && req.user.id.toString() !== userId.toString()) {
      return res.status(403).json({ message: "Access denied" });
    }

    const [progressRecords, courseStudentRecords] = await Promise.all([
      Progress.find({ userId }).populate("courseId"),
      Course.find({ students: userId })
    ]);

    const courseMap = new Map();

    progressRecords.forEach((record) => {
      if (record.courseId?._id) {
        courseMap.set(record.courseId._id.toString(), record.courseId);
      }
    });

    courseStudentRecords.forEach((course) => {
      courseMap.set(course._id.toString(), course);
    });

    res.json(Array.from(courseMap.values()));
  } catch (err) {
    res.status(500).json({ message: "Failed to fetch enrolled courses" });
  }
};

/* Course modules and lectures (student/teacher) */
export const getCourseContent = async (req, res) => {
  try {
    const { id: courseId } = req.params;
    const userId = req.user.id;

    const course = await Course.findById(courseId).lean();
    if (!course) {
      return res.status(404).json({ message: "Course not found" });
    }

    const isTeacherOrAdmin = ["teacher", "admin"].includes(req.user.role);
    const enrolledAsStudent = await hasStudentEnrollment(course, courseId, userId);
    const hasFullAccess = isTeacherOrAdmin || enrolledAsStudent;

    const modules = await Module.find({ courseId })
      .populate({
        path: "lectures",
        options: { sort: { order: 1, createdAt: 1 } },
        select: "title videoUrl moduleId courseId duration order isPreview"
      })
      .sort({ order: 1, createdAt: 1 })
      .lean();

    const normalizedModules = modules.map((moduleItem) => {
      const lectures = (moduleItem.lectures || []).map((lecture) => {
        const locked = !hasFullAccess && !lecture.isPreview;

        return {
          ...lecture,
          locked,
          videoUrl: locked ? null : lecture.videoUrl
        };
      });

      return { ...moduleItem, lectures };
    });

    res.json({
      courseId: course._id,
      courseTitle: course.title,
      isEnrolled: enrolledAsStudent,
      canAccessFullContent: hasFullAccess,
      modules: normalizedModules
    });
  } catch (err) {
    res.status(500).json({ message: "Failed to fetch course content" });
  }
};
