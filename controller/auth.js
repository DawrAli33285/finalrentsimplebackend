const userModel = require('../models/user');
const jwt = require('jsonwebtoken'); 
const argon=require('argon2')
const nodemailer=require('nodemailer')


module.exports.register = async (req, res) => {
  let { paymentMethodId, ...data } = req.body;
  let createdUser = null; 
  let token = null;
  
  try {
      
      let alreadyExists = await userModel.findOne({ email: data.email });
      if (alreadyExists) {
          return res.status(400).json({
              error: "User already exists"
          });
      }

      // Create user and generate token
      const result = await new Promise(async (resolve, reject) => {
          try {
              const user = await userModel.create(data);
              
              const generatedToken = jwt.sign(
                  { _id: user._id, email: user.email }, 
                  process.env.JWT_KEY, 
                  { expiresIn: '7d' }
              );
              
              resolve({ user, token: generatedToken });
          } catch (error) {
              reject(error);
          }
      });
      
      createdUser = result.user;
      token = result.token;

      // Handle payment method if provided
      if (paymentMethodId) {
          try {
              const payload = {
                  paymentMethodId
              };

              // Create payment method token
              const paymentToken = jwt.sign(payload, process.env.JWT_KEY, {
                  expiresIn: "1y"
              });

              // Update user with payment method token
              createdUser = await userModel.findByIdAndUpdate(
                  createdUser._id,
                  { paymentMethodToken: paymentToken },
                  { new: true }
              );
          } catch (paymentError) {
              console.error('Payment method save failed:', paymentError.message);
              // Don't fail registration if payment method fails
              // User can add it later
          }
      }

      // Send welcome email
      const mailOptions = {
          from: 'orders@enrichifydata.com',
          to: createdUser.email,
          subject: 'Welcome to RentSimple - Your Account is Ready',
          html: `
            <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; background-color: #ffffff;">
              <!-- Header -->
              <div style="background-color: #024a47; padding: 30px; text-align: center;">
                <h1 style="color: #ffffff; margin: 0; font-size: 28px;">Welcome to RentSimple!</h1>
                <p style="color: #ecf0f1; margin-top: 10px; font-size: 16px;">Your account is officially set up</p>
              </div>
              
              <!-- Account Created Time -->
              <div style="padding: 20px; background-color: #f8f9fa; border-bottom: 2px solid #e9ecef;">
                <p style="margin: 0; color: #7f8c8d; font-size: 14px;">Account Created</p>
                <h2 style="margin: 5px 0 0 0; color: #2c3e50; font-size: 20px;">${new Date().toLocaleString('en-US', { 
                  dateStyle: 'full', 
                  timeStyle: 'short' 
                })}</h2>
              </div>
        
              <!-- Main Content -->
              <div style="padding: 30px;">
                <!-- Welcome Message -->
                <div style="margin-bottom: 30px;">
                  <h3 style="color: #2c3e50; margin-top: 0;">Hi ${createdUser.name || 'there'}! 👋</h3>
                  <p style="color: #495057; font-size: 15px; line-height: 1.6; margin: 0;">
                    Welcome aboard! Your RentSimple account is officially set up, and we're excited to support you with 
                    a smoother, more streamlined rental experience.
                  </p>
                  <p style="color: #495057; font-size: 15px; line-height: 1.6; margin-top: 15px;">
                    Whether you're here to rent or to list, your new account gives you access to a secure, modern platform 
                    designed to reduce friction, improve transparency, and keep every transaction moving with confidence.
                  </p>
                </div>
        
                <!-- What You Can Do -->
                <div style="margin-bottom: 25px;">
                  <h3 style="color: #2c3e50; border-bottom: 2px solid #024a47; padding-bottom: 10px; margin-top: 0;">
                    Here's What You Can Do Right Away
                  </h3>
                  
                  <!-- For Renters Section -->
                  <div style="background-color: #f8f9fa; padding: 20px; border-radius: 8px; margin-top: 15px;">
                    <h4 style="margin: 0 0 15px 0; color: #024a47; font-size: 18px;">For Renters</h4>
                    
                    <div style="display: flex; align-items: start; margin-bottom: 12px;">
                      <span style="color: #024a47; margin-right: 10px; font-size: 18px;">•</span>
                      <p style="margin: 0; color: #495057; font-size: 14px; line-height: 1.6;">
                        Browse available appliances
                      </p>
                    </div>
                    
                    <div style="display: flex; align-items: start; margin-bottom: 12px;">
                      <span style="color: #024a47; margin-right: 10px; font-size: 18px;">•</span>
                      <p style="margin: 0; color: #495057; font-size: 14px; line-height: 1.6;">
                        Submit rental requests
                      </p>
                    </div>
                    
                    <div style="display: flex; align-items: start; margin-bottom: 12px;">
                      <span style="color: #024a47; margin-right: 10px; font-size: 18px;">•</span>
                      <p style="margin: 0; color: #495057; font-size: 14px; line-height: 1.6;">
                        Manage payments through a secure billing portal
                      </p>
                    </div>
                    
                    <div style="display: flex; align-items: start;">
                      <span style="color: #024a47; margin-right: 10px; font-size: 18px;">•</span>
                      <p style="margin: 0; color: #495057; font-size: 14px; line-height: 1.6;">
                        Receive real-time updates and confirmations
                      </p>
                    </div>
                  </div>
        
                  <!-- For Vendors Section -->
                  <div style="background-color: #e7f3f2; padding: 20px; border-radius: 8px; margin-top: 15px;">
                    <h4 style="margin: 0 0 15px 0; color: #024a47; font-size: 18px;">For Vendors</h4>
                    
                    <div style="display: flex; align-items: start; margin-bottom: 12px;">
                      <span style="color: #024a47; margin-right: 10px; font-size: 18px;">•</span>
                      <p style="margin: 0; color: #495057; font-size: 14px; line-height: 1.6;">
                        Add inventory with clear pricing and availability
                      </p>
                    </div>
                    
                    <div style="display: flex; align-items: start; margin-bottom: 12px;">
                      <span style="color: #024a47; margin-right: 10px; font-size: 18px;">•</span>
                      <p style="margin: 0; color: #495057; font-size: 14px; line-height: 1.6;">
                        Communicate with renters through the integrated messaging system
                      </p>
                    </div>
                    
                    <div style="display: flex; align-items: start; margin-bottom: 12px;">
                      <span style="color: #024a47; margin-right: 10px; font-size: 18px;">•</span>
                      <p style="margin: 0; color: #495057; font-size: 14px; line-height: 1.6;">
                        Receive payouts through Stripe's secure banking network
                      </p>
                    </div>
                    
                    <div style="display: flex; align-items: start;">
                      <span style="color: #024a47; margin-right: 10px; font-size: 18px;">•</span>
                      <p style="margin: 0; color: #495057; font-size: 14px; line-height: 1.6;">
                        Manage performance, listings, and rental activity in your dashboard
                      </p>
                    </div>
                  </div>
                </div>
        
                <!-- Next Steps -->
                <div style="margin-top: 30px; padding: 20px; background-color: #fff3cd; border-left: 4px solid #ffc107; border-radius: 4px;">
                  <h4 style="margin: 0 0 10px 0; color: #856404; font-size: 16px;">⚡ Activate Your Account Fully</h4>
                  <p style="margin: 0; color: #856404; font-size: 14px; line-height: 1.6;">
                    To ensure fast approvals, secure payouts, and a seamless renting experience, make sure to complete 
                    the next steps outlined in your dashboard.
                  </p>
                </div>
        
                <!-- Call to Action Button -->
                <div style="text-align: center; margin-top: 30px;">
                  <a href="${process.env.FRONTEND_URL || 'https://rentsimpledeals.com'}/renterdashboard" 
                     style="display: inline-block; background-color: #024a47; color: #ffffff; padding: 15px 40px; text-decoration: none; border-radius: 8px; font-weight: 600; font-size: 16px;">
                    Log In to Your Dashboard
                  </a>
                </div>
        
                <!-- Support Section -->
                <div style="margin-top: 30px; padding: 20px; background-color: #f8f9fa; border-radius: 8px;">
                  <h4 style="margin: 0 0 10px 0; color: #2c3e50; font-size: 16px;">Need Support?</h4>
                  <p style="margin: 0; color: #495057; font-size: 14px; line-height: 1.6;">
                    If you ever need support, we're here to help. Our team is ready to assist you with any questions 
                    or concerns you may have.
                  </p>
                </div>
        
                <!-- Account Details -->
                <div style="margin-top: 20px; padding: 15px; background-color: #e9ecef; border-radius: 4px;">
                  <p style="margin: 0; color: #6c757d; font-size: 12px; text-align: center;">
                    Account Email: <strong>${createdUser.email}</strong>
                  </p>
                </div>
              </div>
        
              <!-- Footer -->
              <div style="background-color: #2c33e50; padding: 20px; text-align: center;">
                <p style="margin: 0; color: #ecf0f1; font-size: 12px;">
                  Thank you again for joining the RentSimple community — we're looking forward to being part of your day-to-day workflow.
                </p>
                <p style="margin: 10px 0 0 0; color: #95a5a6; font-size: 11px;">
                  © 2025 RentSimple. All rights reserved.
                </p>
              </div>
            </div>
          `
      };

      try {
          const transporter = nodemailer.createTransport({
              service: 'gmail',
              auth: {
                  user: 'rentsimple159@gmail.com', 
                  pass: 'upqbbmeobtztqxyg' 
              }
          });
          
          await transporter.sendMail(mailOptions);
      } catch (emailError) {
          console.error('Email sending failed:', emailError.message);
      }

      return res.status(201).json({
          token: token,
          message: "User registered successfully",
          userId: createdUser._id,
          paymentMethodSaved: !!paymentMethodId
      });

  } catch (e) {
      if (createdUser && createdUser._id) {
          try {
              await userModel.findByIdAndDelete(createdUser._id);
              console.log('Rolled back user creation due to error');
          } catch (deleteError) {
              console.error('Failed to rollback user creation:', deleteError.message);
          }
      }
      
      console.error('Registration error:', e.message);
      return res.status(500).json({
          error: "Facing issue while registering. Please try again.",
          details: e.message
      });
  }
};

