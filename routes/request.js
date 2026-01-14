const {sendRequestUser,updateDeliveryAddress,getRequestsUser,getRequestsProfileUser,rejectDeliveryAndInstallation,releasePaymentToVendor,approveOfferByUser,getRequestById,rejectRequestOffer,rejectOffer}=require('../controller/request');
const { Auth } = require('../middleware/auth');
const router=require('express').Router();

router.post('/sendRequestUser',Auth,sendRequestUser)
router.get('/getRequestsUser',Auth,getRequestsUser)
router.patch('/rejectOffer/:id',rejectOffer)
router.patch('/rejectRequestOffer/:id',rejectRequestOffer)
router.get('/getRequestById/:id',Auth,getRequestById)
router.post('/approveOfferByUser',Auth,approveOfferByUser)

router.put('/request/:id/delivery-address',updateDeliveryAddress)

router.get('/getRequestsProfileUser',Auth,getRequestsProfileUser)
router.post('/releasePaymentToVendor',releasePaymentToVendor)
router.post('/rejectDeliveryAndInstallation',Auth,rejectDeliveryAndInstallation)
module.exports=router;  