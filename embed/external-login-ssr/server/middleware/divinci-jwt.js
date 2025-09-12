const { getDivinciJWT } = require("../divinci");

module.exports = async function getDivinciUser(req, res, next){
  res.locals.divinciUserToken = null;
  try {
    if(req.session && req.session.user) {
      res.locals.divinciUserToken = await getDivinciJWT(req.session.user);
    }
    next();
  }catch(e){
    next(e);
  }
};
