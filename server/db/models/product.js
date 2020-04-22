const mongoose = require('mongoose');
const ProductSchema = new mongoose.Schema({
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

price:{
        type:Number,
        required:true,
        default:0.0
    },

category:{
        type:mongoose.Schema.Types.ObjectId,
        required:true
    },

quantity:{
        type:Number,
        required:true
    },

main_images:{
        type:String,
        required:true,
    },

main_images_url:{
        type:String,
        required:true,
    },
    
location:{
        type:String,
        required:true
    }

});

const Product = mongoose.model('products',ProductSchema);
module.exports = {Product};