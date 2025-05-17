const jwt = require("jsonwebtoken");
const users = require("../models/M_user");
const user_sessions = require("../models/M_user_session");

const { errorRes, authFailRes } = require("../../utils/common_fun");

const verifyToken = async (req, res, next) => {
  try {
    const bearerHeader = req.headers["authorization"];

    if (!bearerHeader) {
      return errorRes(res, `A token is required for authentication.`);
    }

    const bearer = bearerHeader.split(" ");
    const bearerToken = bearer[1];

    const findUsersSession = await user_sessions.findOne({
      auth_token: bearerToken,
    });

    if (!findUsersSession) {
      return await authFailRes(res, "Authentication failed.");
    }

    const { id } = jwt.verify(bearerToken, process.env.TOKEN_KEY);

    const findUsers = await users.findOne({
      _id: id,
      is_deleted: false,
    });

    if (!findUsers) {
      return await authFailRes(res, "Authentication failed.");
    }
    if (
      findUsers.is_blocked_by_admin == true ||
      findUsers.is_blocked_by_admin == "true"
    ) {
      return await authFailRes(
        res,
        "Your account has been blocked by the admin."
      );
    }
    req.user = findUsers;
    req.user.token = bearerToken;
    next();
  } catch (error) {
    if (error.message == "jwt malformed") {
      return await authFailRes(res, "Authentication failed.");
    }

    console.log("jwt::::::::::", error.message);
    return await errorRes(res, "Internal server error");
  }
};

const isAuthenticated = async (req, res, next) => {
  try {
    const bearerHeader = req.headers["authorization"];

    if (!bearerHeader) {
      return errorRes(res, `A token is required for authentication.`);
    }

    console.log(bearerHeader);

    const bearer = bearerHeader.split(" ");
    const bearerToken = bearer[1];

    const findUsersSession = await user_sessions.findOne({
      auth_token: bearerToken,
    });

    console.log(bearerHeader);

    if (!findUsersSession) {
      return await authFailRes(res, "Authentication failed.");
    }

    const { id } = jwt.verify(bearerToken, process.env.TOKEN_KEY);

    const findUsers = await users.findOne({
      _id: id,
      is_deleted: false,
    });

    if (!findUsers) {
      return await authFailRes(res, "Authentication failed.");
    }
    if (
      findUsers.is_blocked_by_admin == true ||
      findUsers.is_blocked_by_admin == "true"
    ) {
      return await authFailRes(
        res,
        "Your account has been blocked by the admin."
      );
    }
    req.user = findUsers;
    req.user.token = bearerToken;
    next();
  } catch (error) {
    if (error.message == "jwt malformed") {
      return await authFailRes(res, "Authentication failed.");
    }

    console.log("jwt::::::::::", error.message);
    console.log("jwt:::::::::: ERROR -- ", error);
    return await errorRes(res, "Internal server error");
  }
};

const isCoach = (req, res, next) => {
  if (req.user.user_type !== "coach") {
    return res
      .status(403)
      .json({ success: false, message: "Access denied. Coach role required" });
  }
  next();
};

const isClient = (req, res, next) => {
  if (req.user.user_type !== "client") {
    return res
      .status(403)
      .json({ success: false, message: "Access denied. Client role required" });
  }
  next();
};

module.exports = {
  verifyToken,
  isAuthenticated,
  isCoach,
  isClient,
};
