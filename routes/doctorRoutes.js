import express from "express";
import { createDoctor, getUsersDoctor } from "../controllers/doctorController.js";
import { verifyToken } from "../middlewares/verifyToken.js";
import { createDoctorWithClinic } from "../controllers/doctorWithClinicController.js";


const router = express.Router();

// POST /api/doctors
router.post("/", verifyToken, createDoctor);
router.get("/", verifyToken, getUsersDoctor);
router.post("/createDoctorWithClinic", verifyToken, createDoctorWithClinic);

export default router;