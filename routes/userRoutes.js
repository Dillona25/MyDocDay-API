import express from "express";
import { completeOnboarding, createUser, getCurrentUser, signInUser, validateDupCreds } from "../controllers/userController.js";
import { verifyToken } from "../middlewares/verifyToken.js";

const router = express.Router();

router.post("/signup", createUser)

router.post("/signin", signInUser)

router.post("/validateDupCreds", validateDupCreds);

router.put("/onboardingComplete", verifyToken, completeOnboarding)

router.get("/me", verifyToken, getCurrentUser);


export default router;