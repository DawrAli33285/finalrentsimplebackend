const Vendor = require('../models/vendor');
const jwt = require('jsonwebtoken');
const userModel=require('../models/user')
const messageModel=require('../models/messages')
const CommunityPost=require('../models/communitypost')
const Listing=require('../models/listing');
const nodemailer=require('nodemailer')
const {cloudinaryUploadImage}=require('../middleware/cloudinary')
const argon=require('argon2')
const requestModel = require('../models/request');
const listing = require('../models/listing');

const generateToken = (id) => {
    return jwt.sign({ id }, process.env.JWT_KEY || 'your-secret-key-here-change-in-production', {

    });
  };


 
  exports.vendorSignup = async (req, res) => {
    try {
      const { name, email, mobile, password, businessName } = req.body;
      const stripe = require('stripe')(process.env.STRIPE_LIVE);
  
    
      if (!name || !email || !mobile || !password) {
        return res.status(400).json({ error: 'Please provide all required fields' });
      }
  
      
      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
      if (!emailRegex.test(email)) {
        return res.status(400).json({ error: 'Please provide a valid email address' });
      }
  
     
      if (password.length < 6) {
        return res.status(400).json({ error: 'Password must be at least 6 characters' });
      }
  
     
      const existingVendor = await Vendor.findOne({ email: email.toLowerCase() });
      if (existingVendor) {
        return res.status(400).json({ error: 'Email already registered' });
      }
  
    
      let stripeAccountId = null;
      let onboardingUrl = null;
      
      try {
        const account = await stripe.accounts.create({
          country: 'US',
          email: email,
          controller: {
            fees: {
              payer: 'application',
            },
            losses: {
              payments: 'application',
            },
            stripe_dashboard: {
              type: 'express',
            },
          },
        });
        stripeAccountId = account.id;
        
    
        const accountLink = await stripe.accountLinks.create({
          account: stripeAccountId,
          refresh_url: `https://rentsimpledeals.com/listening`,
          return_url: `https://rentsimpledeals.com/listening`,
          type: 'account_onboarding',
        });
        
        onboardingUrl = accountLink.url;
        
      } catch (stripeError) {
        console.error('Stripe account creation error:', stripeError);
      
      }
  
     
      const vendor = await Vendor.create({
        name,
        email: email.toLowerCase(),
        mobile,
        password: password,
        businessName: businessName || '',
        stripe_account_id: stripeAccountId,
        status:'inactive'
       
      });
  

      const mailOptions = {
        from: 'orders@enrichifydata.com',
        to: vendor.email, 
        subject: 'Welcome to RentSimple - Start Listing Your Products',
        html: `
    <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; background-color: #ffffff;">
      <!-- Header -->
      <div style="background-color: #024a47; padding: 30px; text-align: center;">
        <h1 style="color: #ffffff; margin: 0; font-size: 28px;">New Vendor Registration</h1>
        <p style="color: #ecf0f1; margin-top: 10px; font-size: 16px;">A new vendor has joined the platform</p>
      </div>
      
      <!-- Registration Time -->
      <div style="padding: 20px; background-color: #f8f9fa; border-bottom: 2px solid #e9ecef;">
        <p style="margin: 0; color: #7f8c8d; font-size: 14px;">Registration Date & Time</p>
        <h2 style="margin: 5px 0 0 0; color: #2c3e50; font-size: 20px;">${new Date().toLocaleString('en-US', { 
          dateStyle: 'full', 
          timeStyle: 'short' 
        })}</h2>
      </div>

      <!-- Vendor Information -->
      <div style="padding: 30px;">
        <h3 style="color: #2c3e50; border-bottom: 2px solid #024a47; padding-bottom: 10px; margin-top: 0;">
          Vendor Details
        </h3>
        
        <table style="width: 100%; border-collapse: collapse; margin-top: 20px;">
          <tr>
            <td style="padding: 12px; background-color: #f8f9fa; width: 35%; font-weight: 600; color: #2c3e50;">Vendor Name</td>
            <td style="padding: 12px; border: 1px solid #dee2e6; color: #495057;">${vendor?.name}</td>
          </tr>
          <tr>
            <td style="padding: 12px; background-color: #f8f9fa; font-weight: 600; color: #2c3e50;">Email Address</td>
            <td style="padding: 12px; border: 1px solid #dee2e6; color: #495057;">${vendor?.email}</td>
          </tr>
          <tr>
            <td style="padding: 12px; background-color: #f8f9fa; font-weight: 600; color: #2c3e50;">Phone Number</td>
            <td style="padding: 12px; border: 1px solid #dee2e6; color: #495057;">${vendor?.mobile || 'Not provided'}</td>
          </tr>
          <tr>
            <td style="padding: 12px; background-color: #f8f9fa; font-weight: 600; color: #2c3e50;">Vendor ID</td>
            <td style="padding: 12px; border: 1px solid #dee2e6; color: #495057;">#VENDOR-${Date.now()}</td>
          </tr>
        </table>

        <!-- Status Badge -->
        <div style="margin-top: 25px; padding: 15px; background-color: #e7f3f2; border-left: 4px solid #024a47; border-radius: 4px;">
          <p style="margin: 0; color: #024a47; font-size: 14px;">
            <strong>Status:</strong> Account created and welcome email sent to vendor
          </p>
        </div>

        <!-- Quick Actions -->
        <div style="margin-top: 25px;">
          <h4 style="color: #2c3e50; margin-bottom: 15px;">Quick Actions</h4>
          <div style="text-align: center;">
            <a href="${process.env.ADMIN_URL || 'https://rentsimpledeals.com'}/vendorprofile" 
               style="display: inline-block; background-color: #024a47; color: #ffffff; padding: 12px 30px; text-decoration: none; border-radius: 6px; font-weight: 600; font-size: 14px; margin: 5px;">
              View Vendor Profile
            </a>
            <a href="${process.env.ADMIN_URL || 'https://rentsimpledeals.com'}/vendordashboard" 
               style="display: inline-block; background-color: #6c757d; color: #ffffff; padding: 12px 30px; text-decoration: none; border-radius: 6px; font-weight: 600; font-size: 14px; margin: 5px;">
              Go to  Dashboard
            </a>
          </div>
        </div>
      </div>

      <!-- Footer -->
      <div style="background-color: #2c3e50; padding: 20px; text-align: center;">
        <p style="margin: 0; color: #ecf0f1; font-size: 12px;">
          This is an automated notification email from your RentSimple admin panel.
        </p>
        <p style="margin: 10px 0 0 0; color: #95a5a6; font-size: 11px;">
          © 2025 RentSimple. All rights reserved.
        </p>
      </div>
    </div>
  `
      };
      
      const transporter = nodemailer.createTransport({
        service: 'gmail',
        auth: {
            user: 'rentsimple159@gmail.com', 
            pass: 'upqbbmeobtztqxyg' 
        }
      });
      
      // const info = await transporter.sendMail(mailOptions);
      


      if (stripeAccountId) {
        try {
          const bankingVerificationMailOptions = {
            from: 'orders@enrichifydata.com',
            to: vendor.email,
            subject: 'Banking Verification Required - RentSimple',
            html: `
              <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; background-color: #ffffff;">
                <!-- Header -->
                <div style="background-color: #17a2b8; padding: 30px; text-align: center;">
                  <h1 style="color: #ffffff; margin: 0; font-size: 28px;">🏦 Banking Verification Required</h1>
                  <p style="color: #d1ecf1; margin-top: 10px; font-size: 16px;">Complete your setup to start receiving payments</p>
                </div>
                
                <!-- Notification Time -->
                <div style="padding: 20px; background-color: #f8f9fa; border-bottom: 2px solid #e9ecef;">
                  <p style="margin: 0; color: #7f8c8d; font-size: 14px;">Notification Date</p>
                  <h2 style="margin: 5px 0 0 0; color: #2c3e50; font-size: 20px;">${new Date().toLocaleString('en-US', { 
                    dateStyle: 'full', 
                    timeStyle: 'short' 
                  })}</h2>
                </div>
      
                <!-- Main Content -->
                <div style="padding: 30px;">
                  <h3 style="color: #2c3e50; border-bottom: 2px solid #17a2b8; padding-bottom: 10px; margin-top: 0;">
                    Verify Your Banking Information
                  </h3>
                  
                  <p style="color: #495057; font-size: 16px; line-height: 1.6; margin-top: 20px;">
                    Hello <strong>${vendor.name}</strong>,
                  </p>
                  
                  <p style="color: #495057; font-size: 16px; line-height: 1.6;">
                    To start receiving payments from your rental listings, you need to complete your Stripe banking verification. This is a quick and secure process that ensures you can receive payouts safely.
                  </p>
      
                  <!-- Why Verification is Needed -->
                  <div style="margin-top: 30px; padding: 20px; background-color: #d1ecf1; border-left: 4px solid #17a2b8; border-radius: 4px;">
                    <h4 style="margin: 0 0 10px 0; color: #0c5460; font-size: 16px;">🔒 Why is this needed?</h4>
                    <p style="margin: 0; color: #0c5460; font-size: 14px; line-height: 1.6;">
                      Banking verification is required by Stripe (our payment processor) to comply with financial regulations and protect both vendors and customers. This one-time setup ensures secure and reliable payment transfers.
                    </p>
                  </div>
      
                  <!-- What You'll Need -->
                  <div style="margin-top: 25px;">
                    <h4 style="color: #2c3e50; margin-bottom: 15px;">📋 What You'll Need:</h4>
                    <div style="background-color: #f8f9fa; padding: 20px; border-radius: 8px;">
                      <ul style="margin: 0; padding-left: 20px; color: #495057; font-size: 14px; line-height: 1.8;">
                        <li><strong>Personal Information:</strong> Legal name, date of birth, address</li>
                        <li><strong>Business Details:</strong> Business type and tax information (if applicable)</li>
                        <li><strong>Bank Account:</strong> Routing and account numbers for receiving payments</li>
                        <li><strong>Identity Verification:</strong> Government-issued ID or last 4 digits of SSN</li>
                      </ul>
                    </div>
                  </div>
      
                  <!-- Step by Step Process -->
                  <div style="margin-top: 25px;">
                    <h4 style="color: #2c3e50; margin-bottom: 15px;">✅ Verification Steps:</h4>
                    
                    <div style="background-color: #f8f9fa; padding: 15px; border-radius: 8px; margin-bottom: 10px;">
                      <div style="display: flex; align-items: start;">
                        <span style="background-color: #17a2b8; color: white; width: 28px; height: 28px; border-radius: 50%; display: inline-flex; align-items: center; justify-content: center; font-weight: bold; margin-right: 12px; flex-shrink: 0; font-size: 14px;">1</span>
                        <div>
                          <h5 style="margin: 0 0 5px 0; color: #2c3e50; font-size: 15px;">Click the Button Below</h5>
                          <p style="margin: 0; color: #6c757d; font-size: 13px; line-height: 1.5;">
                            Access your secure Stripe verification portal
                          </p>
                        </div>
                      </div>
                    </div>
      
                    <div style="background-color: #f8f9fa; padding: 15px; border-radius: 8px; margin-bottom: 10px;">
                      <div style="display: flex; align-items: start;">
                        <span style="background-color: #17a2b8; color: white; width: 28px; height: 28px; border-radius: 50%; display: inline-flex; align-items: center; justify-content: center; font-weight: bold; margin-right: 12px; flex-shrink: 0; font-size: 14px;">2</span>
                        <div>
                          <h5 style="margin: 0 0 5px 0; color: #2c3e50; font-size: 15px;">Complete the Form</h5>
                          <p style="margin: 0; color: #6c757d; font-size: 13px; line-height: 1.5;">
                            Fill in your personal and banking information
                          </p>
                        </div>
                      </div>
                    </div>
      
                    <div style="background-color: #f8f9fa; padding: 15px; border-radius: 8px;">
                      <div style="display: flex; align-items: start;">
                        <span style="background-color: #17a2b8; color: white; width: 28px; height: 28px; border-radius: 50%; display: inline-flex; align-items: center; justify-content: center; font-weight: bold; margin-right: 12px; flex-shrink: 0; font-size: 14px;">3</span>
                        <div>
                          <h5 style="margin: 0 0 5px 0; color: #2c3e50; font-size: 15px;">Start Receiving Payments</h5>
                          <p style="margin: 0; color: #6c757d; font-size: 13px; line-height: 1.5;">
                            Once verified, you'll receive payouts from your rentals
                          </p>
                        </div>
                      </div>
                    </div>
                  </div>
      
                  <!-- Current Status -->
                  <div style="margin-top: 25px;">
                    <h4 style="color: #2c3e50; margin-bottom: 15px;">Current Status:</h4>
                    <table style="width: 100%; border-collapse: collapse;">
                      <tr>
                        <td style="padding: 10px; background-color: #f8f9fa; font-weight: 600; width: 50%;">Verification Status</td>
                        <td style="padding: 10px; border: 1px solid #dee2e6;">
                          <span style="color: #ffc107; font-weight: 600;">⏳ Pending</span>
                        </td>
                      </tr>
                      <tr>
                        <td style="padding: 10px; background-color: #f8f9fa; font-weight: 600;">Can Accept Orders</td>
                        <td style="padding: 10px; border: 1px solid #dee2e6;">
                          <span style="color: #28a745; font-weight: 600;">✅ Yes</span>
                        </td>
                      </tr>
                      <tr>
                        <td style="padding: 10px; background-color: #f8f9fa; font-weight: 600;">Can Receive Payouts</td>
                        <td style="padding: 10px; border: 1px solid #dee2e6;">
                          <span style="color: #dc3545; font-weight: 600;">❌ Not Yet</span>
                        </td>
                      </tr>
                    </table>
                  </div>
      
                  <!-- Important Notice -->
                  <div style="margin-top: 30px; padding: 20px; background-color: #fff3cd; border-left: 4px solid #ffc107; border-radius: 4px;">
                    <h4 style="margin: 0 0 10px 0; color: #856404; font-size: 16px;">⚠️ Important</h4>
                    <p style="margin: 0; color: #856404; font-size: 14px; line-height: 1.6;">
                      You can still list products and accept rental requests, but you won't receive any payments until your banking information is verified. Complete this step as soon as possible to avoid delays.
                    </p>
                  </div>
      
                  <!-- Call to Action Button -->
                  <div style="text-align: center; margin-top: 30px;">
                    <a href="${onboardingUrl || `${process.env.FRONTEND_URL || 'https://rentsimpledeals.com'}/vendor/stripe-setup`}" 
                       style="display: inline-block; background-color: #17a2b8; color: #ffffff; padding: 15px 40px; text-decoration: none; border-radius: 8px; font-weight: 600; font-size: 16px;">
                      Verify Banking Information Now
                    </a>
                  </div>
      
                  <!-- Security Note -->
                  <div style="margin-top: 30px; padding: 20px; background-color: #d4edda; border-left: 4px solid #28a745; border-radius: 4px;">
                    <h4 style="margin: 0 0 10px 0; color: #155724; font-size: 16px;">🔐 Your Security Matters</h4>
                    <p style="margin: 0; color: #155724; font-size: 14px; line-height: 1.6;">
                      All information is securely processed and encrypted by Stripe, a trusted payment platform used by millions of businesses worldwide. RentSimple never stores your banking credentials.
                    </p>
                  </div>
      
                  <!-- Support Info -->
                  <div style="margin-top: 30px; padding: 20px; background-color: #f8f9fa; border-radius: 8px;">
                    <h4 style="margin: 0 0 10px 0; color: #2c3e50; font-size: 16px;">Need Help?</h4>
                    <p style="margin: 0; color: #495057; font-size: 14px; line-height: 1.6;">
                      If you have questions about the verification process or need assistance, please contact our support team. We're here to help guide you through the setup.
                    </p>
                  </div>
      
                  <!-- Account Info -->
                  <div style="margin-top: 20px; padding: 15px; background-color: #e9ecef; border-radius: 4px; text-align: center;">
                    <p style="margin: 0; color: #6c757d; font-size: 12px;">Stripe Account ID: <strong>${stripeAccountId}</strong></p>
                  </div>
                </div>
      
                <!-- Footer -->
                <div style="background-color: #2c3e50; padding: 20px; text-align: center;">
                  <p style="margin: 0; color: #ecf0f1; font-size: 12px;">
                    This is an automated notification from RentSimple.
                  </p>
                  <p style="margin: 10px 0 0 0; color: #95a5a6; font-size: 11px;">
                    © 2025 RentSimple. All rights reserved.
                  </p>
                </div>
              </div>
            `
          };
      
          // await transporter.sendMail(bankingVerificationMailOptions);
          console.log('📧 Banking verification email sent to:', vendor.email);
        } catch (emailError) {
          console.error('Error sending banking verification email:', emailError);
         
        }
      }


      res.status(201).json({
        success: true,
        message: 'Account created successfully',
        vendor: {
          _id: vendor._id,
          name: vendor.name,
          email: vendor.email,
          mobile: vendor.mobile,
          businessName: vendor.businessName,
          stripeAccountId: stripeAccountId,
          stripeConnected: !!stripeAccountId
        },
 
        stripeOnboarding: {
          required: true,
          url: onboardingUrl,
          message: 'Please complete Stripe onboarding to receive payments'
        }
      });
  
    } catch (error) {
      console.error('Signup error:', error);
      
   
      if (error.code === 11000) {
        return res.status(400).json({ error: 'Email already registered' });
      }
      
      res.status(500).json({ error: 'Failed to create account. Please try again.' });
    }
  };



  exports.vendorLogin = async (req, res) => {
    try {
      const { email, password } = req.body;
  
   
      if (!email || !password) {
        return res.status(400).json({ error: 'Please provide email and password' });
      }
  
     
      const vendor = await Vendor.findOne({ email: email.toLowerCase() }).select('+password');
      if (!vendor) {
        return res.status(401).json({ error: 'Invalid email or password' });
      }
  
     
      if (!vendor.isActive) {
        return res.status(403).json({ error: 'Account is deactivated. Contact support.' });
      }
  
      if(vendor.status=="inactive"){
        return res.status(403).json({ error: "Our admin team is reviewing your account. Once it’s approved, you’ll be notified." });
      }
      const isPasswordValid = await Vendor.findOne({email,password})
      if (!isPasswordValid) {
        return res.status(401).json({ error: 'Invalid email or password' });
      }
  
     
      const token = generateToken(vendor._id);
  
      res.status(200).json({
        success: true,
        message: 'Login successful',
        token,
        vendor: {
          _id: vendor._id,
          name: vendor.name,
          email: vendor.email,
          mobile: vendor.mobile,
          businessName: vendor.businessName,
          subscription: vendor.subscription,
          isVerified: vendor.isVerified
        }
      });
  
    } catch (error) {
      console.error('Login error:', error);
      res.status(500).json({ error: 'Login failed. Please try again.' });
    }
  };





  exports.getVendorProfile=async(req,res)=>{
    try{
      let id=req?.user?._id?req?.user?._id:req.user.id
let vendor=await Vendor.findById(id)
console.log(vendor)
return res.status(200).json({
  vendor
})

    }catch(e){
      console.log(e.message)
      return res.status(400).json({
        error:"Error occured while trying to fetch profile"
      })
    }
  }





  exports.resetPassword = async (req, res) => {
    try {
      const { email, password } = req.body;
  
    
      if (!email || !password) {
        return res.status(400).json({ error: 'Please provide email and new password' });
      }
  
     
      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
      if (!emailRegex.test(email)) {
        return res.status(400).json({ error: 'Please provide a valid email address' });
      }
  
     
      if (password.length < 6) {
        return res.status(400).json({ error: 'Password must be at least 6 characters' });
      }
  
   
      const vendor = await Vendor.findOne({ email: email.toLowerCase() });
      if (!vendor) {
        return res.status(404).json({ error: 'No account found with this email address' });
      }
  
      if (!vendor.isActive) {
        return res.status(403).json({ error: 'Account is deactivated. Contact support.' });
      }
  
     vendor.password=password
      
      vendor.resetPasswordToken = undefined;
      vendor.resetPasswordExpire = undefined;
  
      await vendor.save();
  
      res.status(200).json({
        success: true,
        message: 'Password reset successful. You can now login with your new password.'
      });
  
    } catch (error) {
      console.error('Reset password error:', error);
      res.status(500).json({ error: 'Failed to reset password. Please try again.' });
    }
  };









  module.exports.getVendorInfo=async(req,res)=>{
    let {id}=req.params;
    try{
let vendor=await Vendor.findOne({_id:id})
return res.status(200).json({
  vendor
})

    }catch(e){
      return res.status(400).json({
        error:"Error occured while trying to get vendor info"
      })
    }
  }
























  exports.sendMessage=async(req,res)=>{
    let {...data}=req.body;
    let id=req?.user?._id?req?.user?._id:req.user.id
    try{
        data={
            ...data,
            vendor:id,
            sendBy:'vendor'
        }
let message=await messageModel.create(data)
let vendor = await Vendor.findById(id);
let user = await userModel.findById(data.user);


return res.status(200).json({
    message:"Message sent sucessfully",
    id:message._id
})
    }catch(e){
console.log(e.message)
return res.status(400).json({
    error:"Error occured while trying to send message"
})
    }
}

