import { Router } from "express";
import { authMiddleware } from "../middleware/authMiddleware.js";
import { getMyInventory } from "../controllers/inventoryController.js";

const router = Router();

router.get("/", authMiddleware, getMyInventory);

export default router;
