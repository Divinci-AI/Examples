const express = require('express');
const users = require("../databases/users.json");
const { requireGuest } = require('../middleware/auth');

const router = express.Router();

/**
 * POST /auth/login
 * Authenticate user with username/password
 */
router.post('/login', requireGuest, express.urlencoded({ extended: true }), (req, res) => {
  const { username, password } = req.body;

  if (!username || !password) {
    return res.render('login', {
      error: 'Username and password are required',
      username: username || ''
    });
  }

  // Find user in our "database"
  const user = users.find(u => u.username === username && u.password === password);
  
  if (!user) {
    return res.render('login', {
      error: 'Invalid username or password',
      username: username
    });
  }

  // Create session
  req.session.user = {
    id: user.id,
    username: user.username,
    name: user.name,
    picture: user.picture
  };

  // Redirect to protected page or intended destination
  const redirectTo = req.session.returnTo || '/protected';
  delete req.session.returnTo;
  res.redirect(redirectTo);
});

/**
 * POST /auth/logout
 * Destroy user session
 */
router.post('/logout', (req, res) => {
  if (req.session) {
    req.session.destroy((err) => {
      if (err) {
        console.error('Failed to destroy session:', err);
      }
      res.clearCookie('connect.sid');
      res.redirect('/');
    });
  } else {
    res.redirect('/');
  }
});

module.exports = router;
