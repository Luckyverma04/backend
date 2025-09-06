import { v2 as cloudinary } from "cloudinary";
import fs from "fs";
import dotenv from "dotenv";

// load .env
dotenv.config();

cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
});

const uploadOnCloudinary = async (filePath) => {
  try {
    if (!filePath) {
      console.log("❌ No file path provided");
      return null;
    }

    console.log("📂 Uploading file from path:", filePath);

    // actual upload
    const response = await cloudinary.uploader.upload(filePath, {
      resource_type: "auto",
    });

    console.log("✅ Cloudinary Upload Success:", response.secure_url);

    // delete local file if upload success
    if (fs.existsSync(filePath)) {
      fs.unlinkSync(filePath);
      console.log("🗑️ Local file deleted:", filePath);
    }

    // return only what you need
    return {
      url: response.secure_url,
      public_id: response.public_id,
    };
  } catch (error) {
    console.error("❌ Cloudinary Upload Error:", error);

    // ensure file is cleaned up on error
    if (filePath && fs.existsSync(filePath)) {
      fs.unlinkSync(filePath);
      console.log("🗑️ Local file deleted after error:", filePath);
    }

    return null;
  }
};


export { uploadOnCloudinary };
