import { Router } from "express";
import { authMiddleware } from "../middleware/authMiddleware.js";
import {
  getMyNotifications,
  markAllRead,
} from "../controllers/NotificationsController.js";

const router = Router();

router.get("/", authMiddleware, getMyNotifications);
router.post("/read-all", authMiddleware, markAllRead);

export default router;
