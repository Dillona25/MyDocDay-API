import pg from "pg";
import dotenv from "dotenv";
dotenv.config();

const { Pool } = pg;

// Create a connection pool to PostgreSQL
const pool = new Pool({
  user: process.env.PG_USER,
  password: process.env.PG_PASSWORD,
  host: process.env.PG_HOST,
  port: process.env.PG_PORT,
  database: process.env.PG_DATABASE,
});

// Test the connection immediately
pool
  .connect()
  .then((client) => {
    console.log("✅ Connected to PostgreSQL");
    client.release();
  })
  .catch((err) => {
    console.error("❌ Database connection error:", err.stack);
  });

export default pool;
