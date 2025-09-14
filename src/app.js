import express from "express";
import cookieParser from "cookie-parser";
import cors from "cors";
import path from "path";
import { fileURLToPath } from "url";

// Initialize Express
const app = express();

// Get __dirname for ES modules
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// ✅ Allowed origins from environment variable
// Example: CORS_ORIGIN=https://patelcropproducts.onrender.com
const allowedOrigins = process.env.CORS_ORIGIN?.split(",") || [];

// ✅ CORS middleware
app.use(
  cors({
    origin: (origin, callback) => {
      // Allow requests with no origin (curl, Postman, mobile apps)
      if (!origin) return callback(null, true);

      // Allow if origin is in allowedOrigins
      if (allowedOrigins.includes(origin)) return callback(null, true);

      // Otherwise block but gracefully
      console.warn(`❌ CORS blocked request from: ${origin}`);
      return callback(null, false);
    },
    credentials: true, // Allow cookies/auth headers
  })
);

// ✅ Handle preflight requests
app.options("*", cors());

// ✅ Body parsing
app.use(express.json({ limit: "16kb" }));
app.use(express.urlencoded({ extended: true, limit: "16kb" }));

// ✅ Cookie parsing
app.use(cookieParser());

// ✅ Serve static public folder
app.use(express.static("public"));

// ✅ Routes
import userRouter from "./routes/user.routes.js";
import videoRouter from "./routes/video.routes.js";
import commentRouter from "./routes/comment.routes.js";

app.use("/api/v1/users", userRouter);
app.use("/api/v1/videos", videoRouter);
app.use("/api/v1/comments", commentRouter);

// ✅ Serve frontend build
app.use(express.static(path.join(__dirname, "dist")));

// ✅ Fallback for frontend routes (non-API)
app.get(/^\/(?!api).*/, (req, res) => {
  res.sendFile(path.join(__dirname, "dist", "index.html"));
});

export { app };
