const express = require("express");
const jwt = require("jsonwebtoken");
const users = require("../databases/users.json");
const config = require("../config");
const { requireGuest, optionalAuth, requireAuth } = require("../middleware/auth");

const router = express.Router();

/**
 * POST /auth/
 * Authenticate user with username/password
 */
router.post("/", requireGuest, express.json(), (req, res)=>{
  const { username, password } = req.body;

  if(!username || !password) {
    return res.status(400).json({
      error: "Username and password are required"
    });
  }

  // Find user in our "database"
  const user = users.find(u=>u.username === username && u.password === password);

  if(!user) {
    return res.status(401).json({
      error: "Invalid username or password"
    });
  }

  // Create JWT token
  const userPayload = {
    id: user.id,
    username: user.username,
    name: user.name,
    picture: user.picture
  };

  const token = jwt.sign(userPayload, config.sessionSecret, {
    expiresIn: "24h"
  });

  res.json({
    success: true,
    user: userPayload,
    token: token,
    message: "Login successful"
  });
});

router.get("/", optionalAuth, (req, res)=>{
  if(req.user) {
    res.json({
      user: req.user,
      authenticated: true
    });
  } else {
    res.json({
      user: null,
      authenticated: false
    });
  }
});

router.get("/refresh", requireAuth, (req, res)=>{

  const token = jwt.sign(req.user, config.sessionSecret, {
    expiresIn: "24h"
  });

  res.json({
    success: true,
    user: req.user,
    token: token,
    message: "Refresh successful"
  });
});

/**
 * DELETE /auth/
 * Destroy user session
 */
router.delete("/", (_req, res)=>{
  // With JWT, logout is handled client-side by removing the token
  // Server doesn't need to track anything
  res.json({
    success: true,
    message: "Logout successful"
  });
});

module.exports = router;
