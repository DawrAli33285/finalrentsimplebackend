


let {cloudinaryUploadImage}=require('../middleware/cloudinary')
const argon=require('argon2')
const fs=require('fs')

const userModel=require('../models/user');
const adminModel = require('../models/admin');
const nodemailer=require('nodemailer')
const vendor=require('../models/vendor')
const orderModel = require('../models/order');
const listingModel=require('../models/listing')
const Product = require('../models/products');
const SupportTicket  = require('../models/ticket');
const {SupportMessage}=require('../models/support');
const messageModel = require('../models/messages');
const requestModel = require('../models/request');




module.exports.getUsers = async (req, res) => {
    try {
       
        const page = parseInt(req.query.page) || 1;
        const limit = parseInt(req.query.limit) || 10;
        const search = req.query.search || '';
        const status = req.query.status || 'all';
        
       
        const skip = (page - 1) * limit;
       
        let searchQuery = { deletedUser: false };
        
       
        if (search) {
            searchQuery.$or = [
                { name: { $regex: search, $options: 'i' } },
                { email: { $regex: search, $options: 'i' } },
                { mobile: { $regex: search, $options: 'i' } }
            ];
        }
        
       
        if (status !== 'all') {
            if (status === 'active') {
                searchQuery.billingPaused = false;
            } else if (status === 'suspended') {
                searchQuery.billingPaused = true;
            }
        }
        
       
        const totalUsers = await userModel.countDocuments(searchQuery);
        
       
        const users = await userModel.find(searchQuery)
            .sort({ createdAt: -1 }) 
            .skip(skip)
            .limit(limit)
            .select('-password'); 
        
     
        const totalPages = Math.ceil(totalUsers / limit);
        const hasNext = page < totalPages;
        const hasPrev = page > 1;
        
        return res.status(200).json({
            users,
            pagination: {
                currentPage: page,
                totalPages,
                totalUsers,
                limit,
                hasNext,
                hasPrev
            }
        });

    } catch (e) {
        console.log(e.message);
        return res.status(400).json({
            error: "Facing issue while fetching users"
        });
    }
}



