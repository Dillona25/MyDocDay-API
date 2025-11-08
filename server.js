import express from "express";
import dotenv from "dotenv";
import cors from "cors";
import userRoutes from "./routes/userRoutes.js";
import doctorRoutes from "./routes/doctorRoutes.js";
import clinicRoutes from "./routes/clinicRoutes.js"
import appointmentRoutes from "./routes/appointmentsRoutes.js"
import { errorHandler } from "./middlewares/errorHandler.js";

dotenv.config();

const app = express();

// Middleware
app.use(cors());

app.use(express.json());

// Base route
app.get("/", (req, res) => {
  res.send("MyDocDay backend is running");
});

app.use("/api/users", userRoutes);
app.use("/api/doctors", doctorRoutes);
app.use("/api/clinics", clinicRoutes);
app.use("/api/appointments", appointmentRoutes);

app.use(errorHandler);


// Start server
const PORT = process.env.PORT || 5000;
app.listen(PORT, () => {
  console.log(`✅ Server running on port ${PORT}`);
});