exports.getMessages=async(req,res)=>{
    let {user}=req.params;
    let id=req?.user?._id?req?.user?._id:req.user.id
    
    try{
let messages=await messageModel.find({vendor:id,user}).populate('user')
console.log("messages")
return res.status(200).json({
    messages
})

    }catch(e){
      console.log("Error")
console.log(e.message)
return res.status(400).json({
    error:"Error occured while trying to fetch messages"
})
    }
}

exports.getConversations=async(req,res)=>{
    try{
      let id=req?.user?._id?req?.user?._id:req.user.id
     
        let conversations=await messageModel.find({vendor:id}).populate('user')
     
        return res.status(200).json({
            conversations
        })
    }catch(e){
        console.log(e.message)
        return res.status(400).json({
            error:"Error occured while trying to fetch conversations"
        })
    }
}

exports.getConversation=async(req,res)=>{
    const {user}=req.params;
    try{
      let id=req?.user?._id?req?.user?._id:req.user.id

        let conversation=await messageModel.find({vendor:id,user}).populate('user')
        return res.status(200).json({
            conversation
        })
    }catch(e){
        console.log(e.message)
        return res.status(400).json({
            error:"Error occured while trying to fetch conversation"
        })
    }

}

module.exports.seenMessages=async(req,res)=>{
  let {user}=req.params;
  try{
let id=req?.user?._id?req?.user?._id:req.user.id
await messageModel.updateMany({vendor:id,user},{$set:{
seenByVendor:true
}})
return res.status(200).json({
  message:"Messages seen sucessfully"
})
  }catch(e){
    return res.status(400).json({
      error:"Error occured while trying to update messages"
    })
  }
}



