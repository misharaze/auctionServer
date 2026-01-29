import { Router } from "express";
import { authMiddleware } from "../middleware/authMiddleware.js";
import {
  getAllGiveaways,
  joinGiveaway,
} from "../controllers/giveawaysController.js";

const router = Router();

router.get("/", getAllGiveaways);
router.post("/:id/join", authMiddleware, joinGiveaway);

export default router;
