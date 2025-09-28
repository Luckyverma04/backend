import express from "express";
import cookieParser from "cookie-parser";
import cors from "cors";
import path from "path";
import { fileURLToPath } from "url";

// Import your routes
import userRouter from "./routes/user.routes.js";
import videoRouter from "./routes/video.routes.js";
import commentRouter from "./routes/comment.routes.js";

// ✅ ADD THESE TWO IMPORTS
import adminRouter from "./routes/admin.routes.js";
import productRouter from "./routes/product.routes.js";

const app = express();
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

console.log("📦 Initializing Express application...");

// ✅ CRITICAL: Trust proxy for Render
app.set('trust proxy', 1);

// ✅ SIMPLIFIED CORS Configuration - FIXED
const allowedOrigins = [
  "https://patelcropproducts-34yo.onrender.com", // Your frontend URL
  "http://localhost:3000",                      // Local React dev
  "http://localhost:5173"                       // Local Vite dev
];

console.log("🌍 Configured CORS origins:", allowedOrigins);

// ✅ SIMPLIFIED CORS Middleware - FIXED
app.use(cors({
  origin: function(origin, callback) {
    // Allow requests with no origin (mobile apps, Postman, server-to-server)
    if (!origin) return callback(null, true);
    
    // Check if origin is in allowed list
    if (allowedOrigins.indexOf(origin) !== -1) {
      return callback(null, true);
    }
    
    // In development, be more permissive
    if (process.env.NODE_ENV === 'development') {
      console.log("🔧 Development mode - allowing origin:", origin);
      return callback(null, true);
    }
    
    return callback(new Error('Not allowed by CORS'), false);
  },
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS', 'PATCH'],
  allowedHeaders: ['Content-Type', 'Authorization', 'X-Requested-With']
}));

// ✅ Request logging middleware
app.use((req, res, next) => {
  const timestamp = new Date().toISOString();
  console.log(`[${timestamp}] ${req.method} ${req.path} - Origin: ${req.headers.origin || 'none'}`);
  next();
});

// ✅ Security headers
app.use((req, res, next) => {
  res.setHeader('X-Content-Type-Options', 'nosniff');
  res.setHeader('X-Frame-Options', 'SAMEORIGIN');
  res.setHeader('X-XSS-Protection', '1; mode=block');
  
  // Only set secure headers in production
  if (process.env.NODE_ENV === 'production') {
    res.setHeader('Strict-Transport-Security', 'max-age=31536000; includeSubDomains');
  }
  
  next();
});

// ✅ Body parsing middleware
app.use(express.json({ limit: "16kb" }));
app.use(express.urlencoded({ extended: true, limit: "16kb" }));
app.use(cookieParser());

// ✅ Static files middleware (for uploaded files, images etc.)
app.use(express.static("public"));

// ✅ Root endpoint
app.get('/', (req, res) => {
  res.json({
    message: "🚀 Patel Crop Products Backend API",
    description: "This is the backend API server. Frontend is deployed separately.",
    timestamp: new Date().toISOString(),
    environment: process.env.NODE_ENV || "development",
    version: "1.0.0",
    status: "healthy",
    endpoints: {
      health: "/api/v1/health",
      users: "/api/v1/users/*",
      products: "/api/v1/products/*",
      admin: "/api/v1/admin/*"
    }
  });
});

// ✅ Health check endpoint
app.get("/api/v1/health", (req, res) => {
  res.status(200).json({ 
    status: "OK", 
    message: "Backend API is working perfectly!",
    timestamp: new Date().toISOString(),
    environment: process.env.NODE_ENV || "development"
  });
});

// ✅ API Routes - FIXED ORDER
console.log("🛣️  Registering API routes...");

app.use("/api/v1/users", userRouter);
app.use("/api/v1/videos", videoRouter);
app.use("/api/v1/comments", commentRouter);

// ✅ ADDED: Admin and Product routes - FIXED ORDER
app.use("/api/v1/admin", adminRouter);
app.use("/api/v1", productRouter); // This should come after specific routes

console.log("✅ API routes registered successfully");

// ✅ 404 handler for API routes
app.use('/api/*', (req, res) => {
  res.status(404).json({
    error: 'API endpoint not found',
    path: req.path,
    method: req.method,
    timestamp: new Date().toISOString()
  });
});

// ✅ 404 handler for non-API routes
app.use('*', (req, res) => {
  res.status(404).json({
    error: 'Route not found',
    message: 'This is a backend API server. Frontend is deployed separately.',
    path: req.path,
    method: req.method,
    timestamp: new Date().toISOString()
  });
});

// ✅ Global error handler - SIMPLIFIED
app.use((err, req, res, next) => {
  console.error('❌ Global Error:', err.message);
  
  // CORS errors
  if (err.message && err.message.includes('CORS')) {
    return res.status(403).json({
      error: 'CORS Error',
      message: 'Origin not allowed',
      origin: req.headers.origin
    });
  }
  
  // Default error response
  const statusCode = err.status || 500;
  
  res.status(statusCode).json({
    error: statusCode >= 500 ? 'Internal Server Error' : err.message,
    timestamp: new Date().toISOString(),
    ...(process.env.NODE_ENV === 'development' && { 
      stack: err.stack
    })
  });
});

console.log("✅ Express application configured successfully");

export { app };