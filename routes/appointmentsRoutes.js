import express from "express";
import { verifyToken } from "../middlewares/verifyToken.js";
import { createAppointment, getUsersAppointments } from "../controllers/appointmentsController.js";

const router = express.Router();

router.post("/", verifyToken, createAppointment);
router.get("/", verifyToken, getUsersAppointments);

export default router;