import jwt from 'jsonwebtoken';
import bcrypt from 'bcryptjs';
import User from '../models/User.model.js';

// generate and set the cookie
const generateTokenAndSetCookie = (userId, role, res) => {
  const token = jwt.sign({ userId, role }, process.env.JWT_SECRET, { expiresIn: '8h' });
  
  res.cookie('token', token, {
    httpOnly: true, // Prevents XSS attacks
    secure: process.env.NODE_ENV === 'production', // True if in production (HTTPS)
    sameSite: 'strict', // Prevents CSRF attacks
    maxAge: 8 * 60 * 60 * 1000 // 8 hours
  });
};

export const login = async (req, res) => {
  try {
    const { username, password } = req.body;
    if (!username || !password) {
      return res.status(400).json({ error: "Username and password required." });
    }
    
    const user = await User.findOne({ username });
    if (!user || !user.isActive) {
      return res.status(401).json({ error: 'Invalid credentials or account deactivated.' });
    }

    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) {
      return res.status(401).json({ error: 'Invalid credentials.' });
    }

    generateTokenAndSetCookie(user._id, user.role, res);

    // sending just the user data
    res.status(200).json({
      message: 'Login successful',
      user: {
        id: user._id,
        username: user.username,
        role: user.role,
        assignedDomains: user.assignedDomains,
        assignedCategories: user.assignedCategories
      }
    });
  } catch (error) {
    res.status(500).json({ error: 'Server error during login' });
  }
};

export const logout = (req, res) => {
  res.clearCookie("token", {
    httpOnly: true,
    sameSite: "strict",
    secure: process.env.NODE_ENV === "production"
  });
  res.status(200).json({ message: 'Logged out successfully' });
};

// Frontend will call this on page load to see if the user is still logged in
export const getMe = async (req, res) => {
  // req.freshUser is attached by our auth middleware
  res.status(200).json({ user: req.freshUser }); 
};