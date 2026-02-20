import jwt from 'jsonwebtoken';
import User from '../models/User.model.js';
import AuditLog from "../models/Audit.model.js";

export const verifyTokenAndFetchUser = async (req, res, next) => {
  try {
    const token = req.cookies.token;
    if (!token) {
      return res.status(401).json({ error: 'Access denied. No token provided.' });
    }

    // Token verification
    const decoded = jwt.verify(token, process.env.JWT_SECRET);

    // Fetch FRESH user from DB to ensure we have the latest role/permissions and check if account is active
    const user = await User.findById(decoded.userId).select('-password');
    if (!user || !user.isActive) {
      res.clearCookie('token'); // Clear invalid cookie
      return res.status(403).json({ error: 'Account deactivated or deleted.' });
    }

    // Attaching fresh user to request to ensure we have the latest role/permissions for downstream checks
    req.freshUser = user;
    next();
  } catch (error) {
    res.clearCookie('token');
    return res.status(401).json({ error: 'Invalid or expired token.' });
  }
};

// Middleware to block unauthorized categories
export const requireCategoryAccess = async (req, res, next) => {
  const { domain, category } = req.body;
  const user = req.freshUser;

  if (!domain || !category) {
    return res.status(400).json({ error: "Domain and category are required." });
  }

  const normalizedDomain = domain.trim().toLowerCase();
  const normalizedCategory = category.trim().toLowerCase();

  // Admin bypasses permission check but not validation
  if (user.role === "Admin") {
    return next();
  }

  const isDomainAllowed =
    normalizedDomain === "all" ||
    user.assignedDomains.some(d => d.toLowerCase() === normalizedDomain);

  const isCategoryAllowed =
    normalizedCategory === "all" ||
    user.assignedCategories.some(c => c.toLowerCase() === normalizedCategory);

  if (!isDomainAllowed || !isCategoryAllowed) {
    try {
      await AuditLog.create({
        userId: user._id,
        user: user.username,
        userRole: user.role,
        type: "Unauthorized Access Attempt",
        action: "Unauthorized Access Attempt",
        attemptedDomain: normalizedDomain,
        attemptedCategory: normalizedCategory,
      });
    } catch (auditError) {
      console.error("Failed to save audit log:", auditError);
    }

    return res.status(403).json({
      error:
        "Security Violation: You are not authorized to query this category or domain."
    });
  }

  next();
};