module.exports.getVendors = async (req, res) => {
    try {
       
        const page = parseInt(req.query.page) || 1;
        const limit = parseInt(req.query.limit) || 10;
        const search = req.query.search || '';
        const status = req.query.status || 'all';
        
       
        const skip = (page - 1) * limit;
       
  
let searchQuery = { 
    $or: [
        { deletedUser: { $exists: false } },
        { deletedUser: false }
    ]
};

        if (search) {
            searchQuery.$or = [
                { name: { $regex: search, $options: 'i' } },
                { email: { $regex: search, $options: 'i' } },
                { mobile: { $regex: search, $options: 'i' } }
            ];
        }
        
       
        if (status !== 'all') {
            if (status === 'active') {
                searchQuery.isActive = true;  
            } else if (status === 'suspended') {
                searchQuery.isActive = false;  
            }
        }
        
       
        const totalVendors = await vendor.countDocuments(searchQuery);
        
       
        const vendors = await vendor.find(searchQuery)
        .sort({ createdAt: -1 }) 
        .skip(skip)
        .limit(limit)
        .select('-password')
        .lean();
        const vendorIds = vendors.map(v => v._id);

        const revenueData = await orderModel.aggregate([
            {
                $match: {
                    vendor: { $in: vendorIds },
                    status: 'confirmed' 
                }
            },
            {
                $group: {
                    _id: '$vendor',
                    totalRevenue: { $sum: '$vendorPayout' }, 
                    totalOrders: { $sum: 1 }
                }
            }
        ]);
        
        
        const revenueMap = {};
        revenueData.forEach(item => {
            revenueMap[item._id.toString()] = {
                totalRevenue: item.totalRevenue || 0,
                totalOrders: item.totalOrders || 0
            };
        });
        
       
        vendors.forEach(v => {
            const vendorId = v._id.toString();
            const revenue = revenueMap[vendorId] || { totalRevenue: 0, totalOrders: 0 };
            
       
            if (!v.stats) {
                v.stats = {};
            }
            v.stats.totalRevenue = revenue.totalRevenue;
            v.stats.completedOrders = revenue.totalOrders;
        });
        
     
        const totalPages = Math.ceil(totalVendors / limit);
        const hasNext = page < totalPages;
        const hasPrev = page > 1;
        
        return res.status(200).json({
            vendors,
            pagination: {
                currentPage: page,
                totalPages,
                totalVendors,
                limit,
                hasNext,
                hasPrev
            }
        });

    } catch (e) {
        console.log(e.message);
        return res.status(400).json({
            error: "Facing issue while fetching users"
        });
    }
}
module.exports.updateUser=async(req,res)=>{
    let {id}=req.params;
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




module.exports.updateVendor = async(req, res) => {
  let {id} = req.params;
  let {...data} = req.body;
  
  try {
    console.log("STATUS")
    console.log(data)
      // Get vendor before update to access email
      const vendorBeforeUpdate = await vendor.findById(id);
      
      if (!vendorBeforeUpdate) {
          return res.status(404).json({
              error: "Vendor not found"
          });
      }

      // Update vendor
      await vendor.findByIdAndUpdate(id, {
          $set: data
      });

      const transporter = nodemailer.createTransport({
          service: 'gmail',
          auth: {
              user: 'rentsimple159@gmail.com', 
              pass: 'mlgioecamzoitfdt' 
          }
      });

      // Send email based on status change
      if (data.status === "active") {
          // ACTIVATION EMAIL
          const activationMailOptions = {
              from: 'orders@enrichifydata.com',
              to: vendorBeforeUpdate.email, 
              subject: '✅ Your Vendor Account Has Been Activated - RentSimple',
              html: `
                  <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; background-color: #ffffff;">
                      <!-- Header -->
                      <div style="background-color: #28a745; padding: 30px; text-align: center;">
                          <h1 style="color: #ffffff; margin: 0; font-size: 28px;">🎉 Account Activated!</h1>
                          <p style="color: #d4edda; margin-top: 10px; font-size: 16px;">Your vendor account is now active</p>
                      </div>
                      
                      <!-- Activation Time -->
                      <div style="padding: 20px; background-color: #f8f9fa; border-bottom: 2px solid #e9ecef;">
                          <p style="margin: 0; color: #7f8c8d; font-size: 14px;">Activated On</p>
                          <h2 style="margin: 5px 0 0 0; color: #2c3e50; font-size: 20px;">${new Date().toLocaleString('en-US', { 
                              dateStyle: 'full', 
                              timeStyle: 'short' 
                          })}</h2>
                      </div>
              
                      <!-- Main Content -->
                      <div style="padding: 30px;">
                          <div style="margin-bottom: 30px;">
                              <h3 style="color: #2c3e50; margin-top: 0;">Hi ${vendorBeforeUpdate.name || vendorBeforeUpdate.businessName || 'there'},</h3>
                              <p style="color: #495057; font-size: 15px; line-height: 1.6; margin: 0 0 15px 0;">
                                  Great news! Your vendor account has been reviewed and activated. You now have full access to the RentSimple platform and can start listing your appliances for rent.
                              </p>
                              <p style="color: #495057; font-size: 15px; line-height: 1.6; margin: 0;">
                                  Your account is fully operational and ready to generate rental income. You can now create listings, receive rental requests, and manage your inventory through the vendor dashboard.
                              </p>
                          </div>
                  
                          <!-- Success Banner -->
                          <div style="margin-top: 30px; padding: 25px; background-color: #d4edda; border-left: 4px solid #28a745; border-radius: 4px; text-align: center;">
                              <h2 style="margin: 0; color: #155724; font-size: 24px;">✅ All Systems Active</h2>
                              <p style="margin: 10px 0 0 0; color: #155724; font-size: 16px;">You're ready to start earning rental income</p>
                          </div>
                  
                          <!-- Account Details -->
                          <div style="margin-top: 30px;">
                              <h4 style="color: #2c3e50; margin-bottom: 15px;">Your Account Status:</h4>
                              <table style="width: 100%; border-collapse: collapse;">
                                  <tr>
                                      <td style="padding: 12px; background-color: #f8f9fa; font-weight: 600; width: 50%;">Account Status</td>
                                      <td style="padding: 12px; border: 1px solid #dee2e6;">
                                          <span style="background-color: #28a745; color: white; padding: 4px 12px; border-radius: 12px; font-size: 12px; font-weight: 600;">ACTIVE</span>
                                      </td>
                                  </tr>
                                  <tr>
                                      <td style="padding: 12px; background-color: #f8f9fa; font-weight: 600;">Email</td>
                                      <td style="padding: 12px; border: 1px solid #dee2e6;">${vendorBeforeUpdate.email}</td>
                                  </tr>
                                  ${vendorBeforeUpdate.businessName ? `
                                  <tr>
                                      <td style="padding: 12px; background-color: #f8f9fa; font-weight: 600;">Business Name</td>
                                      <td style="padding: 12px; border: 1px solid #dee2e6;">${vendorBeforeUpdate.businessName}</td>
                                  </tr>
                                  ` : ''}
                              </table>
                          </div>
                  
                          <!-- What's Next -->
                          <div style="margin-top: 30px;">
                              <h3 style="color: #2c3e50; border-bottom: 2px solid #28a745; padding-bottom: 10px;">
                                  🚀 What You Can Do Now
                              </h3>
                              
                              <div style="background-color: #f8f9fa; padding: 20px; border-radius: 8px; margin-top: 15px;">
                                  <div style="margin-bottom: 20px;">
                                      <div style="display: flex; align-items: start;">
                                          <span style="background-color: #28a745; color: white; width: 28px; height: 28px; border-radius: 50%; display: inline-flex; align-items: center; justify-content: center; font-weight: bold; margin-right: 12px; flex-shrink: 0;">1</span>
                                          <div>
                                              <h4 style="margin: 0 0 5px 0; color: #2c3e50; font-size: 16px;">Create Your First Listing</h4>
                                              <p style="margin: 0; color: #6c757d; font-size: 14px; line-height: 1.5;">
                                                  List your appliances with photos, pricing, and delivery options.
                                              </p>
                                          </div>
                                      </div>
                                  </div>
                          
                                  <div style="margin-bottom: 20px;">
                                      <div style="display: flex; align-items: start;">
                                          <span style="background-color: #28a745; color: white; width: 28px; height: 28px; border-radius: 50%; display: inline-flex; align-items: center; justify-content: center; font-weight: bold; margin-right: 12px; flex-shrink: 0;">2</span>
                                          <div>
                                              <h4 style="margin: 0 0 5px 0; color: #2c3e50; font-size: 16px;">Set Up Stripe Connect</h4>
                                              <p style="margin: 0; color: #6c757d; font-size: 14px; line-height: 1.5;">
                                                  Connect your bank account to receive automatic payouts.
                                              </p>
                                          </div>
                                      </div>
                                  </div>
                          
                                  <div>
                                      <div style="display: flex; align-items: start;">
                                          <span style="background-color: #28a745; color: white; width: 28px; height: 28px; border-radius: 50%; display: inline-flex; align-items: center; justify-content: center; font-weight: bold; margin-right: 12px; flex-shrink: 0;">3</span>
                                          <div>
                                              <h4 style="margin: 0 0 5px 0; color: #2c3e50; font-size: 16px;">Start Accepting Requests</h4>
                                              <p style="margin: 0; color: #6c757d; font-size: 14px; line-height: 1.5;">
                                                  Review and approve rental requests from customers.
                                              </p>
                                          </div>
                                      </div>
                                  </div>
                              </div>
                          </div>
                  
                          <!-- Call to Action Button -->
                          <div style="text-align: center; margin-top: 30px;">
                              <a href="${process.env.FRONTEND_URL || 'https://rentsimpledeals.com'}/vendordashboard" 
                                 style="display: inline-block; background-color: #28a745; color: #ffffff; padding: 15px 40px; text-decoration: none; border-radius: 8px; font-weight: 600; font-size: 16px;">
                                  Go to Dashboard
                              </a>
                          </div>
                  
                          <!-- Support Info -->
                          <div style="margin-top: 30px; padding: 20px; background-color: #f8f9fa; border-radius: 8px;">
                              <h4 style="margin: 0 0 10px 0; color: #2c3e50; font-size: 16px;">Need Help?</h4>
                              <p style="margin: 0; color: #495057; font-size: 14px; line-height: 1.6;">
                                  If you have any questions about setting up your listings or using the platform, our support team is ready to assist you.
                              </p>
                          </div>
                      </div>
              
                      <!-- Footer -->
                      <div style="background-color: #2c3e50; padding: 20px; text-align: center;">
                          <p style="margin: 0; color: #ecf0f1; font-size: 12px;">
                              Welcome to RentSimple!
                          </p>
                          <p style="margin: 10px 0 0 0; color: #95a5a6; font-size: 11px;">
                              © 2025 RentSimple. All rights reserved.
                          </p>
                      </div>
                  </div>
              `
          };
          
          await transporter.sendMail(activationMailOptions);
          console.log('✅ Activation email sent to:', vendorBeforeUpdate.email);
          
      } else if (data.status === "inactive") {
          // DEACTIVATION EMAIL
          const deactivationMailOptions = {
              from: 'orders@enrichifydata.com',
              to: vendorBeforeUpdate.email, 
              subject: '⚠️ Your Vendor Account Has Been Deactivated - RentSimple',
              html: `
                  <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; background-color: #ffffff;">
                      <!-- Header -->
                      <div style="background-color: #dc3545; padding: 30px; text-align: center;">
                          <h1 style="color: #ffffff; margin: 0; font-size: 28px;">⚠️ Account Deactivated</h1>
                          <p style="color: #f8d7da; margin-top: 10px; font-size: 16px;">Your vendor account has been deactivated</p>
                      </div>
                      
                      <!-- Deactivation Time -->
                      <div style="padding: 20px; background-color: #f8f9fa; border-bottom: 2px solid #e9ecef;">
                          <p style="margin: 0; color: #7f8c8d; font-size: 14px;">Deactivated On</p>
                          <h2 style="margin: 5px 0 0 0; color: #2c3e50; font-size: 20px;">${new Date().toLocaleString('en-US', { 
                              dateStyle: 'full', 
                              timeStyle: 'short' 
                          })}</h2>
                      </div>
              
                      <!-- Main Content -->
                      <div style="padding: 30px;">
                          <div style="margin-bottom: 30px;">
                              <h3 style="color: #2c3e50; margin-top: 0;">Hi ${vendorBeforeUpdate.name || vendorBeforeUpdate.businessName || 'there'},</h3>
                              <p style="color: #495057; font-size: 15px; line-height: 1.6; margin: 0 0 15px 0;">
                                  We're writing to inform you that your vendor account on RentSimple has been deactivated. This means you currently do not have access to create listings or accept new rental requests.
                              </p>
                              <p style="color: #495057; font-size: 15px; line-height: 1.6; margin: 0;">
                                  If you believe this is a mistake or would like to discuss reactivating your account, please contact our support team as soon as possible.
                              </p>
                          </div>
                  
                          <!-- Deactivation Notice -->
                          <div style="margin-top: 30px; padding: 25px; background-color: #f8d7da; border-left: 4px solid #dc3545; border-radius: 4px;">
                              <h2 style="margin: 0; color: #721c24; font-size: 20px;">Account Status: Inactive</h2>
                              <p style="margin: 10px 0 0 0; color: #721c24; font-size: 14px;">You cannot create new listings or accept rental requests while your account is deactivated.</p>
                          </div>
                  
                          <!-- Account Details -->
                          <div style="margin-top: 30px;">
                              <h4 style="color: #2c3e50; margin-bottom: 15px;">Account Information:</h4>
                              <table style="width: 100%; border-collapse: collapse;">
                                  <tr>
                                      <td style="padding: 12px; background-color: #f8f9fa; font-weight: 600; width: 50%;">Account Status</td>
                                      <td style="padding: 12px; border: 1px solid #dee2e6;">
                                          <span style="background-color: #dc3545; color: white; padding: 4px 12px; border-radius: 12px; font-size: 12px; font-weight: 600;">DEACTIVATED</span>
                                      </td>
                                  </tr>
                                  <tr>
                                      <td style="padding: 12px; background-color: #f8f9fa; font-weight: 600;">Email</td>
                                      <td style="padding: 12px; border: 1px solid #dee2e6;">${vendorBeforeUpdate.email}</td>
                                  </tr>
                                  ${vendorBeforeUpdate.businessName ? `
                                  <tr>
                                      <td style="padding: 12px; background-color: #f8f9fa; font-weight: 600;">Business Name</td>
                                      <td style="padding: 12px; border: 1px solid #dee2e6;">${vendorBeforeUpdate.businessName}</td>
                                  </tr>
                                  ` : ''}
                              </table>
                          </div>
                  
                          <!-- What This Means -->
                          <div style="margin-top: 30px;">
                              <h3 style="color: #2c3e50; border-bottom: 2px solid #dc3545; padding-bottom: 10px;">
                                  What This Means
                              </h3>
                              
                              <div style="background-color: #fff3cd; padding: 20px; border-radius: 8px; margin-top: 15px; border-left: 4px solid #ffc107;">
                                  <ul style="margin: 0; padding-left: 20px; color: #856404; font-size: 14px; line-height: 1.8;">
                                      <li>Your existing listings are no longer visible to customers</li>
                                      <li>You cannot create new listings</li>
                                      <li>You cannot accept new rental requests</li>
                                      <li>Existing active rentals will continue as scheduled</li>
                                      <li>You still have access to view your dashboard</li>
                                  </ul>
                              </div>
                          </div>
                  
                          <!-- Reactivation Info -->
                          <div style="margin-top: 30px; padding: 20px; background-color: #d1ecf1; border-left: 4px solid #17a2b8; border-radius: 4px;">
                              <h4 style="margin: 0 0 10px 0; color: #0c5460; font-size: 16px;">💡 Want to Reactivate Your Account?</h4>
                              <p style="margin: 0; color: #0c5460; font-size: 14px; line-height: 1.6;">
                                  If you'd like to reactivate your vendor account and resume listing your appliances, please contact our support team. We're here to help resolve any issues and get you back up and running.
                              </p>
                          </div>
                  
                          <!-- Call to Action Button -->
                          <div style="text-align: center; margin-top: 30px;">
                              <a href="mailto:rentsimple159@gmail.com" 
                                 style="display: inline-block; background-color: #024a47; color: #ffffff; padding: 15px 40px; text-decoration: none; border-radius: 8px; font-weight: 600; font-size: 16px;">
                                  Contact Support
                              </a>
                          </div>
                  
                          <!-- Support Info -->
                          <div style="margin-top: 30px; padding: 20px; background-color: #f8f9fa; border-radius: 8px;">
                              <h4 style="margin: 0 0 10px 0; color: #2c3e50; font-size: 16px;">Need Assistance?</h4>
                              <p style="margin: 0; color: #495057; font-size: 14px; line-height: 1.6;">
                                  Our support team is available to answer any questions about your account status. Reply to this email or contact us at rentsimple159@gmail.com.
                              </p>
                          </div>
                      </div>
              
                      <!-- Footer -->
                      <div style="background-color: #2c3e50; padding: 20px; text-align: center;">
                          <p style="margin: 0; color: #ecf0f1; font-size: 12px;">
                              RentSimple Support Team
                          </p>
                          <p style="margin: 10px 0 0 0; color: #95a5a6; font-size: 11px;">
                              © 2025 RentSimple. All rights reserved.
                          </p>
                      </div>
                  </div>
              `
          };
          
          await transporter.sendMail(deactivationMailOptions);
          console.log('📧 Deactivation email sent to:', vendorBeforeUpdate.email);
      }

      return res.status(200).json({
          message: "Vendor updated successfully"
      });

  } catch(e) {
      console.log('Error updating vendor:', e.message);
      return res.status(400).json({
          error: "Facing issue while updating vendor"
      });
  }
}



module.exports.deleteUser = async (req, res) => {
  const { id } = req.params;
  const stripe = require('stripe')(process.env.STRIPE_LIVE);
  
  try {
      // Step 1: Verify user exists
      const user = await userModel.findOne({ _id: id });
      
      if (!user) {
          return res.status(404).json({
              error: "User not found"
          });
      }

      // Step 2: Get orders first (before deleting anything)
      const orders = await orderModel.find({ user: id });
      
      // Step 3: Pause subscriptions BEFORE deleting anything
      let successCount = 0;
      let failCount = 0;
      let results = [];

      if (orders.length > 0) {
          // Pause subscriptions sequentially - if one fails, throw error
          for (const order of orders) {
              if (!order.subscriptionId) {
                  console.log(`Order ${order._id} has no subscription ID`);
                  results.push({ orderId: order._id, success: false, error: 'No subscription ID' });
                  failCount++;
                  continue;
              }

              try {
                  await stripe.subscriptions.update(order.subscriptionId, {
                      pause_collection: {
                          behavior: 'void'
                      }
                  });

                  results.push({ orderId: order._id, subscriptionId: order.subscriptionId, success: true });
                  successCount++;
                  console.log(`Paused subscription ${order.subscriptionId}`);

              } catch (error) {
                  console.error(`Failed to pause subscription ${order.subscriptionId}:`, error.message);
                  // Throw error to stop the deletion process
                  throw new Error(`Failed to pause subscription ${order.subscriptionId}: ${error.message}`);
              }
          }

          console.log(`Paused ${successCount} subscriptions, ${failCount} failed`);
      }

      // Step 4: Delete all related data in parallel (only after subscriptions are paused)
      const [requestsDeleted, supportMessagesDeleted, ordersDeleted, messagesDeleted] = await Promise.all([
          requestModel.deleteMany({ user: id }),
          SupportMessage.deleteMany({ user: id }),
          orderModel.deleteMany({ user: id }),
          messageModel.deleteMany({ user: id })
      ]);

      console.log(`Deleted: ${requestsDeleted.deletedCount} requests, ${supportMessagesDeleted.deletedCount} support messages, ${ordersDeleted.deletedCount} orders, ${messagesDeleted.deletedCount} messages`);

      // Step 5: Finally delete the user
      await userModel.findByIdAndDelete(id);
      console.log(`Deleted user ${id}`);

      return res.status(200).json({
          message: "User deleted successfully",
          deletedCounts: {
              requests: requestsDeleted.deletedCount,
              supportMessages: supportMessagesDeleted.deletedCount,
              orders: ordersDeleted.deletedCount,
              messages: messagesDeleted.deletedCount
          },
          subscriptionsPaused: successCount,
          subscriptionsFailed: failCount,
          details: results
      });

  } catch (e) {
      console.error('Delete user error:', e.message);
      return res.status(500).json({
          error: "Error while deleting user",
          details: e.message,
          note: "Deletion stopped at first failure. Some operations may have completed before the error."
      });
  }
};







module.exports.deleteVendor = async (req, res) => {
  const { id } = req.params;
  const stripe = require('stripe')(process.env.STRIPE_LIVE);
  
  try {
      // Step 1: Verify vendor exists
      const vendorfound = await vendor.findOne({ _id: id });
      
      if (!vendorfound) {
          return res.status(404).json({
              error: "Vendor not found"
          });
      }

      // Step 2: Delete all related data in parallel (they don't depend on each other)
      const [listingsDeleted, requestsDeleted, supportMessagesDeleted, messagesDeleted] = await Promise.all([
          listingModel.deleteMany({ vendor: id }),
          requestModel.deleteMany({ vendor: id }),
          SupportMessage.deleteMany({ vendor: id }),
          messageModel.deleteMany({ vendor: id })
      ]);

      console.log(`Deleted: ${listingsDeleted.deletedCount} listings, ${requestsDeleted.deletedCount} requests, ${supportMessagesDeleted.deletedCount} support messages, ${messagesDeleted.deletedCount} messages`);

      // Step 3: Handle orders and subscriptions (must be sequential)
      const orders = await orderModel.find({ user: id });
      
      let successCount = 0;
      let failCount = 0;
      let results = [];

      if (orders.length > 0) {
          // Pause subscriptions sequentially - if one fails, throw error
          for (const order of orders) {
              if (!order.subscriptionId) {
                  console.log(`Order ${order._id} has no subscription ID`);
                  continue;
              }

              await stripe.subscriptions.update(order.subscriptionId, {
                  pause_collection: {
                      behavior: 'void'
                  }
              });

              results.push({ orderId: order._id, subscriptionId: order.subscriptionId, success: true });
              successCount++;
              console.log(`Paused subscription ${order.subscriptionId}`);
          }

          // Step 4: Delete orders after pausing subscriptions
          const ordersDeleted = await orderModel.deleteMany({ vendor: id });
          console.log(`Deleted ${ordersDeleted.deletedCount} orders`);
      }

      // Step 5: Finally delete the vendor
      await vendor.findByIdAndDelete(id);
      console.log(`Deleted vendor ${id}`);

      return res.status(200).json({
          message: "Vendor deleted successfully",
          deletedCounts: {
              listings: listingsDeleted.deletedCount,
              requests: requestsDeleted.deletedCount,
              supportMessages: supportMessagesDeleted.deletedCount,
              messages: messagesDeleted.deletedCount,
              orders: orders.length
          },
          subscriptionsPaused: successCount
      });

  } catch (e) {
      console.error('Delete vendor error:', e.message);
      return res.status(500).json({
          error: "Error while deleting vendor",
          details: e.message,
          note: "Deletion stopped at first failure. Some operations may have completed before the error."
      });
  }
};


module.exports.updateProduct = async (req, res) => {
    let { ...data } = req.body;
    let { id } = req.params;
 
    try {
      
        if (req.file) {
            console.log('File received:', req.file.path);
          
            const cloudinaryResult = await cloudinaryUploadImage(req.file.path);
            
            if (cloudinaryResult.url) {
            
                data.images = [{
                    url: cloudinaryResult.url,
                    publicId: cloudinaryResult.public_id || ''
                }];
                console.log('Image uploaded to Cloudinary:', cloudinaryResult.url);
                
       
                fs.unlinkSync(req.file.path);
            } else {
                throw new Error('Failed to upload image to Cloudinary');
            }
        }
        
        
        if (data['pricing[rentPrice]'] || data['pricing[buyPrice]']) {
            data.pricing = {
                rentPrice: parseFloat(data['pricing[rentPrice]']) || 0,
                buyPrice: parseFloat(data['pricing[buyPrice]']) || 0
            };
            delete data['pricing[rentPrice]'];
            delete data['pricing[buyPrice]'];
        }

    
        const specifications = {};
        Object.keys(data).forEach(key => {
            if (key.startsWith('specifications[')) {
                const specKey = key.match(/specifications\[(.*?)\]/)[1];
                specifications[specKey] = data[key];
                delete data[key];
            }
        });
        if (Object.keys(specifications).length > 0) {
            data.specifications = specifications;
        }
        
     
        const updatedProduct = await listingModel.findByIdAndUpdate(
            id,
            { $set: data },
            { new: true, runValidators: true } 
        ).populate('vendor', 'name businessName email'); 
        
        if (!updatedProduct) {
            return res.status(404).json({
                success: false,
                error: "Product not found"
            });
        }
        
        if(data?.status=='active'){
          const mailOptions = {
            from: 'orders@enrichifydata.com',
            to: updatedProduct.vendor.email, 
            subject: 'Your Listing Has Been Approved! 🎉',
            html: `
              <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; background-color: #ffffff;">
                <!-- Header -->
                <div style="background-color: #024a47; padding: 30px; text-align: center;">
                  <h1 style="color: #ffffff; margin: 0; font-size: 28px;">✅ Listing Approved!</h1>
                  <p style="color: #ecf0f1; margin-top: 10px; font-size: 16px;">Your product is now live on RentSimple</p>
                </div>
                
                <!-- Approval Time -->
                <div style="padding: 20px; background-color: #f8f9fa; border-bottom: 2px solid #e9ecef;">
                  <p style="margin: 0; color: #7f8c8d; font-size: 14px;">Approved On</p>
                  <h2 style="margin: 5px 0 0 0; color: #2c3e50; font-size: 20px;">${new Date().toLocaleString('en-US', { 
                    dateStyle: 'full', 
                    timeStyle: 'short' 
                  })}</h2>
                </div>
          
                <!-- Main Content -->
                <div style="padding: 30px;">
                  <!-- Approval Message -->
                  <div style="margin-bottom: 30px;">
                    <h3 style="color: #2c3e50; margin-top: 0;">Hi ${updatedProduct.vendor.name || updatedProduct.vendor.businessName || 'there'},</h3>
                    <p style="color: #495057; font-size: 15px; line-height: 1.6; margin: 0 0 15px 0;">
                      Good news — your listing has been reviewed and officially approved. It's now live on the RentSimple marketplace and ready for renters to discover.
                    </p>
                    <p style="color: #495057; font-size: 15px; line-height: 1.6; margin: 0 0 15px 0;">
                      Your item is fully activated and eligible for rental requests, payouts, and visibility across the platform. This is a strong step forward in expanding your revenue stream and increasing your exposure to local renters.
                    </p>
                    <p style="color: #495057; font-size: 15px; line-height: 1.6; margin: 0;">
                      If you'd like to optimize the listing or add additional inventory, feel free to update your dashboard at any time. Our team is here to support you as you scale.
                    </p>
                  </div>
          
                  <!-- Success Badge -->
                  <div style="margin-bottom: 30px; padding: 20px; background-color: #d4edda; border-left: 4px solid #28a745; border-radius: 4px; text-align: center;">
                    <h4 style="margin: 0 0 10px 0; color: #155724; font-size: 18px;">✅ Now Live & Active</h4>
                    <p style="margin: 0; color: #155724; font-size: 14px; line-height: 1.6;">
                      Your listing is fully visible to customers and ready to generate rental income.
                    </p>
                  </div>
          
                  <!-- Product Information -->
                  <div style="margin-bottom: 25px;">
                    <h3 style="color: #2c3e50; border-bottom: 2px solid #024a47; padding-bottom: 10px; margin-top: 0;">
                      📦 Approved Listing Details
                    </h3>
                    
                    ${updatedProduct.images && updatedProduct.images.length > 0 ? `
                    <div style="text-align: center; margin: 20px 0;">
                      <img src="${updatedProduct.images.find(img => img.isPrimary)?.url || updatedProduct.images[0].url}" 
                           alt="${updatedProduct.title}" 
                           style="max-width: 100%; height: auto; border-radius: 8px; border: 1px solid #dee2e6;" />
                    </div>
                    ` : ''}
                    
                    <table style="width: 100%; border-collapse: collapse; margin-top: 20px;">
                      <tr>
                        <td style="padding: 12px; background-color: #f8f9fa; width: 35%; font-weight: 600; color: #2c3e50;">Product</td>
                        <td style="padding: 12px; border: 1px solid #dee2e6; color: #495057;">${updatedProduct.title}</td>
                      </tr>
                      <tr>
                        <td style="padding: 12px; background-color: #f8f9fa; font-weight: 600; color: #2c3e50;">Brand</td>
                        <td style="padding: 12px; border: 1px solid #dee2e6; color: #495057;">${updatedProduct.brand}</td>
                      </tr>
                      <tr>
                        <td style="padding: 12px; background-color: #f8f9fa; font-weight: 600; color: #2c3e50;">Category</td>
                        <td style="padding: 12px; border: 1px solid #dee2e6; color: #495057; text-transform: capitalize;">${updatedProduct.category}</td>
                      </tr>
                      <tr>
                        <td style="padding: 12px; background-color: #f8f9fa; font-weight: 600; color: #2c3e50;">Condition</td>
                        <td style="padding: 12px; border: 1px solid #dee2e6; color: #495057;">${updatedProduct.condition}</td>
                      </tr>
                      <tr>
                        <td style="padding: 12px; background-color: #f8f9fa; font-weight: 600; color: #2c3e50;">Monthly Rent</td>
                        <td style="padding: 12px; border: 1px solid #dee2e6; color: #024a47; font-weight: 700; font-size: 18px;">$${updatedProduct.pricing.rentPrice}/mo</td>
                      </tr>
                      <tr>
                        <td style="padding: 12px; background-color: #f8f9fa; font-weight: 600; color: #2c3e50;">Buy Price</td>
                        <td style="padding: 12px; border: 1px solid #dee2e6; color: #2c3e50; font-weight: 600; font-size: 16px;">$${updatedProduct.pricing.buyPrice}</td>
                      </tr>
                      ${updatedProduct.availability?.location ? `
                      <tr>
                        <td style="padding: 12px; background-color: #f8f9fa; font-weight: 600; color: #2c3e50;">Location</td>
                        <td style="padding: 12px; border: 1px solid #dee2e6; color: #495057;">${updatedProduct.availability.location}</td>
                      </tr>
                      ` : ''}
                    </table>
                  </div>
          
                  <!-- What's Next -->
                  <div style="margin-bottom: 25px;">
                    <h3 style="color: #2c3e50; border-bottom: 2px solid #024a47; padding-bottom: 10px;">
                      🚀 What's Next?
                    </h3>
                    
                    <div style="background-color: #f8f9fa; padding: 20px; border-radius: 8px; margin-top: 15px;">
                      <div style="margin-bottom: 20px;">
                        <div style="display: flex; align-items: start; margin-bottom: 15px;">
                          <span style="background-color: #024a47; color: white; width: 28px; height: 28px; border-radius: 50%; display: inline-flex; align-items: center; justify-content: center; font-weight: bold; margin-right: 12px; flex-shrink: 0;">1</span>
                          <div>
                            <h4 style="margin: 0 0 5px 0; color: #2c3e50; font-size: 16px;">Receive Rental Requests</h4>
                            <p style="margin: 0; color: #6c757d; font-size: 14px; line-height: 1.5;">
                              Customers can now send rental requests. You'll be notified via email and in your dashboard.
                            </p>
                          </div>
                        </div>
                      </div>
          
                      <div style="margin-bottom: 20px;">
                        <div style="display: flex; align-items: start; margin-bottom: 15px;">
                          <span style="background-color: #024a47; color: white; width: 28px; height: 28px; border-radius: 50%; display: inline-flex; align-items: center; justify-content: center; font-weight: bold; margin-right: 12px; flex-shrink: 0;">2</span>
                          <div>
                            <h4 style="margin: 0 0 5px 0; color: #2c3e50; font-size: 16px;">Review & Accept</h4>
                            <p style="margin: 0; color: #6c757d; font-size: 14px; line-height: 1.5;">
                              Review customer details and approve requests that work for your schedule.
                            </p>
                          </div>
                        </div>
                      </div>
          
                      <div>
                        <div style="display: flex; align-items: start;">
                          <span style="background-color: #024a47; color: white; width: 28px; height: 28px; border-radius: 50%; display: inline-flex; align-items: center; justify-content: center; font-weight: bold; margin-right: 12px; flex-shrink: 0;">3</span>
                          <div>
                            <h4 style="margin: 0 0 5px 0; color: #2c3e50; font-size: 16px;">Get Paid</h4>
                            <p style="margin: 0; color: #6c757d; font-size: 14px; line-height: 1.5;">
                              Receive secure payouts directly to your connected bank account after each rental.
                            </p>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
          
                  <!-- Call to Action Button -->
                  <div style="text-align: center; margin-top: 30px;">
                    <a href="${process.env.FRONTEND_URL || 'https://rentsimpledeals.com'}/vendordashboard" 
                       style="display: inline-block; background-color: #024a47; color: #ffffff; padding: 15px 40px; text-decoration: none; border-radius: 8px; font-weight: 600; font-size: 16px;">
                      View Your Dashboard
                    </a>
                  </div>
          
                  <!-- Revenue Potential -->
                  <div style="margin-top: 30px;">
                    <table style="width: 100%; border-collapse: collapse;">
                      <tr>
                        <td style="padding: 20px; background-color: #f8f9fa; text-align: center; border-right: 1px solid #dee2e6; width: 50%;">
                          <div style="font-size: 32px; font-weight: 700; color: #024a47; margin-bottom: 5px;">$${updatedProduct.pricing.rentPrice}</div>
                          <div style="color: #6c757d; font-size: 13px;">Monthly Income Potential</div>
                        </td>
                        <td style="padding: 20px; background-color: #f8f9fa; text-align: center; width: 50%;">
                          <div style="font-size: 32px; font-weight: 700; color: #024a47; margin-bottom: 5px;">24/7</div>
                          <div style="color: #6c757d; font-size: 13px;">Your Listing Works For You</div>
                        </td>
                      </tr>
                    </table>
                  </div>
          
                  <!-- Optimize Your Listing -->
                  <div style="margin-top: 30px; padding: 20px; background-color: #e7f3f2; border-left: 4px solid #024a47; border-radius: 4px;">
                    <h4 style="margin: 0 0 10px 0; color: #024a47; font-size: 16px;">💡 Tips to Maximize Success</h4>
                    <ul style="margin: 10px 0; padding-left: 20px; color: #495057; font-size: 14px; line-height: 1.8;">
                      <li>Respond to rental requests quickly to increase bookings</li>
                      <li>Keep your availability calendar updated</li>
                      <li>Add more quality photos to build trust</li>
                      <li>Consider adding more inventory to increase revenue</li>
                    </ul>
                  </div>
          
                  <!-- Closing Message -->
                  <div style="margin-top: 30px; text-align: center;">
                    <p style="color: #495057; font-size: 15px; line-height: 1.6; margin: 0;">
                      Thanks for partnering with RentSimple — we're excited to see your listing perform.
                    </p>
                  </div>
          
                  <!-- Listing ID -->
                  <div style="margin-top: 20px; padding: 15px; background-color: #e9ecef; border-radius: 4px; text-align: center;">
                    <p style="margin: 0; color: #6c757d; font-size: 12px;">
                      Listing ID: <strong>#${updatedProduct._id}</strong> • Account: ${updatedProduct.vendor.email}
                    </p>
                  </div>
                </div>
          
                <!-- Footer -->
                <div style="background-color: #2c3e50; padding: 20px; text-align: center;">
                  <p style="margin: 0; color: #ecf0f1; font-size: 12px;">
                    Thank you for choosing RentSimple!
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
            pass: 'mlgioecamzoitfdt' 
        }
      });
      
      const info = await transporter.sendMail(mailOptions);
        }else{
            const mailOptions = {
                from: 'orders@enrichifydata.com',
                to: updatedProduct.vendor.email, 
                subject: 'Your Listing Status Has Been Updated',
                html: `
                  <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; background-color: #ffffff;">
                    <!-- Header -->
                    <div style="background-color: #856404; padding: 30px; text-align: center;">
                      <h1 style="color: #ffffff; margin: 0; font-size: 28px;">⚠️ Listing Status Update</h1>
                      <p style="color: #fff3cd; margin-top: 10px; font-size: 16px;">Your listing has been temporarily paused</p>
                    </div>
                    
                    <!-- Status Update Time -->
                    <div style="padding: 20px; background-color: #f8f9fa; border-bottom: 2px solid #e9ecef;">
                      <p style="margin: 0; color: #7f8c8d; font-size: 14px;">Updated On</p>
                      <h2 style="margin: 5px 0 0 0; color: #2c3e50; font-size: 20px;">${new Date().toLocaleString('en-US', { 
                        dateStyle: 'full', 
                        timeStyle: 'short' 
                      })}</h2>
                    </div>
              
                    <!-- Main Content -->
                    <div style="padding: 30px;">
                      <!-- Status Message -->
                      <div style="margin-bottom: 30px;">
                        <h3 style="color: #2c3e50; margin-top: 0;">Hello ${updatedProduct.vendor.name || updatedProduct.vendor.businessName || 'there'},</h3>
                        <p style="color: #495057; font-size: 15px; line-height: 1.6; margin: 0;">
                          We're writing to inform you that your listing has been temporarily paused by our admin team. This means your product is currently not visible to customers on RentSimple.
                        </p>
                      </div>
              
                      <!-- Notice Box -->
                      <div style="margin-bottom: 25px; padding: 20px; background-color: #fff3cd; border-left: 4px solid #ffc107; border-radius: 4px;">
                        <h4 style="margin: 0 0 10px 0; color: #856404; font-size: 16px;">⚠️ Listing Status: ${data.status === 'paused' ? 'Paused' : data.status === 'hold' ? 'On Hold' : 'Inactive'}</h4>
                        <p style="margin: 0; color: #856404; font-size: 14px; line-height: 1.6;">
                          Your listing is temporarily unavailable and not visible to customers. This may be due to a quality review, policy compliance check, or other administrative reasons.
                        </p>
                      </div>
        
                      <!-- Product Information -->
                      <div style="margin-bottom: 25px;">
                        <h3 style="color: #2c3e50; border-bottom: 2px solid #024a47; padding-bottom: 10px; margin-top: 0;">
                          📦 Affected Listing
                        </h3>
                        
                        ${updatedProduct.images && updatedProduct.images.length > 0 ? `
                        <div style="text-align: center; margin: 20px 0;">
                          <img src="${updatedProduct.images.find(img => img.isPrimary)?.url || updatedProduct.images[0].url}" 
                               alt="${updatedProduct.title}" 
                               style="max-width: 100%; height: auto; border-radius: 8px; border: 1px solid #dee2e6; opacity: 0.7;" />
                        </div>
                        ` : ''}
                        
                        <table style="width: 100%; border-collapse: collapse; margin-top: 20px;">
                          <tr>
                            <td style="padding: 12px; background-color: #f8f9fa; width: 35%; font-weight: 600; color: #2c3e50;">Product</td>
                            <td style="padding: 12px; border: 1px solid #dee2e6; color: #495057;">${updatedProduct.title}</td>
                          </tr>
                          <tr>
                            <td style="padding: 12px; background-color: #f8f9fa; font-weight: 600; color: #2c3e50;">Brand</td>
                            <td style="padding: 12px; border: 1px solid #dee2e6; color: #495057;">${updatedProduct.brand}</td>
                          </tr>
                          <tr>
                            <td style="padding: 12px; background-color: #f8f9fa; font-weight: 600; color: #2c3e50;">Category</td>
                            <td style="padding: 12px; border: 1px solid #dee2e6; color: #495057; text-transform: capitalize;">${updatedProduct.category}</td>
                          </tr>
                          <tr>
                            <td style="padding: 12px; background-color: #f8f9fa; font-weight: 600; color: #2c3e50;">Current Status</td>
                            <td style="padding: 12px; border: 1px solid #dee2e6;">
                              <span style="background-color: #fff3cd; 
                                           color: #856404; 
                                           padding: 4px 12px; 
                                           border-radius: 12px; 
                                           font-size: 13px; 
                                           font-weight: 600;">
                                ⏸ ${data.status === 'paused' ? 'Paused' : data.status === 'hold' ? 'On Hold' : 'Inactive'}
                              </span>
                            </td>
                          </tr>
                          <tr>
                            <td style="padding: 12px; background-color: #f8f9fa; font-weight: 600; color: #2c3e50;">Monthly Rent</td>
                            <td style="padding: 12px; border: 1px solid #dee2e6; color: #6c757d;">$${updatedProduct.pricing.rentPrice}/mo</td>
                          </tr>
                        </table>
                      </div>
              
                      <!-- What This Means -->
                      <div style="margin-bottom: 25px;">
                        <h3 style="color: #2c3e50; border-bottom: 2px solid #024a47; padding-bottom: 10px;">
                          📋 What This Means
                        </h3>
                        
                        <div style="background-color: #f8f9fa; padding: 20px; border-radius: 8px; margin-top: 15px;">
                          <div style="margin-bottom: 20px;">
                            <div style="display: flex; align-items: start; margin-bottom: 15px;">
                              <span style="background-color: #856404; color: white; width: 28px; height: 28px; border-radius: 50%; display: inline-flex; align-items: center; justify-content: center; font-weight: bold; margin-right: 12px; flex-shrink: 0;">!</span>
                              <div>
                                <h4 style="margin: 0 0 5px 0; color: #2c3e50; font-size: 16px;">Not Visible to Customers</h4>
                                <p style="margin: 0; color: #6c757d; font-size: 14px; line-height: 1.5;">
                                  Your listing is temporarily hidden from search results and won't receive new rental requests.
                                </p>
                              </div>
                            </div>
                          </div>
              
                          <div style="margin-bottom: 20px;">
                            <div style="display: flex; align-items: start; margin-bottom: 15px;">
                              <span style="background-color: #856404; color: white; width: 28px; height: 28px; border-radius: 50%; display: inline-flex; align-items: center; justify-content: center; font-weight: bold; margin-right: 12px; flex-shrink: 0;">✓</span>
                              <div>
                                <h4 style="margin: 0 0 5px 0; color: #2c3e50; font-size: 16px;">Existing Rentals Continue</h4>
                                <p style="margin: 0; color: #6c757d; font-size: 14px; line-height: 1.5;">
                                  Any ongoing rentals are not affected and will continue as scheduled.
                                </p>
                              </div>
                            </div>
                          </div>
              
                          <div>
                            <div style="display: flex; align-items: start;">
                              <span style="background-color: #856404; color: white; width: 28px; height: 28px; border-radius: 50%; display: inline-flex; align-items: center; justify-content: center; font-weight: bold; margin-right: 12px; flex-shrink: 0;">📧</span>
                              <div>
                                <h4 style="margin: 0 0 5px 0; color: #2c3e50; font-size: 16px;">Contact Support for Details</h4>
                                <p style="margin: 0; color: #6c757d; font-size: 14px; line-height: 1.5;">
                                  Our support team can provide more information about why your listing was paused and next steps.
                                </p>
                              </div>
                            </div>
                          </div>
                        </div>
                      </div>
        
                      <!-- Possible Reasons -->
                      <div style="margin-bottom: 25px; padding: 20px; background-color: #e7f3f2; border-left: 4px solid #024a47; border-radius: 4px;">
                        <h4 style="margin: 0 0 10px 0; color: #024a47; font-size: 16px;">💡 Common Reasons for Pausing</h4>
                        <ul style="margin: 10px 0; padding-left: 20px; color: #495057; font-size: 14px; line-height: 1.8;">
                          <li>Quality review or compliance check in progress</li>
                          <li>Reported customer concerns being investigated</li>
                          <li>Missing or incomplete information in the listing</li>
                          <li>Policy updates requiring verification</li>
                          <li>Technical issues being resolved</li>
                        </ul>
                      </div>
        
                      <!-- Action Required -->
                      <div style="margin-bottom: 25px; padding: 20px; background-color: #fff3cd; border-left: 4px solid #ffc107; border-radius: 4px;">
                        <h4 style="margin: 0 0 10px 0; color: #856404; font-size: 16px;">🔔 Action Required</h4>
                        <p style="margin: 0; color: #856404; font-size: 14px; line-height: 1.6;">
                          <strong>Please contact our support team for more information.</strong> They can explain the specific reason for the pause and guide you through any necessary steps to get your listing back online.
                        </p>
                      </div>
              
                      <!-- Call to Action Buttons -->
                      <div style="text-align: center; margin-top: 30px;">
                        <a href="${process.env.FRONTEND_URL || 'https://rentsimpledeals.com'}/chat" 
                           style="display: inline-block; background-color: #024a47; color: #ffffff; padding: 15px 40px; text-decoration: none; border-radius: 8px; font-weight: 600; font-size: 16px; margin: 0 10px 10px 10px;">
                          Contact Support
                        </a>
                        <a href="${process.env.FRONTEND_URL || 'https://rentsimpledeals.com'}/vendordashboard" 
                           style="display: inline-block; background-color: #6c757d; color: #ffffff; padding: 15px 40px; text-decoration: none; border-radius: 8px; font-weight: 600; font-size: 16px; margin: 0 10px 10px 10px;">
                          View Dashboard
                        </a>
                      </div>
              
                      <!-- Customer Support -->
                      <div style="margin-top: 30px; padding: 20px; background-color: #f8f9fa; border-radius: 8px;">
                        <h4 style="margin: 0 0 10px 0; color: #2c3e50; font-size: 16px;">Need Help?</h4>
                        <p style="margin: 0; color: #495057; font-size: 14px; line-height: 1.6;">
                          Our support team is available to answer your questions and help resolve any issues with your listing. We're committed to getting you back up and running as quickly as possible.
                        </p>
                      </div>
              
                      <!-- Listing ID -->
                      <div style="margin-top: 20px; padding: 15px; background-color: #e9ecef; border-radius: 4px; text-align: center;">
                        <p style="margin: 0; color: #6c757d; font-size: 12px;">
                          Listing ID: <strong>#${updatedProduct._id}</strong> • Account: ${updatedProduct.vendor.email}
                        </p>
                      </div>
                    </div>
              
                    <!-- Footer -->
                    <div style="background-color: #2c3e50; padding: 20px; text-align: center;">
                      <p style="margin: 0; color: #ecf0f1; font-size: 12px;">
                        Thank you for your understanding and cooperation.
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
            pass: 'mlgioecamzoitfdt' 
        }
      });
      
      const info = await transporter.sendMail(mailOptions);
        }
        return res.status(200).json({
            success: true,
            message: "Product updated successfully",
            product: updatedProduct
        });
    } catch (e) {
        console.log('Error updating product:', e.message);
        return res.status(400).json({
            success: false,
            error: "Facing issue while updating product: " + e.message
        });
    }
}


