import express from "express";
import { createDoctor, getUsersDoctor } from "../controllers/doctorController.js";
import { verifyToken } from "../middlewares/verifyToken.js";


const router = express.Router();

// POST /api/doctors
router.post("/", verifyToken, createDoctor);
router.get("/", verifyToken, getUsersDoctor);

export default router;