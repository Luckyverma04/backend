// src/middlewares/admin.middleware.js
import { ApiError } from "../utils/ApiError.js";
import { asyncHandler } from "../utils/asyncHandler.js";
import { User } from "../models/user.model.js";
import jwt from "jsonwebtoken";

// 🔹 Helper: Allow bypass for inactive admin on specific routes
function canBypassDeactivated(user, req) {
  if (user.role !== "admin") return false;

  // These are the routes where even a deactivated admin can access
  const allowedPaths = [
    "/api/v1/admin/users/status",
    "/api/v1/admin/users/role"
  ];

  return allowedPaths.some((path) => req.originalUrl.includes(path));
}

// ================== VERIFY ADMIN ONLY ==================
export const verifyAdminJWT = asyncHandler(async (req, res, next) => {
  try {
    const token =
      req.cookies?.adminToken ||
      req.header("Authorization")?.replace("Bearer ", "") ||
      req.header("x-auth-token");

    if (!token) {
      throw new ApiError(401, "Unauthorized request - No token provided");
    }

    const decodedToken = jwt.verify(token, process.env.ACCESS_TOKEN_SECRET);

    const user = await User.findById(decodedToken?._id).select(
      "-password -refreshToken"
    );

    if (!user) {
      throw new ApiError(401, "Invalid access token - User not found");
    }

    // Check if user is admin
    if (user.role !== "admin") {
      throw new ApiError(403, "Access denied. Admin privileges required.");
    }

    // Check if active (with bypass)
    if (!user.isActive && !canBypassDeactivated(user, req)) {
      throw new ApiError(403, "Account is deactivated");
    }

    req.user = user;
    next();
  } catch (error) {
    if (error.name === "JsonWebTokenError") {
      throw new ApiError(401, "Invalid access token");
    } else if (error.name === "TokenExpiredError") {
      throw new ApiError(401, "Access token expired");
    }
    throw new ApiError(401, error?.message || "Invalid access token");
  }
});

// ================== VERIFY ADMIN OR MODERATOR ==================
export const verifyAdminOrModerator = asyncHandler(async (req, res, next) => {
  try {
    const token =
      req.cookies?.adminToken ||
      req.header("Authorization")?.replace("Bearer ", "") ||
      req.header("x-auth-token");

    if (!token) {
      throw new ApiError(401, "Unauthorized request - No token provided");
    }

    const decodedToken = jwt.verify(token, process.env.ACCESS_TOKEN_SECRET);

    const user = await User.findById(decodedToken?._id).select(
      "-password -refreshToken"
    );

    if (!user) {
      throw new ApiError(401, "Invalid access token - User not found");
    }

    // Check if role is admin or moderator
    if (!["admin", "moderator"].includes(user.role)) {
      throw new ApiError(
        403,
        "Access denied. Admin or moderator privileges required."
      );
    }

    // Check if active (with bypass only for admin)
    if (!user.isActive && !canBypassDeactivated(user, req)) {
      throw new ApiError(403, "Account is deactivated");
    }

    req.user = user;
    next();
  } catch (error) {
    if (error.name === "JsonWebTokenError") {
      throw new ApiError(401, "Invalid access token");
    } else if (error.name === "TokenExpiredError") {
      throw new ApiError(401, "Access token expired");
    }
    throw new ApiError(401, error?.message || "Invalid access token");
  }
});
