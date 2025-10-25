import express from "express";
import { createDoctor } from "../controllers/doctorController.js";

const router = express.Router();

// POST /api/doctors
router.post("/", createDoctor);

export default router;