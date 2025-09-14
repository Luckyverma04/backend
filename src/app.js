// src/app.js - Clean Express 4.x version
import express from "express";
import cors from "cors";
import cookieParser from "cookie-parser";
import dotenv from "dotenv";

// Load environment variables
dotenv.config();

console.log("🔥 Initializing Express 4.x app...");

const app = express();

// ✅ CORS configuration
const allowedOrigins = [
  "https://patelcropproducts.onrender.com",
  "http://localhost:5173",
  "http://localhost:3000"
];

app.use(cors({
  origin: allowedOrigins,
  credentials: true,
  methods: ["GET", "POST", "PUT", "DELETE", "OPTIONS"]
}));

// ✅ Basic middleware
app.use(express.json({ limit: "16kb" }));
app.use(express.urlencoded({ extended: true, limit: "16kb" }));
app.use(cookieParser());

// ✅ Simple routes (no complex parameters)
app.get("/", (req, res) => {
  console.log("✅ Root route accessed");
  res.json({ 
    message: "🚀 Express 4.x Server Working!",
    timestamp: new Date().toISOString(),
    version: "Express 4.x",
    status: "healthy"
  });
});

app.get("/api/v1/test", (req, res) => {
  console.log("✅ API test route accessed");
  res.json({ 
    message: "✅ API Test Route Working!",
    status: "OK",
    cors: "enabled",
    allowedOrigins: allowedOrigins
  });
});

app.post("/api/v1/users/login", (req, res) => {
  console.log("🔑 Login route accessed:", req.body);
  
  try {
    const { email, username, password } = req.body;
    
    // Validate required fields
    if (!password || (!email && !username)) {
      return res.status(400).json({
        success: false,
        message: "Email/username and password are required"
      });
    }
    
    // Mock successful login
    res.json({
      success: true,
      message: "Login successful",
      user: { 
        id: "test-user-123", 
        email: email || `${username}@example.com`,
        username: username || email.split('@')[0]
      },
      token: "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.test.token"
    });
    
  } catch (error) {
    console.error("❌ Login error:", error);
    res.status(500).json({
      success: false,
      message: "Internal server error",
      error: error.message
    });
  }
});

// ✅ Health check route
app.get("/api/v1/health", (req, res) => {
  res.json({
    status: "healthy",
    timestamp: new Date().toISOString(),
    uptime: process.uptime(),
    memory: process.memoryUsage(),
    environment: process.env.NODE_ENV || 'development'
  });
});

// ✅ 404 handler
app.use("*", (req, res) => {
  console.log(`❌ 404: ${req.method} ${req.url}`);
  res.status(404).json({
    success: false,
    message: `Route not found: ${req.method} ${req.url}`,
    availableRoutes: [
      "GET /",
      "GET /api/v1/test",
      "GET /api/v1/health",
      "POST /api/v1/users/login"
    ]
  });
});

// ✅ Error handler
app.use((err, req, res, next) => {
  console.error("💥 Global error:", err);
  res.status(err.status || 500).json({
    success: false,
    message: err.message || "Internal server error",
    ...(process.env.NODE_ENV === 'development' && { stack: err.stack })
  });
});

console.log("✅ Express 4.x app configured successfully");

export default app;