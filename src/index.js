// src/index.js
import app from "./app.js"; // ✅ Changed to default import

const PORT = process.env.PORT || 8000;

// ✅ Start server
const startServer = async () => {
  try {
    console.log("🔥 Starting server...");
    console.log(`📍 Environment: ${process.env.NODE_ENV || 'development'}`);
    console.log(`🌐 Port: ${PORT}`);
    
    app.listen(PORT, '0.0.0.0', () => {
      console.log(`✅ Server running on port ${PORT}`);
      console.log(`🔗 Local: http://localhost:${PORT}`);
      console.log(`🔗 Network: http://0.0.0.0:${PORT}`);
      console.log("🧪 Test URL: http://localhost:" + PORT + "/api/v1/test");
    });
    
  } catch (error) {
    console.error("💥 Failed to start server:", error);
    process.exit(1);
  }
};

// Handle graceful shutdown
process.on('SIGTERM', () => {
  console.log('👋 SIGTERM received, shutting down gracefully');
  process.exit(0);
});

process.on('SIGINT', () => {
  console.log('👋 SIGINT received, shutting down gracefully');
  process.exit(0);
});

// Start the server
startServer();