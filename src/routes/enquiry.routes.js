import multer from "multer";
import express from "express";

import {
  getEnquiries,
  getEnquiryById,
  createEnquiry,
  updateEnquiry,
  deleteEnquiry
} from "../controllers/enquiry.controllers.js";
import { verifyAdminJWT } from "../middlewares/admin.middleware.js";

const router = express.Router();

// Public routes
router.post("/", createEnquiry);                    // POST /api/enquiries - Submit enquiry

// Admin routes
router.get("/", verifyAdminJWT, getEnquiries);      // GET /api/enquiries - Admin view all enquiries
router.get("/:id", verifyAdminJWT, getEnquiryById); // GET /api/enquiries/:id - Get specific enquiry
router.put("/:id", verifyAdminJWT, updateEnquiry);  // PUT /api/enquiries/:id - Update enquiry
router.delete("/:id", verifyAdminJWT, deleteEnquiry); // DELETE /api/enquiries/:id - Delete enquiry

export default router;