module.exports.getProducts = async (req, res) => {
  
    try {

        const page = parseInt(req.query.page) || 1;
        const limit = parseInt(req.query.limit) || 10;
        const search = req.query.search || '';
        const status = req.query.status || 'all';
        const category = req.query.category || 'all';
        const condition = req.query.condition || 'all';
        const price = req.query.price || 'all';
        
        const skip = (page - 1) * limit;
        
        let searchQuery = {};
        
        
        if (search) {
            searchQuery.$or = [
                { title: { $regex: search, $options: 'i' } },
                { brand: { $regex: search, $options: 'i' } },
                { description: { $regex: search, $options: 'i' } }
            ];
        }
      
     
        if (status !== 'all') {
            searchQuery.status = status;
        }

    
        if (category !== 'all') {
            searchQuery.category = category;
        }

        
        if (condition !== 'all') {
            searchQuery.condition = condition;
        }

       
        if (price !== 'all') {
            switch (price) {
                case 'low':
                    searchQuery['pricing.rentPrice'] = { $lte: 50 };
                    break;
                case 'medium':
                    searchQuery['pricing.rentPrice'] = { $gt: 50, $lte: 150 };
                    break;
                case 'high':
                    searchQuery['pricing.rentPrice'] = { $gt: 150 };
                    break;
            }
        }
        
     
        const totalProducts = await listingModel.countDocuments(searchQuery);
        
       
        const products = await listingModel.find(searchQuery)
            .populate('vendor', 'name businessName email')
            .sort({ createdAt: -1 })
            .skip(skip)
            .limit(limit);
        
        const totalPages = Math.ceil(totalProducts / limit);
        const hasNext = page < totalPages;
        const hasPrev = page > 1;

        console.log("PRODUCTS ARE")
        
     console.log(products)
        return res.status(200).json({
            products,
            pagination: {
                currentPage: page,
                totalPages,
                totalProducts,
                limit,
                hasNext,
                hasPrev
            }
        });

    } catch (e) {
        console.log(e.message);
        return res.status(400).json({
            error: "Facing issue while fetching products"
        });
    }
}


