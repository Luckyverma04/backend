import dotenv from "dotenv";

// ✅ Load environment variables first
dotenv.config({ path: "./.env" });

import { DB_NAME } from "./constants.js";
import connectDB from "./db/index.js";
import { app } from "./app.js";

const PORT = process.env.PORT || 8000;
const NODE_ENV = process.env.NODE_ENV || "development";

// ✅ Graceful shutdown handling
const gracefulShutdown = (signal) => {
  console.log(`\n🔄 Received ${signal}. Starting graceful shutdown...`);
  
  if (server) {
    server.close((err) => {
      if (err) {
        console.error("❌ Error during server shutdown:", err);
        process.exit(1);
      }
      
      console.log("✅ HTTP server closed.");
      console.log("👋 Graceful shutdown completed.");
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
  console.error("💥 Uncaught Exception:", error);
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

let server;

// ✅ Database connection and server startup
const startServer = async () => {
  try {
    console.log("🚀 Starting server initialization...");
    console.log(`🌍 Environment: ${NODE_ENV}`);
    console.log(`📊 Database: ${DB_NAME}`);
    
    // Connect to database
    await connectDB();
    console.log("✅ Database connected successfully");
    
    // Start HTTP server
    server = app.listen(PORT, () => {
      console.log(`🎉 Server is running successfully!`);
      console.log(`🔗 Local: http://localhost:${PORT}`);
      console.log(`📡 API Base: http://localhost:${PORT}/api/v1`);
      console.log(`🏥 Health Check: http://localhost:${PORT}/api/v1/health`);
      
      if (NODE_ENV === 'development') {
        console.log("🔧 Development mode - Hot reloading enabled");
      }
    });
    
    // Handle server-specific errors
    server.on("error", (error) => {
      if (error.code === "EADDRINUSE") {
        console.error(`❌ Port ${PORT} is already in use`);
        console.log("💡 Try using a different port or kill the process using this port");
      } else if (error.code === "EACCES") {
        console.error(`❌ Permission denied to bind to port ${PORT}`);
        console.log("💡 Try using a port number greater than 1024 or run with sudo");
      } else {
        console.error("❌ Server error:", error);
      }
      process.exit(1);
    });
    
    // Handle server close
    server.on("close", () => {
      console.log("🔒 HTTP server closed");
    });
    
  } catch (error) {
    console.error("💥 Failed to start server:", error);
    console.error("Stack:", error.stack);
    
    // Specific error handling
    if (error.name === "MongooseServerSelectionError") {
      console.log("💡 Make sure MongoDB is running and the connection string is correct");
    } else if (error.code === "ENOTFOUND") {
      console.log("💡 Check your internet connection and database URL");
    }
    
    process.exit(1);
  }
};

// ✅ Start the application
startServer();