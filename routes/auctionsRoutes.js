import { Router } from "express";
import {
  getAuctions,
  getAuctionById,
  placeBid,
  closeAuction
} from "../controllers/auctionsController.js";
import { authMiddleware } from "../middleware/authMiddleware.js";
import { validate } from "../middleware/validate.js";
import { bidSchema } from "../schemas/auctionShemas.js";
const router = Router();

router.get("/", getAuctions);
router.get("/:id", getAuctionById);
router.post("/:id/bid",authMiddleware,validate(bidSchema), placeBid);
router.post("/:id/close", closeAuction);

export default router;
