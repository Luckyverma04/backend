import express from "express";
import {
  getProducts,           
  getProductById,        
  createProduct,         
  updateProduct,         
  deleteProduct,         
  getProductsByCategory,
  getProductsWithFilters 
} from "../controllers/product.controllers.js";
import { verifyAdminJWT } from "../middlewares/admin.middleware.js";
import { uploadProductImage } from "../middlewares/multer.middleware.js";

const router = express.Router();

// Public routes
router.get("/products", getProducts); // GET /api/v1/products
router.get("/products/category/:category", getProductsByCategory);
router.get("/products/:id", getProductById);

// Admin routes - FIXED to match your working endpoints
router.post("/createProduct", verifyAdminJWT, uploadProductImage, createProduct); // POST /api/v1/createProduct
router.put("/products/update/:id", verifyAdminJWT, uploadProductImage, updateProduct); // PUT /api/v1/products/:id
router.delete("/products/delete/:id", verifyAdminJWT, deleteProduct); // DELETE /api/v1/products/:id

router.get("/products", getProductsWithFilters);
export default router;