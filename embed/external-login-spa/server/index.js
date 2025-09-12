const http = require('http');
const app = require('./app');
const config = require('./config');

// Create HTTP server
const server = http.createServer();

// Handle requests with Express app
server.on('request', app);

// Start server
server.listen(config.port, () => {
  console.log(`🚀 SPA External Login Demo Server running on http://localhost:${config.port}`);
  console.log(`📝 Available routes:`);
  console.log(`   • Home: http://localhost:${config.port}/`);
  console.log(`   • Login: http://localhost:${config.port}/login`);
  console.log(`   • Example: http://localhost:${config.port}/example`);
  console.log(`   • Protected: http://localhost:${config.port}/protected`);
  console.log(`📊 API endpoints:`);
  console.log(`   • GET /api/me - Current user info`);
  console.log(`   • GET /api/get-jwt - Get Divinci JWT`);
  console.log(`   • POST /auth/login - Login`);
  console.log(`   • POST /auth/logout - Logout`);
  console.log(`   • GET /api/debug/sessions - Debug sessions`);
  console.log(`🔑 Test users:`);
  console.log(`   • alice / password123`);
  console.log(`   • bob / secret456`);
  console.log(`   • charlie / test789`);
});

// Graceful shutdown
process.on('SIGTERM', () => {
  console.log('SIGTERM received, shutting down gracefully');
  server.close(() => {
    console.log('Server closed');
    process.exit(0);
  });
});

process.on('SIGINT', () => {
  console.log('SIGINT received, shutting down gracefully');
  server.close(() => {
    console.log('Server closed');
    process.exit(0);
  });
});
