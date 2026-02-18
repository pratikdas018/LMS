import Task from "../models/Task.js";
import Progress from "../models/Progress.js";
import Certificate from "../models/Certificate.js";

/* 👨‍🏫 Teacher creates task */
export const createTask = async (req, res) => {
  const { courseId, title, description, deadline } = req.body;

  const task = await Task.create({
    courseId,
    title,
    description,
    deadline,
    createdBy: req.user.id
  });

  // 🔥 UPDATE totalTasks for all students in this course
  await Progress.updateMany(
    { courseId },
    { $inc: { totalTasks: 1 } }
  );

  res.status(201).json(task);
};

export const submitTask = async (req, res) => {
  const { taskId, answer } = req.body;

  if (!taskId || !answer) {
    return res.status(400).json({ message: "TaskId and answer required" });
  }

  const task = await Task.findById(taskId);
  if (!task) return res.status(404).json({ message: "Task not found" });

  // Check if submission exists
  const existingSubmission = task.submissions.find(
    s => s.studentId.toString() === req.user.id
  );

  if (existingSubmission) {
    if (existingSubmission.status === "pass") {
      return res.status(400).json({ message: "Task already passed" });
    }
    // Update existing submission (retry)
    existingSubmission.answer = answer;
    existingSubmission.answerText = answer;
    existingSubmission.status = "pending";
    existingSubmission.comment = "";
    existingSubmission.isViewed = true;
    existingSubmission.submittedAt = new Date();
  } else {
    task.submissions.push({
      studentId: req.user.id,
      answer,
      answerText: answer,
      status: "pending",
      comment: "",
      isViewed: true,
      submittedAt: new Date()
    });
  }

  await task.save();

  res.json({ message: "Task submitted successfully" });
};

export const gradeTask = async (req, res) => {
  try {
    const { taskId, submissionId, status, comment } = req.body;

    if (!taskId || !submissionId || !status) {
      return res.status(400).json({ message: "Missing required fields" });
    }

    const task = await Task.findById(taskId);
    if (!task) return res.status(404).json({ message: "Task not found" });

    const submission = task.submissions.id(submissionId);
    if (!submission) return res.status(404).json({ message: "Submission not found" });

    const previousStatus = submission.status;
    submission.status = status;
    submission.comment = typeof comment === "string" ? comment.trim() : "";
    submission.isViewed = false; // 🔔 Mark as unread for student
    await task.save();

    // 🔥 UPDATE PROGRESS ONLY IF PASS
    if (status === "pass" && previousStatus !== "pass") {
      await Progress.findOneAndUpdate(
        {
          userId: submission.studentId,
          courseId: task.courseId
        },
        { $inc: { completedTasks: 1 } }
      );
    } else if (previousStatus === "pass" && status !== "pass") {
      await Progress.findOneAndUpdate(
        {
          userId: submission.studentId,
          courseId: task.courseId
        },
        { $inc: { completedTasks: -1 } }
      );
    }

    res.json({ message: "Task graded successfully", status, submission });
  } catch (err) {
    console.error("Grading error:", err);
    res.status(500).json({ message: "Failed to grade task" });
  }
};

export const getTask = async (req, res) => {
  try {
    const { taskId } = req.params;
    const task = await Task.findById(taskId).populate("submissions.studentId", "name email");
    if (!task) return res.status(404).json({ message: "Task not found" });
    res.json(task);
  } catch (err) {
    console.error("Get task error:", err);
    res.status(500).json({ message: "Failed to fetch task" });
  }
};

export const getStudentTasks = async (req, res) => {
  try {
    const studentId = req.user.id;
    const { courseId } = req.params;

    // 🔹 Fetch tasks safely
    const tasks = await Task.find({ courseId }).lean();

    let completedTasks = 0;

    const formattedTasks = tasks.map(task => {
      const submissions = Array.isArray(task.submissions)
        ? task.submissions
        : [];

      const submission = submissions.find(
        s => s.studentId?.toString() === studentId
      );

      if (submission?.status === "pass") {
        completedTasks++;
      }

      return {
        ...task,
        submission: submission || null
      };
    });

    // 🔁 Sync Progress with tasks
    const progressDoc = await Progress.findOneAndUpdate(
      { userId: studentId, courseId },
      {
        completedTasks,
        totalTasks: tasks.length
      },
      { upsert: true, new: true }
    );

    // 📊 Calculate Overall Progress (Tasks + Lessons)
    const total = tasks.length;
    const completed = completedTasks;

    const percent = total === 0 ? 0 : Math.round((completed / total) * 100);

    // 🔥 AUTO-CERTIFICATE GENERATION
    if (percent === 100) {
      const exists = await Certificate.findOne({ userId: studentId, courseId });
      if (!exists) {
        await Certificate.create({
          userId: studentId,
          courseId,
          issuedAt: new Date()
        });
      }
    }

    return res.json({
      tasks: formattedTasks,
      completedTasks,
      totalTasks: tasks.length,
      percent,
      progress: percent
    });
  } catch (err) {
    console.error("❌ getStudentTasks error:", err);
    return res
      .status(500)
      .json({ message: "Failed to load student tasks" });
  }
};

export const getTeacherTasks = async (req, res) => {
  try {
    const { courseId } = req.params;

    const tasks = await Task.find({ courseId })
      .populate("submissions.studentId", "name email")
      .sort({ createdAt: -1 });

    res.json(tasks);
  } catch (error) {
    console.error("Teacher task fetch error:", error);
    res.status(500).json({
      message: "Failed to fetch teacher tasks"
    });
  }
};

/* 🔔 Get notification count for student */
export const getStudentNotifications = async (req, res) => {
  try {
    const studentId = req.user.id;
    // Count tasks with unread graded submissions
    const tasks = await Task.find({
      "submissions": {
        $elemMatch: {
          studentId: studentId,
          status: { $in: ["pass", "fail"] },
          isViewed: false
        }
      }
    });
    res.json({ count: tasks.length });
  } catch (err) {
    console.error("Notification error:", err);
    res.status(500).json({ message: "Failed to fetch notifications" });
  }
};

/* 🔔 Mark task as read */
export const markTaskAsRead = async (req, res) => {
  try {
    const { taskId } = req.params;
    const studentId = req.user.id;

    const task = await Task.findById(taskId);
    if (!task) return res.status(404).json({ message: "Task not found" });

    const submission = task.submissions.find(s => s.studentId.toString() === studentId);
    if (submission) {
      submission.isViewed = true;
      await task.save();
    }

    res.json({ message: "Marked as read" });
  } catch (err) {
    res.status(500).json({ message: "Failed to update task" });
  }
};

/* ✏️ Update Task */
export const updateTask = async (req, res) => {
  try {
    const { taskId } = req.params;
    const { title, description, deadline } = req.body;

    const task = await Task.findByIdAndUpdate(
      taskId,
      { title, description, deadline },
      { new: true }
    );

    if (!task) return res.status(404).json({ message: "Task not found" });
    res.json(task);
  } catch (err) {
    res.status(500).json({ message: "Failed to update task" });
  }
};

/* 🗑️ Delete Task */
export const deleteTask = async (req, res) => {
  try {
    const { taskId } = req.params;
    const task = await Task.findByIdAndDelete(taskId);
    
    if (!task) return res.status(404).json({ message: "Task not found" });

    // 🔥 Decrease totalTasks for all students in this course
    await Progress.updateMany({ courseId: task.courseId }, { $inc: { totalTasks: -1 } });

    res.json({ message: "Task deleted successfully" });
  } catch (err) {
    res.status(500).json({ message: "Failed to delete task" });
  }
};