module.exports.getOrders = async (req, res) => {
    try {
        const page = parseInt(req.query.page) || 1;
        const limit = parseInt(req.query.limit) || 10;
        const search = req.query.search || '';
        const status = req.query.status || 'all';
        const paymentStatus = req.query.paymentStatus || 'all';
        const transferStatus = req.query.transferStatus || 'all';
        
        const skip = (page - 1) * limit;
        
        let searchQuery = {};
        
   
        if (search) {
            searchQuery.$or = [
                { orderNumber: { $regex: search, $options: 'i' } },
                { subscriptionId: { $regex: search, $options: 'i' } },
                { trackingNumber: { $regex: search, $options: 'i' } },
                { paymentIntentId: { $regex: search, $options: 'i' } },
                { 'deliveryAddress.street': { $regex: search, $options: 'i' } },
                { 'deliveryAddress.city': { $regex: search, $options: 'i' } },
                { 'deliveryAddress.zipCode': { $regex: search, $options: 'i' } }
            ];
        }
        
        
        if (status !== 'all') {
            searchQuery.status = status;
        }
        
        
        if (paymentStatus !== 'all') {
            searchQuery.paymentStatus = paymentStatus;
        }
        
      
        if (transferStatus !== 'all') {
            searchQuery.transferStatus = transferStatus;
        }
        
       
        const totalOrders = await orderModel.countDocuments(searchQuery);
        
        
        const orders = await orderModel.find(searchQuery)
            .populate('user', 'name email phone')
            .populate('vendor', 'name businessName email phone')
            .populate('listing', 'title category pricing images')
            .populate('request', 'requestType status')
            .sort({ createdAt: -1 })
            .skip(skip)
            .limit(limit)
            .lean(); 
        
    
        const totalPages = Math.ceil(totalOrders / limit);
        const hasNext = page < totalPages;
        const hasPrev = page > 1;
        
        return res.status(200).json({
            success: true,
            orders,
            pagination: {
                currentPage: page,
                totalPages,
                totalOrders,
                limit,
                hasNext,
                hasPrev
            }
        });

    } catch (e) {
        console.log('Error fetching orders:', e.message);
        return res.status(400).json({
            success: false,
            error: "Facing issue while fetching orders: " + e.message
        });
    }
}



