import mongoose from "mongoose";

const enquirySchema = new mongoose.Schema({
  name: {
    type: String,
    required: [true, "Name is required"],
    trim: true
  },
  email: {
    type: String,
    required: [true, "Email is required"],
    trim: true,
    lowercase: true
  },
  phone: {
    type: String,
    required: [true, "Phone number is required"],
    trim: true
  },
  message: {
    type: String,
    required: [true, "Message is required"],
    trim: true
  },
  companyName: {
    type: String,
    required: [true, "Company name is required"],
    trim: true
  },
  contactPerson: {
    type: String,
    required: [true, "Contact person is required"],
    trim: true
  },
  productCategory: {
    type: String,
    required: [true, "Product category is required"],
    trim: true
  },
  quantityRequired: {
    type: Number,  // Changed to Number as per your validation error
    required: [true, "Quantity required is required"]
  },
  status: {
    type: String,
    enum: ["pending", "contacted", "resolved", "cancelled"],
    default: "pending"
  }
}, {
  timestamps: true
});

const Enquiry = mongoose.model("Enquiry", enquirySchema);

export default Enquiry;