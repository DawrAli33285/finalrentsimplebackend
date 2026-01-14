const cron = require('node-cron');
const Listing = require('../models/listing'); 
const nodemailer = require('nodemailer');


const transporter = nodemailer.createTransport({
  service: 'gmail',
  auth: {
    user: 'rentsimple159@gmail.com', 
    pass: 'hfxiijdonfzfgmhp' 
  }
});

const sendBoostExpiryWarning = async (listing, vendor, hoursRemaining) => {
  try {
    const expiryDate = new Date(listing.visibility.boostEndDate);
    
    const mailOptions = {
      from: 'rentsimple159@gmail.com',
      to: vendor.email,
      subject: '⚠️ Your Listing Boost Expires in 3 Days - RentSimple',
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; background-color: #ffffff;">
          <!-- Header -->
          <div style="background-color: #f39c12; padding: 30px; text-align: center;">
            <h1 style="color: #ffffff; margin: 0; font-size: 28px;">⚡ Boost Expiring Soon</h1>
            <p style="color: #ffffff; margin-top: 10px; font-size: 16px;">Your listing boost will expire in approximately ${hoursRemaining} hours (3 days)</p>
          </div>
          
          <!-- Alert Box -->
          <div style="padding: 20px; background-color: #fff3cd; border-left: 4px solid #f39c12; margin: 20px;">
            <p style="margin: 0; color: #856404; font-size: 16px; font-weight: bold;">
              ⏰ Time Remaining: ${hoursRemaining} hours (~3 days)
            </p>
            <p style="margin: 5px 0 0 0; color: #856404; font-size: 14px;">
              Expiry Date: ${expiryDate.toLocaleString('en-US', { 
                dateStyle: 'full', 
                timeStyle: 'short' 
              })}
            </p>
          </div>
    
          <!-- Listing Information -->
          <div style="padding: 30px;">
            <h3 style="color: #2c3e50; border-bottom: 2px solid #f39c12; padding-bottom: 10px; margin-top: 0;">
              Listing Details
            </h3>
            
            <table style="width: 100%; border-collapse: collapse; margin-top: 20px;">
              <tr>
                <td style="padding: 12px; background-color: #f8f9fa; width: 35%; font-weight: 600; color: #2c3e50;">Listing Title</td>
                <td style="padding: 12px; border: 1px solid #dee2e6; color: #495057;">${listing.title}</td>
              </tr>
              <tr>
                <td style="padding: 12px; background-color: #f8f9fa; font-weight: 600; color: #2c3e50;">Brand</td>
                <td style="padding: 12px; border: 1px solid #dee2e6; color: #495057;">${listing.brand}</td>
              </tr>
              <tr>
                <td style="padding: 12px; background-color: #f8f9fa; font-weight: 600; color: #2c3e50;">Category</td>
                <td style="padding: 12px; border: 1px solid #dee2e6; color: #495057;">${listing.category}</td>
              </tr>
              <tr>
                <td style="padding: 12px; background-color: #f8f9fa; font-weight: 600; color: #2c3e50;">Boost Amount</td>
                <td style="padding: 12px; border: 1px solid #dee2e6; color: #495057; font-weight: bold;">$${listing.visibility.boostAmount}</td>
              </tr>
              <tr>
                <td style="padding: 12px; background-color: #f8f9fa; font-weight: 600; color: #2c3e50;">Current Views</td>
                <td style="padding: 12px; border: 1px solid #dee2e6; color: #495057;">${listing.engagement?.views || 0}</td>
              </tr>
              <tr>
                <td style="padding: 12px; background-color: #f8f9fa; font-weight: 600; color: #2c3e50;">Listing ID</td>
                <td style="padding: 12px; border: 1px solid #dee2e6; color: #495057;">${listing._id}</td>
              </tr>
            </table>
    
            <!-- What Happens Next -->
            <div style="margin-top: 30px; padding: 20px; background-color: #e3f2fd; border-radius: 8px;">
              <h4 style="color: #1976d2; margin-top: 0;">What happens when your boost expires?</h4>
              <ul style="color: #424242; line-height: 1.8;">
                <li>Your listing will return to normal visibility</li>
                <li>It will no longer appear at the top of search results</li>
                <li>You can re-boost anytime to increase visibility again</li>
              </ul>
            </div>
    
            <!-- Call to Action -->
            <div style="text-align: center; margin-top: 30px;">
              <p style="font-size: 18px; color: #2c3e50; margin-bottom: 20px; font-weight: 600;">
                Don't let your visibility drop! Extend your boost now.
              </p>
              <a href="https://rentsimpledeals.com/boost" 
                 style="display: inline-block; padding: 15px 40px; background-color: #f39c12; color: #ffffff; text-decoration: none; border-radius: 5px; font-weight: bold; font-size: 16px;">
                Extend Boost Now
              </a>
            </div>
          </div>
    
          <!-- Footer -->
          <div style="background-color: #2c3e50; padding: 20px; text-align: center;">
            <p style="margin: 0; color: #ecf0f1; font-size: 12px;">
              This is an automated notification from RentSimple
            </p>
            <p style="margin: 10px 0 0 0; color: #95a5a6; font-size: 11px;">
              © 2025 RentSimple. All rights reserved.
            </p>
          </div>
        </div>
      `
    };
    
    await transporter.sendMail(mailOptions);
    console.log(`📧 72h expiry warning sent to ${vendor.email} for listing: ${listing.title}`);
    
    return true;
  } catch (error) {
    console.error('❌ Error sending expiry warning email:', error);
    return false;
  }
};


const sendBoostExpiredNotification = async (listing, vendor) => {
  try {
    const mailOptions = {
      from: 'rentsimple159@gmail.com',
      to: vendor.email,
      subject: '❌ Your Listing Boost Has Expired - RentSimple',
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; background-color: #ffffff;">
          <!-- Header -->
          <div style="background-color: #e74c3c; padding: 30px; text-align: center;">
            <h1 style="color: #ffffff; margin: 0; font-size: 28px;">Boost Expired</h1>
            <p style="color: #ffffff; margin-top: 10px; font-size: 16px;">Your listing is now showing normal visibility</p>
          </div>
          
          <!-- Listing Information -->
          <div style="padding: 30px;">
            <p style="font-size: 16px; color: #2c3e50; line-height: 1.6;">
              Hi ${vendor.name || vendor.businessName || 'there'},
            </p>
            <p style="font-size: 16px; color: #2c3e50; line-height: 1.6;">
              Your boost for <strong>"${listing.title}"</strong> has expired and has been removed.
            </p>
            
            <table style="width: 100%; border-collapse: collapse; margin-top: 20px;">
              <tr>
                <td style="padding: 12px; background-color: #f8f9fa; width: 35%; font-weight: 600; color: #2c3e50;">Listing Title</td>
                <td style="padding: 12px; border: 1px solid #dee2e6; color: #495057;">${listing.title}</td>
              </tr>
              <tr>
                <td style="padding: 12px; background-color: #f8f9fa; font-weight: 600; color: #2c3e50;">Previous Boost</td>
                <td style="padding: 12px; border: 1px solid #dee2e6; color: #495057;">$${listing.visibility.boostAmount}</td>
              </tr>
              <tr>
                <td style="padding: 12px; background-color: #f8f9fa; font-weight: 600; color: #2c3e50;">Total Views</td>
                <td style="padding: 12px; border: 1px solid #dee2e6; color: #495057;">${listing.engagement?.views || 0}</td>
              </tr>
              <tr>
                <td style="padding: 12px; background-color: #f8f9fa; font-weight: 600; color: #2c3e50;">Expired On</td>
                <td style="padding: 12px; border: 1px solid #dee2e6; color: #495057;">${new Date().toLocaleString('en-US', { 
                  dateStyle: 'full', 
                  timeStyle: 'short' 
                })}</td>
              </tr>
            </table>
    
            <!-- Call to Action -->
            <div style="text-align: center; margin-top: 30px;">
              <a href="https://rentsimpledeals.com/boost" 
                 style="display: inline-block; padding: 15px 40px; background-color: #27ae60; color: #ffffff; text-decoration: none; border-radius: 5px; font-weight: bold; font-size: 16px;">
                Boost Again
              </a>
            </div>
          </div>
    
          <!-- Footer -->
          <div style="background-color: #2c3e50; padding: 20px; text-align: center;">
            <p style="margin: 0; color: #ecf0f1; font-size: 12px;">
              This is an automated notification from RentSimple
            </p>
          </div>
        </div>
      `
    };
    
    await transporter.sendMail(mailOptions);
    console.log(`📧 Expiry notification sent to ${vendor.email} for listing: ${listing.title}`);
    
    return true;
  } catch (error) {
    console.error('❌ Error sending expiry notification email:', error);
    return false;
  }
};


