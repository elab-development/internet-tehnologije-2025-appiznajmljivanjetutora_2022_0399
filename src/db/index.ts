import mysql from "mysql2/promise";
import { drizzle } from "drizzle-orm/mysql2";
import * as schema from "./schema";

const connectionString = process.env.DATABASE_URL;
if (!connectionString) {
  throw new Error("DATABASE_URL is not set. Please define it in .env.local");
}

export const pool = mysql.createPool(connectionString);
export const db = drizzle(pool, { schema, mode: "default" });
export { schema };
