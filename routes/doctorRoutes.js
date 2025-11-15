import express from "express";
import { deleteDoctor, getUsersDoctor, updateDoctor } from "../controllers/doctors.js";
import { verifyToken } from "../middlewares/verifyToken.js";
import { createDoctorWithClinic } from "../controllers/doctors.js";


const router = express.Router();

// POST /api/doctors
router.get("/", verifyToken, getUsersDoctor);
router.post("/", verifyToken, createDoctorWithClinic);
router.patch("/:id", verifyToken, updateDoctor)
router.delete("/:id", verifyToken, deleteDoctor)

export default router;