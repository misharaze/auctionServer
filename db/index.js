import pg from "pg";
import dotenv from "dotenv";

dotenv.config();

const { Pool } = pg;

export const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: {
    rejectUnauthorized: false,
  },
});

pool.on("connect", (client) => {
  console.log("✅ Connected to DB:", client.database);
  console.log("DB URL:", process.env.DATABASE_URL);
});
export const query = (text, params) => pool.query(text, params);
