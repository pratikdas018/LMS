import { Readable } from "stream";
import cloudinary, { assertCloudinaryConfig } from "../config/cloudinary.js";
import Course from "../models/Course.js";
import Module from "../models/Module.js";
import Lecture from "../models/Lecture.js";

const isValidHttpUrl = (value = "") => {
  try {
    const parsed = new URL(value);
    return parsed.protocol === "http:" || parsed.protocol === "https:";
  } catch (error) {
    return false;
  }
};

const uploadVideoToCloudinary = ({ buffer, originalname }) =>
  new Promise((resolve, reject) => {
    const folder = process.env.CLOUDINARY_VIDEO_FOLDER || "lms-lectures";

    const uploadStream = cloudinary.uploader.upload_stream(
      {
        resource_type: "video",
        folder
      },
      (error, result) => {
        if (error) {
          reject(error);
          return;
        }
        resolve(result);
      }
    );

    Readable.from(buffer).pipe(uploadStream);
  });

export const uploadLectureVideo = async (req, res) => {
  try {
    assertCloudinaryConfig();

    if (!req.file) {
      return res.status(400).json({ message: "Video file is required" });
    }

    const uploadResult = await uploadVideoToCloudinary(req.file);

    res.status(200).json({
      videoUrl: uploadResult.secure_url,
      publicId: uploadResult.public_id,
      duration: Math.round(uploadResult.duration || 0),
      bytes: uploadResult.bytes
    });
  } catch (err) {
    res.status(500).json({
      message: err.message || "Failed to upload video"
    });
  }
};

export const createLecture = async (req, res) => {
  try {
    const {
      title,
      videoUrl,
      moduleId,
      courseId,
      duration,
      order,
      isPreview
    } = req.body;

    if (!title || !videoUrl || !moduleId || !courseId) {
      return res.status(400).json({
        message: "title, videoUrl, moduleId and courseId are required"
      });
    }

    if (!isValidHttpUrl(videoUrl)) {
      return res.status(400).json({ message: "videoUrl must be a valid http/https URL" });
    }

    const [course, moduleDoc] = await Promise.all([
      Course.findById(courseId),
      Module.findById(moduleId)
    ]);

    if (!course) {
      return res.status(404).json({ message: "Course not found" });
    }

    if (!moduleDoc) {
      return res.status(404).json({ message: "Module not found" });
    }

    if (moduleDoc.courseId.toString() !== courseId.toString()) {
      return res.status(400).json({ message: "Module does not belong to this course" });
    }

    const nextOrder = await Lecture.countDocuments({ moduleId });

    const resolvedOrder = Number.isFinite(Number(order)) ? Number(order) : nextOrder + 1;
    const resolvedDuration = Number.isFinite(Number(duration)) ? Number(duration) : 0;

    const lecture = await Lecture.create({
      title: title.trim(),
      videoUrl: videoUrl.trim(),
      moduleId,
      courseId,
      duration: resolvedDuration,
      order: resolvedOrder,
      isPreview: Boolean(isPreview)
    });

    await Module.findByIdAndUpdate(moduleId, {
      $addToSet: { lectures: lecture._id }
    });

    res.status(201).json(lecture);
  } catch (err) {
    res.status(500).json({ message: "Failed to create lecture" });
  }
};
