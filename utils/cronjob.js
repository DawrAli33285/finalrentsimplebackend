const cron = require('node-cron');
const Listing = require('../models/listing'); 
const nodemailer = require('nodemailer');

const EMAIL_CONFIG = {
  sender: 'rentsimple159@gmail.com',
  service: 'gmail',
  password: 'mlgioecamzoitfdt',
  companyName: 'RentSimple',
  boostUrl: 'https://rentsimpledeals.com/boost'
};

const QUERY_CONFIG = {
  populate: { path: 'vendor', select: 'email name businessName' },
  select: '_id title brand category visibility engagement vendor'
};


const transporter = nodemailer.createTransport({
  service: EMAIL_CONFIG.service,
  auth: {
    user: EMAIL_CONFIG.sender, 
    pass: EMAIL_CONFIG.password 
  }
});

const emailStyles = {
  container: 'font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; background-color: #ffffff;',
  header: (bgColor) => `background-color: ${bgColor}; padding: 30px; text-align: center;`,
  headerTitle: 'color: #ffffff; margin: 0; font-size: 28px;',
  headerSubtitle: 'color: #ffffff; margin-top: 10px; font-size: 16px;',
  alertBox: 'padding: 20px; background-color: #fff3cd; border-left: 4px solid #f39c12; margin: 20px;',
  body: 'padding: 30px;',
  sectionTitle: 'color: #2c3e50; border-bottom: 2px solid #f39c12; padding-bottom: 10px; margin-top: 0;',
  table: 'width: 100%; border-collapse: collapse; margin-top: 20px;',
  tableLabel: 'padding: 12px; background-color: #f8f9fa; width: 35%; font-weight: 600; color: #2c3e50;',
  tableValue: 'padding: 12px; border: 1px solid #dee2e6; color: #495057;',
  infoBox: 'margin-top: 30px; padding: 20px; background-color: #e3f2fd; border-radius: 8px;',
  ctaContainer: 'text-align: center; margin-top: 30px;',
  button: (bgColor) => `display: inline-block; padding: 15px 40px; background-color: ${bgColor}; color: #ffffff; text-decoration: none; border-radius: 5px; font-weight: bold; font-size: 16px;`,
  footer: 'background-color: #2c3e50; padding: 20px; text-align: center;',
  footerText: 'margin: 0; color: #ecf0f1; font-size: 12px;',
  footerCopyright: 'margin: 10px 0 0 0; color: #95a5a6; font-size: 11px;'
};

const buildListingDetailsTable = (listing, includeId = true) => {
  const rows = [
    { label: 'Listing Title', value: listing.title },
    { label: 'Brand', value: listing.brand },
    { label: 'Category', value: listing.category },
    { label: 'Boost Amount', value: `$${listing.visibility.boostAmount}`, bold: true }
  ];

  if (listing.engagement) {
    rows.push({ label: 'Current Views', value: listing.engagement.views || 0 });
  }

  if (includeId) {
    rows.push({ label: 'Listing ID', value: listing._id });
  }

  return `
    <table style="${emailStyles.table}">
      ${rows.map(row => `
        <tr>
          <td style="${emailStyles.tableLabel}">${row.label}</td>
          <td style="${emailStyles.tableValue}${row.bold ? ' font-weight: bold;' : ''}">${row.value}</td>
        </tr>
      `).join('')}
    </table>
  `;
};

const buildEmailTemplate = (headerConfig, bodyContent) => {
  return `
    <div style="${emailStyles.container}">
      <!-- Header -->
      <div style="${emailStyles.header(headerConfig.bgColor)}">
        <h1 style="${emailStyles.headerTitle}">${headerConfig.title}</h1>
        <p style="${emailStyles.headerSubtitle}">${headerConfig.subtitle}</p>
      </div>
      
      ${bodyContent}

      <!-- Footer -->
      <div style="${emailStyles.footer}">
        <p style="${emailStyles.footerText}">
          This is an automated notification from ${EMAIL_CONFIG.companyName}
        </p>
        <p style="${emailStyles.footerCopyright}">
          © 2025 ${EMAIL_CONFIG.companyName}. All rights reserved.
        </p>
      </div>
    </div>
  `;
};


const sendEmail = async (to, subject, htmlContent, logMessage) => {
  try {
    const mailOptions = {
      from: EMAIL_CONFIG.sender,
      to,
      subject,
      html: htmlContent
    };
    
    await transporter.sendMail(mailOptions);
    console.log(`📧 ${logMessage}`);
    return true;
  } catch (error) {
    console.error(`❌ Error sending email: ${error.message}`);
    return false;
  }
};