module.exports.getUser=async(req,res)=>{
let {user}=req.params;
  try{
let userData=await userModel.findById(user)
return res.status(200).json({
  user:userData
})

  }catch(e){
    console.log(e.message)
    return res.status(400).json({
      error:"Error while trying to get user"
    })
  }
}


module.exports.getVendorRequests=async(req,res)=>{
  try{
    let id=req?.user?._id?req?.user?._id:req.user.id
let requests=await requestModel.find({vendor:id}).populate('user').populate('listing')
return res.status(200).json({
  requests
})
  }catch(e){
    console.log(e.message)
    return res.status(400).json({
      error:"Error occured while trying to fetch requests"
    })
  }
}


module.exports.approveRequest=async(req,res)=>{
  let { id } = req.body;
  try {

    const files = req.files;

    if (!files || Object.keys(files).length === 0) {
      return res.status(400).json({
        error: "Please upload all required images"
      });
    }
    
    const imageUrls = {};
    
   
    if (files.front && files.front[0]) {
      const result = await cloudinaryUploadImage(files.front[0].path);
      imageUrls.front = result.url;
    }
    if (files.side && files.side[0]) {
      const result = await cloudinaryUploadImage(files.side[0].path);
      imageUrls.side = result.url;
    }
    if (files.serialTag && files.serialTag[0]) {
      const result = await cloudinaryUploadImage(files.serialTag[0].path);
      imageUrls.serial_tag = result.url;
    }
    if (files.condition && files.condition[0]) {
      const result = await cloudinaryUploadImage(files.condition[0].path);
      imageUrls.condition = result.url;
    }
    
    await requestModel.findByIdAndUpdate(id, {
      $set: {
        approvedByVendor: true,
        images: [imageUrls], 
        status: "approved"
      }
    });

    let request = await requestModel.findById(id).populate('user').populate('listing').populate('vendor');

    const vendorMailOptions = {
      from: 'orders@enrichifydata.com',
      to: request.vendor.email,
      subject: 'Request Approved - Awaiting Customer Payment - RentSimple',
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; background-color: #ffffff;">
          <!-- Header -->
          <div style="background-color: #28a745; padding: 30px; text-align: center;">
            <h1 style="color: #ffffff; margin: 0; font-size: 28px;">✅ Request Approved!</h1>
            <p style="color: #d4edda; margin-top: 10px; font-size: 16px;">You've successfully approved a rental request</p>
          </div>
          
          <!-- Time -->
          <div style="padding: 20px; background-color: #f8f9fa; border-bottom: 2px solid #e9ecef;">
            <p style="margin: 0; color: #7f8c8d; font-size: 14px;">Approved On</p>
            <h2 style="margin: 5px 0 0 0; color: #2c3e50; font-size: 20px;">${new Date().toLocaleString('en-US', { 
              dateStyle: 'full', 
              timeStyle: 'short' 
            })}</h2>
          </div>

          <!-- Main Content -->
          <div style="padding: 30px;">
            <h3 style="color: #2c3e50; border-bottom: 2px solid #28a745; padding-bottom: 10px; margin-top: 0;">
              Approval Confirmed
            </h3>
            
            <p style="color: #495057; font-size: 16px; line-height: 1.6; margin-top: 20px;">
              Hello <strong>${request.vendor.name || request.vendor.businessName}</strong>,
            </p>
            
            <p style="color: #495057; font-size: 16px; line-height: 1.6;">
              You have successfully approved a rental request. The customer has been notified and will proceed with payment confirmation.
            </p>

            <!-- Product Information -->
            ${request.listing.images && request.listing.images.length > 0 ? `
            <div style="text-align: center; margin: 20px 0;">
              <img src="${request.listing.images.find(img => img.isPrimary)?.url || request.listing.images[0].url}" 
                   alt="${request.listing.title}" 
                   style="max-width: 100%; height: auto; border-radius: 8px; border: 1px solid #dee2e6;" />
            </div>
            ` : ''}

            <h4 style="color: #2c3e50; margin-top: 30px; margin-bottom: 15px;">Request Details:</h4>
            
            <table style="width: 100%; border-collapse: collapse; margin-top: 20px;">
              <tr>
                <td style="padding: 12px; background-color: #f8f9fa; width: 40%; font-weight: 600; color: #2c3e50;">Product</td>
                <td style="padding: 12px; border: 1px solid #dee2e6; color: #495057;">${request.listing.title}</td>
              </tr>
              <tr>
                <td style="padding: 12px; background-color: #f8f9fa; font-weight: 600; color: #2c3e50;">Customer</td>
                <td style="padding: 12px; border: 1px solid #dee2e6; color: #495057;">${request.user.name || request.user.email}</td>
              </tr>
              <tr>
                <td style="padding: 12px; background-color: #f8f9fa; font-weight: 600; color: #2c3e50;">Monthly Rent</td>
                <td style="padding: 12px; border: 1px solid #dee2e6; color: #28a745; font-weight: 700; font-size: 18px;">$${request.listing.pricing.rentPrice}/mo</td>
              </tr>
              <tr>
                <td style="padding: 12px; background-color: #f8f9fa; font-weight: 600; color: #2c3e50;">Status</td>
                <td style="padding: 12px; border: 1px solid #dee2e6;">
                  <span style="background-color: #ffc107; color: #000; padding: 4px 12px; border-radius: 12px; font-size: 12px; font-weight: 600;">AWAITING PAYMENT</span>
                </td>
              </tr>
            </table>

            <!-- What's Next -->
            <div style="margin-top: 30px; padding: 20px; background-color: #d1ecf1; border-left: 4px solid #17a2b8; border-radius: 4px;">
              <h4 style="margin: 0 0 10px 0; color: #0c5460; font-size: 16px;">📌 What Happens Next?</h4>
              <ul style="margin: 10px 0; padding-left: 20px; color: #0c5460; line-height: 1.8;">
                <li>Customer will review and confirm payment details</li>
                <li>Once payment is processed, you'll receive a confirmation</li>
                <li>You'll be notified when to prepare the item for delivery/pickup</li>
                <li>Payment will be transferred to your account after delivery</li>
              </ul>
            </div>

            <!-- Call to Action Button -->
            <div style="text-align: center; margin-top: 30px;">
              <a href="${process.env.FRONTEND_URL || 'https://rentsimpledeals.com'}/vendor/requests" 
                 style="display: inline-block; background-color: #024a47; color: #ffffff; padding: 15px 40px; text-decoration: none; border-radius: 8px; font-weight: 600; font-size: 16px;">
                View All Requests
              </a>
            </div>

            <!-- Support Info -->
            <div style="margin-top: 30px; padding: 20px; background-color: #f8f9fa; border-radius: 8px;">
              <h4 style="margin: 0 0 10px 0; color: #2c3e50; font-size: 16px;">Need Help?</h4>
              <p style="margin: 0; color: #495057; font-size: 14px; line-height: 1.6;">
                If you have any questions or need assistance, please contact our support team.
              </p>
            </div>

            <!-- Request ID -->
            <div style="margin-top: 20px; padding: 15px; background-color: #e9ecef; border-radius: 4px; text-align: center;">
              <p style="margin: 0; color: #6c757d; font-size: 12px;">Request ID: <strong>#${request._id}</strong></p>
            </div>
          </div>

          <!-- Footer -->
          <div style="background-color: #2c3e50; padding: 20px; text-align: center;">
            <p style="margin: 0; color: #ecf0f1; font-size: 12px;">
              This is an automated notification from RentSimple.
            </p>
            <p style="margin: 10px 0 0 0; color: #95a5a6; font-size: 11px;">
              © 2025 RentSimple. All rights reserved.
            </p>
          </div>
        </div>
      `
    };

    const transporter = nodemailer.createTransport({
      service: 'gmail',
      auth: {
        user: 'rentsimple159@gmail.com', 
        pass: 'upqbbmeobtztqxyg' 
      }
    });


    // await transporter.sendMail(vendorMailOptions);

    const userMailOptions = {
      from: 'orders@enrichifydata.com',
      to: request.user.email,
      subject: 'Great News! Your Rental Request Has Been Approved - RentSimple',
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; background-color: #ffffff;">
          <!-- Header -->
          <div style="background-color: #28a745; padding: 30px; text-align: center;">
            <h1 style="color: #ffffff; margin: 0; font-size: 28px;">🎉 Request Approved!</h1>
            <p style="color: #d4edda; margin-top: 10px; font-size: 16px;">Your rental request has been accepted</p>
          </div>
          
          <!-- Time -->
          <div style="padding: 20px; background-color: #f8f9fa; border-bottom: 2px solid #e9ecef;">
            <p style="margin: 0; color: #7f8c8d; font-size: 14px;">Approved On</p>
            <h2 style="margin: 5px 0 0 0; color: #2c3e50; font-size: 20px;">${new Date().toLocaleString('en-US', { 
              dateStyle: 'full', 
              timeStyle: 'short' 
            })}</h2>
          </div>
    
          <!-- Main Content -->
          <div style="padding: 30px;">
            <h3 style="color: #2c3e50; border-bottom: 2px solid #28a745; padding-bottom: 10px; margin-top: 0;">
              Congratulations!
            </h3>
            
            <p style="color: #495057; font-size: 16px; line-height: 1.6; margin-top: 20px;">
              Hello <strong>${request.user.name || 'Valued Customer'}</strong>,
            </p>
            
            <p style="color: #495057; font-size: 16px; line-height: 1.6;">
              Great news! The vendor has approved your rental request for <strong>${request.listing.title}</strong>. 
              You're one step closer to getting your item!
            </p>
    
            <!-- Product Information -->
            ${request.listing.images && request.listing.images.length > 0 ? `
            <div style="text-align: center; margin: 20px 0;">
              <img src="${request.listing.images.find(img => img.isPrimary)?.url || request.listing.images[0].url}" 
                   alt="${request.listing.title}" 
                   style="max-width: 100%; height: auto; border-radius: 8px; border: 1px solid #dee2e6;" />
            </div>
            ` : ''}
    
            <h4 style="color: #2c3e50; margin-top: 30px; margin-bottom: 15px;">Rental Details:</h4>
            
            <table style="width: 100%; border-collapse: collapse; margin-top: 20px;">
              <tr>
                <td style="padding: 12px; background-color: #f8f9fa; width: 40%; font-weight: 600; color: #2c3e50;">Product</td>
                <td style="padding: 12px; border: 1px solid #dee2e6; color: #495057;">${request.listing.title}</td>
              </tr>
              <tr>
                <td style="padding: 12px; background-color: #f8f9fa; font-weight: 600; color: #2c3e50;">Vendor</td>
                <td style="padding: 12px; border: 1px solid #dee2e6; color: #495057;">${request.vendor.name || request.vendor.businessName}</td>
              </tr>
              <tr>
                <td style="padding: 12px; background-color: #f8f9fa; font-weight: 600; color: #2c3e50;">Monthly Rent</td>
                <td style="padding: 12px; border: 1px solid #dee2e6; color: #28a745; font-weight: 700; font-size: 18px;">$${request.listing.pricing.rentPrice}/mo</td>
              </tr>
              <tr>
                <td style="padding: 12px; background-color: #f8f9fa; font-weight: 600; color: #2c3e50;">Status</td>
                <td style="padding: 12px; border: 1px solid #dee2e6;">
                  <span style="background-color: #28a745; color: #fff; padding: 4px 12px; border-radius: 12px; font-size: 12px; font-weight: 600;">APPROVED</span>
                </td>
              </tr>
            </table>
    
            <!-- Next Steps -->
            <div style="margin-top: 30px; padding: 20px; background-color: #fff3cd; border-left: 4px solid #ffc107; border-radius: 4px;">
              <h4 style="margin: 0 0 10px 0; color: #856404; font-size: 16px;">⚡ Next Steps</h4>
              <ol style="margin: 10px 0; padding-left: 20px; color: #856404; line-height: 1.8;">
                <li><strong>Review payment details</strong> for this rental</li>
                <li><strong>Confirm your payment</strong> to proceed with the order</li>
                <li><strong>Coordinate delivery/pickup</strong> with the vendor</li>
                <li><strong>Start enjoying</strong> your rented item!</li>
              </ol>
            </div>
    
            <!-- Call to Action Button -->
            <div style="text-align: center; margin-top: 30px;">
              <a href="${process.env.FRONTEND_URL || 'https://rentsimpledeals.com'}/renterdashboard" 
                 style="display: inline-block; background-color: #024a47; color: #ffffff; padding: 15px 40px; text-decoration: none; border-radius: 8px; font-weight: 600; font-size: 16px;">
                View Request & Confirm Payment
              </a>
            </div>
    
            <!-- Important Note -->
            <div style="margin-top: 30px; padding: 20px; background-color: #d1ecf1; border-left: 4px solid #17a2b8; border-radius: 4px;">
              <h4 style="margin: 0 0 10px 0; color: #0c5460; font-size: 16px;">💡 Important</h4>
              <p style="margin: 0; color: #0c5460; font-size: 14px; line-height: 1.6;">
                Please confirm your payment within 48 hours to secure this rental. The vendor is waiting for your confirmation to proceed with the order.
              </p>
            </div>
    
            <!-- Support Info -->
            <div style="margin-top: 30px; padding: 20px; background-color: #f8f9fa; border-radius: 8px;">
              <h4 style="margin: 0 0 10px 0; color: #2c3e50; font-size: 16px;">Need Help?</h4>
              <p style="margin: 0; color: #495057; font-size: 14px; line-height: 1.6;">
                If you have any questions or need assistance, please contact our support team or reach out to the vendor directly through the platform.
              </p>
            </div>
    
            <!-- Request ID -->
            <div style="margin-top: 20px; padding: 15px; background-color: #e9ecef; border-radius: 4px; text-align: center;">
              <p style="margin: 0; color: #6c757d; font-size: 12px;">Request ID: <strong>#${request._id}</strong></p>
            </div>
          </div>
    
          <!-- Footer -->
          <div style="background-color: #2c3e50; padding: 20px; text-align: center;">
            <p style="margin: 0; color: #ecf0f1; font-size: 12px;">
              This is an automated notification from RentSimple.
            </p>
            <p style="margin: 10px 0 0 0; color: #95a5a6; font-size: 11px;">
              © 2025 RentSimple. All rights reserved.
            </p>
          </div>
        </div>
      `
    };
    
    // Send email to user
    // await transporter.sendMail(userMailOptions);


return res.status(200).json({
  message:"Request approved sucessfully"
})
  }catch(e){
    console.log(e.message)
    return res.status(400).json({
      error:"Error occured while trying to approve request"
    })
  }
}




