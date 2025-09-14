import dotenv from "dotenv";

// ✅ Load environment variables first
dotenv.config({ path: "./.env" });

import { DB_NAME } from "./constants.js";
import connectDB from "./db/index.js";
import { app } from "./app.js";

const PORT = process.env.PORT || 10000; // Use 10000 for Render
const NODE_ENV = process.env.NODE_ENV || "development";

console.log("🚀 Starting server initialization...");
console.log(`📍 Environment: ${NODE_ENV}`);
console.log(`🔌 Port: ${PORT}`);
console.log(`📊 Database: ${DB_NAME}`);

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
      console.log("✅ HTTP server closed.");
      process.exit(0);
    });
    
    // Force shutdown after 30 seconds
    setTimeout(() => {
      console.error("⚠️ Forced shutdown after 30 seconds");
      process.exit(1);
    }, 30000);
  } else {
    process.exit(0);
  }
};

// ✅ Global error handlers
process.on("uncaughtException", (error) => {
  console.error("💥 Uncaught Exception:", error.message);
  console.error("Stack:", error.stack);
  process.exit(1);
});

process.on("unhandledRejection", (reason, promise) => {
  console.error("💥 Unhandled Rejection at:", promise);
  console.error("Reason:", reason);
  process.exit(1);
});

// ✅ Graceful shutdown signals
process.on("SIGTERM", () => gracefulShutdown("SIGTERM"));
process.on("SIGINT", () => gracefulShutdown("SIGINT"));

// ✅ Start server function
const startServer = async () => {
  try {
    console.log("🔗 Connecting to database...");
    
    // Connect to database
    await connectDB();
    console.log("✅ Database connected successfully");
    
    // Start HTTP server - CRITICAL: Bind to 0.0.0.0 for Render
    server = app.listen(PORT, '0.0.0.0', () => {
      console.log("🎉 Server is running successfully!");
      console.log(`🌐 Server URL: http://0.0.0.0:${PORT}`);
      console.log(`📡 API Base: http://0.0.0.0:${PORT}/api/v1`);
      console.log(`🏥 Health Check: http://0.0.0.0:${PORT}/api/v1/health`);
      
      if (NODE_ENV === 'development') {
        console.log("🔧 Development mode - Hot reloading enabled");
        console.log(`🔗 Local: http://localhost:${PORT}`);
      } else {
        console.log("🚀 Production mode - Server ready for requests");
      }
    });
    
    // ✅ Server error handling
    server.on("error", (error) => {
      console.error("❌ Server error:", error.message);
      
      if (error.code === "EADDRINUSE") {
        console.error(`❌ Port ${PORT} is already in use`);
        console.log("💡 Try using a different port or kill the process using this port");
      } else if (error.code === "EACCES") {
        console.error(`❌ Permission denied to bind to port ${PORT}`);
        console.log("💡 Try using a port number greater than 1024");
      } else if (error.code === "ENOTFOUND") {
        console.error("❌ DNS lookup failed");
        console.log("💡 Check your internet connection");
      }
      
      process.exit(1);
    });
    
    // Handle server close
    server.on("close", () => {
      console.log("🔒 HTTP server closed");
    });
    
    // ✅ Server timeout for requests (important for Render)
    server.timeout = 120000; // 2 minutes
    server.keepAliveTimeout = 120000;
    server.headersTimeout = 120000;
    
  } catch (error) {
    console.error("💥 Failed to start server:", error.message);
    console.error("Stack:", error.stack);
    
    // Specific error handling
    if (error.name === "MongooseServerSelectionError") {
      console.log("💡 MongoDB connection failed. Check:");
      console.log("   - MongoDB connection string is correct");
      console.log("   - MongoDB service is running");
      console.log("   - Network connectivity");
    } else if (error.code === "ENOTFOUND") {
      console.log("💡 DNS resolution failed. Check your internet connection");
    } else if (error.name === "ValidationError") {
      console.log("💡 Environment validation failed. Check your .env file");
    }
    
    process.exit(1);
  }
};

// ✅ Start the application
console.log("⚡ Initializing application...");
startServer().catch((error) => {
  console.error("💥 Application startup failed:", error);
  process.exit(1);
});