module.exports.pauseSubscription = async (req, res) => {
    
const stripe = require('stripe')(process.env.STRIPE_LIVE);
    try {
        let {subscriptionId}=req.params
        
        let order = await orderModel.findOne({_id:subscriptionId})
       

      
        const subscription = await stripe.subscriptions.update(
            order.subscriptionId,
            {
                pause_collection: {
                    behavior: 'void', 
                },
            }
        );

   
        await orderModel.findByIdAndUpdate(order._id, {
            status: 'paused',
            pausedAt: new Date()
        });


        return res.status(200).json({
            message:"Subscription paused sucessfully"
        })

    } catch (e) {
        console.log("Pause billing error:", e.message);
        return res.status(500).json({
            error: "Facing issue while pausing billing please try again",
            details: e.message
        });
    }
}





module.exports.unPauseSubscription = async (req, res) => {
    
const stripe = require('stripe')(process.env.STRIPE_LIVE);
    try {
        let { subscriptionId } = req.params;
        
        console.log('Unpausing subscription for ID:', subscriptionId);
        
        let order = await orderModel.findOne({ _id: subscriptionId });
        
        if (!order) {
            return res.status(404).json({
                error: "Order not found"
            });
        }

        console.log('Current order status:', order.status);
        console.log('Current subscriptionId:', order.subscriptionId);

       
        const subscription = await stripe.subscriptions.update(
            order.subscriptionId,
            {
                pause_collection: '' 
            }
        );

        console.log('Stripe subscription update response:', subscription.status);

      
        const updatedOrder = await orderModel.findByIdAndUpdate(
            order._id, 
            {
                $set: { 
                    status: 'active',
                 
                    billingPaused: false
                },
                $unset: { pausedAt: 1 }
            },
            { new: true } 
        );

        console.log('Updated order:', updatedOrder);

        return res.status(200).json({
            message: "Subscription unpaused successfully",
            order: updatedOrder
        });

    } catch (e) {
        console.log("Unpause billing error:", e.message);
        return res.status(500).json({
            error: "Facing issue while unpausing billing please try again",
            details: e.message
        });
    }
}


