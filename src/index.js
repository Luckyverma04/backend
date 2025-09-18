import dotenv from "dotenv";

// ✅ Load environment variables first
dotenv.config({ path: "./.env" });

import { DB_NAME } from "./constants.js";
import connectDB from "./db/index.js";
import { app } from "./app.js";

// ✅ Use PORT from environment (Render provides this automatically)
const PORT = process.env.PORT || 8000;
const NODE_ENV = process.env.NODE_ENV || "production";

console.log("🚀 Starting Patel Crop Products Backend Server...");
console.log(`📍 Environment: ${NODE_ENV}`);
console.log(`🔌 Port: ${PORT}`);
console.log(`📊 Database: ${DB_NAME}`);
console.log(`🌐 Frontend URL: ${process.env.CORS_ORIGIN || 'Not configured'}`);

// ✅ Environment validation
const requiredEnvVars = [
  'MONGODB_URI',
  'ACCESS_TOKEN_SECRET',
  'REFRESH_TOKEN_SECRET'
];

const optionalEnvVars = [
  'CORS_ORIGIN',
  'ACCESS_TOKEN_EXPIRY',
  'REFRESH_TOKEN_EXPIRY',
  'CLOUDINARY_CLOUD_NAME',
  'CLOUDINARY_API_KEY', 
  'CLOUDINARY_API_SECRET',
  'EMAIL_USER',
  'EMAIL_PASS'
];

console.log("🔍 Checking environment variables...");
requiredEnvVars.forEach(varName => {
  if (!process.env[varName]) {
    console.error(`❌ Required environment variable ${varName} is not set`);
    process.exit(1);
  } else {
    console.log(`✅ ${varName}: Configured`);
  }
});

optionalEnvVars.forEach(varName => {
  if (process.env[varName]) {
    console.log(`✅ ${varName}: Configured`);
  } else {
    console.log(`⚠️ ${varName}: Not configured (optional)`);
  }
});

// ✅ Graceful shutdown handling
let server;

const gracefulShutdown = (signal) => {
  console.log(`\n🔄 Received ${signal}. Starting graceful shutdown...`);
  
  if (server) {
    server.close((err) => {
      if (err) {
        console.error("❌ Error during server shutdown:", err);
        process.exit(1);
      }
      console.log("✅ HTTP server closed gracefully");
      console.log("👋 Goodbye!");
      process.exit(0);
    });
    
    // Force shutdown after 30 seconds
    setTimeout(() => {
      console.error("⚠️ Forced shutdown after 30 seconds timeout");
      process.exit(1);
    }, 30000);
  } else {
    console.log("✅ No server to close");
    process.exit(0);
  }
};

// ✅ Global error handlers
process.on("uncaughtException", (error) => {
  console.error("💥 Uncaught Exception:", error.message);
  console.error("Stack:", error.stack);
  console.error("⚠️ This is a critical error. Server will exit.");
  process.exit(1);
});

process.on("unhandledRejection", (reason, promise) => {
  console.error("💥 Unhandled Promise Rejection at:", promise);
  console.error("Reason:", reason);
  console.error("⚠️ This might cause memory leaks. Server will exit.");
  process.exit(1);
});

// ✅ Graceful shutdown signals (important for Render)
process.on("SIGTERM", () => gracefulShutdown("SIGTERM"));
process.on("SIGINT", () => gracefulShutdown("SIGINT"));

