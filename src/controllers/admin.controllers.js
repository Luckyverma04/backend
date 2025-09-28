import { asyncHandler } from "../utils/asyncHandler.js";
import { User } from "../models/user.model.js";
import { Product } from "../models/product.model.js";
import { ApiResponse } from "../utils/ApiResponse.js";
import { ApiError } from "../utils/ApiError.js";
import mongoose from "mongoose";
import jwt from "jsonwebtoken";

// ---------------- ADMIN LOGIN ----------------
const ADMIN_CREDENTIALS = { username: "Admin User", password: "1234" };

// ---------------- ADMIN LOGIN ----------------
const adminLogin = asyncHandler(async (req, res) => {
  const { username, password } = req.body;

  if (!username?.trim() || !password) {
    throw new ApiError(400, "Username and password are required");
  }

  let adminUser = await User.findOne({ 
    username: username.toLowerCase(), 
    role: "admin" 
  });

  if (!adminUser) {
    const existingAdmins = await User.countDocuments({ role: "admin" });
    if (existingAdmins > 0) {
      throw new ApiError(401, "Invalid admin credentials");
    }

    adminUser = await User.create({
      username: username.toLowerCase(),
      email: "lucky.verma.lv.2004@gmail.com",
      fullName: "Boss",
      password: password, // hashed by pre-save hook
      role: "admin",
      isActive: true,      // ✅ directly mark active when first created
      lastLogin: new Date()
    });
  } else {
    const isPasswordValid = await adminUser.isPasswordCorrect(password);
    if (!isPasswordValid) {
      throw new ApiError(401, "Invalid admin credentials");
    }

    // ✅ Set active + update login time
    adminUser.isActive = true;
    adminUser.lastLogin = new Date();
    await adminUser.save();
  }

  const token = jwt.sign(
    {
      _id: adminUser._id,
      email: adminUser.email,
      username: adminUser.username,
      fullName: adminUser.fullName,
      role: "admin"
    },
    process.env.ACCESS_TOKEN_SECRET,
    { expiresIn: process.env.ACCESS_TOKEN_EXPIRY || "1d" }
  );

  const userWithoutSensitiveData = await User.findById(adminUser._id)
    .select("-password -refreshToken");

  const options = {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "strict",
    maxAge: 24 * 60 * 60 * 1000,
  };

  return res
    .status(200)
    .cookie("accessToken", token, options)
    .cookie("adminToken", token, options)
    .json(
      new ApiResponse(
        200, 
        { user: userWithoutSensitiveData, token }, 
        "Admin logged in successfully"
      )
    );
});


// ---------------- ADMIN LOGOUT ----------------
// ✅ Admin Logout Controller
const adminLogout = asyncHandler(async (req, res) => {
  try {
    // ✅ Update admin status to inactive and clear token (if stored)
    await User.findByIdAndUpdate(
      req.user._id,
      {
        $unset: { adminToken: 1 }, // Remove admin token field (if exists)
        $set: {
          isActive: false,          // Mark admin as inactive
          lastLogout: new Date()    // Track logout time
        }
      },
      { new: true }
    );

    const options = {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production", // Cookie security in production
    };

    return res
      .status(200)
      .clearCookie("accessToken", options) // Remove access token
      .clearCookie("adminToken", options)  // Remove admin token
      .json(new ApiResponse(200, null, "Admin logged out successfully"));

  } catch (error) {
    console.error("Logout error:", error);
    throw new ApiError(500, "Error during admin logout");
  }
});

const getUserById = asyncHandler(async (req, res) => {
  const { id } = req.params;

  if (!mongoose.Types.ObjectId.isValid(id)) {
    throw new ApiError(400, "Invalid user ID");
  }

  const user = await User.findById(id).select("-password -refreshToken");
  if (!user) {
    throw new ApiError(404, "User not found");
  }

  res.status(200).json(new ApiResponse(200, user, "User details fetched successfully"));
});

const updateUserProfile = asyncHandler(async (req, res) => {
  const { id } = req.params;
  const updates = req.body;

  if (!mongoose.Types.ObjectId.isValid(id)) {
    throw new ApiError(400, "Invalid user ID");
  }

  const user = await User.findByIdAndUpdate(id, updates, { new: true }).select("-password -refreshToken");
  if (!user) {
    throw new ApiError(404, "User not found");
  }

  res.status(200).json(new ApiResponse(200, user, "User profile updated successfully"));
});
const searchUsers = asyncHandler(async (req, res) => {
  const { role, isActive, query } = req.query; // query = username or email search
  const filter = {};

  // Filter by role
  if (role) filter.role = role;

  // Filter by active status
  if (isActive !== undefined) filter.isActive = isActive === "true";

  // Search by username or email
  if (query) {
    filter.$or = [
      { username: { $regex: query, $options: "i" } },
      { email: { $regex: query, $options: "i" } }
    ];
  }

  const users = await User.find(filter).select("-password -refreshToken");
  res.status(200).json(new ApiResponse(200, users, "Filtered users fetched successfully"));
});
// ---------------- CREATE PRODUCT ----------------
// const createProduct = asyncHandler(async (req, res) => {
//   const { name, description, price, category, inStock, bestseller } = req.body;

//   if (!name || !price) throw new ApiError(400, "Name and price are required");

//   const product = await Product.create({
//     name,
//     description,
//     price,
//     category,
//     inStock: inStock ?? true,
//     bestseller: bestseller ?? false,
//     createdBy: req.user?._id || null,
//   });