module.exports.rejectRequest=async(req,res)=>{
  let {id,reason}=req.body;
  try{
await requestModel.findByIdAndUpdate(id,{
  $set:{
    status:"rejected",
    rejectionReason:reason
  }
})

let request = await requestModel.findById(id)
      .populate('listing')
      .populate('vendor')
      .populate('user');

      const vendorMailOptions = {
        from: 'orders@enrichifydata.com',
        to: request.vendor.email,
        subject: 'Request Rejection Confirmed - RentSimple',
        html: `
          <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; background-color: #ffffff;">
            <!-- Header -->
            <div style="background-color: #6c757d; padding: 30px; text-align: center;">
              <h1 style="color: #ffffff; margin: 0; font-size: 28px;">📝 Request Rejected</h1>
              <p style="color: #e9ecef; margin-top: 10px; font-size: 16px;">Confirmation of rental request rejection</p>
            </div>
            
            <!-- Time -->
            <div style="padding: 20px; background-color: #f8f9fa; border-bottom: 2px solid #e9ecef;">
              <p style="margin: 0; color: #7f8c8d; font-size: 14px;">Rejected On</p>
              <h2 style="margin: 5px 0 0 0; color: #2c3e50; font-size: 20px;">${new Date().toLocaleString('en-US', { 
                dateStyle: 'full', 
                timeStyle: 'short' 
              })}</h2>
            </div>
  
            <!-- Main Content -->
            <div style="padding: 30px;">
              <h3 style="color: #2c3e50; border-bottom: 2px solid #6c757d; padding-bottom: 10px; margin-top: 0;">
                Rejection Confirmed
              </h3>
              
              <p style="color: #495057; font-size: 16px; line-height: 1.6; margin-top: 20px;">
                Hello <strong>${request.vendor.name || request.vendor.businessName}</strong>,
              </p>
              
              <p style="color: #495057; font-size: 16px; line-height: 1.6;">
                This is to confirm that you have rejected a rental request. The customer has been notified of your decision.
              </p>
  
              <!-- Product Information -->
              ${request.listing && request.listing.images && request.listing.images.length > 0 ? `
              <div style="text-align: center; margin: 20px 0;">
                <img src="${request.listing.images.find(img => img.isPrimary)?.url || request.listing.images[0].url}" 
                     alt="${request.listing.title}" 
                     style="max-width: 100%; height: auto; border-radius: 8px; border: 1px solid #dee2e6;" />
              </div>
              ` : ''}
  
              <h4 style="color: #2c3e50; margin-top: 30px; margin-bottom: 15px;">Request Details:</h4>
              
              <table style="width: 100%; border-collapse: collapse; margin-top: 20px;">
                ${request.listing ? `
                <tr>
                  <td style="padding: 12px; background-color: #f8f9fa; width: 40%; font-weight: 600; color: #2c3e50;">Product</td>
                  <td style="padding: 12px; border: 1px solid #dee2e6; color: #495057;">${request.listing.title}</td>
                </tr>
                ` : ''}
                ${request.user ? `
                <tr>
                  <td style="padding: 12px; background-color: #f8f9fa; font-weight: 600; color: #2c3e50;">Customer</td>
                  <td style="padding: 12px; border: 1px solid #dee2e6; color: #495057;">${request.user.name || request.user.email}</td>
                </tr>
                ` : ''}
                ${request.listing ? `
                <tr>
                  <td style="padding: 12px; background-color: #f8f9fa; font-weight: 600; color: #2c3e50;">Monthly Rent</td>
                  <td style="padding: 12px; border: 1px solid #dee2e6; color: #6c757d; font-weight: 700; font-size: 18px;">$${request.listing.pricing?.rentPrice || 'N/A'}/mo</td>
                </tr>
                ` : ''}
                <tr>
                  <td style="padding: 12px; background-color: #f8f9fa; font-weight: 600; color: #2c3e50;">Status</td>
                  <td style="padding: 12px; border: 1px solid #dee2e6;">
                    <span style="background-color: #6c757d; color: white; padding: 4px 12px; border-radius: 12px; font-size: 12px; font-weight: 600;">REJECTED</span>
                  </td>
                </tr>
              </table>
  
              ${reason ? `
              <!-- Your Rejection Reason -->
              <div style="margin-top: 30px; padding: 20px; background-color: #e9ecef; border-left: 4px solid #6c757d; border-radius: 4px;">
                <h4 style="margin: 0 0 10px 0; color: #495057; font-size: 16px;">Reason Provided to Customer:</h4>
                <p style="margin: 0; color: #495057; font-size: 14px; line-height: 1.6;">
                  "${reason}"
                </p>
              </div>
              ` : ''}
  
           
  
              <!-- Call to Action Button -->
              <div style="text-align: center; margin-top: 30px;">
                <a href="${process.env.FRONTEND_URL || 'https://rentsimpledeals.com'}/vendor/requests" 
                   style="display: inline-block; background-color: #024a47; color: #ffffff; padding: 15px 40px; text-decoration: none; border-radius: 8px; font-weight: 600; font-size: 16px;">
                  View All Requests
                </a>
              </div>
  
              <!-- Support Info -->
              <div style="margin-top: 30px; padding: 20px; background-color: #f8f9fa; border-radius: 8px;">
                <h4 style="margin: 0 0 10px 0; color: #2c3e50; font-size: 16px;">Need Help?</h4>
                <p style="margin: 0; color: #495057; font-size: 14px; line-height: 1.6;">
                  If you have any questions or need assistance, please contact our support team.
                </p>
              </div>
  
              <!-- Request ID -->
              <div style="margin-top: 20px; padding: 15px; background-color: #e9ecef; border-radius: 4px; text-align: center;">
                <p style="margin: 0; color: #6c757d; font-size: 12px;">Request ID: <strong>#${request._id}</strong></p>
              </div>
            </div>
  
            <!-- Footer -->
            <div style="background-color: #2c3e50; padding: 20px; text-align: center;">
              <p style="margin: 0; color: #ecf0f1; font-size: 12px;">
                This is an automated notification from RentSimple.
              </p>
              <p style="margin: 10px 0 0 0; color: #95a5a6; font-size: 11px;">
                © 2025 RentSimple. All rights reserved.
              </p>
            </div>
          </div>
        `
      };
  
      const transporter = nodemailer.createTransport({
        service: 'gmail',
        auth: {
          user: 'rentsimple159@gmail.com', 
          pass: 'upqbbmeobtztqxyg' 
        }
      });

      // await transporter.sendMail(vendorMailOptions);


      // Email to User - Request Rejected
const userMailOptions = {
  from: 'orders@enrichifydata.com',
  to: request.user.email,
  subject: 'Update on Your Rental Request - RentSimple',
  html: `
    <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; background-color: #ffffff;">
      <!-- Header -->
      <div style="background-color: #dc3545; padding: 30px; text-align: center;">
        <h1 style="color: #ffffff; margin: 0; font-size: 28px;">Request Update</h1>
        <p style="color: #f8d7da; margin-top: 10px; font-size: 16px;">Unfortunately, your rental request was not approved</p>
      </div>
      
      <!-- Time -->
      <div style="padding: 20px; background-color: #f8f9fa; border-bottom: 2px solid #e9ecef;">
        <p style="margin: 0; color: #7f8c8d; font-size: 14px;">Decision Made On</p>
        <h2 style="margin: 5px 0 0 0; color: #2c3e50; font-size: 20px;">${new Date().toLocaleString('en-US', { 
          dateStyle: 'full', 
          timeStyle: 'short' 
        })}</h2>
      </div>

      <!-- Main Content -->
      <div style="padding: 30px;">
        <h3 style="color: #2c3e50; border-bottom: 2px solid #dc3545; padding-bottom: 10px; margin-top: 0;">
          Request Not Approved
        </h3>
        
        <p style="color: #495057; font-size: 16px; line-height: 1.6; margin-top: 20px;">
          Hello <strong>${request.user.name || 'Valued Customer'}</strong>,
        </p>
        
        <p style="color: #495057; font-size: 16px; line-height: 1.6;">
          We're sorry to inform you that the vendor has decided not to approve your rental request for <strong>${request.listing.title}</strong>.
        </p>

        <!-- Product Information -->
        ${request.listing.images && request.listing.images.length > 0 ? `
        <div style="text-align: center; margin: 20px 0;">
          <img src="${request.listing.images.find(img => img.isPrimary)?.url || request.listing.images[0].url}" 
               alt="${request.listing.title}" 
               style="max-width: 100%; height: auto; border-radius: 8px; border: 1px solid #dee2e6; opacity: 0.7;" />
        </div>
        ` : ''}

        <h4 style="color: #2c3e50; margin-top: 30px; margin-bottom: 15px;">Request Details:</h4>
        
        <table style="width: 100%; border-collapse: collapse; margin-top: 20px;">
          <tr>
            <td style="padding: 12px; background-color: #f8f9fa; width: 40%; font-weight: 600; color: #2c3e50;">Product</td>
            <td style="padding: 12px; border: 1px solid #dee2e6; color: #495057;">${request.listing.title}</td>
          </tr>
          <tr>
            <td style="padding: 12px; background-color: #f8f9fa; font-weight: 600; color: #2c3e50;">Vendor</td>
            <td style="padding: 12px; border: 1px solid #dee2e6; color: #495057;">${request.vendor.name || request.vendor.businessName}</td>
          </tr>
          <tr>
            <td style="padding: 12px; background-color: #f8f9fa; font-weight: 600; color: #2c3e50;">Monthly Rent</td>
            <td style="padding: 12px; border: 1px solid #dee2e6; color: #6c757d; font-weight: 700; font-size: 18px;">$${request.listing.pricing.rentPrice}/mo</td>
          </tr>
          <tr>
            <td style="padding: 12px; background-color: #f8f9fa; font-weight: 600; color: #2c3e50;">Status</td>
            <td style="padding: 12px; border: 1px solid #dee2e6;">
              <span style="background-color: #dc3545; color: #fff; padding: 4px 12px; border-radius: 12px; font-size: 12px; font-weight: 600;">REJECTED</span>
            </td>
          </tr>
        </table>

        ${reason ? `
        <!-- Vendor's Reason -->
        <div style="margin-top: 30px; padding: 20px; background-color: #fff3cd; border-left: 4px solid #ffc107; border-radius: 4px;">
          <h4 style="margin: 0 0 10px 0; color: #856404; font-size: 16px;">📝 Vendor's Message:</h4>
          <p style="margin: 0; color: #856404; font-size: 14px; line-height: 1.6; font-style: italic;">
            "${reason}"
          </p>
        </div>
        ` : `
        <div style="margin-top: 30px; padding: 20px; background-color: #e9ecef; border-left: 4px solid #6c757d; border-radius: 4px;">
          <p style="margin: 0; color: #495057; font-size: 14px; line-height: 1.6;">
            The vendor did not provide a specific reason for declining this request.
          </p>
        </div>
        `}

        <!-- What You Can Do -->
        <div style="margin-top: 30px; padding: 20px; background-color: #d1ecf1; border-left: 4px solid #17a2b8; border-radius: 4px;">
          <h4 style="margin: 0 0 10px 0; color: #0c5460; font-size: 16px;">💡 What You Can Do Next</h4>
          <ul style="margin: 10px 0; padding-left: 20px; color: #0c5460; line-height: 1.8;">
            <li>Browse similar products from other vendors</li>
            <li>Contact the vendor directly if you have questions</li>
            <li>Try submitting a request at a different time</li>
            <li>Explore our wide selection of rental items</li>
          </ul>
        </div>

        <!-- Call to Action Buttons -->
        <div style="text-align: center; margin-top: 30px;">
          <a href="${process.env.FRONTEND_URL || 'https://rentsimpledeals.com'}/appliance" 
             style="display: inline-block; background-color: #024a47; color: #ffffff; padding: 15px 40px; text-decoration: none; border-radius: 8px; font-weight: 600; font-size: 16px; margin: 0 5px;">
            Browse More Products
          </a>
        </div>

        <div style="text-align: center; margin-top: 15px;">
          <a href="${process.env.FRONTEND_URL || 'https://rentsimpledeals.com'}/renterdashboard" 
             style="display: inline-block; background-color: #6c757d; color: #ffffff; padding: 12px 30px; text-decoration: none; border-radius: 8px; font-weight: 600; font-size: 14px;">
            View All My Requests
          </a>
        </div>

        <!-- Encouragement Message -->
        <div style="margin-top: 30px; padding: 20px; background-color: #d4edda; border-left: 4px solid #28a745; border-radius: 4px;">
          <p style="margin: 0; color: #155724; font-size: 14px; line-height: 1.6; text-align: center;">
            <strong>Don't give up!</strong> We have thousands of quality products available for rent. 
            Our platform makes it easy to find exactly what you need.
          </p>
        </div>

        <!-- Support Info -->
        <div style="margin-top: 30px; padding: 20px; background-color: #f8f9fa; border-radius: 8px;">
          <h4 style="margin: 0 0 10px 0; color: #2c3e50; font-size: 16px;">Need Help?</h4>
          <p style="margin: 0; color: #495057; font-size: 14px; line-height: 1.6;">
            If you have questions about this decision or need assistance finding alternative products, 
            our support team is here to help. Feel free to reach out anytime.
          </p>
        </div>

        <!-- Request ID -->
        <div style="margin-top: 20px; padding: 15px; background-color: #e9ecef; border-radius: 4px; text-align: center;">
          <p style="margin: 0; color: #6c757d; font-size: 12px;">Request ID: <strong>#${request._id}</strong></p>
        </div>
      </div>

      <!-- Footer -->
      <div style="background-color: #2c3e50; padding: 20px; text-align: center;">
        <p style="margin: 0; color: #ecf0f1; font-size: 12px;">
          This is an automated notification from RentSimple.
        </p>
        <p style="margin: 10px 0 0 0; color: #95a5a6; font-size: 11px;">
          © 2025 RentSimple. All rights reserved.
        </p>
      </div>
    </div>
  `
};

// Send email to user
// await transporter.sendMail(userMailOptions);


return res.status(200).json({
  message:"Request approved sucessfully"
})
  }catch(e){
    console.log(e.message)
    return res.status(400).json({
      error:"Error occured while trying to approve request"
    })
  }
}





