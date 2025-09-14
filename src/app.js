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

// ✅ CORS Configuration - Fixed for your domains
const allowedOrigins = [
  "https://patelcropproducts.onrender.com",           // Your frontend
  "https://patelcropproducts-backend.onrender.com",   // Your backend (for testing)
  "http://localhost:3000",                            // Local development
  "http://localhost:5173",                            // Vite dev server
  "http://localhost:3001",                            // Alternative local port
  "http://127.0.0.1:3000",                           // Alternative localhost
  "http://127.0.0.1:5173"                            // Alternative localhost
];

console.log("🌍 Configured CORS origins:", allowedOrigins);

// ✅ CORS Middleware
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
    
    // Log and reject
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
  optionsSuccessStatus: 200 // For legacy browser support
}));

// ✅ Manual CORS headers (backup for Render)
app.use((req, res, next) => {
  const origin = req.headers.origin;
  
  // Log all requests
  console.log(`📨 ${req.method} ${req.path} from ${origin || 'no-origin'}`);
  
  // Set CORS headers for allowed origins
  if (!origin || allowedOrigins.includes(origin)) {
    res.setHeader('Access-Control-Allow-Origin', origin || '*');
    res.setHeader('Access-Control-Allow-Credentials', 'true');
    res.setHeader('Access-Control-Allow-Methods', 'GET,POST,PUT,DELETE,OPTIONS,PATCH');
    res.setHeader('Access-Control-Allow-Headers', 'Origin,X-Requested-With,Content-Type,Accept,Authorization,Cookie');
    res.setHeader('Access-Control-Expose-Headers', 'Set-Cookie');
  }
  
  // Handle preflight requests
  if (req.method === 'OPTIONS') {
    console.log("🔄 Handling preflight request for:", req.path);
    return res.status(200).end();
  }
  
  next();
});

// ✅ Request logging middleware
app.use((req, res, next) => {
  const timestamp = new Date().toISOString();
  console.log(`[${timestamp}] ${req.method} ${req.path}`);
  
  if (req.body && Object.keys(req.body).length > 0) {
    console.log("📝 Request body keys:", Object.keys(req.body));
  }
  
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

// ✅ Static files middleware
app.use(express.static("public"));

// ✅ Root endpoint for testing
app.get('/', (req, res) => {
  console.log("🏠 Root endpoint accessed");
  res.json({
    message: "🎉 Patel Crop Products Backend is running!",
    timestamp: new Date().toISOString(),
    environment: process.env.NODE_ENV || "development",
    version: "1.0.0",
    status: "healthy",
    endpoints: {
      health: "/api/v1/health",
      cors_test: "/api/v1/cors-test",
      users: "/api/v1/users/*",
      videos: "/api/v1/videos/*",
      comments: "/api/v1/comments/*"
    }
  });
});

// ✅ Health check endpoint
app.get("/api/v1/health", (req, res) => {
  const origin = req.headers.origin;
  console.log("🏥 Health check from origin:", origin);
  
  res.status(200).json({ 
    status: "OK", 
    message: "API is working perfectly!",
    timestamp: new Date().toISOString(),
    environment: process.env.NODE_ENV || "development",
    cors: {
      allowedOrigins: allowedOrigins,
      requestOrigin: origin
    },
    server: "Render",
    uptime: process.uptime(),
    memory: process.memoryUsage()
  });
});

// ✅ CORS test endpoint
app.get("/api/v1/cors-test", (req, res) => {
  const origin = req.headers.origin;
  console.log("🧪 CORS test from origin:", origin);
  
  res.json({
    message: "CORS test successful! ✅",
    origin: origin,
    allowedOrigins: allowedOrigins,
    timestamp: new Date().toISOString(),
    headers: {
      'access-control-allow-origin': res.getHeader('Access-Control-Allow-Origin'),
      'access-control-allow-credentials': res.getHeader('Access-Control-Allow-Credentials')
    }
  });
});

// ✅ API Routes
console.log("🛣️  Registering API routes...");
app.use("/api/v1/users", userRouter);
app.use("/api/v1/videos", videoRouter);
app.use("/api/v1/comments", commentRouter);
console.log("✅ API routes registered successfully");

// ✅ Serve static files from dist folder (for production build)
if (process.env.NODE_ENV === 'production') {
  app.use(express.static(path.join(__dirname, "dist")));
  
  // Catch-all handler for SPA routing
  app.get('*', (req, res, next) => {
    // Skip API routes
    if (req.path.startsWith('/api')) {
      return next();
    }
    
    const indexPath = path.join(__dirname, "dist", "index.html");
    res.sendFile(indexPath, (err) => {
      if (err) {
        console.error('Error serving index.html:', err);
        res.status(500).json({ 
          error: 'Internal Server Error',
          message: 'Could not serve static files'
        });
      }
    });
  });
}

// ✅ 404 handler for API routes
app.use('/api/*', (req, res) => {
  console.log("❌ 404 - API endpoint not found:", req.method, req.path);
  res.status(404).json({
    error: 'API endpoint not found',
    path: req.path,
    method: req.method,
    timestamp: new Date().toISOString(),
    availableEndpoints: [
      'GET /',
      'GET /api/v1/health',
      'GET /api/v1/cors-test',
      'POST /api/v1/users/login',
      'POST /api/v1/users/register',
      'GET /api/v1/users/*',
      'GET /api/v1/videos/*',
      'GET /api/v1/comments/*'
    ],
    hint: "Check if your route exists and the HTTP method is correct"
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
      hint: "Make sure your frontend URL is in the allowed origins list"
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

export { app };