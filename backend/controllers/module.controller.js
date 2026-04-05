import Course from "../models/Course.js";
import Module from "../models/Module.js";

export const createModule = async (req, res) => {
  try {
    const { title, courseId, order } = req.body;

    if (!title || !courseId) {
      return res.status(400).json({ message: "Title and courseId are required" });
    }

    const course = await Course.findById(courseId);
    if (!course) {
      return res.status(404).json({ message: "Course not found" });
    }

    const nextOrder = await Module.countDocuments({ courseId });
    const resolvedOrder = Number.isFinite(Number(order)) ? Number(order) : nextOrder + 1;

    const moduleDoc = await Module.create({
      title: title.trim(),
      courseId,
      order: resolvedOrder,
      lectures: []
    });

    res.status(201).json(moduleDoc);
  } catch (err) {
    res.status(500).json({ message: "Failed to create module" });
  }
};
