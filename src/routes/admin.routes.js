import express from "express";
import {
  getAllUsers,
  updateUserStatus,
  getAdminStats,
  deleteUser,
  adminLogin,
  adminLogout,
    updateUserRole ,
    getUserById,
    updateUserProfile,
    searchUsers,
    getProductStats
} from "../controllers/admin.controllers.js";
import { verifyAdminJWT, verifyAdminOrModerator } from "../middlewares/admin.middleware.js";

const router = express.Router();

// ===== AUTH =====
router.post("/login", adminLogin);
router.post("/logout",verifyAdminJWT, adminLogout);

// ===== USERS =====
// ✅ Only admin can get all users
router.get("/users", verifyAdminJWT, getAllUsers);

// ✅ Only admin can update role
router.put("/users/role", verifyAdminJWT, updateUserRole);
router.get("/users/search",verifyAdminJWT,searchUsers);

router.get("/products/stats",verifyAdminJWT, getProductStats);

// ✅ Admin OR Moderator can update status
router.put("/users/status", verifyAdminOrModerator, updateUserStatus);

// ✅ Only admin can delete user
router.delete("/users/:id", verifyAdminJWT, deleteUser);

router.get("/users/:id", verifyAdminJWT, getUserById);

router.patch("/users/:id",verifyAdminJWT,updateUserProfile);


router.get("/stats", verifyAdminJWT, getAdminStats);
export default router;
