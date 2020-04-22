const {User} = require('../db/models/user');
var authinticate = function(req,res,next){
    var header = req.header('Authorization');
     if(!header){
         return res.status(401).send();
     }
    var token = req.header('Authorization').split(' ')[1];
    User.findByToken(token).then((user) => {
        if(!user){
            return Promise.reject();
        }
        req.user = user;
        req.token = token;
        next();
    }).catch((e) => {res.status(401).send(e)})
}
module.exports = {authinticate};