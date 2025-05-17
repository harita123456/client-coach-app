const express = require("express");
const router = express.Router();
const jwt = require("jsonwebtoken");
const bcrypt = require("bcrypt");
const User = require("../models/M_user");
const { isAuthenticated } = require("../middlewares/auth");
const UserSession = require("../models/M_user_session");

// Register
router.post("/register", async (req, res) => {
  try {
    const { email_address, password, full_name, user_type, device_token, device_type } = req.body;

    // Check if user already exists
    const existingUser = await User.findOne({ email_address });
    if (existingUser) {
      return res.status(400).json({ success: false, message: "Email already registered" });
    }

    // Hash password
    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(password, salt);

    // Create user
    const user = new User({
      email_address,
      password: hashedPassword,
      full_name,
      user_type
    });

    await user.save();

    // Generate tokens
    const accessToken = jwt.sign(
      { id: user._id, role: user.user_type },
      process.env.TOKEN_KEY,
      { expiresIn: '1h' }
    );

    // Create user session
    const userSession = new UserSession({
      user_id: user._id,
      device_token: device_token || 'android',
      device_type: device_type || 'android',
      auth_token: accessToken,
      is_active: true
    });

    await userSession.save();

    res.status(201).json({
      success: true,
      data: {
        id: user._id,
        email: user.email_address,
        name: user.full_name,
        role: user.user_type,
        auth_token: accessToken
      }
    });
  } catch (error) {
    console.error("Register error:", error);
    res.status(500).json({ success: false, message: error.message });
  }
});

// Login
router.post("/login", async (req, res) => {
  try {
    const { email_address, password, device_token, device_type } = req.body;

    // Find user
    const user = await User.findOne({ email_address });
    if (!user) {
      return res.status(401).json({ success: false, message: "Invalid credentials" });
    }

    // Check password
    const validPassword = await bcrypt.compare(password, user.password);
    if (!validPassword) {
      return res.status(401).json({ success: false, message: "Invalid credentials" });
    }

    // Check if user is blocked
    if (user.is_blocked_by_admin) {
      return res.status(403).json({ success: false, message: "Your account has been blocked by admin" });
    }

    // Generate token
    const accessToken = jwt.sign(
      { id: user._id, role: user.user_type },
      process.env.TOKEN_KEY,
      { expiresIn: '1h' }
    );

    // Check for existing active session
    let userSession = await UserSession.findOne({
      user_id: user._id,
      device_token: device_token || 'android',
      device_type: device_type || 'android',
      is_active: true
    });

    if (userSession) {
      // Update existing session with new auth token
      userSession.auth_token = accessToken;
      await userSession.save();
    } else {
      // Create new session if none exists
      userSession = new UserSession({
        user_id: user._id,
        device_token: device_token || 'android',
        device_type: device_type || 'android',
        auth_token: accessToken,
        is_active: true
      });
      await userSession.save();
    }

    res.json({
      success: true,
      data: {
        id: user._id,
        email: user.email_address,
        name: user.full_name,
        role: user.user_type,
        auth_token: accessToken
      }
    });
  } catch (error) {
    console.error("Login error:", error);
    res.status(500).json({ success: false, message: error.message });
  }
});

// Logout
router.post("/logout", async (req, res) => {
  try {
    const bearerHeader = req.headers["authorization"];
    if (!bearerHeader) {
      return res.status(401).json({ success: false, message: "No token provided" });
    }

    const bearer = bearerHeader.split(" ");
    const bearerToken = bearer[1];

    // Deactivate the current session
    await UserSession.findOneAndUpdate(
      { auth_token: bearerToken },
      { is_active: false }
    );

    res.json({
      success: true,
      message: "Logged out successfully"
    });
  } catch (error) {
    console.error("Logout error:", error);
    res.status(500).json({ success: false, message: error.message });
  }
});

// Refresh token
router.post("/refresh", async (req, res) => {
  try {
    const { refresh_token } = req.body;

    if (!refresh_token) {
      return res.status(401).json({ success: false, message: "Refresh token required" });
    }

    // Verify refresh token
    const decoded = jwt.verify(refresh_token, process.env.JWT_REFRESH_SECRET);
    const user = await User.findById(decoded.userId);

    if (!user || user.refresh_token !== refresh_token) {
      return res.status(401).json({ success: false, message: "Invalid refresh token" });
    }

    // Generate new access token
    const accessToken = jwt.sign(
      { userId: user._id, role: user.user_type },
      process.env.JWT_SECRET,
      { expiresIn: '1h' }
    );

    res.json({
      success: true,
      data: {
        access_token: accessToken
      }
    });
  } catch (error) {
    res.status(401).json({ success: false, message: "Invalid refresh token" });
  }
});

// Get current user profile
router.get("/me", isAuthenticated, async (req, res) => {
  try {
    const user = await User.findById(req.user._id).select('-password -refresh_token');
    res.json({ success: true, data: user });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

// Update user profile
router.patch("/me", isAuthenticated, async (req, res) => {
  try {
    const allowedUpdates = ['full_name', 'profile_picture', 'bio', 'credentials',
      'specialization', 'age', 'gender', 'fitness_level', 'goals', 'health_info'];

    const updates = Object.keys(req.body)
      .filter(key => allowedUpdates.includes(key))
      .reduce((obj, key) => {
        obj[key] = req.body[key];
        return obj;
      }, {});

    const user = await User.findByIdAndUpdate(
      req.user._id,
      { $set: updates },
      { new: true, runValidators: true }
    ).select('-password -refresh_token');

    res.json({ success: true, data: user });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

module.exports = router; 