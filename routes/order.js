const router=require('express').Router();
const {createOrder,contactSupport,getRecentOrder,verifyCalandar}=require('../controller/order')
const {Auth}=require('../middleware/auth')
router.post('/createOrder',Auth,createOrder)
router.get('/verifyCalandar',Auth,verifyCalandar)
router.get('/getRecentOrder',Auth,getRecentOrder)
router.post('/contactSupport',contactSupport)
module.exports=router;