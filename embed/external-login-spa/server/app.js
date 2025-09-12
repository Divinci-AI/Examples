const express = require("express");

const app = express();

// Routes
const authRoutes = require("./routes/auth");
const divinciRoutes = require("./routes/divinci");
const staticRoutes = require("./routes/static");

app.use("/api/auth", authRoutes);
app.use("/api/divinci", divinciRoutes);
app.use("/", staticRoutes); // Static routes last (includes SPA fallback)

// Error handling middleware
app.use((err, req, res, next)=>{
  console.error("Server error:", err);
  res.status(500).json({
    error: "Internal server error",
    message: process.env.NODE_ENV === "development" ? err.message : "Something went wrong"
  });
});

// 404 handler for API routes
app.use("/api/*", (req, res)=>{
  res.status(404).json({
    error: "API endpoint not found"
  });
});

module.exports = app;
