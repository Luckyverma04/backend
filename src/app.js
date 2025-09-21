import express from "express";
import cookieParser from "cookie-parser";
import cors from "cors";
import path from "path";
import { fileURLToPath } from "url";

// Import your routes
import userRouter from "./routes/user.routes.js";
import videoRouter from "./routes/video.routes.js";
import commentRouter from "./routes/comment.routes.js";

const app = express();
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

console.log("📦 Initializing Express application...");

// ✅ CRITICAL: Trust proxy for Render
app.set('trust proxy', 1);

// ✅ CORS Configuration - Using your actual domains
const allowedOrigins = [
  process.env.CORS_ORIGIN || "https://patelcropproducts-34yo.onrender.com", // Your frontend URL
  "https://patelcropproducts-34yo.onrender.com",          // Your frontend
  "http://localhost:3000",                           // Local React dev
  "http://localhost:5173",                           // Local Vite dev
  "http://localhost:3001",                           // Alternative local port
  "http://127.0.0.1:3000",                          // Alternative localhost
  "http://127.0.0.1:5173"                           // Alternative localhost
];

console.log("🌍 Configured CORS origins:", allowedOrigins);

// ✅ CORS Middleware - Simplified for production
app.use(cors({
  origin: function(origin, callback) {
    console.log(`📡 CORS check for origin: ${origin || 'no-origin'}`);
    
    // Allow requests with no origin (mobile apps, Postman, server-to-server)
    if (!origin) {
      console.log("✅ No origin - allowing request");
      return callback(null, true);
    }
    
    // Check if origin is in allowed list
    if (allowedOrigins.includes(origin)) {
      console.log("✅ Origin allowed:", origin);
      return callback(null, true);
    }
    
    // In development, be more permissive
    if (process.env.NODE_ENV === 'development') {
      console.log("🔧 Development mode - allowing origin:", origin);
      return callback(null, true);
    }
    
    // Log and reject in production
    console.log("❌ Origin rejected:", origin);
    console.log("📋 Allowed origins:", allowedOrigins);
    return callback(new Error(`CORS: Origin ${origin} not allowed`), false);
  },
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS', 'PATCH'],
  allowedHeaders: [
    'Origin',
    'X-Requested-With',
    'Content-Type',
    'Accept',
    'Authorization',
    'Cookie',
    'Set-Cookie'
  ],
  exposedHeaders: ['Set-Cookie'],
  optionsSuccessStatus: 200
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

// ✅ Root endpoint - MODIFIED to indicate this is backend only
app.get('/', (req, res) => {
  console.log("🏠 Root endpoint accessed");
  res.json({
    message: "🚀 Patel Crop Products Backend API",
    description: "This is the backend API server. Frontend is deployed separately.",
    timestamp: new Date().toISOString(),
    environment: process.env.NODE_ENV || "development",
    version: "1.0.0",
    status: "healthy",
    frontend_url: process.env.CORS_ORIGIN || "Not configured",
    endpoints: {
      health: "/api/v1/health",
      cors_test: "/api/v1/cors-test",
      placeholder: "/api/v1/placeholder/:width/:height",
      users: "/api/v1/users/*",
      videos: "/api/v1/videos/*",
      comments: "/api/v1/comments/*"
    },
    docs: {
      api_base: `${req.protocol}://${req.get('host')}/api/v1`,
      note: "This is a REST API. Visit your frontend URL to access the website."
    }
  });
});

// ✅ Health check endpoint
app.get("/api/v1/health", (req, res) => {
  const origin = req.headers.origin;
  console.log("🏥 Health check from origin:", origin);
  
  res.status(200).json({ 
    status: "OK", 
    message: "Backend API is working perfectly!",
    timestamp: new Date().toISOString(),
    environment: process.env.NODE_ENV || "development",
    server: "Render Backend",
    uptime: Math.floor(process.uptime()),
    memory: {
      used: Math.round(process.memoryUsage().heapUsed / 1024 / 1024) + 'MB',
      total: Math.round(process.memoryUsage().heapTotal / 1024 / 1024) + 'MB'
    },
    cors: {
      allowedOrigins: allowedOrigins,
      requestOrigin: origin
    }
  });
});

// ✅ CORS test endpoint
app.get("/api/v1/cors-test", (req, res) => {
  const origin = req.headers.origin;
  console.log("🧪 CORS test from origin:", origin);
  
  res.json({
    message: "CORS test successful! ✅",
    origin: origin,
    timestamp: new Date().toISOString(),
    server: "Backend API",
    cors_headers: {
      'access-control-allow-origin': res.getHeader('Access-Control-Allow-Origin'),
      'access-control-allow-credentials': res.getHeader('Access-Control-Allow-Credentials')
    }
  });
});

// ✅ Placeholder image endpoint (fixes the 404 error)
app.get("/api/v1/placeholder/:width/:height", (req, res) => {
  const { width, height } = req.params;
  const validWidth = Math.min(Math.max(parseInt(width) || 300, 50), 2000);
  const validHeight = Math.min(Math.max(parseInt(height) || 300, 50), 2000);
  
  console.log(`🖼️ Placeholder image request: ${validWidth}x${validHeight}`);
  
  // Generate a simple SVG placeholder
  const svg = `
    <svg width="${validWidth}" height="${validHeight}" xmlns="http://www.w3.org/2000/svg">
      <rect width="100%" height="100%" fill="#f3f4f6"/>
      <text x="50%" y="50%" font-family="Arial, sans-serif" font-size="16" fill="#6b7280" text-anchor="middle" dy=".3em">
        ${validWidth} × ${validHeight}
      </text>
    </svg>
  `;
  
  res.setHeader('Content-Type', 'image/svg+xml');
  res.setHeader('Cache-Control', 'public, max-age=3600'); // Cache for 1 hour
  res.send(svg);
});

// ✅ API Routes
console.log("🛣️  Registering API routes...");
app.use("/api/v1/users", userRouter);
app.use("/api/v1/videos", videoRouter);
app.use("/api/v1/comments", commentRouter);
console.log("✅ API routes registered successfully");

// ✅ 404 handler for API routes
app.use('/api/*', (req, res) => {
  console.log("❌ 404 - API endpoint not found:", req.method, req.path);
  res.status(404).json({
    error: 'API endpoint not found',
    path: req.path,
    method: req.method,
    timestamp: new Date().toISOString(),
    message: "This endpoint does not exist on the backend API",
    availableEndpoints: {
      "GET /": "API info",
      "GET /api/v1/health": "Health check",
      "GET /api/v1/cors-test": "CORS test",
      "GET /api/v1/placeholder/:width/:height": "Placeholder images",
      "POST /api/v1/users/register": "User registration",
      "POST /api/v1/users/login": "User login",
      "GET /api/v1/users/current-user": "Get current user",
      "POST /api/v1/users/logout": "User logout",
      "POST /api/v1/users/change-password": "Change password",
      "PATCH /api/v1/users/avatar": "Upload avatar",
      "PATCH /api/v1/users/cover-image": "Upload cover image",
      "PATCH /api/v1/users/update-account": "Update account",
      "POST /api/v1/users/refresh-token": "Refresh token",
      "GET /api/v1/users/watch-history": "Get watch history",
      "GET /api/v1/videos": "Get videos",
      "POST /api/v1/videos": "Create video",
      "GET /api/v1/comments": "Get comments",
      "POST /api/v1/comments": "Create comment"
    },
    hint: "Check the API documentation or use the correct HTTP method"
  });
});

// ✅ 404 handler for non-API routes
app.use('*', (req, res) => {
  console.log("❌ 404 - Route not found:", req.method, req.path);
  res.status(404).json({
    error: 'Route not found',
    message: 'This is a backend API server. Frontend is deployed separately.',
    path: req.path,
    method: req.method,
    timestamp: new Date().toISOString(),
    frontend_url: process.env.CORS_ORIGIN || "Configure CORS_ORIGIN environment variable",
    api_base: "/api/v1",
    hint: "Visit the frontend URL to access the website, or use /api/v1/* for API endpoints"
  });
});

// ✅ Global error handler
app.use((err, req, res, next) => {
  console.error('❌ Global Error:', err.message);
  console.error('Stack:', err.stack);
  console.error('Request:', {
    method: req.method,
    path: req.path,
    origin: req.headers.origin,
    userAgent: req.headers['user-agent']?.substring(0, 100)
  });
  
  // CORS errors
  if (err.message && (err.message.includes('CORS') || err.message.includes('Origin'))) {
    return res.status(403).json({
      error: 'CORS Error',
      message: 'Origin not allowed by CORS policy',
      origin: req.headers.origin,
      allowedOrigins: allowedOrigins,
      solution: "Add your frontend URL to the CORS_ORIGIN environment variable"
    });
  }
  
  // Default error response
  const statusCode = err.status || err.statusCode || 500;
  
  res.status(statusCode).json({
    error: statusCode >= 500 ? 'Internal Server Error' : err.message,
    timestamp: new Date().toISOString(),
    path: req.path,
    method: req.method,
    ...(process.env.NODE_ENV !== 'production' && { 
      stack: err.stack,
      details: err.message 
    })
  });
});

console.log("✅ Express application configured successfully");

// ✅ CRITICAL: Make sure this export is at the very end
export { app };