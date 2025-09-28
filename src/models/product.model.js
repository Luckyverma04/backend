import mongoose, { Schema } from "mongoose";
const productSchema = new Schema(
  {
    name: {
      type: String,
      required: [true, "Product name is required"],
      trim: true,
      index: true,
    },
    description: {
      type: String,
      required: [true, "Product description is required"],
      trim: true,
    },
  category: {
  type: String,
  required: [true, "Product category is required"],
  lowercase: true,
},
    price: {
      type: Number,
      required: [true, "Product price is required"],
      min: [0, "Price cannot be negative"],
    },
    bulkPrice: {
      type: Number,
      required: [true, "Bulk price is required"],
      min: [0, "Bulk price cannot be negative"],
    },
    minOrder: {
      type: Number,
      required: [true, "Minimum order quantity is required"],
      min: [1, "Minimum order must be at least 1"],
    },
    features: [
      {
        type: String,
        trim: true,
      }
    ],
    // Product image - using same pattern as User model
    image: {
      url: { 
        type: String, 
        required: true 
      },
      public_id: { 
        type: String, 
        required: true 
      },
    },
    // Simple emoji for display
    emoji: {
      type: String,
      default: "📦",
      maxLength: 4,
    },
    bestseller: {
      type: Boolean,
      default: false,
    },
    inStock: {
      type: Boolean,
      default: true,
    },
    stockQuantity: {
      type: Number,
      default: 0,
      min: [0, "Stock quantity cannot be negative"],
    },
    // Auto-generated fields
    rating: {
      type: Number,
      default: 4.0,
      min: 0,
      max: 5,
    },
    reviewCount: {
      type: Number,
      default: 0,
      min: 0,
    },
    totalSales: {
      type: Number,
      default: 0,
      min: 0,
    },
    // SEO and metadata
    slug: {
      type: String,
      unique: true,
      lowercase: true,
    },
    tags: [String],
    metaDescription: String,
    // Tracking
    createdBy: {
      type: Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    updatedBy: {
      type: Schema.Types.ObjectId,
      ref: "User",
    },
    isActive: {
      type: Boolean,
      default: true,
    },
  },
  { 
    timestamps: true 
  }
);

// 🔑 Pre-save hook to generate slug and update stock status
productSchema.pre("save", async function (next) {
  // Generate slug if name is modified or new product
  if (this.isModified("name") || this.isNew) {
    const baseSlug = this.name
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/(^-|-$)/g, '');
    
    let slug = baseSlug;
    let counter = 1;
    
    // Ensure unique slug
    while (await mongoose.models.Product.findOne({ slug, _id: { $ne: this._id } })) {
      slug = `${baseSlug}-${counter}`;
      counter++;
    }
    
    this.slug = slug;
  }
  
  // Update stock status based on quantity
  if (this.isModified("stockQuantity")) {
    this.inStock = this.stockQuantity > 0;
  }
  
  next();
});

// 🔑 Check if product is in stock
productSchema.methods.isInStock = function () {
  return this.inStock && this.stockQuantity > 0;
};

// 🔑 Update stock quantity
productSchema.methods.updateStock = async function (quantity) {
  this.stockQuantity = Math.max(0, quantity);
  this.inStock = this.stockQuantity > 0;
  return await this.save();
};

// 🔑 Calculate discount percentage
productSchema.methods.getDiscountPercentage = function () {
  if (this.price && this.bulkPrice && this.bulkPrice < this.price) {
    return Math.round(((this.price - this.bulkPrice) / this.price) * 100);
  }
  return 0;
};

// 🔑 Toggle bestseller status
productSchema.methods.toggleBestseller = async function () {
  this.bestseller = !this.bestseller;
  return await this.save();
};

// 🔑 Static method to find active products
productSchema.statics.findActive = function () {
  return this.find({ isActive: true });
};

// 🔑 Static method to find products by category
productSchema.statics.findByCategory = function (category) {
  return this.find({ category: category.toLowerCase(), isActive: true });
};

// 🔑 Static method to find bestsellers
productSchema.statics.findBestsellers = function () {
  return this.find({ bestseller: true, isActive: true, inStock: true });
};

export const Product =
  mongoose.models.Product || mongoose.model("Product", productSchema);