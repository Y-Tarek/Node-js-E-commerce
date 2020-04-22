const mongoose = require('mongoose');
const OrderSchema = new mongoose.Schema({
 title:{
        type:String,
        required:true,
        trim:true
    },
 description:{
        type:String,
        required:true,
        trim:true
 },

 quantity:{
        type:Number,
        required:true
 },
 
 unit_price:{
        type:Number,
        required:true,

  },

 _creator:{
        type:mongoose.Schema.Types.ObjectId,
        required:true
 },

 final_price:{
        type:Number,
        required:true
  },

 status:{
        type:String,
        required:true,
        default:'pending',
        enum:['pending','accepted','canceled','delivered']
  },
   created_at:{
       type:String,
       required:true,
       default:new Date().toISOString().slice(0,10)
   }

});

const Order = mongoose.model('orders',OrderSchema);
module.exports = {Order}