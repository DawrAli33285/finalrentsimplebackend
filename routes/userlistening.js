
const router=require('express').Router();
const {getUserListenings,trackListingView}=require('../controller/userlistening');
const { Auth } = require('../middleware/auth');
router.get('/getUserListenings',Auth,getUserListenings)
router.post('/trackView/:listingId', Auth, trackListingView);

module.exports=router;