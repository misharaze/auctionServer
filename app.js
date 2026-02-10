import express from "express";
import cors from "cors";
import dotenv from "dotenv";
import helmet from "helmet";
import rateLimit from "express-rate-limit";
import morgan from "morgan";
import NotificationRoutes from "./routes/NotificationsRoutes.js";
import walletRoutes from "./routes/walletRoutes.js";
import auctionsRoutes from "./routes/auctionsRoutes.js";
import usersRoutes from "./routes/userRoutes.js";
import upgradesRoutes from "./routes/upgradesRoutes.js";
import inventoryRoutes from "./routes/inventoryRoutes.js";
import itemsRoutes from "./routes/ItemsRoutes.js";
import authRoutes from "./routes/authRoutes.js";
import bidsRoutes from "./routes/bidsRoutes.js"
import GiveawaysRoutes from "./routes/giveawaysRoutes.js";
import tournamentsRoutes from "./routes/tournamentsRoutes.js";
import homeRoutes from "./routes/HomeRoutes.js";

dotenv.config();

const app = express();



const apiLimiter = rateLimit({
  windowMs: 60 * 1000,
  max: 120,
});

app.use(helmet());

app.set("trust proxy", 1);

const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 30,
  standardHeaders: true,
  legacyHeaders: false,
});

app.use(
  cors({
    origin: [
      "http://localhost:3000",
      "http://localhost:5173",
      "https://auctiongoodies.vercel.app"
    ],
    credentials: true,
    methods: ["GET", "POST", "PUT", "PATCH", "DELETE", "OPTIONS"],
    allowedHeaders: ["Content-Type", "Authorization"],
  })
);

// 👇 ОБЯЗАТЕЛЬНО
app.options("*", cors())




app.use(morgan("dev"));
app.use(express.json({ limit: "100kb" }));


app.use("/api/auth", authLimiter, authRoutes);
app.use("/api/auctions", auctionsRoutes);
app.use("/api/user", usersRoutes);
app.use("/api/upgrades", upgradesRoutes);
app.use("/api/items", itemsRoutes);
app.use("/api/inventory", inventoryRoutes);
app.use("/api/wallet", walletRoutes);
app.use("/api/bids", bidsRoutes);
app.use("/api/notifications", NotificationRoutes)
app.use("/api/giveaways", GiveawaysRoutes)
app.use("/api/tournaments", tournamentsRoutes);
app.use("/api/home", homeRoutes);

app.get("/api/health", (req, res) => {
  res.json({ ok: true });
});


app.use((err, req, res, next) => {
  console.error("🔥 Unhandled error:", err);

  res.status(err.status || 500).json({
    error: err.message || "Internal server error",
  });
});

export default app;
