import express from 'express';
import { getAllUsers, updateUserPermissions, getAuditLogs } from '../controllers/adminController.js';
import { verifyTokenAndFetchUser } from '../middlewares/auth.js';

const router = express.Router();

// Admin-only guard
const isAdmin = (req, res, next) => {
  if (req.freshUser.role !== "Admin") {
    return res.status(403).json({ error: "Admin access required." });
  }
  next();
};


router.get('/users', verifyTokenAndFetchUser, isAdmin, getAllUsers);
router.put('/users/permissions/:userId', verifyTokenAndFetchUser, isAdmin, updateUserPermissions);
router.get('/audit-logs', verifyTokenAndFetchUser, isAdmin, getAuditLogs);

export default router;