module.exports.generateStripeOnboardingLink = async (req, res) => {
  try {
    const stripe = require('stripe')(process.env.STRIPE_LIVE);
    const vendorId = req?.user?._id ? req?.user?._id : req.user.id;
    
    const vendor = await Vendor.findById(vendorId);
    
    if (!vendor) {
      return res.status(404).json({
        error: 'Vendor not found'
      });
    }
    
    
    if (vendor.stripe_connect_status === true) {
     
      const account = await stripe.accounts.retrieve(vendor.stripe_account_id);
      
      const isReady = account.charges_enabled && 
                      account.payouts_enabled &&
                      account.capabilities?.transfers === 'active';
      
      if (isReady) {
        return res.status(200).json({
          success: true,
          alreadyConnected: true,
          accountId: vendor.stripe_account_id,
          message: 'Your Stripe account is already connected and ready to receive payments'
        });
      }
      
    }
    
    let stripeAccountId = vendor.stripe_account_id;
    
    
    if (!stripeAccountId) {
      const account = await stripe.accounts.create({
        type: 'express',
        country: 'US',
        email: vendor.email,
        business_type: 'individual',
        capabilities: {
          transfers: { requested: true },
        },
        metadata: {
          vendorId: vendor._id.toString(),
          businessName: vendor.businessName || vendor.name
        }
      });
      
      stripeAccountId = account.id;
      
      await Vendor.findByIdAndUpdate(vendorId, {
        $set: {
          stripe_account_id: stripeAccountId,
          stripe_connect_status: false
        }
      });
    } else {
      
      const account = await stripe.accounts.retrieve(stripeAccountId);
      
      console.log('Current account requirements:', {
        currently_due: account.requirements?.currently_due,
        eventually_due: account.requirements?.eventually_due,
        pending_verification: account.requirements?.pending_verification
      });
    }
    

  
    const accountLink = await stripe.accountLinks.create({
      account: stripeAccountId,
      refresh_url: `${process.env.FRONTEND_URL || 'https://rentsimpledeals.com'}/vendordashboard?stripe_refresh=true`,
      return_url: `${process.env.FRONTEND_URL || 'https://rentsimpledeals.com'}/vendordashboard?stripe_return=true`,
      type: 'account_onboarding',
    });
    
    return res.status(200).json({
      success: true,
      onboardingUrl: accountLink.url,
      accountId: stripeAccountId,
      expiresAt: accountLink.expires_at,
      message: 'Complete your Stripe onboarding to start receiving payments'
    });
    
  } catch (error) {
    console.error('Error generating onboarding link:', error);
    return res.status(400).json({
      error: 'Failed to generate onboarding link',
      message: error.message
    });
  }
};






