const express = require("express");
const session = require("express-session");
const path = require("path");
const config = require("./config");


const app = express();

const EJS_LOCAL_CONSTANTS = require("./databases/local-constants");
Object.assign(app.locals, EJS_LOCAL_CONSTANTS);

// View engine setup
app.set("view engine", "ejs");
app.set("views", path.join(__dirname, "../views"));

// Body parsing will be done per-route as needed

// Serve static files
app.use("/static", express.static(path.join(__dirname, "../public")));

// Session configuration
app.use(session({
  secret: config.sessionSecret,
  resave: false,
  saveUninitialized: false,
  cookie: {
    secure: false, // Set to true in production with HTTPS
    httpOnly: true,
    maxAge: 24 * 60 * 60 * 1000 // 24 hours
  }
}));
const getDivinciUser = require("./middleware/divinci-jwt");
app.use(getDivinciUser);

// Store returnTo URL for redirects after login
app.use((req, res, next)=>{
  if(!req.session.user && req.method === "GET" && req.path !== "/login" && req.path !== "/" && !req.path.startsWith("/api")) {
    req.session.returnTo = req.originalUrl;
  }
  next();
});

// Routes
const authRoutes = require("./routes/auth");
const apiRoutes = require("./routes/api");
const pageRoutes = require("./routes/pages");

app.use("/auth", authRoutes);
app.use("/api", apiRoutes);
app.use("/", pageRoutes);

// Error handling middleware
app.use((err, req, res, next)=>{
  console.error("Server error:", err);
  res.status(500).render("error", {
    title: "Server Error",
    error: process.env.NODE_ENV === "development" ? err : { message: "Something went wrong" },
    user: req.session?.user || null
  });
});

// 404 handler
app.use((req, res)=>{
  res.status(404).render("error", {
    title: "Page Not Found",
    error: { message: "The page you requested could not be found." },
    user: req.session?.user || null
  });
});

module.exports = app;
