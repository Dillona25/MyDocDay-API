import express from "express";
import { getUsersDoctor } from "../controllers/doctors.js";
import { verifyToken } from "../middlewares/verifyToken.js";
import { createDoctorWithClinic } from "../controllers/doctors.js";


const router = express.Router();

// POST /api/doctors
router.get("/", verifyToken, getUsersDoctor);
router.post("/", verifyToken, createDoctorWithClinic);

export default router;