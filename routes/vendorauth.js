const express = require('express');
const router = express.Router();
const {
  vendorSignup,
  vendorLogin,
  resetPassword
} = require('../controller/vendor');


router.post('/vendor/signup', vendorSignup);
router.post('/vendor/login', vendorLogin);
router.post('/vendor/reset-password', resetPassword);

module.exports = router;