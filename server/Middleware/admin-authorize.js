const {authinticate} = require('./authinticate');
var authorizeAdmin = function(req,res,next){

  if(req.user.role == 'admin'){
      next()
  }else{
     return res.status(403).send();
  }
}
module.exports = {authorizeAdmin};