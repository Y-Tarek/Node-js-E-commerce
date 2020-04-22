const mongoose = require('mongoose');
const jwt = require('jsonwebtoken');
const validator = require('validator');
const bcrypt = require('bcryptjs');
var UserSchema = new mongoose.Schema({
    UserName:{
            type:String,
            trim:true,
            required:true
        },

    email:{
            type:String,
            required:true,
            trim:true,
            unique:true,
            validate: {
                validator: function(email){
                    return validator.isEmail(email);
                },
                message: '{VALUE} is not a valid email'
            }
        },

     password:{
            type:String,
            trim:true,
            required:true
        },

    role:{
            type:String,
            enum:['user','admin'],
            default:'user'
        },
        
    tokens:[{
            access:{
                type:String,
                required:true
            },
            token:{
                type:String,
                required:true
            }
        }]

});

//Instance methods on UserSchema
UserSchema.methods.generateAuthToken = function(){
    var user = this;
    var access = 'auth';
    var token = jwt.sign({_id:user._id,access:access},process.env.JWT_SECRETE);
    user.tokens.push({
        access:access,
        token:token
    });
    return user.save().then(() => {
        return token;
    });
}

UserSchema.methods.removetoken = function(token){
    var user = this;
   return user.updateOne({
        $pull:{
            tokens:{
                token:token
            }
        }
    });
}

//Model methods on UserSchema

UserSchema.statics.findByCredintials = function(username,email,pass){
    var user = this;
    var con = !username ? {email:email} : {UserName:username}
  return  user.findOne(con).then((user) => {
        if(!user){
            return Promise.reject();
        }
        return new Promise((resolve,reject)=>{
            bcrypt.compare(pass,user.password,(err,res) => {
              if(res){
                resolve(user);
              }else{
                reject();
              }
            })
          })
    })
    
};

UserSchema.statics.findByToken = function(token){
    var user = this;
    var decoded;
    try{
      decoded = jwt.verify(token,process.env.JWT_SECRETE);
    }
    catch(e){
        console.log(e);
        return Promise.reject();
    }
    return user.findOne({
        "_id": decoded._id,
        "tokens.token":token,
        "tokens.access":'auth'
    })
}

//Password hashing Middleaware
UserSchema.pre('save',function(next)  {
    var user = this;
    if(user.isModified('password')){
        bcrypt.genSalt(10,(err,salt) => {
            bcrypt.hash(user.password,salt,(err,hash) => {
                user.password = hash;
                next();
            });
        })
    }else{
        next();
    }
});

var User = mongoose.model('users',UserSchema);
module.exports = {User};