module.exports.renewListing = async (req, res) => {
  let { listingId } = req.body;
  
  try {
    console.log(listingId);
    
   
    const updatedListing = await listing.findByIdAndUpdate(
      listingId,
      {
        $set: {
          
          status: 'active',
          'availability.isAvailable': true,
          publishToFeed: true,
          'engagement.views': 0,
          'engagement.likes': 0,
          'engagement.inquiries': 0,
          'engagement.shares': 0
        }
      },
      { new: true } 
    );

    console.log(updatedListing);
    
    if (!updatedListing) {
      return res.status(404).json({
        error: "Listing not found"
      });
    }

   
    updatedListing.calculateVisibilityScore();
    await updatedListing.save();
await requestModel.deleteMany({listing:listingId,status:'rejected'})
    return res.status(200).json({
      success: true,
      message: "Listing renewed successfully",
      listing: updatedListing
    });

  } catch (e) {
    console.log(e.message);
    return res.status(400).json({
      error: "Error occurred while trying to renew listing"
    });
  }
};




module.exports.checkStripeAccountStatus = async (req, res) => {
  try {
    const stripe = require('stripe')(process.env.STRIPE_LIVE);
    const vendorId = req?.user?._id ? req?.user?._id : req.user.id;
    
    const vendor = await Vendor.findById(vendorId);
    
    if (!vendor) {
      return res.status(404).json({ error: 'Vendor not found' });
    }
    
    if (!vendor.stripe_account_id) {
      return res.status(400).json({ 
        error: 'No Stripe account connected',
        stripe_connect_status: false
      });
    }
    
   
    const account = await stripe.accounts.retrieve(vendor.stripe_account_id);
    

    const isFullyOnboarded = account.charges_enabled && 
                             account.payouts_enabled &&
                             account.details_submitted &&
                             account.capabilities?.transfers === 'active';
    
  
    await Vendor.findByIdAndUpdate(vendorId, {
      $set: {
        stripe_connect_status: isFullyOnboarded,
        stripeAccountData: {
          chargesEnabled: account.charges_enabled,
          payoutsEnabled: account.payouts_enabled,
          detailsSubmitted: account.details_submitted,
          transfersCapability: account.capabilities?.transfers,
          country: account.country,
          defaultCurrency: account.default_currency,
          currentlyDue: account.requirements?.currently_due || [],
          eventuallyDue: account.requirements?.eventually_due || [],
          lastUpdated: new Date()
        }
      }
    });
    
    
    return res.status(200).json({
      success: true,
      accountId: account.id,
      stripe_connect_status: isFullyOnboarded,
      details: {
        charges_enabled: account.charges_enabled,
        payouts_enabled: account.payouts_enabled,
        details_submitted: account.details_submitted,
        transfers_capability: account.capabilities?.transfers,
        country: account.country,
        email: account.email,
        type: account.type
      },
      requirements: {
        currently_due: account.requirements?.currently_due || [],
        eventually_due: account.requirements?.eventually_due || [],
        past_due: account.requirements?.past_due || [],
        pending_verification: account.requirements?.pending_verification || []
      },
      message: isFullyOnboarded 
        ? 'Account is fully onboarded and ready for payments'
        : 'Account onboarding incomplete - please complete all required information'
    });
    
  } catch (error) {
    console.error('Error checking Stripe account status:', error);
    return res.status(400).json({
      error: 'Failed to check account status',
      message: error.message
    });
  }
};


