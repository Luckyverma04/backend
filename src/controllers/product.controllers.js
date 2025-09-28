// controllers/product.controllers.js
import {Product} from "../models/product.model.js"; // 👈 अपना product model यहाँ import करें
import { asyncHandler } from "../utils/asyncHandler.js";
import { uploadOnCloudinary } from "../utils/cloudinary.js";
import { ApiError } from "../utils/ApiError.js";
import { ApiResponse } from "../utils/ApiResponse.js";
// @desc    Get all products
// @route   GET /api/products
// @access  Public
const getProducts = async (req, res) => {
  try {
    const products = await Product.find();
    res.status(200).json(products);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

// @desc    Get single product by ID
// @route   GET /api/products/:id
// @access  Public
 const getProductById = async (req, res) => {
  try {
    const product = await Product.findById(req.params.id);
    if (!product) return res.status(404).json({ message: "Product not found" });
    res.status(200).json(product);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

// @desc    Create a new product
// @route   POST /api/products
// @access  Admin
 
 const createProduct = asyncHandler(async (req, res) => {
  try {
    //    console.log("=== PRODUCT CREATION DEBUG ===");
    // console.log("Request body:", req.body);
    // console.log("Request files:", req.files);
    //  console.log("req.file:", req.file);
    const {
      name,
      description,
      category,
      price,
      bulkPrice,
      minOrder,
      features,
      emoji,
      bestseller,
      stockQuantity,
      tags,
      metaDescription
    } = req.body;
     console.log("Extracted fields:");
    console.log("- name:", name);
    console.log("- description:", description);
    console.log("- category:", category);
    console.log("- price:", price);
    console.log("- bulkPrice:", bulkPrice);
    console.log("- minOrder:", minOrder);

    // 1. Required field validation
    if (!name || !description || !category || !price || !bulkPrice || !minOrder) {
      throw new ApiError(400, "Name, description, category, price, bulk price, and min order are required");
    }

    // 2. Price validation
    if (price <= 0 || bulkPrice <= 0) {
      throw new ApiError(400, "Price and bulk price must be greater than 0");
    }

    if (parseFloat(bulkPrice) >= parseFloat(price)) {
      throw new ApiError(400, "Bulk price must be less than regular price");
    }

    if (minOrder < 1) {
      throw new ApiError(400, "Minimum order must be at least 1");
    }

    // 3. Check if product already exists
    const existingProduct = await Product.findOne({
      name: { $regex: new RegExp(`^${name.trim()}$`, "i") }
    });

    if (existingProduct) {
      throw new ApiError(409, "Product with this name already exists");
    }

  // Handle product image upload
let productImage = {};

// FIX: Check req.file instead of req.files.image
if (req.file) {
  // console.log("📁 File found:", req.file);
  const uploadedImage = await uploadOnCloudinary(req.file.path);
  
  if (!uploadedImage?.url) {
    throw new ApiError(400, "Failed to upload product image");
  }
  
  productImage = {
    url: uploadedImage.secure_url || uploadedImage.url,
    public_id: uploadedImage.public_id
  };
} else {
  throw new ApiError(400, "Product image is required");
}

    // 5. Process features array
    const processedFeatures = Array.isArray(features) 
      ? features.filter(feature => feature?.trim()).map(feature => feature.trim())
      : features?.split(',').map(feature => feature.trim()).filter(feature => feature) || [];

    // 6. Process tags array
    const processedTags = Array.isArray(tags) 
      ? tags.filter(tag => tag?.trim()).map(tag => tag.trim())
      : tags?.split(',').map(tag => tag.trim()).filter(tag => tag) || [];

    // 7. Prepare product data
    const productData = {
      name: name.trim(),
      description: description.trim(),
      category: category.toLowerCase(),
      price: parseFloat(price),
      bulkPrice: parseFloat(bulkPrice),
      minOrder: parseInt(minOrder),
      features: processedFeatures,
      emoji: emoji || "📦",
      bestseller: bestseller === "true",
      stockQuantity: stockQuantity ? parseInt(stockQuantity) : 0,
      tags: processedTags,
      metaDescription: metaDescription?.trim(),
      image: productImage,
      createdBy: req.user._id,
      updatedBy: req.user._id,
      isActive: true
    };

    // 8. Create product
    const product = await Product.create(productData);

    // 9. Populate creator info for response
    const createdProduct = await Product.findById(product._id)
      .populate("createdBy", "username email fullName avatar")
      .populate("updatedBy", "username email fullName avatar")
      .select("-__v");

    // 10. Calculate discount percentage for response
    const productResponse = createdProduct.toObject();
    productResponse.discountPercentage = createdProduct.getDiscountPercentage();

    return res.status(201).json(
      new ApiResponse(
        201, 
        productResponse, 
        "Product created successfully"
      )
    );

  } catch (error) {
    // Handle MongoDB duplicate key error (slug or name)
    if (error.code === 11000) {
      const field = Object.keys(error.keyPattern)[0];
      throw new ApiError(409, `Product with this ${field} already exists`);
    }
    
    // Handle Mongoose validation errors (including enum validation)
    if (error.name === 'ValidationError') {
      const messages = Object.values(error.errors).map(err => err.message);
      throw new ApiError(400, messages.join(', '));
    }
    
    throw error; // Let asyncHandler handle it
  }
});

// @desc    Update a product
// @route   PUT /api/products/:id
// @access  Admin
const updateProduct = asyncHandler(async (req, res) => {
  try {
    const productId = req.params.id;
    
    // 1. Check if product exists
    const existingProduct = await Product.findById(productId);
    if (!existingProduct) {
      throw new ApiError(404, "Product not found");
    }

    // 2. Prepare update data (exclude immutable fields)
    const updateData = { ...req.body };
    
    // Remove fields that shouldn't be updated directly
    delete updateData._id;
    delete updateData.createdBy;
    delete updateData.createdAt;
    delete updateData.slug; // If you have slug field
    
    // 3. Handle price validations if price/bulkPrice are being updated
    if (updateData.price !== undefined || updateData.bulkPrice !== undefined) {
      const price = updateData.price !== undefined ? parseFloat(updateData.price) : existingProduct.price;
      const bulkPrice = updateData.bulkPrice !== undefined ? parseFloat(updateData.bulkPrice) : existingProduct.bulkPrice;
      
      if (price <= 0 || bulkPrice <= 0) {
        throw new ApiError(400, "Price and bulk price must be greater than 0");
      }
      
      if (bulkPrice >= price) {
        throw new ApiError(400, "Bulk price must be less than regular price");
      }
    }

    // 4. Handle minOrder validation if being updated
    if (updateData.minOrder !== undefined && updateData.minOrder < 1) {
      throw new ApiError(400, "Minimum order must be at least 1");
    }

    // 5. Process array fields if provided
    if (updateData.features !== undefined) {
      updateData.features = Array.isArray(updateData.features) 
        ? updateData.features.filter(feature => feature?.trim()).map(feature => feature.trim())
        : updateData.features.split(',').map(feature => feature.trim()).filter(feature => feature);
    }

    if (updateData.tags !== undefined) {
      updateData.tags = Array.isArray(updateData.tags) 
        ? updateData.tags.filter(tag => tag?.trim()).map(tag => tag.trim())
        : updateData.tags.split(',').map(tag => tag.trim()).filter(tag => tag);
    }

    // 6. Add updatedBy and updatedAt
    updateData.updatedBy = req.user._id;
    updateData.updatedAt = new Date();

    // 7. Update the product
    const updatedProduct = await Product.findByIdAndUpdate(
      productId,
      updateData,
      { 
        new: true, 
        runValidators: true 
      }
    ).populate("createdBy", "username email fullName avatar")
     .populate("updatedBy", "username email fullName avatar")
     .select("-__v");

    if (!updatedProduct) {
      throw new ApiError(404, "Product not found after update");
    }

    // 8. Return response
    return res.status(200).json(
      new ApiResponse(
        200, 
        updatedProduct, 
        "Product updated successfully"
      )
    );

  } catch (error) {
    // Handle specific errors
    if (error.name === 'CastError') {
      throw new ApiError(400, "Invalid product ID format");
    }
    
    if (error.name === 'ValidationError') {
      const messages = Object.values(error.errors).map(err => err.message);
      throw new ApiError(400, messages.join(', '));
    }
    
    throw error;
  }
});

// @desc    Delete a product
// @route   DELETE /api/products/:id
// @access  Admin
 const deleteProduct = async (req, res) => {
  try {
    const deletedProduct = await Product.findByIdAndDelete(req.params.id);
    if (!deletedProduct) return res.status(404).json({ message: "Product not found" });
    res.status(200).json({ message: "Product deleted successfully" });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

// @desc    Get products by category
// @route   GET /api/products/category/:category
// @access  Public
 const getProductsByCategory = async (req, res) => {
  try {
    const products = await Product.find({ category: req.params.category });
    res.status(200).json(products);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

const getProductsWithFilters = asyncHandler(async (req, res) => {
  try {
    // Extract query parameters
    const {
      page = 1,
      limit = 12,
      sort = "-createdAt",
      category,
      minPrice,
      maxPrice,
      search,
      bestseller,
      inStock,
      tags
    } = req.query;

    // Build filter object
    const filter = { isActive: true };

    // Category filter
    if (category) {
      filter.category = { $regex: category, $options: "i" };
    }

    // Price range filter
    if (minPrice || maxPrice) {
      filter.price = {};
      if (minPrice) filter.price.$gte = parseFloat(minPrice);
      if (maxPrice) filter.price.$lte = parseFloat(maxPrice);
    }

    // Search filter (name, description, tags)
    if (search) {
      filter.$or = [
        { name: { $regex: search, $options: "i" } },
        { description: { $regex: search, $options: "i" } },
        { tags: { $in: [new RegExp(search, "i")] } }
      ];
    }

    // Bestseller filter
    if (bestseller === "true") {
      filter.bestseller = true;
    }

    // Stock filter
    if (inStock === "true") {
      filter.stockQuantity = { $gt: 0 };
    } else if (inStock === "false") {
      filter.stockQuantity = { $lte: 0 };
    }

    // Tags filter
    if (tags) {
      const tagsArray = Array.isArray(tags) ? tags : tags.split(',');
      filter.tags = { $in: tagsArray.map(tag => new RegExp(tag.trim(), "i")) };
    }

    // Calculate pagination
    const pageNum = parseInt(page);
    const limitNum = parseInt(limit);
    const skip = (pageNum - 1) * limitNum;

    // Execute query with pagination
    const products = await Product.find(filter)
      .sort(sort)
      .skip(skip)
      .limit(limitNum)
      .populate("createdBy", "username")
      .select("-__v");

    // Get total count for pagination info
    const totalProducts = await Product.countDocuments(filter);
    const totalPages = Math.ceil(totalProducts / limitNum);

    // Response data
    const response = {
      products,
      pagination: {
        currentPage: pageNum,
        totalPages,
        totalProducts,
        hasNext: pageNum < totalPages,
        hasPrev: pageNum > 1,
        limit: limitNum
      }
    };

    return res.status(200).json(
      new ApiResponse(200, response, "Products fetched successfully")
    );

  } catch (error) {
    throw new ApiError(500, "Error fetching products: " + error.message);
  }
});
// Export all functions
export {
  getProducts,
  getProductById,
  createProduct,
  updateProduct,
  deleteProduct,
  getProductsByCategory,
  getProductsWithFilters 
};
