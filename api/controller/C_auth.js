const jwt = require("jsonwebtoken");
const bcrypt = require("bcrypt");
const User = require("../models/M_user");
const UserSession = require("../models/M_user_session");
const { successRes, errorRes } = require("../../utils/common_fun");
const { sendOtpCode } = require("../../utils/send_mail");

// Register
const register = async (req, res) => {
  try {
    const { 
      email_address, 
      password, 
      full_name, 
      user_type, 
      device_token, 
      device_type,
      // Coach specific fields
      credentials,
      bio,
      specialization,
      // Client specific fields
      age,
      gender,
      fitness_level,
      goals,
      health_info
    } = req.body;

    // Check if user already exists
    const existingUser = await User.findOne({ email_address });
    if (existingUser) {
      return errorRes(res, "Email already registered");
    }

    // Validate required fields based on user type
    if (user_type === 'coach') {
      if (!credentials || !bio || !specialization) {
        return errorRes(res, "Coach profile requires credentials, bio, and specialization");
      }
    } else if (user_type === 'client') {
      if (!age || !gender || !fitness_level || !goals) {
        return errorRes(res, "Client profile requires age, gender, fitness level, and goals");
      }
    }

    // Hash password
    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(password, salt);

    // Create user with type-specific fields
    const userData = {
      email_address,
      password: hashedPassword,
      full_name,
      user_type,
      ...(user_type === 'coach' && {
        credentials,
        bio,
        specialization
      }),
      ...(user_type === 'client' && {
        age,
        gender,
        fitness_level,
        goals,
        health_info: health_info ? JSON.stringify(health_info) : '{}'
      })
    };

    const user = new User(userData);
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

    // Parse health_info back to object for response
    const responseData = {
      id: user._id,
      email: user.email_address,
      name: user.full_name,
      role: user.user_type,
      auth_token: accessToken,
      ...(user_type === 'coach' && {
        credentials: user.credentials,
        bio: user.bio,
        specialization: user.specialization
      }),
      ...(user_type === 'client' && {
        age: user.age,
        gender: user.gender,
        fitness_level: user.fitness_level,
        goals: user.goals,
        health_info: user.health_info ? JSON.parse(user.health_info) : {}
      })
    };

    return successRes(res, "User registered successfully", responseData);
  } catch (error) {
    console.error("Register error:", error);
    return errorRes(res, "Internal server error");
  }
};

// Login
const login = async (req, res) => {
  try {
    const { email_address, password, device_token, device_type } = req.body;

    // Find user
    const user = await User.findOne({ email_address });
    if (!user) {
      return errorRes(res, "Invalid credentials");
    }

    // Check password
    const validPassword = await bcrypt.compare(password, user.password);
    if (!validPassword) {
      return errorRes(res, "Invalid credentials");
    }

    // Check if user is blocked
    if (user.is_blocked_by_admin) {
      return errorRes(res, "Your account has been blocked by admin");
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

    return successRes(res, "Login successful", {
      id: user._id,
      email: user.email_address,
      name: user.full_name,
      role: user.user_type,
      auth_token: accessToken
    });
  } catch (error) {
    console.error("Login error:", error);
    return errorRes(res, "Internal server error");
  }
};

// Logout
const logout = async (req, res) => {
  try {
    const bearerHeader = req.headers["authorization"];
    if (!bearerHeader) {
      return errorRes(res, "No token provided");
    }

    const bearer = bearerHeader.split(" ");
    const bearerToken = bearer[1];

    // Deactivate the current session
    await UserSession.deleteOne(
      { auth_token: bearerToken }
    );

    return successRes(res, "Logged out successfully");
  } catch (error) {
    console.error("Logout error:", error);
    return errorRes(res, "Internal server error");
  }
};

// Refresh token
const refreshToken = async (req, res) => {
  try {
    const { refresh_token } = req.body;

    if (!refresh_token) {
      return errorRes(res, "Refresh token required");
    }

    // Verify refresh token
    const decoded = jwt.verify(refresh_token, process.env.JWT_REFRESH_SECRET);
    const user = await User.findById(decoded.userId);

    if (!user || user.refresh_token !== refresh_token) {
      return errorRes(res, "Invalid refresh token");
    }

    // Generate new access token
    const accessToken = jwt.sign(
      { userId: user._id, role: user.user_type },
      process.env.JWT_SECRET,
      { expiresIn: '1h' }
    );

    return successRes(res, "Token refreshed successfully", {
      access_token: accessToken
    });
  } catch (error) {
    return errorRes(res, "Invalid refresh token");
  }
};

// Get current user profile
const getCurrentUser = async (req, res) => {
  try {
    const user = await User.findById(req.user._id).select('-password -refresh_token');
    
    if (!user) {
      return errorRes(res, "User not found");
    }

    // Format user data
    const userData = {
      id: user._id,
      email: user.email_address,
      name: user.full_name,
      role: user.user_type,
      ...(user.user_type === 'coach' && {
        credentials: user.credentials,
        bio: user.bio,
        specialization: user.specialization
      }),
      ...(user.user_type === 'client' && {
        age: user.age,
        gender: user.gender,
        fitness_level: user.fitness_level,
        goals: user.goals,
        health_info: user.health_info ? JSON.parse(user.health_info) : {}
      })
    };

    return successRes(res, "User profile retrieved successfully", userData);
  } catch (error) {
    console.error("Get current user error:", error);
    return errorRes(res, "Internal server error");
  }
};

// Update user profile
const updateProfile = async (req, res) => {
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

    return successRes(res, "Profile updated successfully", user);
  } catch (error) {
    return errorRes(res, "Internal server error");
  }
};