module.exports.getDashboardData=async(req,res)=>{
    
    try{
let users=await userModel.find({})
let products=await Product.find({})
let orders=await orderModel.find({})

return res.status(200).json({
    users,
    products,
    orders
})

    }catch(e){
        console.log("Unpause billing error:", e.message);
        return res.status(500).json({
            error: "Facing issue while fetching data",
           
        });
    }
}

module.exports.createAdmin=async(req,res)=>{
  let {...data}=req.body;
  try{
await adminModel.create(data)
return res.status(200).json({
  message:"Admin created sucessfully"
})
  }catch(e){
console.log(e.message)
return res.status(400).json({
  error:"Error while creating admin"
})
  }
}



module.exports.loginAdmin=async(req,res)=>{
  let {...data}=req.body;
  try{
let emailCorrect=await adminModel.findOne({email:data.email})
if(!emailCorrect){
  return res.status(400).json({
      error:"No admin with this email found"
  })
}


let passwordMatch=await adminModel.findOne({password:data.password})
if(!passwordMatch){
  return res.status(400).json({
      error:"Password is incorrect"
  })
}

return res.status(200).json({
  message:"Logged in sucessfully"
})
  }catch(e){
console.log(e.message)
return res.status(400).json({
  error:"Error while creating admin"
})
  }
}







module.exports.resetAdmin=async(req,res)=>{
  let {...data}=req.body;
  try{
let emailCorrect=await adminModel.findOne({email:data.email})
if(!emailCorrect){
  return res.status(400).json({
      error:"No admin with this email found"
  })
}


await adminModel.findByIdAndUpdate(emailCorrect._id,{
  $set:{
      password:data.password
  }
})

return res.status(200).json({
  message:"Password reseted sucessfully"
})
  }catch(e){
console.log(e.message)
return res.status(400).json({
  error:"Error while creating admin"
})
  }
}





