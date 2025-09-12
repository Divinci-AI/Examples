const express = require("express");
const { requireAuth, optionalAuth } = require("../middleware/auth");
const { getDivinciJWT } = require("../divinci");
const config = require("../config");

const router = express.Router();

router.get("/release", (req, res)=>{
  res.json({
    releaseId: config.divinci.releaseId
  });
});

/**
 * GET /api/get-jwt
 * Get fresh Divinci JWT for current user
 */
router.get("/get-jwt", requireAuth, async (req, res)=>{
  try {
    const user = req.user;

    const jwt = await getDivinciJWT(
      user.id,
      user.name,
      user.picture
    );

    res.json({
      jwt: jwt,
      user: {
        id: user.id,
        name: user.name,
        picture: user.picture
      }
    });

  }catch(error) {
    console.error("Failed to get JWT:", error);
    res.status(500).json({
      error: "Failed to get authentication token",
      details: error.message
    });
  }
});


/**
 * GET /api/debug/tokens
 * Debug endpoint to see current token info
 */
router.get("/debug/tokens", optionalAuth, (req, res)=>{
  res.json({
    currentUser: req.user || null,
    tokenPresent: !!req.headers.authorization,
    timestamp: new Date().toISOString()
  });
});

module.exports = router;