module.exports.login = async (req, res) => {
  let { email, password } = req.body;
  
  try {
  
      let userFound = await userModel.findOne({ email });
      if (!userFound) {
          return res.status(404).json({
              error: "User not found"
          });
      }

      let passwordMatch = await userModel.findOne({email,password:password});
     
      
      if (!passwordMatch) {
          return res.status(401).json({
              error: "Invalid Password"
          });
      }

      let userToken = jwt.sign({ _id: userFound._id, email: userFound.email }, process.env.JWT_KEY, {
      });

      console.log("USERFOUND")
      console.log(userFound)

      return res.status(200).json({
          message: "User logged in successfully",
          token: userToken,
          userId:userFound._id
      });
  } catch (e) {
      console.log(e.message);
      return res.status(500).json({
          error: "Facing issue while login please try again",
          details: e.message
      });
  }
};



module.exports.getUser = async (req, res) => {
  try {
      const user = await userModel.findById(req.user._id);

      let paymentMethod = null;

      if (user.paymentMethodToken) {
          try {
              paymentMethod = jwt.verify(
                  user.paymentMethodToken,
                  process.env.JWT_KEY
              );
          } catch (err) {
             
              paymentMethod = null;
          }
      }

      console.log('paymentmethod')
      console.log(paymentMethod)
      return res.status(200).json({
          user,
          paymentMethod
      });

  } catch (e) {
      console.log(e.message);
      return res.status(500).json({
          error: "Facing issue while fetching user please try again",
          details: e.message
      });
  }
};


