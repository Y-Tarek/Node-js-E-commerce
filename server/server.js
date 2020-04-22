const express = require('express');
const config = require('./config/config');
const  mongoose  = require('./db/mongoose');
const {authinticate} = require('./Middleware/authinticate');
const {authorizeAdmin} = require('./Middleware/admin-authorize');
const bodyparser = require('body-parser');
const {ObjectId} = require('mongodb');
const {User} = require('./db/models/user');
const {Order} = require('./db/models/order');
const {Categories} = require('./db/models/category');
const {Product} = require('./db/models/product');
const path = require('path');
const _ = require('lodash');
const cors = require('cors');
const store = require('./playgroud/multer');
const upload = store.upload_images('./uploads');
const ip = require('ip');
const address = ip.address();
var fullAddress;
require('express-group-routes');
const app = express();

app.use(bodyparser.json());
app.use(express.static('uploads'));

//Guest Routes
app.group("/api/guest",(router) => {
    router.post('/register',(req,res) => {
        var body = _.pick(req.body,['UserName','email','password','role']);
        if(req.body.confirm_password != body.password ){
            return res.status(400).send("passwords doesnot matches");
        }
        var user = new User(body);
        user.save().then(() => {
            return user.generateAuthToken()
        }).then((token) => {
            res.header('Authorization', 'Bearer'+token).status(200).send(user);
        }).catch((e) => {res.status(400).send(e)})
    });

    router.post('/login',(req,res) => {
        var body = _.pick(req.body,['UserName','email','password']);
        User.findByCredintials(body.UserName,body.email,body.password).then((user) => {
            return user.generateAuthToken().then((token) => {
                res.header('Authorization','Bearer'+token).status(200).send(user)
            })
        }).catch((e) => {res.status(404).send(e)})
    });
});


//Authintication Routes
app.group('/api/auth',(router) => {
    router.post('/logout',authinticate,(req,res) => {
        var user = req.user;
         user.removetoken(req.token).then(() => {
            res.status(200).send()
        })
    });

    router.post('/order',authinticate,(req,res) => {
      var order = new Order({
          title:req.body.title,
          description:req.body.description,
          quantity:req.body.quantity,
          unit_price:req.body.unit_price,
          final_price:req.body.quantity * req.body.unit_price,
          _creator:req.user._id
      });

      order.save().then((result) => {
          res.status(200).send(result);
      }).catch((e) => {res.status(400).send(e)})

    });

    router.post('/order/cancel/:id',authinticate,(req,res) => {
      var id = req.params.id;
       if(!ObjectId.isValid(id)){
           return res.status(404).send();
       }
       Order.findOneAndUpdate({_id:id,_creator:req.user._id},{$set:{status:'canceled'}},{new:true}).then((order)=>{
         if(!order){
             return res.status(404).send();
         }
         res.status(200).send();
       }).catch((e) => {res.status(400).send(e)})

    });

    router.get('/categories',authinticate,(req,res) => {
       Categories.find().then((result) => {
           if(!res){
               return res.status(404).send();
           }
           res.status(200).send(result);
       }).catch((e) => {res.status(400).send(e)})
    });
    
    router.get('/products',authinticate,(req,res) => {
        Product.find().then((result) => {
            if(!res){
                return res.status(404).send();
            }
            res.status(200).send(result);
        }).catch((e) => {res.status(400).send(e)})
     });

    router.get('/category/:id',authinticate,(req,res) => {
        var id = req.params.id;
         if(!ObjectId.isValid(id)){
             return res.status(404).send();
         }
         Categories.findOne({_id:id}).then((data) => {
             if(!data){
                 return res.status(404).send();
             }
             res.status(200).send(data);
         }).catch((e) => {res.status(400).send()})
    });

    router.get('/product/:id',authinticate,(req,res) => {
        var id = req.params.id;
         if(!ObjectId.isValid(id)){
             return res.status(404).send();
         }
         Product.findOne({_id:id}).then((data) => {
             if(!data){
                 return res.status(404).send();
             }
             res.status(200).send(data);
         }).catch((e) => {res.status(400).send()})
    });

    router.get('/product/quantity/:id',authinticate,(req,res) => {
        var id = req.params.id;
         if(!ObjectId.isValid(id)){
             return res.status(404).send();
         }
         Product.find({_id:id},'quantity').then((data) => {
             if(!data){
                return res.status(404).send();
             }
             res.status(200).send(data)
         })
    })

});


