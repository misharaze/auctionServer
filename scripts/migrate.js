import fs from "fs";
import { pool } from "../db.js";

const sql = fs.readFileSync("./dump.sql", "utf8");

await pool.query(sql);
console.log("✅ Migration done");
process.exit(0);