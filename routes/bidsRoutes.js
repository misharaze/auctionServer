
import { Router } from "express";
import { authMiddleware } from "../middleware/authMiddleware.js";
import { getMyBids } from "../controllers/BidsController.js";

const router = Router();

router.get("/my", authMiddleware, getMyBids);

export default router;
