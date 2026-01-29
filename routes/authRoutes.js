import { Router } from "express";
import { register, login, refresh, logout } from "../controllers/authController.js";
import { registerSchema, loginSchema } from "../schemas/authSchemas.js";
import { validate } from "../middleware/validate.js";
import { authMiddleware } from "../middleware/authMiddleware.js";
const router = Router();

router.post("/register", validate(registerSchema),register);
router.post("/login", validate(loginSchema),login);
router.post("/refresh", refresh);
router.post("/logout", authMiddleware, logout);
export default router;
