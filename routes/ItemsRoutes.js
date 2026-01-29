import { Router } from "express";
import {  authMiddleware } from "../middleware/authMiddleware.js";
import {
  getAllItems,
  getUserInventory,
} from "../controllers/itemsController.js";

const router = Router();

router.get("/", getAllItems);
router.get("/inventory", authMiddleware, getUserInventory);

export default router;
