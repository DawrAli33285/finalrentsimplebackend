// const cron = require('node-cron');
// const orderModel = require('../models/order'); 
// const nodemailer=require('nodemailer')

// const autoConfirmOrdersCronJob = cron.schedule('0 0 * * *', async () => {
//   console.log('🕐 Running auto-confirm orders cron job...');
  
//   try {
  
//     const sevenDaysAgo = new Date();
//     sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);
    
//     console.log('📅 Checking orders created before:', sevenDaysAgo.toISOString());
    
  
//     const ordersToConfirm = await orderModel.find({
//       status: 'processing',
//       createdAt: { $lte: sevenDaysAgo }
//     });
    
//     console.log(`📦 Found ${ordersToConfirm.length} orders to auto-confirm`);
    
//     if (ordersToConfirm.length === 0) {
//       console.log('✅ No orders need confirmation');
//       return;
//     }
    
  
//     const result = await orderModel.updateMany(
//       {
//         status: 'processing',
//         createdAt: { $lte: sevenDaysAgo }
//       },
//       {
//         $set: {
//           status: 'confirmed',
//           autoConfirmedAt: new Date(),
//           autoConfirmedReason: 'Auto-confirmed after 7 days without renter approval'
//         }
//       }
//     );
    
//     console.log(`✅ Auto-confirmed ${result.modifiedCount} orders`);
    
   
//     ordersToConfirm.forEach(order => {
//       console.log(`   📋 Order ${order.orderNumber || order._id} - Created: ${order.createdAt}`);
//     });
    
//   } catch (error) {
//     console.error('❌ Error in auto-confirm cron job:', error);
//   }
// });


// autoConfirmOrdersCronJob.start();
// console.log('✅ Auto-confirm orders cron job scheduled (runs daily at midnight)');

// module.exports = autoConfirmOrdersCronJob;



const cron = require('node-cron');
const orderModel = require('../models/order'); 
const nodemailer = require('nodemailer');

// Create email transporter
const transporter = nodemailer.createTransport({
  service: 'gmail',
  auth: {
    user: 'rentsimple159@gmail.com', 
    pass: 'upqbbmeobtztqxyg' 
  }
});

