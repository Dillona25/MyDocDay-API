import express from "express";
import dotenv from "dotenv";
import cors from "cors";
import pool from "./db/index.js";
import userRoutes from "./routes/userRoutes.js";

dotenv.config();

const app = express();

// Middleware
app.use(cors({
  origin: "*", // allow all origins for local testing
  methods: ["GET", "POST", "PUT", "DELETE"],
  allowedHeaders: ["Content-Type"]
}));

app.use(express.json());

// Base route
app.get("/", (req, res) => {
  res.send("MyDocDay backend is running 🚀");
});

app.use("/api/users", userRoutes);

// Start server
const PORT = process.env.PORT || 5000;
app.listen(PORT, () => {
  console.log(`✅ Server running on port ${PORT}`);
});
