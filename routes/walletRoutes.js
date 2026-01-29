import express from "express";
import { getOperations , getDepositsHistory,deposit,
    withdraw, getWithdrawHistory
} from "../controllers/walletController.js";
import { authMiddleware } from "../middleware/authMiddleware.js";

const router = express.Router();

router.get("/operations",authMiddleware, getOperations);
router.post("/deposit", authMiddleware, deposit);
router.get("/deposits", authMiddleware, getDepositsHistory);
router.post("/withdraw", authMiddleware, withdraw);
router.get("/withdraws", authMiddleware, getWithdrawHistory);

export default router;