// Function to send auto-confirmation emails
async function sendAutoConfirmEmails(order) {
  const confirmDate = new Date();
  
  // Email to Vendor
  const vendorMailOptions = {
    from: 'orders@enrichifydata.com',
    to: order.vendor?.email,
    subject: '✅ Order Auto-Confirmed - 7 Day Period Expired - RentSimple',
    html: `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; background-color: #ffffff;">
        <!-- Header -->
        <div style="background-color: #28a745; padding: 30px; text-align: center;">
          <h1 style="color: #ffffff; margin: 0; font-size: 28px;">✅ Order Auto-Confirmed</h1>
          <p style="color: #d4edda; margin-top: 10px; font-size: 16px;">7-day approval period has expired</p>
        </div>
        
        <!-- Time -->
        <div style="padding: 20px; background-color: #f8f9fa; border-bottom: 2px solid #e9ecef;">
          <p style="margin: 0; color: #7f8c8d; font-size: 14px;">Auto-Confirmed On</p>
          <h2 style="margin: 5px 0 0 0; color: #2c3e50; font-size: 20px;">${confirmDate.toLocaleString('en-US', { 
            dateStyle: 'full', 
            timeStyle: 'short' 
          })}</h2>
        </div>

        <!-- Main Content -->
        <div style="padding: 30px;">
          <h3 style="color: #2c3e50; border-bottom: 2px solid #28a745; padding-bottom: 10px; margin-top: 0;">
            Automatic Order Confirmation
          </h3>
          
          <p style="color: #495057; font-size: 16px; line-height: 1.6; margin-top: 20px;">
            Hello <strong>${order.vendor?.name || order.vendor?.businessName}</strong>,
          </p>
          
          <p style="color: #495057; font-size: 16px; line-height: 1.6;">
            This is to inform you that one of your rental orders has been automatically confirmed. The 7-day approval period has expired without the renter disputing the order.
          </p>

          <!-- Auto-Confirmation Notice -->
          <div style="margin-top: 25px; padding: 20px; background-color: #d4edda; border-left: 4px solid #28a745; border-radius: 4px;">
            <h4 style="margin: 0 0 10px 0; color: #155724; font-size: 16px;">🎉 Great News!</h4>
            <p style="margin: 0; color: #155724; font-size: 14px; line-height: 1.6;">
              Since the renter did not report any issues within 7 days, the order has been automatically confirmed. This means the rental is complete and successful!
            </p>
          </div>

          <!-- Product Information -->
          ${order.listing?.images && order.listing.images.length > 0 ? `
          <div style="text-align: center; margin: 25px 0;">
            <img src="${order.listing.images.find(img => img.isPrimary)?.url || order.listing.images[0].url}" 
                 alt="${order.listing?.title}" 
                 style="max-width: 100%; height: auto; border-radius: 8px; border: 1px solid #dee2e6;" />
          </div>
          ` : ''}

          <h4 style="color: #2c3e50; margin-top: 30px; margin-bottom: 15px;">Order Details:</h4>
          
          <table style="width: 100%; border-collapse: collapse; margin-top: 20px;">
            <tr>
              <td style="padding: 12px; background-color: #f8f9fa; width: 40%; font-weight: 600; color: #2c3e50;">Order Number</td>
              <td style="padding: 12px; border: 1px solid #dee2e6; color: #495057; font-weight: 700;">#${order.orderNumber || order._id}</td>
            </tr>
            ${order.listing ? `
            <tr>
              <td style="padding: 12px; background-color: #f8f9fa; font-weight: 600; color: #2c3e50;">Product</td>
              <td style="padding: 12px; border: 1px solid #dee2e6; color: #495057;">${order.listing.title}</td>
            </tr>
            ` : ''}
            ${order.user ? `
            <tr>
              <td style="padding: 12px; background-color: #f8f9fa; font-weight: 600; color: #2c3e50;">Renter</td>
              <td style="padding: 12px; border: 1px solid #dee2e6; color: #495057;">${order.user.name || order.user.email}</td>
            </tr>
            ` : ''}
            <tr>
              <td style="padding: 12px; background-color: #f8f9fa; font-weight: 600; color: #2c3e50;">Order Created</td>
              <td style="padding: 12px; border: 1px solid #dee2e6; color: #495057;">${new Date(order.createdAt).toLocaleDateString('en-US', { 
                dateStyle: 'medium' 
              })}</td>
            </tr>
            <tr>
              <td style="padding: 12px; background-color: #f8f9fa; font-weight: 600; color: #2c3e50;">Auto-Confirmed</td>
              <td style="padding: 12px; border: 1px solid #dee2e6; color: #495057;">${confirmDate.toLocaleDateString('en-US', { 
                dateStyle: 'medium' 
              })}</td>
            </tr>
            ${order.totalAmount ? `
            <tr>
              <td style="padding: 12px; background-color: #f8f9fa; font-weight: 600; color: #2c3e50;">Total Amount</td>
              <td style="padding: 12px; border: 1px solid #dee2e6; color: #28a745; font-weight: 700; font-size: 18px;">$${order.totalAmount}</td>
            </tr>
            ` : ''}
            <tr>
              <td style="padding: 12px; background-color: #f8f9fa; font-weight: 600; color: #2c3e50;">Status</td>
              <td style="padding: 12px; border: 1px solid #dee2e6;">
                <span style="background-color: #28a745; color: white; padding: 4px 12px; border-radius: 12px; font-size: 12px; font-weight: 600;">CONFIRMED</span>
              </td>
            </tr>
          </table>

          <!-- What This Means -->
          <div style="margin-top: 30px; padding: 20px; background-color: #d1ecf1; border-left: 4px solid #17a2b8; border-radius: 4px;">
            <h4 style="margin: 0 0 10px 0; color: #0c5460; font-size: 16px;">💡 What This Means</h4>
            <ul style="margin: 10px 0; padding-left: 20px; color: #0c5460; font-size: 14px; line-height: 1.8;">
              <li>The rental transaction is complete and confirmed</li>
              <li>No issues were reported by the renter within the 7-day period</li>
              <li>Your listing is now available for new rentals</li>
              <li>You've successfully completed this rental transaction</li>
            </ul>
          </div>

          <!-- Next Steps -->
          <div style="margin-top: 30px; padding: 20px; background-color: #e7f3f2; border-left: 4px solid #024a47; border-radius: 4px;">
            <h4 style="margin: 0 0 10px 0; color: #024a47; font-size: 16px;">🚀 What's Next?</h4>
            <ul style="margin: 10px 0; padding-left: 20px; color: #495057; font-size: 14px; line-height: 1.8;">
              <li>Continue managing your other active rentals</li>
              <li>Update your inventory and listings as needed</li>
              <li>Respond to new rental requests promptly</li>
              <li>Maintain excellent service for continued success</li>
            </ul>
          </div>

          <!-- Call to Action Button -->
          <div style="text-align: center; margin-top: 30px;">
            <a href="${process.env.FRONTEND_URL || 'https://rentsimpledeals.com'}/vendor/orders" 
               style="display: inline-block; background-color: #024a47; color: #ffffff; padding: 15px 40px; text-decoration: none; border-radius: 8px; font-weight: 600; font-size: 16px;">
              View My Orders
            </a>
          </div>

          <!-- Support Info -->
          <div style="margin-top: 30px; padding: 20px; background-color: #f8f9fa; border-radius: 8px;">
            <h4 style="margin: 0 0 10px 0; color: #2c3e50; font-size: 16px;">Need Help?</h4>
            <p style="margin: 0; color: #495057; font-size: 14px; line-height: 1.6;">
              If you have any questions about this order or need assistance, our support team is here to help.
            </p>
          </div>

          <!-- Order ID -->
          <div style="margin-top: 20px; padding: 15px; background-color: #e9ecef; border-radius: 4px; text-align: center;">
            <p style="margin: 0; color: #6c757d; font-size: 12px;">Order ID: <strong>#${order._id}</strong></p>
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

  // Email to Renter
  const renterMailOptions = {
    from: 'orders@enrichifydata.com',
    to: order.user?.email,
    subject: '✅ Your Rental Order Auto-Confirmed - RentSimple',
    html: `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; background-color: #ffffff;">
        <!-- Header -->
        <div style="background-color: #28a745; padding: 30px; text-align: center;">
          <h1 style="color: #ffffff; margin: 0; font-size: 28px;">✅ Order Confirmed</h1>
          <p style="color: #d4edda; margin-top: 10px; font-size: 16px;">Your rental has been automatically confirmed</p>
        </div>
        
        <!-- Time -->
        <div style="padding: 20px; background-color: #f8f9fa; border-bottom: 2px solid #e9ecef;">
          <p style="margin: 0; color: #7f8c8d; font-size: 14px;">Confirmed On</p>
          <h2 style="margin: 5px 0 0 0; color: #2c3e50; font-size: 20px;">${confirmDate.toLocaleString('en-US', { 
            dateStyle: 'full', 
            timeStyle: 'short' 
          })}</h2>
        </div>

        <!-- Main Content -->
        <div style="padding: 30px;">
          <h3 style="color: #2c3e50; border-bottom: 2px solid #28a745; padding-bottom: 10px; margin-top: 0;">
            Rental Order Confirmed
          </h3>
          
          <p style="color: #495057; font-size: 16px; line-height: 1.6; margin-top: 20px;">
            Hello <strong>${order.user?.name}</strong>,
          </p>
          
          <p style="color: #495057; font-size: 16px; line-height: 1.6;">
            Great news! Your rental order has been automatically confirmed. Since no issues were reported within the 7-day approval period, we've marked this rental as successfully completed.
          </p>

          <!-- Success Message -->
          <div style="margin-top: 25px; padding: 20px; background-color: #d4edda; border-left: 4px solid #28a745; border-radius: 4px;">
            <h4 style="margin: 0 0 10px 0; color: #155724; font-size: 16px;">🎉 Rental Complete!</h4>
            <p style="margin: 0; color: #155724; font-size: 14px; line-height: 1.6;">
              Thank you for using RentSimple! Your rental transaction has been successfully confirmed. We hope you had a great experience with your rental.
            </p>
          </div>

          <!-- Product Information -->
          ${order.listing?.images && order.listing.images.length > 0 ? `
          <div style="text-align: center; margin: 25px 0;">
            <img src="${order.listing.images.find(img => img.isPrimary)?.url || order.listing.images[0].url}" 
                 alt="${order.listing?.title}" 
                 style="max-width: 100%; height: auto; border-radius: 8px; border: 1px solid #dee2e6;" />
          </div>
          ` : ''}

          <h4 style="color: #2c3e50; margin-top: 30px; margin-bottom: 15px;">Order Details:</h4>
          
          <table style="width: 100%; border-collapse: collapse; margin-top: 20px;">
            <tr>
              <td style="padding: 12px; background-color: #f8f9fa; width: 40%; font-weight: 600; color: #2c3e50;">Order Number</td>
              <td style="padding: 12px; border: 1px solid #dee2e6; color: #495057; font-weight: 700;">#${order.orderNumber || order._id}</td>
            </tr>
            ${order.listing ? `
            <tr>
              <td style="padding: 12px; background-color: #f8f9fa; font-weight: 600; color: #2c3e50;">Product</td>
              <td style="padding: 12px; border: 1px solid #dee2e6; color: #495057;">${order.listing.title}</td>
            </tr>
            ` : ''}
            ${order.vendor ? `
            <tr>
              <td style="padding: 12px; background-color: #f8f9fa; font-weight: 600; color: #2c3e50;">Vendor</td>
              <td style="padding: 12px; border: 1px solid #dee2e6; color: #495057;">${order.vendor.name || order.vendor.businessName}</td>
            </tr>
            ` : ''}
            <tr>
              <td style="padding: 12px; background-color: #f8f9fa; font-weight: 600; color: #2c3e50;">Rental Period</td>
              <td style="padding: 12px; border: 1px solid #dee2e6; color: #495057;">7 days (Auto-confirmed)</td>
            </tr>
            ${order.totalAmount ? `
            <tr>
              <td style="padding: 12px; background-color: #f8f9fa; font-weight: 600; color: #2c3e50;">Total Amount</td>
              <td style="padding: 12px; border: 1px solid #dee2e6; color: #28a745; font-weight: 700; font-size: 18px;">$${order.totalAmount}</td>
            </tr>
            ` : ''}
            <tr>
              <td style="padding: 12px; background-color: #f8f9fa; font-weight: 600; color: #2c3e50;">Status</td>
              <td style="padding: 12px; border: 1px solid #dee2e6;">
                <span style="background-color: #28a745; color: white; padding: 4px 12px; border-radius: 12px; font-size: 12px; font-weight: 600;">CONFIRMED</span>
              </td>
            </tr>
          </table>

          <!-- What Happened -->
          <div style="margin-top: 30px; padding: 20px; background-color: #d1ecf1; border-left: 4px solid #17a2b8; border-radius: 4px;">
            <h4 style="margin: 0 0 10px 0; color: #0c5460; font-size: 16px;">ℹ️ Why Was This Auto-Confirmed?</h4>
            <p style="margin: 0; color: #0c5460; font-size: 14px; line-height: 1.6;">
              All rentals have a 7-day approval period. Since you didn't report any issues during this time, your order has been automatically confirmed. This indicates a successful rental transaction.
            </p>
          </div>

          <!-- Feedback Request -->
          <div style="margin-top: 30px; padding: 20px; background-color: #fff3cd; border-left: 4px solid #ffc107; border-radius: 4px;">
            <h4 style="margin: 0 0 10px 0; color: #856404; font-size: 16px;">⭐ Share Your Experience</h4>
            <p style="margin: 0 0 10px 0; color: #856404; font-size: 14px; line-height: 1.6;">
              We'd love to hear about your rental experience! Your feedback helps other customers and improves our service.
            </p>
            <div style="text-align: center; margin-top: 15px;">
              <a href="${process.env.FRONTEND_URL || 'https://rentsimpledeals.com'}/orders/${order._id}/review" 
                 style="display: inline-block; background-color: #ffc107; color: #000; padding: 12px 30px; text-decoration: none; border-radius: 8px; font-weight: 600; font-size: 14px;">
                Leave a Review
              </a>
            </div>
          </div>

          <!-- Rent Again -->
          <div style="margin-top: 30px; padding: 20px; background-color: #e7f3f2; border-left: 4px solid #024a47; border-radius: 4px;">
            <h4 style="margin: 0 0 10px 0; color: #024a47; font-size: 16px;">🔄 Rent Again?</h4>
            <p style="margin: 0; color: #495057; font-size: 14px; line-height: 1.6;">
              Need to rent this item again or looking for something else? Browse thousands of products available for rent on RentSimple.
            </p>
          </div>

          <!-- Call to Action Buttons -->
          <div style="text-align: center; margin-top: 30px;">
            <a href="${process.env.FRONTEND_URL || 'https://rentsimpledeals.com'}/browse" 
               style="display: inline-block; background-color: #024a47; color: #ffffff; padding: 15px 40px; text-decoration: none; border-radius: 8px; font-weight: 600; font-size: 16px; margin: 0 10px 10px 0;">
              Browse Products
            </a>
            <a href="${process.env.FRONTEND_URL || 'https://rentsimpledeals.com'}/dashboard/orders" 
               style="display: inline-block; background-color: #6c757d; color: #ffffff; padding: 15px 40px; text-decoration: none; border-radius: 8px; font-weight: 600; font-size: 16px; margin: 0 0 10px 10px;">
              View My Orders
            </a>
          </div>

          <!-- Support Info -->
          <div style="margin-top: 30px; padding: 20px; background-color: #f8f9fa; border-radius: 8px;">
            <h4 style="margin: 0 0 10px 0; color: #2c3e50; font-size: 16px;">Need Help?</h4>
            <p style="margin: 0; color: #495057; font-size: 14px; line-height: 1.6;">
              If you have any questions or concerns about this order, please don't hesitate to contact our support team.
            </p>
          </div>

          <!-- Order ID -->
          <div style="margin-top: 20px; padding: 15px; background-color: #e9ecef; border-radius: 4px; text-align: center;">
            <p style="margin: 0; color: #6c757d; font-size: 12px;">Order ID: <strong>#${order._id}</strong></p>
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

  // Send both emails
  try {
    await Promise.all([
      transporter.sendMail(vendorMailOptions),
      transporter.sendMail(renterMailOptions)
    ]);
    console.log(`   ✅ Auto-confirmation emails sent for order ${order.orderNumber || order._id}`);
  } catch (emailError) {
    console.error(`   ❌ Error sending emails for order ${order.orderNumber || order._id}:`, emailError);
  }
}

const autoConfirmOrdersCronJob = cron.schedule('0 0 * * *', async () => {
  console.log('🕐 Running auto-confirm orders cron job...');
  
  try {
    const sevenDaysAgo = new Date();
    sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);
    
    console.log('📅 Checking orders created before:', sevenDaysAgo.toISOString());
    
    // Find orders to confirm with populated data
    const ordersToConfirm = await orderModel.find({
      status: 'processing',
      createdAt: { $lte: sevenDaysAgo }
    })
    .populate('listing')
    .populate('vendor', 'name businessName email')
    .populate('user', 'name email');
    
    console.log(`📦 Found ${ordersToConfirm.length} orders to auto-confirm`);
    
    if (ordersToConfirm.length === 0) {
      console.log('✅ No orders need confirmation');
      return;
    }
    
    // Update orders
    const result = await orderModel.updateMany(
      {
        status: 'processing',
        createdAt: { $lte: sevenDaysAgo }
      },
      {
        $set: {
          status: 'confirmed',
          autoConfirmedAt: new Date(),
          autoConfirmedReason: 'Auto-confirmed after 7 days without renter approval'
        }
      }
    );
    
    console.log(`✅ Auto-confirmed ${result.modifiedCount} orders`);
    
    // Send emails for each confirmed order
    for (const order of ordersToConfirm) {
      console.log(`   📋 Order ${order.orderNumber || order._id} - Created: ${order.createdAt}`);
      await sendAutoConfirmEmails(order);
    }
    
  } catch (error) {
    console.error('❌ Error in auto-confirm cron job:', error);
  }
});

autoConfirmOrdersCronJob.start();
console.log('✅ Auto-confirm orders cron job scheduled (runs daily at midnight)');

module.exports = autoConfirmOrdersCronJob;