import bcrypt from "bcrypt";
import jwt from "jsonwebtoken";
import { query } from "../db/index.js";

const JWT_SECRET = process.env.JWT_SECRET || "super_secret_key";

// ⏱ короткоживущий access token
const ACCESS_EXPIRES = "15m";
// ♻️ долгоживущий refresh token
const REFRESH_EXPIRES = "7d";



const signAccessToken = (payload) =>
  jwt.sign(payload, JWT_SECRET, { expiresIn: ACCESS_EXPIRES });

const signRefreshToken = (payload) =>
  jwt.sign(payload, JWT_SECRET, { expiresIn: REFRESH_EXPIRES });


export const register = async (req, res) => {
  try {
    const { email, username, password } = req.body;

    if (!email || !username || !password) {
      return res.status(400).json({ error: "Missing fields" });
    }

    const passwordHash = await bcrypt.hash(password, 10);

    const { rows } = await query(
      `
      INSERT INTO users (email, username, password_hash, balance)
      VALUES ($1, $2, $3, 0)
      RETURNING id, email, username, balance
      `,
      [email, username, passwordHash]
    );

    const user = rows[0];

    const accessToken = signAccessToken({ id: user.id });
    const refreshToken = signRefreshToken({ id: user.id });

    await query(
      `UPDATE users SET refresh_token = $1 WHERE id = $2`,
      [refreshToken, user.id]
    );

    return res.json({
      accessToken,
      refreshToken,
      user,
    });

  } catch (e) {
    console.error("REGISTER ERROR:", e);

    // 👇 ВАЖНО
    if (e.code === "23505") {
      return res.status(409).json({ error: "User already exists" });
    }

    return res.status(500).json({ error: "Internal server error" });
  }
};


export const login = async (req, res) => {
  const { email, password } = req.body;

  if (!email || !password) {
    return res.status(400).json({ error: "Missing credentials" });
  }

  const { rows } = await query(
    `SELECT * FROM public.users WHERE email = $1`,
    [email]
  );

  if (!rows.length) {
    return res.status(401).json({ error: "Invalid credentials" });
  }

  const user = rows[0];
  const valid = await bcrypt.compare(password, user.password_hash);

  if (!valid) {
    return res.status(401).json({ error: "Invalid credentials" });
  }

  const accessToken = signAccessToken({ id: user.id });
  const refreshToken = signRefreshToken({ id: user.id });

  await query(
    `UPDATE users SET refresh_token = $1 WHERE id = $2`,
    [refreshToken, user.id]
  );

  res.json({
    accessToken,
    refreshToken,
    user: {
      id: user.id,
      email: user.email,
      username: user.username,
      balance: user.balance,
    },
  });
};

/* =====================
   POST /api/auth/refresh
===================== */
export const refresh = async (req, res) => {
  const { refreshToken } = req.body;

  if (!refreshToken) {
    return res.status(401).json({ error: "No refresh token" });
  }

  try {
    const payload = jwt.verify(refreshToken, JWT_SECRET);

    const { rows } = await query(
      `
      SELECT id
      FROM users
      WHERE id = $1 AND refresh_token = $2
      `,
      [payload.id, refreshToken]
    );

    if (!rows.length) {
      return res.status(401).json({ error: "Invalid refresh token" });
    }

    const newAccessToken = signAccessToken({ id: payload.id });

    res.json({ accessToken: newAccessToken });
  } catch (e) {
    res.status(401).json({ error: "Invalid refresh token" });
  }
};

/* =====================
   POST /api/auth/logout
===================== */
export const logout = async (req, res) => {
  const userId = req.user.id;

  await query(
    `UPDATE users SET refresh_token = NULL WHERE id = $1`,
    [userId]
  );

  res.json({ ok: true });
};