//   return res.status(201).json(new ApiResponse(201, product, "Product created successfully"));
// });

const getProductStats = asyncHandler(async (req, res) => {
  const [totalProducts, inStockProducts, outOfStockProducts] = await Promise.all([
    Product.countDocuments({}),
    Product.countDocuments({ inStock: true }),
    Product.countDocuments({ inStock: false })
  ]);

  res.status(200).json(
    new ApiResponse(200, {
      totalProducts,
      inStockProducts,
      outOfStockProducts
    }, "Product statistics fetched successfully")
  );
});

// ---------------- GET ALL USERS ----------------
const getAllUsers = asyncHandler(async (req, res) => {
  const { page = 1, limit = 10 } = req.query;
  const users = await User.find().limit(limit * 1).skip((page - 1) * limit);
  return res.status(200).json(new ApiResponse(200, users, "Users fetched successfully"));
});

// ---------------- DELETE USER ----------------
const deleteUser = asyncHandler(async (req, res) => {
  const { id } = req.params;

  console.log("Deleting ID from request:", id); // 🔎 Debug log

  // Validate ID
  if (!id || !mongoose.Types.ObjectId.isValid(id)) {
    throw new ApiError(400, `Invalid user ID: ${id}`);
  }

  // Find and delete user
  const user = await User.findByIdAndDelete(id);

  if (!user) {
    throw new ApiError(404, "User not found");
  }

  return res
    .status(200)
    .json(new ApiResponse(200, null, "User deleted successfully"));
});

// ---------------- ADMIN STATS ----------------
const getAdminStats = asyncHandler(async (req, res) => {
  try {
    const totalUsers = await User.countDocuments({});
    const activeUsers = await User.countDocuments({ isActive: true });
    const inactiveUsers = await User.countDocuments({ isActive: false });
    const moderators = await User.countDocuments({ role: "moderator" });
    const admins = await User.countDocuments({ role: "admin" });
    const totalProducts = await Product.countDocuments({});

    return res.status(200).json(
      new ApiResponse(
        200,
        {
          totalUsers,
          activeUsers,
          inactiveUsers,
          moderators,
          admins,
          totalProducts
        },
        "Admin statistics fetched successfully"
      )
    );
  } catch (error) {
    console.error("Error fetching admin stats:", error);
    throw new ApiError(500, "Failed to fetch admin statistics");
  }
});


// ---------------- HEALTH CHECK ----------------
const healthCheck = asyncHandler(async (req, res) => {
  const healthInfo = {
    status: "Admin API Healthy",
    timestamp: new Date().toISOString(),
    uptime: process.uptime(),
    memory: process.memoryUsage(),
  };
  return res.status(200).json(new ApiResponse(200, healthInfo, "Admin API is running smoothly"));
});
// controllers/admin.controllers.js
// controllers/admin.controllers.js


// ---------------- UPDATE USER ROLE ----------------
 const updateUserRole = asyncHandler(async (req, res) => {
  const { userId, newRole } = req.body;

  // Validate userId
  if (!mongoose.Types.ObjectId.isValid(userId)) {
    throw new ApiError(400, "Invalid user ID");
  }

  // Validate role
  const allowedRoles = ["user", "moderator", "admin"];
  if (!newRole || !allowedRoles.includes(newRole)) {
    throw new ApiError(400, "Invalid role. Allowed: user, moderator, admin");
  }

  // Prevent admin from changing their own role
  if (req.user._id.toString() === userId) {
    throw new ApiError(403, "You cannot change your own role");
  }

  const user = await User.findById(userId);
  if (!user) {
    throw new ApiError(404, "User not found");
  }

  // Prevent downgrading last active admin
  if (user.role === "admin" && newRole !== "admin") {
    const activeAdmins = await User.countDocuments({ role: "admin", isActive: true });
    if (activeAdmins <= 1) {
      throw new ApiError(403, "At least one active admin must remain");
    }
  }

  user.role = newRole;
  await user.save();

  return res
    .status(200)
    .json(new ApiResponse(200, user, "User role updated successfully"));
});


const updateUserStatus = asyncHandler(async (req, res) => {
  const { userId, isActive } = req.body;

  if (!mongoose.Types.ObjectId.isValid(userId)) {
    throw new ApiError(400, "Invalid user ID");
  }

  let user;

  if (typeof isActive === "boolean") {
    // Explicit set
    user = await User.findByIdAndUpdate(
      userId,
      { isActive },
      { new: true }
    ).select("-password -refreshToken");
  } else {
    // Auto-toggle
    user = await User.findById(userId).select("-password -refreshToken");
    if (!user) throw new ApiError(404, "User not found");
    user.isActive = !user.isActive;
    await user.save();
  }

  if (!user) {
    throw new ApiError(404, "User not found");
  }

  return res.status(200).json(
    new ApiResponse(
      200,
      user,
      `User status updated successfully: ${user.isActive ? "Active" : "Inactive"}`
    )
  );
});

// ✅ EXPORT everything properly
export {
  adminLogin,
  adminLogout,
  // createProduct,
  getAllUsers,
  deleteUser,        // <-- अब properly export हो रहा है
  getAdminStats,
  healthCheck,
  updateUserRole ,
 updateUserStatus,
 getUserById,
 updateUserProfile,
 searchUsers,
 getProductStats

};
