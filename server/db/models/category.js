var mongoose = require('mongoose');
const CategoryScehma = new mongoose.Schema({
 name:{
        type:String,
        required:true,
        trim:true
    },
    
});

const Categories = mongoose.model("categories",CategoryScehma);
module.exports = {Categories}