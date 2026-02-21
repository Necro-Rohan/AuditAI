import express from "express";
import { getReports } from "../controllers/reportController.js";
import { verifyTokenAndFetchUser } from "../middlewares/auth.js";

const router = express.Router();

// we don't need requireCategoryAccess here, because the controller
// forces `userId: user._id` for non-admins, inherently restricting them to their own authorized data!
router.get("/", verifyTokenAndFetchUser, getReports);

export default router;
