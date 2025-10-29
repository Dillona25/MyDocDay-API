import express from "express";
import { verifyToken } from "../middlewares/verifyToken.js";
import { createClinic } from "../controllers/clinicController.js";

const router = express.Router();

router.post("/", verifyToken, createClinic)

export default router;