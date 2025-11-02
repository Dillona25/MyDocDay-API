import express from "express";
import { createUser, signInUser } from "../controllers/userController.js";

const router = express.Router();

router.post("/signup", createUser)

router.post("/signin", signInUser)

export default router;