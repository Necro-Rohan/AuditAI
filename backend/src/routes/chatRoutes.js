import express from 'express';
import { handleChatQuery } from '../controllers/chatController.js';
import { verifyTokenAndFetchUser, requireCategoryAccess } from '../middlewares/auth.js';

const router = express.Router();

// Order matters: First verify token and fetch user to ensure we have the latest user data for RBAC checks, then check category access, and finally handle the chat query
router.post('/', verifyTokenAndFetchUser, requireCategoryAccess, handleChatQuery);

export default router;