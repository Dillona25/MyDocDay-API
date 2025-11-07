import express from "express";
import { verifyToken } from "../middlewares/verifyToken.js";
import { createAppointment, deleteAppointment, getUsersAppointments, updateAppointment } from "../controllers/appointmentsController.js";

const router = express.Router();

router.post("/", verifyToken, createAppointment);
router.get("/", verifyToken, getUsersAppointments);
router.delete("/:id", verifyToken, deleteAppointment);
router.patch("/:id", verifyToken, updateAppointment);

export default router;