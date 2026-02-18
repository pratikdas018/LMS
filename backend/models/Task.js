import mongoose from "mongoose";

const submissionSchema = new mongoose.Schema({
  studentId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "User"
  },
  answer: String,
  answerText: String,
  comment: {
    type: String,
    default: ""
  },
  isViewed: {
    type: Boolean,
    default: true
  },
  status: {
    type: String,
    enum: ["pending", "pass", "fail"],
    default: "pending"
  },
  submittedAt: {
    type: Date,
    default: Date.now
  }
});

const taskSchema = new mongoose.Schema({
  courseId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "Course",
    required: true
  },
  title: String,
  description: String,
  deadline: Date,
  createdBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "User"
  },
  submissions: [submissionSchema]
});

export default mongoose.model("Task", taskSchema);