module.exports.getRentals = async (req, res) => {
    try {
        const page = parseInt(req.query.page) || 1;
        const limit = parseInt(req.query.limit) || 10;
        const search = req.query.search || '';
        const status = req.query.status || 'all';
        const paymentStatus = req.query.paymentStatus || 'all';
        const transferStatus = req.query.transferStatus || 'all';
        
        const skip = (page - 1) * limit;
        
       
        let searchQuery = {
            status: { $in: ['confirmed', 'paused'] }
        };
        
        
        if (status !== 'all') {
            searchQuery.status = status;
        }
        
       
        if (search) {
            searchQuery.$or = [
                { orderNumber: { $regex: search, $options: 'i' } },
                { subscriptionId: { $regex: search, $options: 'i' } },
                { trackingNumber: { $regex: search, $options: 'i' } },
                { paymentIntentId: { $regex: search, $options: 'i' } },
                { 'deliveryAddress.street': { $regex: search, $options: 'i' } },
                { 'deliveryAddress.city': { $regex: search, $options: 'i' } },
                { 'deliveryAddress.zipCode': { $regex: search, $options: 'i' } }
            ];
        }
    
        if (paymentStatus !== 'all') {
            searchQuery.paymentStatus = paymentStatus;
        }
        
        if (transferStatus !== 'all') {
            searchQuery.transferStatus = transferStatus;
        }
        
        const totalOrders = await orderModel.countDocuments(searchQuery);
        
        const orders = await orderModel.find(searchQuery)
            .populate('user', 'name email phone')
            .populate('vendor', 'name businessName email phone')
            .populate('listing', 'title category pricing images')
            .populate('request', 'requestType status')
            .sort({ createdAt: -1 })
            .skip(skip)
            .limit(limit)
            .lean(); 
    
        const totalPages = Math.ceil(totalOrders / limit);
        const hasNext = page < totalPages;
        const hasPrev = page > 1;
        
        return res.status(200).json({
            success: true,
            orders,
            pagination: {
                currentPage: page,
                totalPages,
                totalOrders,
                limit,
                hasNext,
                hasPrev
            }
        });

    } catch (e) {
        console.log('Error fetching orders:', e.message);
        return res.status(400).json({
            success: false,
            error: "Facing issue while fetching orders: " + e.message
        });
    }
}


module.exports.updateStatus=async(req,res)=>{
    let {newStatus}=req.body;
    let {id}=req.params;
    try{
let order=await orderModel.findByIdAndUpdate(id,{
    $set:{
        status:newStatus
    }
},{
    new:true
})

const stripe = require('stripe')(process.env.STRIPE_LIVE);

let updateData = {
};

if (newStatus === "confirmed") {

  updateData.pause_collection = null;
} else {
 
  updateData.pause_collection = {
    behavior: 'mark_uncollectible' 
  };
}

const subscription = await stripe.subscriptions.update(
  order.subscriptionId,
  updateData
);




return res.status(200).json({
    message:`Rental ${newStatus} sucessfully`
})

    }catch(e){
console.log(e.message)
return res.status(400).json({
    error:"Error occured while trying to update the status of rental"
})        

    }
}


module.exports.supportSendMessage = async(req, res) => {
    console.log('Request body:', req.body);
    
    const { message, ticketId, userType } = req.body;
    const userId=req?.user?._id?req?.user?._id:req?.user?.id
    
    if (!message || !userId || !userType) {
      return res.status(400).json({ 
        error: 'Missing required fields',
        received: { message: !!message, userId: !!userId, userType: !!userType }
      });
    }
    
    try {
      let ticket;
      
      if (!ticketId) {
        ticket = await SupportTicket.create({
          userId: userId,
          userType: userType,
          status: 'open',
          lastMessageAt: new Date()
        });
        console.log('Created new ticket:', ticket._id);
      } else {
        ticket = await SupportTicket.findById(ticketId);
        if (!ticket) {
          return res.status(404).json({ error: 'Ticket not found' });
        }
        ticket.lastMessageAt = new Date();
        ticket.status = 'open'; 
        await ticket.save();
        console.log('Updated existing ticket:', ticket._id);
      }
      
    
      const messageData = {
        ticketId: ticket._id,
        sentBy: userType, 
        senderId: userId,
        senderModel: userType === 'vendor' ? 'Vendor' : 'user',
        message: message,
        seenByUser: true, 
        seenByAdmin: false
      };
      
     
      console.log('Message data to be created:', JSON.stringify(messageData, null, 2));
      
     
      console.log('Field check:', {
        'ticketId exists': !!messageData.ticketId,
        'ticketId value': messageData.ticketId,
        'sentBy exists': !!messageData.sentBy,
        'sentBy value': messageData.sentBy,
        'senderId exists': !!messageData.senderId,
        'senderId value': messageData.senderId,
        'senderModel exists': !!messageData.senderModel,
        'senderModel value': messageData.senderModel,
        'message exists': !!messageData.message,
        'message value': messageData.message
      });
      
      const newMessage = await SupportMessage.create(messageData);
      
      console.log('Message created successfully:', newMessage._id);

      if (typeof io !== 'undefined' && io) {
        io.to('admin-room').emit('newSupportMessage', {
          ticketId: ticket._id,
          message: newMessage,
          userType: userType
        });
      }
      
      res.json({ 
        success: true, 
        ticketId: ticket._id,
        messageId: newMessage._id 
      });
      
    } catch (error) {
      console.log('Error in supportSendMessage:', error);
      res.status(500).json({ error: error.message });
    }
  };


