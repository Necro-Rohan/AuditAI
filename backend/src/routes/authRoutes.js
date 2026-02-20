import express from "express";
import { login, logout, getMe } from "../controllers/authController.js";
import { verifyTokenAndFetchUser } from "../middlewares/auth.js";

const router = express.Router();

router.post("/login", login);
router.post("/logout", logout);

// Protected route to check session on frontend load
router.get("/me", verifyTokenAndFetchUser, getMe);

export default router;
