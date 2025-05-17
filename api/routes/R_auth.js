const express = require("express");
const router = express.Router();
const { isAuthenticated, isCoach } = require("../middlewares/auth");
const {
  register,
  login,
  logout,
  refreshToken,
  getCurrentUser,
  updateProfile,
  forgotPassword,
  verifyOtp,
  resetPassword,
  getClientList
} = require("../controller/C_auth");

// Register
router.post("/register", register);

// Login
router.post("/login", login);

// Logout
router.post("/logout", isAuthenticated, logout);

// Refresh token
router.post("/refresh", refreshToken);

// Get current user profile
router.get("/me", isAuthenticated, getCurrentUser);

router.get("/client_list", isAuthenticated, isCoach, getClientList);

// Update user profile
router.patch("/me", isAuthenticated, updateProfile);

// Forgot password - Send OTP
router.post("/forgot-password", forgotPassword);

// Verify OTP
router.post("/verify-otp", verifyOtp);

// Reset password
router.post("/reset-password", resetPassword);


module.exports = router; 