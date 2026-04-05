import mongoose from "mongoose";

const progressSchema = new mongoose.Schema(
  {
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true
    },
    courseId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Course",
      required: true
    },
    completedTasks: {
      type: Number,
      default: 0
    },
    totalTasks: {
      type: Number,
      default: 0
    },
    // Kept for backward compatibility with existing dashboard/quiz logic.
    completedLessons: {
      type: Number,
      default: 0
    },
    totalLessons: {
      type: Number,
      default: 0
    },
    quizScore: {
      type: Number,
      default: 0
    },
    certificateIssued: {
      type: Boolean,
      default: false
    },
    completedLectures: [
      {
        type: mongoose.Schema.Types.ObjectId,
        ref: "Lecture"
      }
    ],
    lastWatchedLecture: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Lecture",
      default: null
    }
  },
  { timestamps: true }
);

progressSchema.index({ userId: 1, courseId: 1 });

export default mongoose.model("Progress", progressSchema);
