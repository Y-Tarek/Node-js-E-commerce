const {Product} = require('./../db/models/product');
getProduct  = async(title) => {
    await Product.find({title:title}, 'quantity').then((res)=>{
         console.log(res);
         
         
     })
        
       return 'j'; 
        
}

getProduct('pc');