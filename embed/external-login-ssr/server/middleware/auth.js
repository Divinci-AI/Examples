/**
 * Middleware to require authentication
 */
function requireAuth(req, res, next) {
  if (!req.session || !req.session.user) {
    return res.redirect('/login');
  }
  next();
}

/**
 * Middleware to add user info to request if authenticated
 */
function optionalAuth(req, res, next) {
  // User info is already available in req.session.user if logged in
  next();
}

/**
 * Middleware to prevent access for already authenticated users
 */
function requireGuest(req, res, next) {
  if (req.session && req.session.user) {
    return res.redirect('/');
  }
  next();
}

module.exports = {
  requireAuth,
  optionalAuth,
  requireGuest
};