module.exports.resetPassword=async(req,res)=>{
    let {email,newPassword}=req.body;
  let password=newPassword

    try{

        let userFound=await userModel.findOne({email})
        if(!userFound){
return res.status(400).json({
    error:"No user found with this email"
})
        }
        let user=await userModel.updateOne({email},{
            $set:{
                password
            }
        })
        return res.status(200).json({
            message:"Password updated sucessfully"
        })
            }catch(e){
                console.log(e.message);
                return res.status(500).json({
                    error: "Facing issue while updating password please try again",
                    details: e.message
                });
            }
}



module.exports.updateUser=async(req,res)=>{
  let id=req?.user?._id?req?.user?._id:req.user.id
  let {...data}=req.body;
  try{
      let users=await userModel.findByIdAndUpdate(id,{
          $set:data
      })

return res.status(200).json({
  message:"User updated sucessfully"
})

  }catch(e){
console.log(e.message)
return res.status(400).json({
  error:"Facing issue while updating users"
})
  }
}



module.exports.changeUserPassword=async(req,res)=>{
  try {
    const { currentPassword, newPassword } = req.body;
let id=req?.user?._id?req?.user?._id:req.user.id
    const user = await userModel.findById(id).select('+password');
    
    const isMatch = await userModel.findOne({_id:id,password:currentPassword})
    if (!isMatch) {
      return res.status(401).json({ success: false, error: 'Current password is incorrect' });
    }
    
  user.password = newPassword;
    await userModel.findByIdAndUpdate(id,{
      $set:user
    })
    
    return res.json({ success: true, message: 'Password changed successfully' });
  } catch (error) {
    console.log(error.message)
    return res.status(500).json({ success: false, error: error.message });
  }
}

module.exports.paymentMethod = async (req, res) => {
  const userId = req.user._id ? req.user._id : req.user.id;

  try {
    const {paymentMethodId} = req.body;

  
    if (!paymentMethodId) {
      return res.status(400).json({
        error: "Missing required payment fields."
      });
    }

  
   
    const payload = {
      paymentMethodId
     
    };

    
    const token = jwt.sign(payload, process.env.JWT_KEY, {
      expiresIn: "1y"
    });

    
    const user = await userModel.findByIdAndUpdate(
      userId,
      { paymentMethodToken: token },
      { new: true }
    );

    return res.status(200).json({
      message: "Payment method saved successfully",
      paymentMethod: payload,
      user
    });

  } catch (e) {
    console.log(e.message);
    return res.status(400).json({
      error: "Error occurred while trying to save payment method",
      details: e.message
    });
  }
};
