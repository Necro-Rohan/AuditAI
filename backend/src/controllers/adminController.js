import User from '../models/User.model.js';
import AuditLog from '../models/Audit.model.js';

export const getAllUsers = async (req, res) => {
  try {
    const users = await User.find()
      .select('-password')
      .sort({ createdAt: -1 });

    return res.status(200).json(users);
  } catch (err) {
    console.error("Fetch Users Error:", err);
    return res.status(500).json({ error: "Failed to fetch users." });
  }
};

export const updateUserPermissions = async (req, res) => {
  try {
    const { userId } = req.params;
    const { role, assignedDomains, assignedCategories, isActive } = req.body;
    const adminUser = req.freshUser;

    if (!userId) {
      return res.status(400).json({ error: "User ID is required." });
    }

    const targetUser = await User.findById(userId);
    if (!targetUser) {
      return res.status(404).json({ error: "Target user not found." });
    }

    /* Prevent Self-Lockout */
    if (adminUser._id.toString() === userId) {
      if (role && role !== "Admin") {
        return res.status(400).json({
          error: "Security Guard: You cannot remove your own Admin privileges."
        });
      }

      if (isActive === false) {
        return res.status(400).json({
          error: "Security Guard: You cannot deactivate your own account."
        });
      }
    }

    const validRoles = ["Admin", "Analyst"];
    if (role && !validRoles.includes(role)) {
      return res.status(400).json({ error: "Invalid role assignment." });
    }

    if (assignedDomains && !Array.isArray(assignedDomains)) {
      return res.status(400).json({ error: "assignedDomains must be an array." });
    }

    if (assignedCategories && !Array.isArray(assignedCategories)) {
      return res.status(400).json({ error: "assignedCategories must be an array." });
    }

    const updatePayload = {
      ...(role && { role }),
      ...(assignedDomains && { assignedDomains }),
      ...(assignedCategories && { assignedCategories }),
      ...(typeof isActive === "boolean" && { isActive })
    };

    const updatedUser = await User.findByIdAndUpdate(
      userId,
      updatePayload,
      { new: true, runValidators: true }
    ).select('-password');

    await AuditLog.create({
      userId: adminUser._id,
      user: adminUser.username,
      userRole: adminUser.role,
      type: "Admin Action",
      action: "Updated User Permissions",
      targetUserId: updatedUser._id,
      targetUsername: updatedUser.username,
      changes: updatePayload,
    });

    return res.status(200).json(updatedUser);

  } catch (err) {
    console.error("Update User Error:", err);
    return res.status(500).json({
      error: "Internal server error during user update."
    });
  }
};

export const getAuditLogs = async (req, res) => {
  try {
    const logs = await AuditLog.find()
      .sort({ createdAt: -1 })
      .limit(100);

    return res.status(200).json(logs);
  } catch (err) {
    console.error("Fetch Audit Logs Error:", err);
    return res.status(500).json({ error: "Failed to fetch audit logs." });
  }
};