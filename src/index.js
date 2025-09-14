import dotenv from "dotenv";
dotenv.config({ path: "./.env" });
import { DB_NAME } from "./constants.js";
import connectDB from "./db/index.js";
import { app } from "./app.js";

 // ✅ Load env first

const PORT = process.env.PORT || 8000;

connectDB()
  .then(() => {
    app.listen(PORT, () => {
      console.log(`✅ Server is running at port: ${PORT}`);
    });

    app.on("error", (error) => {
      console.error("❌ App error:", error);
      throw error;
    });
  })
  .catch((err) => {
    console.error("❌ MongoDB connection failed!", err);
  });
