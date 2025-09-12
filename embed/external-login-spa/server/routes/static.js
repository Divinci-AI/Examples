const express = require('express');
const path = require('path');

const router = express.Router();

// Serve static files from public directory
router.use(express.static(path.join(__dirname, '../../public')));



// SPA fallback - serve index.html for all non-API routes
router.get('*', (req, res) => {
  res.sendFile(path.join(__dirname, '../../public/index.html'));
});

module.exports = router;