// Helper function to hash password
const securePassword = async (password) => {
  const salt = await bcrypt.genSalt(10);
  return await bcrypt.hash(password, salt);
};

// Forgot password - Send OTP
const forgotPassword = async (req, res) => {
  try {
    let { email_address } = req.body;

    let otp = Math.floor(1000 + Math.random() * 9000);

    const otpExpireTime = new Date();
    otpExpireTime.setMinutes(otpExpireTime.getMinutes() + 10);

    let user_data = await User.findOne({
      email_address,
      is_deleted: false,
    });

    if (!user_data) {
      return errorRes(res, "Account is not found, Please try again.");
    }

    let data = {
      otp,
      emailAddress: email_address,
      name: user_data.full_name,
    };

    sendOtpCode(data);

    let update_data = {
      otp,
      otp_expire_time: otpExpireTime,
    };

    await User.findByIdAndUpdate(user_data._id, update_data);

    return successRes(res, "Verification code sent to your email", data);
  } catch (error) {
    console.log("Error in forgotPassword:", error);
    return errorRes(res, "Internal server error");
  }
};

// Verify OTP
const verifyOtp = async (req, res) => {
  try {
    let { email_address, otp } = req.body;

    let find_user = await User.findOne({
      email_address: email_address,
      is_deleted: false,
    });

    if (!find_user) {
      return errorRes(res, "Account is not found, Please try again.");
    }

    if (find_user.otp_expire_time && new Date() > new Date(find_user.otp_expire_time)) {
      return errorRes(res, "OTP has been expired");
    }

    if (find_user.otp && find_user.otp == Number(otp)) {
      let update_data = {
        otp: null,
        otp_expire_time: null,
      };

      await User.findByIdAndUpdate(find_user._id, update_data, {
        new: true,
      });

      return successRes(res, "OTP verified successfully");
    } else {
      return errorRes(res, "Incorrect OTP");
    }
  } catch (error) {
    console.log("Error in verifyOtp:", error);
    return errorRes(res, "Internal server error");
  }
};

// Reset password
const resetPassword = async (req, res) => {
  try {
    let { email_address, password } = req.body;

    const hashedPassword = await securePassword(password);

    let find_user = await User.findOne({
      email_address,
      is_deleted: false,
    });

    if (!find_user) {
      return errorRes(res, "Account is not found, Please try again.");
    }

    let update_data = {
      password: hashedPassword,
    };

    await User.findByIdAndUpdate(find_user._id, update_data, {
      new: true,
    });

    return successRes(res, "Password reset successfully");
  } catch (error) {
    console.log("Error in resetPassword:", error);
    return errorRes(res, "Internal server error");
  }
};

module.exports = {
  register,
  login,
  logout,
  refreshToken,
  getCurrentUser,
  updateProfile,
  forgotPassword,
  verifyOtp,
  resetPassword
}; 