import { Router } from "express";
import { tryUpgrade } from "../controllers/upgradesController.js";
 import { authMiddleware } from "../middleware/authMiddleware.js";
const router = Router();


router.post("/",authMiddleware, tryUpgrade);

export default router;