// ✅ Start server function
const startServer = async () => {
  try {
    console.log("🔗 Attempting database connection...");
    
    // Connect to database with retry logic
    let dbConnected = false;
    let retryCount = 0;
    const maxRetries = 5;
    
    while (!dbConnected && retryCount < maxRetries) {
      try {
        await connectDB();
        dbConnected = true;
        console.log("✅ Database connected successfully!");
      } catch (error) {
        retryCount++;
        console.error(`❌ Database connection attempt ${retryCount} failed:`, error.message);
        
        if (retryCount < maxRetries) {
          console.log(`🔄 Retrying in 5 seconds... (${retryCount}/${maxRetries})`);
          await new Promise(resolve => setTimeout(resolve, 5000));
        } else {
          throw new Error(`Failed to connect to database after ${maxRetries} attempts`);
        }
      }
    }
    
    // ✅ Start HTTP server - CRITICAL: Bind to 0.0.0.0 for Render
    server = app.listen(PORT, '0.0.0.0', () => {
      console.log("\n🎉 ========================================");
      console.log("🎉 SERVER STARTED SUCCESSFULLY!");
      console.log("🎉 ========================================");
      console.log(`🌐 Server URL: http://0.0.0.0:${PORT}`);
      console.log(`📡 API Base URL: http://0.0.0.0:${PORT}/api/v1`);
      console.log(`🏥 Health Check: http://0.0.0.0:${PORT}/api/v1/health`);
      console.log(`🧪 CORS Test: http://0.0.0.0:${PORT}/api/v1/cors-test`);
      
      if (process.env.RENDER_EXTERNAL_URL) {
        console.log(`🔗 Render URL: ${process.env.RENDER_EXTERNAL_URL}`);
        console.log(`🔗 API URL: ${process.env.RENDER_EXTERNAL_URL}/api/v1`);
      }
      
      if (process.env.CORS_ORIGIN) {
        console.log(`🖥️ Frontend: ${process.env.CORS_ORIGIN}`);
      }
      
      console.log("🎉 ========================================");
      
      if (NODE_ENV === 'development') {
        console.log("🔧 Development mode enabled");
        console.log(`🔗 Local access: http://localhost:${PORT}`);
      } else {
        console.log("🚀 Production mode - Ready to serve requests!");
      }
    });
    
    // ✅ Server configuration for Render
    server.timeout = 120000; // 2 minutes
    server.keepAliveTimeout = 120000; // 2 minutes  
    server.headersTimeout = 120000; // 2 minutes
    server.requestTimeout = 120000; // 2 minutes
    
    // ✅ Server error handling
    server.on("error", (error) => {
      console.error("❌ Server startup error:", error.message);
      
      if (error.code === "EADDRINUSE") {
        console.error(`❌ Port ${PORT} is already in use`);
        console.log("💡 Solutions:");
        console.log("   - Kill the process using this port");
        console.log("   - Use a different PORT environment variable");
        console.log(`   - Run: lsof -ti:${PORT} | xargs kill -9`);
      } else if (error.code === "EACCES") {
        console.error(`❌ Permission denied for port ${PORT}`);
        console.log("💡 Try using a port number greater than 1024");
      } else if (error.code === "ENOTFOUND") {
        console.error("❌ Network/DNS lookup failed");
        console.log("💡 Check your internet connection and DNS settings");
      }
      
      process.exit(1);
    });
    
    // Handle server close event
    server.on("close", () => {
      console.log("🔒 HTTP server has been closed");
    });
    
    // ✅ Log server metrics every 5 minutes in production
    if (NODE_ENV === 'production') {
      setInterval(() => {
        const memUsage = process.memoryUsage();
        console.log(`📊 Server metrics - Uptime: ${Math.floor(process.uptime())}s, Memory: ${Math.round(memUsage.heapUsed/1024/1024)}MB`);
      }, 300000); // 5 minutes
    }
    
  } catch (error) {
    console.error("💥 Failed to start server:", error.message);
    console.error("Stack trace:", error.stack);
    
    // Specific error handling with solutions
    if (error.name === "MongooseServerSelectionError" || error.message.includes("ENOTFOUND")) {
      console.log("\n💡 DATABASE CONNECTION FAILED - Check:");
      console.log("   ✓ MONGODB_URI is correctly set in environment variables");
      console.log("   ✓ MongoDB Atlas cluster is running");
      console.log("   ✓ IP address is whitelisted (use 0.0.0.0/0 for all IPs)");
      console.log("   ✓ Database user has proper permissions");
      console.log("   ✓ Network connectivity is working");
    } else if (error.message.includes("authentication failed")) {
      console.log("\n💡 AUTHENTICATION FAILED - Check:");
      console.log("   ✓ Database username and password are correct");
      console.log("   ✓ User exists in MongoDB Atlas");
      console.log("   ✓ Connection string format is correct");
    } else if (error.code === "ENOTFOUND") {
      console.log("\n💡 NETWORK ERROR - Check:");
      console.log("   ✓ Internet connection is working");
      console.log("   ✓ DNS resolution is working");
      console.log("   ✓ Firewall is not blocking connections");
    }
    
    console.log("\n🔧 Environment variables check:");
    console.log(`   MONGODB_URI: ${process.env.MONGODB_URI ? 'Set' : 'NOT SET'}`);
    console.log(`   ACCESS_TOKEN_SECRET: ${process.env.ACCESS_TOKEN_SECRET ? 'Set' : 'NOT SET'}`);
    console.log(`   REFRESH_TOKEN_SECRET: ${process.env.REFRESH_TOKEN_SECRET ? 'Set' : 'NOT SET'}`);
    console.log(`   CORS_ORIGIN: ${process.env.CORS_ORIGIN || 'Not set'}`);
    console.log(`   NODE_ENV: ${NODE_ENV}`);
    console.log(`   PORT: ${PORT}`);
    
    process.exit(1);
  }
};

// ✅ Startup banner
console.log(`
╔══════════════════════════════════════════╗
║        PATEL CROP PRODUCTS BACKEND       ║
║              Starting Server...          ║
╚══════════════════════════════════════════╝
`);

// ✅ Start the application
startServer().catch((error) => {
  console.error("💥 Application startup failed:", error.message);
  console.error("💥 Stack:", error.stack);
  process.exit(1);
});