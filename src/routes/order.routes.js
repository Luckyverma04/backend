import express from "express";
import {
  createOrder,
  getAllOrders,
  getUserOrders,
  updateOrderStatus,
  getOrderById
} from "../controllers/order.controllers.js";
import { verifyJWT } from "../middlewares/auth.middleware.js";
import { verifyAdminJWT } from "../middlewares/admin.middleware.js";

const router = express.Router();

// Public routes
router.post("/", verifyJWT, createOrder);
router.get("/my-orders", verifyJWT, getUserOrders);
router.get("/:orderId", verifyJWT, getOrderById);

// Admin routes
router.get("/", verifyAdminJWT, getAllOrders);
router.put("/:orderId/status", verifyAdminJWT, updateOrderStatus);

export default router;