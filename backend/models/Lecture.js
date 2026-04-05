import mongoose from "mongoose";

const lectureSchema = new mongoose.Schema(
  {
    title: {
      type: String,
      required: true,
      trim: true
    },
    videoUrl: {
      type: String,
      required: true,
      trim: true
    },
    moduleId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Module",
      required: true
    },
    courseId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Course",
      required: true
    },
    duration: {
      type: Number,
      default: 0
    },
    order: {
      type: Number,
      default: 0
    },
    isPreview: {
      type: Boolean,
      default: false
    }
  },
  { timestamps: true }
);

lectureSchema.index({ moduleId: 1, order: 1 });
lectureSchema.index({ courseId: 1 });

export default mongoose.model("Lecture", lectureSchema);
