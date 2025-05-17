const express = require("express");
const router = express.Router();
const { isAuthenticated } = require("../middlewares/auth");
const {
  register,
  login,
  logout,
  refreshToken,
  getCurrentUser,
  updateProfile
} = require("../controller/C_auth");

// Register
router.post("/register", register);

// Login
router.post("/login", login);

// Logout
router.post("/logout", logout);

// Refresh token
router.post("/refresh", refreshToken);

// Get current user profile
router.get("/me", isAuthenticated, getCurrentUser);

// Update user profile
router.patch("/me", isAuthenticated, updateProfile);

module.exports = router; 