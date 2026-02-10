// routes/adminRoutes.js
import express from "express";
import { requireAuth } from "../middleware/auth.js";
import { requireAdmin } from "../middleware/requireAdmin.js";
import { getAdminStats } from "../controllers/AdminController.js";

const router = express.Router();

router.get("/stats", requireAuth, requireAdmin, getAdminStats);

export default router;