const checkUpcomingExpiries = async () => {
  try {
    const now = new Date();
    const in72Hours = new Date(now.getTime() + (72 * 60 * 60 * 1000));
    const in78Hours = new Date(now.getTime() + (78 * 60 * 60 * 1000)); 
    
    console.log('⚠️ Checking for boosts expiring at or after 72 hours...');
    
   
    const upcomingExpiries = await Listing.find({
      'visibility.isBoosted': true,
      'visibility.boostEndDate': { 
        $gte: in72Hours,  
        $lte: in78Hours   
      },
      'visibility.expiryWarningsSent': { $ne: true }
    })
    .populate('vendor', 'email name businessName')
    .select('_id title brand category visibility engagement vendor');
    
    if (upcomingExpiries.length === 0) {
      console.log('✅ No listings found that need 72h warning');
      return { success: true, warningsSent: 0 };
    }
    
    console.log(`📋 Found ${upcomingExpiries.length} listings expiring in ~72 hours`);
    
    let warningsSent = 0;
    
    for (const listing of upcomingExpiries) {
      const hoursRemaining = Math.round(
        (new Date(listing.visibility.boostEndDate) - now) / (1000 * 60 * 60)
      );
      
      console.log(`  ⏰ "${listing.title}" expires in ${hoursRemaining} hours`);
      
      
      const sent = await sendBoostExpiryWarning(listing, listing.vendor, hoursRemaining);
      
      if (sent) {
        
        await Listing.updateOne(
          { _id: listing._id },
          { $set: { 'visibility.expiryWarningsSent': true } }
        );
        warningsSent++;
      }
    }
    
    console.log(`✅ Sent ${warningsSent} 72-hour expiry warnings`);
    
    return { success: true, warningsSent };
    
  } catch (error) {
    console.error('❌ Error checking upcoming expiries:', error);
    return { success: false, error: error.message };
  }
};


