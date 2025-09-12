const jwt = require("jsonwebtoken");
const config = require("../config");

/**
 * Middleware to require authentication
 */
function requireAuth(req, res, next){
  const authHeader = req.headers.authorization;

  if(!authHeader || !authHeader.startsWith("Bearer ")) {
    return res.status(401).json({
      error: "Authentication required",
      redirectTo: "/login"
    });
  }

  const token = authHeader.substring(7); // Remove "Bearer " prefix

  try {
    const decoded = jwt.verify(token, config.sessionSecret);
    req.user = decoded; // Add user info to request
    next();
  }catch(error) {
    return res.status(401).json({
      error: "Invalid or expired token",
      redirectTo: "/login"
    });
  }
}

/**
 * Middleware to add user info to request if authenticated
 */
function optionalAuth(req, _res, next){
  const authHeader = req.headers.authorization;
  if(!authHeader || !authHeader.startsWith("Bearer ")) {
    req.user = null;
    return next();
  }


  const token = authHeader.substring(7);

  try {
    const decoded = jwt.verify(token, config.sessionSecret);
    req.user = decoded;
  }catch(error) {
    // Invalid token, but this is optional auth so continue
    req.user = null;
  }

  next();
}

/**
 * Middleware to prevent access for already authenticated users
 */
function requireGuest(req, res, next){
  const authHeader = req.headers.authorization;
  if(!authHeader || !authHeader.startsWith("Bearer ")) {
    return next();
  }

  const token = authHeader.substring(7);

  try {
    jwt.verify(token, config.sessionSecret);
    return res.status(400).json({
      error: "Already authenticated",
      redirectTo: "/"
    });
  }catch(error) {
    // Invalid token, user is effectively a guest
  }

  next();
}

module.exports = {
  requireAuth,
  optionalAuth,
  requireGuest
};