module.exports.adminsupportsendmessage=async(req,res)=>{
    const { ticketId, message,adminId="6920a166feae6e4743875b16" } = req.body;
    
    try {
        const ticket = await SupportTicket.findById(ticketId)
        .populate('userId');
      
      if (!ticket) {
        return res.status(404).json({ error: 'Ticket not found' });
      }
      
   
      ticket.lastMessageAt = new Date();
      ticket.status = 'pending'; 
      if (!ticket.assignedAdmin) {
        ticket.assignedAdmin = adminId;
      }
      await ticket.save();
      
    
      const newMessage = await SupportMessage.create({
        ticketId: ticketId,
        sentBy: 'admin',
        senderId: adminId,
        senderModel: 'admin',
        message: message,
        seenByAdmin: true,
        seenByUser: false
      });
     
   
      if (ticket.userId && ticket.userId.email) {
        const user = ticket.userId;
        const userType = ticket.userType || 'user'; // 'user' for renter, 'vendor' for vendor
        const userName = user.name || user.businessName || user.email;
        
        const mailOptions = {
          from: 'orders@enrichifydata.com',
          to: user.email,
          subject: '💬 Support Team Response - RentSimple',
          html: `
            <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; background-color: #ffffff;">
              <!-- Header -->
              <div style="background-color: #0d6efd; padding: 30px; text-align: center;">
                <h1 style="color: #ffffff; margin: 0; font-size: 28px;">💬 Support Response</h1>
                <p style="color: #cfe2ff; margin-top: 10px; font-size: 16px;">Our support team has responded to your ticket</p>
              </div>
              
              <!-- Time -->
              <div style="padding: 20px; background-color: #f8f9fa; border-bottom: 2px solid #e9ecef;">
                <p style="margin: 0; color: #7f8c8d; font-size: 14px;">Received On</p>
                <h2 style="margin: 5px 0 0 0; color: #2c3e50; font-size: 20px;">${new Date().toLocaleString('en-US', { 
                  dateStyle: 'full', 
                  timeStyle: 'short' 
                })}</h2>
              </div>
    
              <!-- Main Content -->
              <div style="padding: 30px;">
                <h3 style="color: #2c3e50; border-bottom: 2px solid #0d6efd; padding-bottom: 10px; margin-top: 0;">
                  Support Team Message
                </h3>
                
                <p style="color: #495057; font-size: 16px; line-height: 1.6; margin-top: 20px;">
                  Hello <strong>${userName}</strong>,
                </p>
                
                <p style="color: #495057; font-size: 16px; line-height: 1.6;">
                  Our support team has responded to your ticket. Please review the message below and feel free to reply if you need further assistance.
                </p>
    
                <!-- Ticket Information -->
                <h4 style="color: #2c3e50; margin-top: 30px; margin-bottom: 15px;">Ticket Information:</h4>
                
                <table style="width: 100%; border-collapse: collapse; margin-top: 20px;">
                  <tr>
                    <td style="padding: 12px; background-color: #f8f9fa; width: 40%; font-weight: 600; color: #2c3e50;">Ticket ID</td>
                    <td style="padding: 12px; border: 1px solid #dee2e6; color: #495057; font-family: monospace;">#${ticket._id}</td>
                  </tr>
                  ${ticket.subject ? `
                  <tr>
                    <td style="padding: 12px; background-color: #f8f9fa; font-weight: 600; color: #2c3e50;">Subject</td>
                    <td style="padding: 12px; border: 1px solid #dee2e6; color: #495057;">${ticket.subject}</td>
                  </tr>
                  ` : ''}
                  ${ticket.category ? `
                  <tr>
                    <td style="padding: 12px; background-color: #f8f9fa; font-weight: 600; color: #2c3e50;">Category</td>
                    <td style="padding: 12px; border: 1px solid #dee2e6; color: #495057; text-transform: capitalize;">${ticket.category}</td>
                  </tr>
                  ` : ''}
                  <tr>
                    <td style="padding: 12px; background-color: #f8f9fa; font-weight: 600; color: #2c3e50;">Status</td>
                    <td style="padding: 12px; border: 1px solid #dee2e6;">
                      <span style="background-color: #ffc107; color: #000; padding: 4px 12px; border-radius: 12px; font-size: 12px; font-weight: 600; text-transform: uppercase;">${ticket.status}</span>
                    </td>
                  </tr>
                  <tr>
                    <td style="padding: 12px; background-color: #f8f9fa; font-weight: 600; color: #2c3e50;">User Type</td>
                    <td style="padding: 12px; border: 1px solid #dee2e6; color: #495057; text-transform: capitalize;">${userType === 'vendor' ? 'Vendor' : 'Renter'}</td>
                  </tr>
                </table>
    
                <!-- Support Message -->
                <div style="margin-top: 30px; padding: 25px; background-color: #e7f3ff; border-left: 4px solid #0d6efd; border-radius: 4px;">
                  <div style="display: flex; align-items: center; margin-bottom: 15px;">
                    <div style="background-color: #0d6efd; color: white; width: 40px; height: 40px; border-radius: 50%; display: flex; align-items: center; justify-content: center; font-weight: bold; font-size: 18px; margin-right: 15px;">
                      🛟
                    </div>
                    <div>
                      <h4 style="margin: 0; color: #084298; font-size: 16px;">RentSimple Support Team</h4>
                      <p style="margin: 0; color: #6c757d; font-size: 12px;">Admin Response</p>
                    </div>
                  </div>
                  <div style="padding: 15px; background-color: #ffffff; border-radius: 8px; border: 1px solid #b6d4fe;">
                    <p style="margin: 0; color: #495057; font-size: 14px; line-height: 1.8; white-space: pre-wrap;">${message}</p>
                  </div>
                </div>
    
                <!-- Response Reminder -->
                <div style="margin-top: 30px; padding: 20px; background-color: #d1ecf1; border-left: 4px solid #17a2b8; border-radius: 4px;">
                  <h4 style="margin: 0 0 10px 0; color: #0c5460; font-size: 16px;">💡 Need More Help?</h4>
                  <p style="margin: 0; color: #0c5460; font-size: 14px; line-height: 1.6;">
                    If you have additional questions or need further clarification, simply reply to this ticket through your dashboard. Our team is here to help you!
                  </p>
                </div>
    
                <!-- Call to Action Button -->
                <div style="text-align: center; margin-top: 30px;">
                  <a href="${process.env.FRONTEND_URL || 'https://rentsimpledeals.com'}/${userType === 'vendor' ? 'vendor' : 'dashboard'}/support/tickets/${ticket._id}" 
                     style="display: inline-block; background-color: #0d6efd; color: #ffffff; padding: 15px 40px; text-decoration: none; border-radius: 8px; font-weight: 600; font-size: 16px;">
                    View & Reply to Ticket
                  </a>
                </div>
    
                <!-- Quick Tips -->
                <div style="margin-top: 30px; padding: 20px; background-color: #fff3cd; border-left: 4px solid #ffc107; border-radius: 4px;">
                  <h4 style="margin: 0 0 10px 0; color: #856404; font-size: 16px;">⚡ Quick Tips</h4>
                  <ul style="margin: 10px 0; padding-left: 20px; color: #856404; font-size: 14px; line-height: 1.8;">
                    <li>Reply promptly to get faster resolution</li>
                    <li>Provide any additional details that might help</li>
                    <li>Check your dashboard regularly for updates</li>
                    <li>You can attach screenshots if needed</li>
                  </ul>
                </div>
    
                <!-- Response Time -->
                <div style="margin-top: 30px; padding: 20px; background-color: #d4edda; border-left: 4px solid #28a745; border-radius: 4px;">
                  <h4 style="margin: 0 0 10px 0; color: #155724; font-size: 16px;">⏰ Our Commitment</h4>
                  <p style="margin: 0; color: #155724; font-size: 14px; line-height: 1.6;">
                    <strong>Average Response Time:</strong> Our support team typically responds within 2-4 hours during business hours. For urgent matters, we'll prioritize your ticket accordingly.
                  </p>
                </div>
    
                <!-- Support Info -->
                <div style="margin-top: 30px; padding: 20px; background-color: #f8f9fa; border-radius: 8px;">
                  <h4 style="margin: 0 0 10px 0; color: #2c3e50; font-size: 16px;">📞 Alternative Contact</h4>
                  <p style="margin: 0; color: #495057; font-size: 14px; line-height: 1.6;">
                    For urgent matters, you can also reach us directly through:
                  </p>
                  <ul style="margin: 10px 0 0 0; padding-left: 20px; color: #495057; font-size: 14px; line-height: 1.8;">
                    <li><strong>Email:</strong> support@rentsimple.com</li>
                    <li><strong>Phone:</strong> Available in your dashboard</li>
                  </ul>
                </div>
    
                <!-- Ticket ID -->
                <div style="margin-top: 20px; padding: 15px; background-color: #e9ecef; border-radius: 4px; text-align: center;">
                  <p style="margin: 0; color: #6c757d; font-size: 12px;">
                    Ticket Reference: <strong>#${ticket._id}</strong> • Message ID: <strong>#${newMessage._id}</strong>
                  </p>
                </div>
              </div>
    
              <!-- Footer -->
              <div style="background-color: #2c3e50; padding: 20px; text-align: center;">
                <p style="margin: 0; color: #ecf0f1; font-size: 12px;">
                  This is an automated notification from RentSimple Support.
                </p>
                <p style="margin: 10px 0 0 0; color: #95a5a6; font-size: 11px;">
                  © 2025 RentSimple. All rights reserved.
                </p>
                <p style="margin: 10px 0 0 0; color: #95a5a6; font-size: 11px;">
                  Please do not reply directly to this email. Use your dashboard to respond to support tickets.
                </p>
              </div>
            </div>
          `
        };
        
        // Create transporter
        const transporter = nodemailer.createTransport({
          service: 'gmail',
          auth: {
            user: 'rentsimple159@gmail.com', 
            pass: 'mlgioecamzoitfdt' 
          }
        });
  
        // Send email (don't await to avoid blocking the response)
        transporter.sendMail(mailOptions).catch(err => {
          console.error('Error sending support message email notification:', err);
        });
        
        console.log(`📧 Support message email sent to ${userType}: ${user.email}`);
      }
      res.json({ success: true, messageId: newMessage._id });
      
    } catch (error) {
        console.log(error.message)
      res.status(500).json({ error: error.message });
    }
}


module.exports.getAllTicketsForAdmins=async(req,res)=>{
    const { status, userType, search, page = 1, limit = 20 } = req.query;
  
  try {
    const query = {};
    
    if (status && status !== 'all') {
        query.status = status;
      } else {
       
        query.status = { $ne: 'closed' };
      }


    if (status && status !== 'all') {
      query.status = status;
    }
    
    if (userType && userType !== 'all') {
      query.userType = userType;
    }
    
    const tickets = await SupportTicket.find(query)
      .populate('userId', 'name email avatar')
      .sort({ lastMessageAt: -1 })
      .skip((page - 1) * limit)
      .limit(limit);
 
    const ticketsWithUnread = await Promise.all(
      tickets.map(async (ticket) => {
        const unreadCount = await SupportMessage.countDocuments({
          ticketId: ticket._id,
          sentBy: { $ne: 'admin' },
          seenByAdmin: false
        });
        
        const lastMessage = await SupportMessage.findOne({
          ticketId: ticket._id
        }).sort({ createdAt: -1 });
        
        return {
          ...ticket.toObject(),
          unreadCount,
          lastMessage
        };
      })
    );
    
    res.json({ tickets: ticketsWithUnread });
    
  } catch (error) {
    console.log(error.message)
    res.status(500).json({ error: error.message });
  }
}








module.exports.supportmessageTickets=async(req,res)=>{
    const { ticketId } = req.params;
  
  try {
    const messages = await SupportMessage.find({ ticketId })
      .sort({ createdAt: 1 })
      .populate('senderId', 'name email avatar');
    
    res.json({ messages });
    
  } catch (error) {
    console.log(error.message)
    res.status(500).json({ error: error.message });
  }
}

module.exports.markMessageAsRead = async (req, res) => {
    const { ticketId } = req.params;
    const {userRole} = req.body; 
    
    try {
    
      let query = { ticketId };
      let updateField;
      
      if (userRole === 'admin') {
      
        query.sentBy = { $ne: 'admin' };
        query.seenByAdmin = false; 
        updateField = { seenByAdmin: true };
      } else {
       
        query.sentBy = 'admin';
        query.seenByUser = false; 
        updateField = { seenByUser: true };
      }
      
      await SupportMessage.updateMany(
        query,
        { 
          $set: { 
            ...updateField,
            seenAt: new Date() 
          } 
        }
      );
      
      res.json({ success: true });
      
    } catch (error) {
        console.log(error.message)
      res.status(500).json({ error: error.message });
    }
  };



  module.exports.getUserTicket = async(req, res) => {
    const {  userType } = req.query;
    console.log(userType)
    try {
        let userId=req?.user?._id?req?.user?._id:req.user.id
        console.log(userId)
      const tickets = await SupportTicket.find({ 
        userId: userId,
        userType: userType,
        status: { $ne: 'closed' } 
      })
      .populate('userId', 'name email')
      .sort({ lastMessageAt: -1 })
      .limit(1); 
      
      if (!tickets || tickets.length === 0) {
        return res.json({ ticket: null, messages: [] });
      }
      
      const ticket = tickets[0];
      
      const messages = await SupportMessage.find({ ticketId: ticket._id })
        .sort({ createdAt: 1 })
        .populate('senderId', 'name email');
      
      res.json({ ticket, messages });
    } catch (error) {
        console.log(error.message)
      res.status(500).json({ error: error.message });
    }
  };




  

  module.exports.getCurrentAdmin = async(req, res) => {
  
    let { email } = req.query;
    
    try {
      let currentAdmin = await adminModel.findOne({ email });
      
      if (!currentAdmin) {
        return res.status(404).json({
          error: "Admin not found"
        });
      }
      
      return res.status(200).json({
        currentAdmin
      });
    } catch(e) {
      console.log(e.message);
      return res.status(400).json({
        error: "Error occurred while trying to get Admin"
      });
    }
  }

  module.exports.checkValidAdmin=async(req,res)=>{
  let {email}=req.body;
    try{
let adminFound=await adminModel.findOne({email})
if(!adminFound){
return res.status(400).json({
  error:"No admin found"
})
}
return res.status(200).json({
  adminFound
})
    }catch(e){
      console.log(e.message)
      return res.status(400).json({
        error:"Error trying to get admin"
      })
    }
  }