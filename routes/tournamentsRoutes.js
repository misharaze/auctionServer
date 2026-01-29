import { Router } from "express";
import { authMiddleware } from "../middleware/authMiddleware.js";
import {
  getAllTournaments,
  joinTournament,
} from "../controllers/TournamentsController.js";

const router = Router();

router.get("/", getAllTournaments);
router.post("/:id/join", authMiddleware, joinTournament);

export default router;
