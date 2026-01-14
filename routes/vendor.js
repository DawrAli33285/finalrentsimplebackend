const express = require('express');
const router = express.Router();
const { protect } = require('../middleware/auth');
const {cloudinaryUploadImage}=require('../middleware/cloudinary')
const {approveRequest,rejectRequest,changeVendorPassword,checkStripeAccountStatus,updateDeliveryAddress}=require('../controller/vendor')
const {sendMessage,getConversation,renewListing, generateStripeOnboardingLink ,getVendorRequests,getUser,seenMessages,getConversations,getMessages}=require('../controller/vendor')
const fs = require('fs');
const {
  createListing,
  getVendorListings,
  updateListing,
  deleteListing,
  getVendorListingsFeed,
  updateStatus,
  getDashboardData,
  getListingById    
} = require('../controller/listening');
const {
  createBoost,
  getActiveBoosts
} = require('../controller/boost');
const {
  createPost,
  getFeed
} = require('../controller/community');

const {getVendorInfo,getVendorProfile,updateVendorProfile,getActiveRentals}=require('../controller/vendor')

let upload=require('../middleware/upload')
const {Auth}=require('../middleware/auth')



router.post('/upload-image', upload.single('image'), async (req, res) => {
    try {
      if (!req.file) {
        return res.status(400).json({ error: 'No image file provided' });
      }
  
     
      const result = await cloudinaryUploadImage(req.file.path);
  
      if (fs.existsSync(req.file.path)) {
        fs.unlinkSync(req.file.path);
      }
  
      res.status(200).json({
        success: true,
        url: result.url,
        public_id: result.public_id
      });
  
    } catch (error) {
      console.error('Image upload error:', error);
      
    
      if (req.file && fs.existsSync(req.file.path)) {
        fs.unlinkSync(req.file.path);
      }
      
      res.status(500).json({ 
        error: 'Failed to upload image',
        details: error.message 
      });
    }
  });



router.post('/listings' , Auth,createListing);
router.get('/listings', Auth, getVendorListings);
router.put('/listings/:id', Auth,upload.array('images'),updateListing);
router.delete('/listings/:id', Auth,deleteListing);
router.get('/getVendorInfo/:id',getVendorInfo)

router.post('/boost',  Auth,createBoost);
router.post('/updateStatus',Auth,updateStatus)
router.get('/boosts',  getActiveBoosts);


router.post('/community/posts',Auth,upload.array('images'),createPost);
router.get('/getVendorDashboardData',Auth,getDashboardData)
router.get('/getVendorListingsFeed',Auth,getVendorListingsFeed)
router.get('/getListingById/:id',Auth,getListingById)
router.get('/posts',getFeed)
router.get('/vendor/profile',Auth,getVendorProfile)





router.post('/vendor/sendMessage',Auth,sendMessage)
router.get('/vendor/getMessages/:user',Auth,getMessages)
router.get('/vendor/getConversations',Auth,getConversations)
router.get('/vendor/getConversation/:vendor',Auth,getConversation)
router.get('/vendor/seenMessages/:user',Auth,seenMessages)
router.get('/vendor/getUserInfo/:user',getUser)
router.get('/getVendorRequests',Auth,getVendorRequests)


router.post('/approveRequest', upload.fields([
  { name: 'front', maxCount: 1 },
  { name: 'side', maxCount: 1 },
  { name: 'serialTag', maxCount: 1 },
  { name: 'condition', maxCount: 1 }
]), approveRequest)


router.patch('/rejectRequest',rejectRequest)
router.post('/renewListing',renewListing)
router.post('/checkStripeAccountStatus',checkStripeAccountStatus)
router.get('/generateStripeOnboardingLink',Auth,generateStripeOnboardingLink)
router.put('/updateVendorProfile',Auth,updateVendorProfile)
router.put('/changeVendorPassword',Auth,changeVendorPassword)


router.get('/getActiveRentals',Auth,getActiveRentals)
router.patch('/updateDeliveryAddress',updateDeliveryAddress)

module.exports = router;