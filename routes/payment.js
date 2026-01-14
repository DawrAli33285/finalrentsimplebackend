const router=require('express').Router();
const {storeBilling,updatePaymentMethod,pauseBilling,resumeBilling}=require('../controller/payment')
const {Auth}=require('../middleware/auth')

router.post('/resumeBilling',Auth,resumeBilling)
router.post('/storeBilling',Auth,storeBilling)
router.patch('/updatePaymentMethod',Auth,updatePaymentMethod)
router.patch('/pauseBilling',Auth,pauseBilling)


module.exports=router;