import express from "express";
import cookieparser from "cookie-parser";
import cors from "cors";
import path from "path";
import { fileURLToPath } from "url";

const app = express();

// Get __dirname equivalent for ES modules
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Middleware
app.use(
  cors({
    origin: process.env.CORS_ORIGIN,
    credentials: true,
  })
);

app.use(express.json({ limit: "16kb" }));
app.use(express.urlencoded({ extended: true, limit: "16kb" }));
app.use(express.static("public"));
app.use(cookieparser());

// routes
import userRouter from "./routes/user.routes.js";
import videoRouter from "./routes/video.routes.js";
import commentRouter from "./routes/comment.routes.js";

app.use("/api/v1/users", userRouter);
app.use("/api/v1/videos", videoRouter);
app.use("/api/v1/comments", commentRouter);

// ✅ Serve frontend dist folder
app.use(express.static(path.join(__dirname, "dist")));

// ✅ Fallback for frontend routes (ONLY for non-API paths)
app.get(/^\/(?!api).*/, (req, res) => {
  res.sendFile(path.join(__dirname, "dist", "index.html"));
});

export { app };