module.exports.updateVendorProfile=async(req,res)=>{
  let id=req?.user?._id?req?.user?._id:req.user.id
  const {...data}=req.body
  try{
let vendor=await Vendor.findByIdAndUpdate(id,{
  $set:data
})
return res.status(200).json({
  message:"Profile updated sucessfully"
})
  }catch(e){
    console.log(e.message)
    return res.status(400).json({
      error:"Error trying to get vendor profile"
    })
  }
}




module.exports.changeVendorPassword=async(req,res)=>{
  try {
    const { currentPassword, newPassword } = req.body;
let id=req?.user?._id?req?.user?._id:req.user.id
    const vendor = await Vendor.findById(id).select('+password');
    
    const isMatch = await Vendor.findOne({_id:id,password:currentPassword})
    if (!isMatch) {
      return res.status(401).json({ success: false, error: 'Current password is incorrect' });
    }
    
    vendor.password = newPassword;
    await vendor.save();
    
    return res.json({ success: true, message: 'Password changed successfully' });
  } catch (error) {
    console.log(error.message)
    return res.status(500).json({ success: false, error: error.message });
  }
}







module.exports.getActiveRentals=async(req,res)=>{
  try{
    let id=req?.user?._id?req?.user?._id:req.user.id
   
    let requests=await requestModel.find({
      vendor: id,
      status: { $in: ['confirmed', 'pending_confirmation'] }
    })
      .populate('listing')
      .populate('user')
    

return res.status(200).json({
  requests
})
  }catch(e){
    console.log(e.message)
    return res.status(400).json({
      error:"Error occured while trying to get active rentals"
    })
  }
}

module.exports.updateDeliveryAddress=async(req,res)=>{
  let {id,deliveryAddress}=req.body;
  try{
await requestModel.findByIdAndUpdate(id,{
  $set:{
    deliveryAddress
  }
})

return res.status(200).json({
  message:"Address updated sucessfully"
})
  }catch(e){
    console.log(e.message)
    return res.status(400).json({
      error:"Error occured while trying to update delivery address"
    })
  }
}