const removeExpiredBoosts = async () => {
  try {
    const now = new Date();
    
    console.log('🔍 Checking for expired boosts at:', now.toISOString());
    
    const expiredListings = await Listing.find({
      'visibility.isBoosted': true,
      'visibility.boostEndDate': { $lte: now } 
    })
    .populate('vendor', 'email name businessName')
    .select('_id title brand category visibility engagement vendor');
    
    if (expiredListings.length === 0) {
      console.log('✅ No expired boosts found');
      return {
        success: true,
        updated: 0,
        message: 'No expired boosts to remove'
      };
    }
    
    console.log(`📋 Found ${expiredListings.length} listings with expired boosts`);
    
   
    for (const listing of expiredListings) {
      const expired = Math.floor((now - new Date(listing.visibility.boostEndDate)) / (1000 * 60 * 60 * 24));
      console.log(`  ❌ "${listing.title}" (${listing.brand})`);
      console.log(`     Category: ${listing.category}`);
      console.log(`     Boost: $${listing.visibility.boostAmount}`);
      console.log(`     Expired: ${expired} day(s) ago`);
      
    
      await sendBoostExpiredNotification(listing, listing.vendor);
    }
    
   
    const result = await Listing.updateMany(
      {
        'visibility.isBoosted': true,
        'visibility.boostEndDate': { $lte: now }
      },
      {
        $set: {
          'visibility.isBoosted': false,
          'visibility.boostAmount': 0,
          'visibility.boostEndDate': null,
          'visibility.expiryWarningsSent': false 
        }
      }
    );
    
    console.log(`✅ Successfully removed boost from ${result.modifiedCount} listings`);
    
    return {
      success: true,
      updated: result.modifiedCount,
      listings: expiredListings.map(l => ({
        id: l._id,
        title: l.title,
        brand: l.brand,
        category: l.category,
        boostAmount: l.visibility.boostAmount,
        expiredDate: l.visibility.boostEndDate
      }))
    };
    
  } catch (error) {
    console.error('❌ Error removing expired boosts:', error);
    return {
      success: false,
      error: error.message
    };
  }
};


module.exports.scheduleBoostExpiryCheck = () => {
 
  cron.schedule('0 0 * * *', async () => {
    console.log('⏰ Running boost expiry check...');
    await removeExpiredBoosts();
  }, {
    scheduled: true,
    timezone: "America/New_York" 
  });
  
 
  cron.schedule('0 */6 * * *', async () => {
    console.log('⏰ Running 72-hour advance warning check...');
    await checkUpcomingExpiries();
  }, {
    scheduled: true,
    timezone: "America/New_York"
  });
  
  console.log('✅ Boost expiry cron jobs scheduled:');
  console.log('   - Expiry check: Every minute (change to daily at midnight if needed)');
  console.log('   - 72h advance warnings: Every 6 hours');
};