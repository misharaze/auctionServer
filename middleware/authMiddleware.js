import { verifyToken } from "../utils/jwt.js";

export const authMiddleware = (req, res, next) => {
  const authHeader = req.headers.authorization;

  if (!authHeader) {
    return res.status(401).json({ error: "No token" });
  }

  const token = authHeader.split(" ")[1];

  if (!token) {
    return res.status(401).json({ error: "Invalid token format" });
  }

  try {
    const payload = verifyToken(token);
    req.user = payload; // ← 🔑 userId здесь
    next();
  } catch (e) {
    return res.status(401).json({ error: "Invalid token" });
  }
};
