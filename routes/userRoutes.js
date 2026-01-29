import { Router } from "express";
import {
  getMe,
  getBalance,
  getOperations,
  getMyStats
} from "../controllers/usersController.js";
import { authMiddleware } from "../middleware/authMiddleware.js";

const router = Router();

router.get("/", authMiddleware, getMe);
router.get("/balance",authMiddleware, getBalance);
router.get("/operations",authMiddleware, getOperations);
router.get("/stats", authMiddleware, getMyStats);
export default router;
