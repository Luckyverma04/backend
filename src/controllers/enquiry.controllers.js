import Enquiry from "../models/enquiry.model.js";

// @desc    Create new enquiry
// @route   POST /api/enquiries
// @access  Public
export const createEnquiry = async (req, res) => {
  try {
    const {
      name,
      email,
      phone,
      message,
      companyName,
      contactPerson,
      productCategory,
      quantityRequired
    } = req.body;

    // Create new enquiry
    const enquiry = new Enquiry({
      name,
      email,
      phone,
      message,
      companyName,
      contactPerson,
      productCategory,
      quantityRequired
    });

    const savedEnquiry = await enquiry.save();

    res.status(201).json({
      success: true,
      message: "Enquiry submitted successfully",
      enquiry: savedEnquiry
    });
  } catch (error) {
    console.error("Create enquiry error:", error);
    res.status(400).json({
      success: false,
      message: error.message
    });
  }
};

// @desc    Get all enquiries
// @route   GET /api/enquiries
// @access  Admin
export const getEnquiries = async (req, res) => {
  try {
    const enquiries = await Enquiry.find().sort({ createdAt: -1 });

    res.status(200).json({
      success: true,
      count: enquiries.length,
      enquiries
    });
  } catch (error) {
    console.error("Get enquiries error:", error);
    res.status(500).json({
      success: false,
      message: "Server error while fetching enquiries"
    });
  }
};

// @desc    Get single enquiry by ID
// @route   GET /api/enquiries/:id
// @access  Admin
export const getEnquiryById = async (req, res) => {
  try {
    const enquiry = await Enquiry.findById(req.params.id);

    if (!enquiry) {
      return res.status(404).json({
        success: false,
        message: "Enquiry not found"
      });
    }

    res.status(200).json({
      success: true,
      enquiry
    });
  } catch (error) {
    console.error("Get enquiry by ID error:", error);
    if (error.kind === 'ObjectId') {
      return res.status(404).json({
        success: false,
        message: "Enquiry not found"
      });
    }
    res.status(500).json({
      success: false,
      message: "Server error while fetching enquiry"
    });
  }
};

// @desc    Update enquiry
// @route   PUT /api/enquiries/:id
// @access  Admin
export const updateEnquiry = async (req, res) => {
  try {
    const {
      name,
      email,
      phone,
      message,
      companyName,
      contactPerson,
      productCategory,
      quantityRequired,
      status
    } = req.body;

    const enquiry = await Enquiry.findById(req.params.id);

    if (!enquiry) {
      return res.status(404).json({
        success: false,
        message: "Enquiry not found"
      });
    }

    // Update fields
    const updateData = {
      name: name || enquiry.name,
      email: email || enquiry.email,
      phone: phone || enquiry.phone,
      message: message || enquiry.message,
      companyName: companyName || enquiry.companyName,
      contactPerson: contactPerson || enquiry.contactPerson,
      productCategory: productCategory || enquiry.productCategory,
      quantityRequired: quantityRequired || enquiry.quantityRequired,
      status: status || enquiry.status
    };

    const updatedEnquiry = await Enquiry.findByIdAndUpdate(
      req.params.id,
      updateData,
      { new: true, runValidators: true }
    );

    res.status(200).json({
      success: true,
      message: "Enquiry updated successfully",
      enquiry: updatedEnquiry
    });
  } catch (error) {
    console.error("Update enquiry error:", error);
    res.status(400).json({
      success: false,
      message: error.message
    });
  }
};

// @desc    Delete enquiry
// @route   DELETE /api/enquiries/:id
// @access  Admin
export const deleteEnquiry = async (req, res) => {
  try {
    const enquiry = await Enquiry.findById(req.params.id);

    if (!enquiry) {
      return res.status(404).json({
        success: false,
        message: "Enquiry not found"
      });
    }

    await Enquiry.findByIdAndDelete(req.params.id);

    res.status(200).json({
      success: true,
      message: "Enquiry deleted successfully"
    });
  } catch (error) {
    console.error("Delete enquiry error:", error);
    if (error.kind === 'ObjectId') {
      return res.status(404).json({
        success: false,
        message: "Enquiry not found"
      });
    }
    res.status(500).json({
      success: false,
      message: "Server error while deleting enquiry"
    });
  }
};