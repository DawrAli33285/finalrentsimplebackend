const router=require('express').Router();
const {addItemsToCart,updateTvscreen,getCartItems,removeItemsFromCart,removeFromCart}=require('../controller/cart')
const {Auth}=require('../middleware/auth')
router.post('/addItemsToCart',Auth,addItemsToCart)
router.get('/getCartItems',Auth,getCartItems)
router.delete('/removeFromCart',Auth,removeFromCart)
router.patch('/updateTvscreen',Auth,updateTvscreen)
router.patch('/removeItemsFromCart',Auth,removeItemsFromCart)
module.exports=router;