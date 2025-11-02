import express from "express";
import { createUser, signInUser, validateDupCreds } from "../controllers/userController.js";

const router = express.Router();

router.post("/signup", createUser)

router.post("/signin", signInUser)

router.post("/validateDupCreds", validateDupCreds);


export default router;