// Admin Routes
app.group('/api/admin',(router) => {
    router.get('/users',authinticate,authorizeAdmin,(req,res) => {
        return User.find({role:'user'}).then((users) => {
            if(users.length == 0){
                res.status(404).send();
            }
            res.status(200).send(users);
        }).catch((e) => res.status(400).send(e));
    });

    router.get('/orders',authinticate,authorizeAdmin,(req,res) => {
        Order.find().then((result) => {
            if(!res){
                return res.status(404).send();
            }
            res.status(200).send(result);
        }).catch((e) => {res.status(400).send(e)})
    });

    router.post('/category',authinticate,authorizeAdmin,(req,res) => {
    var cat = new Categories({
        name:req.body.name
    });
    cat.save().then(() => {
        res.status(200).send();
    }).catch((e) => {res.status(400).send()});

    });

    router.post('/product',authinticate,authorizeAdmin,upload.array('',12),(req,res) => {
    if(!req.files){
        res.status(400).send("PLease upload photos")
    }
        var data = req.files.map(p => ({img:p.path,url:fullAddress+'/'+path.basename(p.path)}));
        var images = data.map(i => i.img).join('|');
        var urls = data.map(i => i.url).join('|');
        var product = new Product({
        title:req.body.title,
        description:req.body.description,
        price:req.body.price,
        quantity:req.body.quantity,
        category:req.body.category,
        main_images:images,
        main_images_url:urls,
        location:req.body.location
    });
    product.save().then((result) => {
        res.status(200).send(result);
    }).catch((e) => {res.status(400).send(e)})
        
    });

    router.post('/category/delete/:id',authinticate,authorizeAdmin,(req,res) => {
    var id = req.params.id;
        if(!ObjectId.isValid(id)){
            return res.status(404).send();
        }
        Categories.findOneAndDelete({_id:id}).then(() => {
            Product.findOneAndDelete({category:id}).then(() => {
                res.status(200).send();
            }).catch((e) => {res.status(400).send(e)})
        }).catch((e) => {res.status(400).send(e)})
    });

    router.post('/product/delete/:id',authinticate,authorizeAdmin,(req,res) => {
        var id = req.params.id;
        if(!ObjectId.isValid(id)){
            return res.status(404).send();
        }
        Product.findOneAndDelete({_id:id}).then(() => {
            res.status(200).send();
        }).catch((e) => {res.status(400).send(e)})
    });

    router.post('/user/delete/:id',authinticate,authorizeAdmin,(req,res) => {
        var id = req.params.id;
        if(!ObjectId.isValid(id)){
            return res.status(404).send();
        }
        User.findOneAndDelete({_id:id}).then(() => {
            Product.findOneAndDelete({_id:id}).then(() => {
                res.status(200).send();
            }).catch((e) => {res.status(400).send(e)})
        }).catch((e) => {res.status(400).send(e)})
    });

    router.post('/order/delete/:status',authinticate,authorizeAdmin,(req,res) => {
     Order.deleteMany({status:req.params.status}).then((result) => {
         if(!result){
             return res.status(404).send();
         }
          res.status(200).send();
       }).catch((e) => {res.status(400).send(e)})
    });

    router.post('/order/change/status/:id',authinticate,authorizeAdmin,(req,res) => {
      var body = _.pick(req.body,['status']),
          id = req.params.id;
        if(!ObjectId.isValid(id)){
            return res.status(404).send();
        }
         Order.findOneAndUpdate({_id:id},{$set:body},{new:true}).then((order)=>{
             if(!order){
                 return res.status(404).send();
             }
              if(order.status == 'accepted'){
                  Product.findOneAndUpdate({title:order.title},{$inc:{quantity:-order.quantity}},{new:true}).then((p) =>{
                      if(!p){
                          return res.status(404).send();
                      }
                  }).catch((e) =>{res.status(400).send(e)})
              }
             res.status(200).send();
         }).catch((e) => {res.status(400).send(e)})
    });

});


//public Routes
app.group('/api/public',(router) => {
  router.post('/image',upload.single(''),(req,res) => {
      if(!req.file){
          res.status(404).send();
      }
      res.send(req.file)
  });

})




app.listen(process.env.PORT,address,(e) => {
    if(e){
        console.log(e);
    }
  fullAddress = `http://${address}:${process.env.PORT}`
  console.log(fullAddress);
  
})