const sendBoostExpiryWarning = async (listing, vendor, hoursRemaining) => {
  const expiryDate = new Date(listing.visibility.boostEndDate);
  
  const bodyContent = `
    <!-- Alert Box -->
    <div style="${emailStyles.alertBox}">
      <p style="margin: 0; color: #856404; font-size: 16px; font-weight: bold;">
        ⏰ Time Remaining: ${hoursRemaining} hours (~3 days)
      </p>
      <p style="margin: 5px 0 0 0; color: #856404; font-size: 14px;">
        Expiry Date: ${expiryDate.toLocaleString('en-US', { dateStyle: 'full', timeStyle: 'short' })}
      </p>
    </div>

    <!-- Listing Information -->
    <div style="${emailStyles.body}">
      <h3 style="${emailStyles.sectionTitle}">Listing Details</h3>
      ${buildListingDetailsTable(listing, true)}

      <!-- What Happens Next -->
      <div style="${emailStyles.infoBox}">
        <h4 style="color: #1976d2; margin-top: 0;">What happens when your boost expires?</h4>
        <ul style="color: #424242; line-height: 1.8;">
          <li>Your listing will return to normal visibility</li>
          <li>It will no longer appear at the top of search results</li>
          <li>You can re-boost anytime to increase visibility again</li>
        </ul>
      </div>

      <!-- Call to Action -->
      <div style="${emailStyles.ctaContainer}">
        <p style="font-size: 18px; color: #2c3e50; margin-bottom: 20px; font-weight: 600;">
          Don't let your visibility drop! Extend your boost now.
        </p>
        <a href="${EMAIL_CONFIG.boostUrl}" style="${emailStyles.button('#f39c12')}">
          Extend Boost Now
        </a>
      </div>
    </div>
  `;

  const htmlContent = buildEmailTemplate(
    {
      bgColor: '#f39c12',
      title: '⚡ Boost Expiring Soon',
      subtitle: `Your listing boost will expire in approximately ${hoursRemaining} hours (3 days)`
    },
    bodyContent
  );

  return await sendEmail(
    vendor.email,
    '⚠️ Your Listing Boost Expires in 3 Days - RentSimple',
    htmlContent,
    `72h expiry warning sent to ${vendor.email} for listing: ${listing.title}`
  );
};

const sendBoostExpiredNotification = async (listing, vendor) => {
  const vendorName = vendor.name || vendor.businessName || 'there';
  const expiredDate = new Date().toLocaleString('en-US', { dateStyle: 'full', timeStyle: 'short' });
  
  const bodyContent = `
    <!-- Listing Information -->
    <div style="${emailStyles.body}">
      <p style="font-size: 16px; color: #2c3e50; line-height: 1.6;">
        Hi ${vendorName},
      </p>
      <p style="font-size: 16px; color: #2c3e50; line-height: 1.6;">
        Your boost for <strong>"${listing.title}"</strong> has expired and has been removed.
      </p>
      
      <table style="${emailStyles.table}">
        <tr>
          <td style="${emailStyles.tableLabel}">Listing Title</td>
          <td style="${emailStyles.tableValue}">${listing.title}</td>
        </tr>
        <tr>
          <td style="${emailStyles.tableLabel}">Previous Boost</td>
          <td style="${emailStyles.tableValue}">$${listing.visibility.boostAmount}</td>
        </tr>
        <tr>
          <td style="${emailStyles.tableLabel}">Total Views</td>
          <td style="${emailStyles.tableValue}">${listing.engagement?.views || 0}</td>
        </tr>
        <tr>
          <td style="${emailStyles.tableLabel}">Expired On</td>
          <td style="${emailStyles.tableValue}">${expiredDate}</td>
        </tr>
      </table>

      <!-- Call to Action -->
      <div style="${emailStyles.ctaContainer}">
        <a href="${EMAIL_CONFIG.boostUrl}" style="${emailStyles.button('#27ae60')}">
          Boost Again
        </a>
      </div>
    </div>
  `;

  const htmlContent = buildEmailTemplate(
    {
      bgColor: '#e74c3c',
      title: 'Boost Expired',
      subtitle: 'Your listing is now showing normal visibility'
    },
    bodyContent
  );

  return await sendEmail(
    vendor.email,
    '❌ Your Listing Boost Has Expired - RentSimple',
    htmlContent,
    `Expiry notification sent to ${vendor.email} for listing: ${listing.title}`
  );
};


const fetchListingsWithQuery = async (query) => {
  return await Listing.find(query)
    .populate(QUERY_CONFIG.populate.path, QUERY_CONFIG.populate.select)
    .select(QUERY_CONFIG.select);
};


const checkUpcomingExpiries = async () => {
  try {
    const now = new Date();
    const in72Hours = new Date(now.getTime() + (72 * 60 * 60 * 1000));
    const in78Hours = new Date(now.getTime() + (78 * 60 * 60 * 1000)); 
    
    console.log('⚠️ Checking for boosts expiring at or after 72 hours...');
    
    const upcomingExpiries = await fetchListingsWithQuery({
      'visibility.isBoosted': true,
      'visibility.boostEndDate': { 
        $gte: in72Hours,  
        $lte: in78Hours   
      },
      'visibility.expiryWarningsSent': { $ne: true }
    });
    
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
    
    const expiredListings = await fetchListingsWithQuery({
      'visibility.isBoosted': true,
      'visibility.boostEndDate': { $lte: now } 
    });
    
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
      const daysExpired = Math.floor(
        (now - new Date(listing.visibility.boostEndDate)) / (1000 * 60 * 60 * 24)
      );
      
      console.log(`  ❌ "${listing.title}" (${listing.brand})`);
      console.log(`     Category: ${listing.category}`);
      console.log(`     Boost: $${listing.visibility.boostAmount}`);
      console.log(`     Expired: ${daysExpired} day(s) ago`);
      
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
  console.log('   - Expiry check: Daily at midnight EST');
  console.log('   - 72h advance warnings: Every 6 hours');
};