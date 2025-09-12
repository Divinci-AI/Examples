const express = require("express");
const { requireAuth, requireGuest, optionalAuth } = require("../middleware/auth");

const router = express.Router();

/**
 * GET /
 * Home page
 */
router.get('/', optionalAuth, (req, res) => {
  res.render('home', {
    title: 'SSR External Login Demo',
    user: req.session?.user || null
  });
});

/**
 * GET /login
 * Login page
 */
router.get('/login', requireGuest, (req, res) => {
  res.render('login', {
    title: 'Login - SSR Demo',
    error: null,
    username: ''
  });
});

router.get("/full-page-app", optionalAuth, (req, res)=>{
  res.render("full-page-app", {
    title: "Full Page App - SSR Demo",
    user: req.session?.user || null,
    divinciDisplay: false,
  });
});

/**
 * GET /example
 * Public example page
 */
router.get('/example', (req, res) => {
  res.render('example', {
    title: 'Example - SSR Demo',
    user: req.session?.user || null
  });
});

/**
 * GET /protected
 * Protected page with chat
 */
router.get("/protected", requireAuth, async (req, res)=>{
  try {

    const user = req.session.user;
    if(!user) {
      throw new Error("No user in session");
    }

    res.render("protected", {
      title: "Protected Page - SSR Demo",
      user: user,
    });

  }catch(error) {
    console.error("Failed to get Divinci JWT:", error);
    res.render("protected", {
      title: "Protected Page - SSR Demo",
      user: req.session.user,
      error: "Failed to load chat. Please try again.",
    });
  }
});

module.exports = router;
