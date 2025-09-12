const express = require('express');
const { requireAuth } = require('../middleware/auth');
const { getDivinciJWT } = require('../divinci');

const router = express.Router();

/**
 * GET /api/get-jwt
 * Get fresh Divinci JWT for current user
 */
router.get('/get-jwt', requireAuth, async (req, res) => {
  try {
    const user = req.session.user;
    
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
    
  } catch (error) {
    console.error('Failed to get JWT:', error);
    res.status(500).json({
      error: 'Failed to get authentication token',
      details: error.message
    });
  }
});


module.exports = router;
