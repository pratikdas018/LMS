import mongoose from "mongoose";

const moduleSchema = new mongoose.Schema(
  {
    title: {
      type: String,
      required: true,
      trim: true
    },
    courseId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Course",
      required: true
    },
    lectures: [
      {
        type: mongoose.Schema.Types.ObjectId,
        ref: "Lecture"
      }
    ],
    order: {
      type: Number,
      default: 0
    }
  },
  { timestamps: true }
);

moduleSchema.index({ courseId: 1, order: 1 });

export default mongoose.model("Module", moduleSchema);
