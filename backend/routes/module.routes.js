import express from "express";
import { protect } from "../middleware/auth.middleware.js";
import { createModule } from "../controllers/module.controller.js";

const router = express.Router();

router.post("/create", protect(["teacher"]), createModule);

export default router;
