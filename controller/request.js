const listing = require("../models/listing");
const orderModel = require("../models/order");
const requestModel = require("../models/request");
const strikeModel = require("../models/strike");
const userModel=require('../models/user')
const Vendor=require('../models/vendor')
const jwt = require("jsonwebtoken");
const nodemailer=require('nodemailer')

const formatAddress = (addr) =>
  addr
    ? `${addr.street || ''}, ${addr.city || ''}, ${addr.state || ''}, ${addr.zipCode || ''}, ${addr.country || ''}`
        .replace(/,\s*,/g, ', ')    
        .replace(/^,|,$/g, '')     
    : '';
exports.sendRequestUser=async(req,res)=>{
  let {listing,vendor,deliveryType,pickUpAddress,deliveryAddress,installationType}=req.body;
  console.log(listing)
  console.log(vendor)
  
try{
const newRequest = await requestModel.create({
  listing,
  vendor,
  user:req.user._id,
  deliveryType,
  installationType,
  deliveryAddress,
  pickUpAddress
})

// Populate the request with listing and user details
const populatedRequest = await requestModel.findById(newRequest._id)
  .populate('listing')
  .populate('user', 'name email phone');

  let vendorFound=await Vendor.findOne({_id:vendor})
const mailOptions = {
from: 'orders@enrichifydata.com',
to: vendorFound.email, 
subject: '🔔 New Rental Request Received!',
html: `
  <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; background-color: #ffffff;">
    <!-- Header -->
    <div style="background-color: #024a47; padding: 30px; text-align: center;">
      <h1 style="color: #ffffff; margin: 0; font-size: 28px;">🎉 New Rental Request!</h1>
      <p style="color: #ecf0f1; margin-top: 10px; font-size: 16px;">A customer wants to rent your product</p>
    </div>
    
    <!-- Request Time -->
    <div style="padding: 20px; background-color: #f8f9fa; border-bottom: 2px solid #e9ecef;">
      <p style="margin: 0; color: #7f8c8d; font-size: 14px;">Request Received</p>
      <h2 style="margin: 5px 0 0 0; color: #2c3e50; font-size: 20px;">${new Date().toLocaleString('en-US', { 
        dateStyle: 'full', 
        timeStyle: 'short' 
      })}</h2>
    </div>

    <!-- Main Content -->
    <div style="padding: 30px;">
      <!-- Greeting Message -->
      <div style="margin-bottom: 30px;">
        <h3 style="color: #2c3e50; margin-top: 0;">Great news, ${vendorFound.name || vendorFound.businessName || 'there'}! 👋</h3>
        <p style="color: #495057; font-size: 15px; line-height: 1.6; margin: 0;">
          You've received a new rental request for one of your listings! A customer is interested in renting your product. 
          Review the details below and respond quickly to increase your chances of securing this rental.
        </p>
      </div>

      <!-- Action Required Notice -->
      <div style="margin-bottom: 25px; padding: 20px; background-color: #d4edda; border-left: 4px solid #28a745; border-radius: 4px;">
        <h4 style="margin: 0 0 10px 0; color: #155724; font-size: 16px;">⚡ Quick Response = More Bookings</h4>
        <p style="margin: 0; color: #155724; font-size: 14px; line-height: 1.6;">
          Vendors who respond within 2-4 hours have a 60% higher conversion rate. Don't miss this opportunity!
        </p>
      </div>

      <!-- Product Information -->
      <div style="margin-bottom: 25px;">
        <h3 style="color: #2c3e50; border-bottom: 2px solid #024a47; padding-bottom: 10px; margin-top: 0;">
          📦 Requested Product
        </h3>
        
        ${populatedRequest.listing.images && populatedRequest.listing.images.length > 0 ? `
        <div style="text-align: center; margin: 20px 0;">
          <img src="${populatedRequest.listing.images.find(img => img.isPrimary)?.url || populatedRequest.listing.images[0].url}" 
               alt="${populatedRequest.listing.title}" 
               style="max-width: 100%; height: auto; border-radius: 8px; border: 1px solid #dee2e6;" />
        </div>
        ` : ''}
        
        <table style="width: 100%; border-collapse: collapse; margin-top: 20px;">
          <tr>
            <td style="padding: 12px; background-color: #f8f9fa; width: 35%; font-weight: 600; color: #2c3e50;">Product</td>
            <td style="padding: 12px; border: 1px solid #dee2e6; color: #495057;">${populatedRequest.listing.title}</td>
          </tr>
          <tr>
            <td style="padding: 12px; background-color: #f8f9fa; font-weight: 600; color: #2c3e50;">Brand</td>
            <td style="padding: 12px; border: 1px solid #dee2e6; color: #495057;">${populatedRequest.listing.brand}</td>
          </tr>
          <tr>
            <td style="padding: 12px; background-color: #f8f9fa; font-weight: 600; color: #2c3e50;">Category</td>
            <td style="padding: 12px; border: 1px solid #dee2e6; color: #495057; text-transform: capitalize;">${populatedRequest.listing.category}</td>
          </tr>
          <tr>
            <td style="padding: 12px; background-color: #f8f9fa; font-weight: 600; color: #2c3e50;">Monthly Rent</td>
            <td style="padding: 12px; border: 1px solid #dee2e6; color: #024a47; font-weight: 700; font-size: 18px;">$${populatedRequest.listing.pricing.rentPrice}/mo</td>
          </tr>
          ${deliveryType ? `
          <tr>
            <td style="padding: 12px; background-color: #f8f9fa; font-weight: 600; color: #2c3e50;">Delivery Type</td>
            <td style="padding: 12px; border: 1px solid #dee2e6; color: #495057; text-transform: capitalize;">${deliveryType}</td>
          </tr>
          ` : ''}
          ${installationType ? `
          <tr>
            <td style="padding: 12px; background-color: #f8f9fa; font-weight: 600; color: #2c3e50;">Installation</td>
            <td style="padding: 12px; border: 1px solid #dee2e6; color: #495057; text-transform: capitalize;">${installationType}</td>
          </tr>
          ` : ''}
        </table>
      </div>

      <!-- Customer Information -->
      <div style="margin-bottom: 25px;">
        <h3 style="color: #2c3e50; border-bottom: 2px solid #024a47; padding-bottom: 10px;">
          👤 Customer Information
        </h3>
        
        <table style="width: 100%; border-collapse: collapse; margin-top: 20px;">
          <tr>
            <td style="padding: 12px; background-color: #f8f9fa; width: 35%; font-weight: 600; color: #2c3e50;">Name</td>
            <td style="padding: 12px; border: 1px solid #dee2e6; color: #495057;">${populatedRequest.user.name}</td>
          </tr>
          <tr>
            <td style="padding: 12px; background-color: #f8f9fa; font-weight: 600; color: #2c3e50;">Email</td>
            <td style="padding: 12px; border: 1px solid #dee2e6; color: #495057;">${populatedRequest.user.email}</td>
          </tr>
          
          ${populatedRequest?.deliveryAddress?.street?.length > 0 ? `
            <tr>
              <td style="padding: 12px; background-color: #f8f9fa; font-weight: 600; color: #2c3e50;">Delivery Address</td>
              <td style="padding: 12px; border: 1px solid #dee2e6; color: #495057;">
                ${formatAddress(populatedRequest.deliveryAddress)}
              </td>
            </tr>
          ` : ''}
          

          ${populatedRequest?.pickUpAddress ? `
            <tr>
              <td style="padding: 12px; background-color: #f8f9fa; font-weight: 600; color: #2c3e50;">Preferred Pickup Address</td>
              <td style="padding: 12px; border: 1px solid #dee2e6; color: #495057;">
                ${populatedRequest.pickUpAddress}
                <div style="margin-top: 8px; padding: 8px; background-color: #fff3cd; border-left: 3px solid #ffc107; font-size: 13px; color: #856404;">
                  <strong>Note:</strong> Customer has requested pickup from this address. Please confirm availability or suggest an alternative.
                </div>
              </td>
            </tr>
          ` : ''}

          ${populatedRequest.user.phone ? `
          <tr>
            <td style="padding: 12px; background-color: #f8f9fa; font-weight: 600; color: #2c3e50;">Phone</td>
            <td style="padding: 12px; border: 1px solid #dee2e6; color: #495057;">${populatedRequest.user.phone}</td>
          </tr>
          ` : ''}
        </table>
      </div>

      <!-- What To Do Next -->
      <div style="margin-bottom: 25px;">
        <h3 style="color: #2c3e50; border-bottom: 2px solid #024a47; padding-bottom: 10px;">
          🚀 What To Do Next?
        </h3>
        
        <div style="background-color: #f8f9fa; padding: 20px; border-radius: 8px; margin-top: 15px;">
          <div style="margin-bottom: 20px;">
            <div style="display: flex; align-items: start; margin-bottom: 15px;">
              <span style="background-color: #024a47; color: white; width: 28px; height: 28px; border-radius: 50%; display: inline-flex; align-items: center; justify-content: center; font-weight: bold; margin-right: 12px; flex-shrink: 0;">1</span>
              <div>
                <h4 style="margin: 0 0 5px 0; color: #2c3e50; font-size: 16px;">Review the Request</h4>
                <p style="margin: 0; color: #6c757d; font-size: 14px; line-height: 1.5;">
                  Check the customer's profile and rental details to ensure it's a good fit.
                </p>
              </div>
            </div>
          </div>

          <div style="margin-bottom: 20px;">
            <div style="display: flex; align-items: start; margin-bottom: 15px;">
              <span style="background-color: #024a47; color: white; width: 28px; height: 28px; border-radius: 50%; display: inline-flex; align-items: center; justify-content: center; font-weight: bold; margin-right: 12px; flex-shrink: 0;">2</span>
              <div>
                <h4 style="margin: 0 0 5px 0; color: #2c3e50; font-size: 16px;">Approve or Decline</h4>
                <p style="margin: 0; color: #6c757d; font-size: 14px; line-height: 1.5;">
                  Log in to your dashboard to approve or decline the request. Remember, fast responses lead to more successful rentals!
                </p>
              </div>
            </div>
          </div>

          <div>
            <div style="display: flex; align-items: start;">
              <span style="background-color: #024a47; color: white; width: 28px; height: 28px; border-radius: 50%; display: inline-flex; align-items: center; justify-content: center; font-weight: bold; margin-right: 12px; flex-shrink: 0;">3</span>
              <div>
                <h4 style="margin: 0 0 5px 0; color: #2c3e50; font-size: 16px;">Coordinate Details</h4>
                <p style="margin: 0; color: #6c757d; font-size: 14px; line-height: 1.5;">
                  Once approved, coordinate delivery, installation, and payment details with the customer.
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
          Review Request Now
        </a>
      </div>

      <!-- Tips Section -->
      <div style="margin-top: 30px; padding: 20px; background-color: #e7f3f2; border-left: 4px solid #024a47; border-radius: 4px;">
        <h4 style="margin: 0 0 10px 0; color: #024a47; font-size: 16px;">💡 Tips for a Successful Rental</h4>
        <ul style="margin: 10px 0; padding-left: 20px; color: #495057; font-size: 14px; line-height: 1.8;">
          <li><strong>Respond quickly:</strong> Customers are more likely to proceed when you respond within a few hours</li>
          <li><strong>Communicate clearly:</strong> Confirm delivery/pickup details and any special requirements</li>
          <li><strong>Verify availability:</strong> Make sure the item is ready and available for the requested dates</li>
          <li><strong>Be professional:</strong> Great service leads to positive reviews and repeat customers</li>
        </ul>
      </div>

      <!-- Stats Highlight -->
      <div style="margin-top: 25px;">
        <table style="width: 100%; border-collapse: collapse;">
          <tr>
            <td style="padding: 20px; background-color: #f8f9fa; text-align: center; border-right: 1px solid #dee2e6; width: 50%;">
              <div style="font-size: 32px; font-weight: 700; color: #024a47; margin-bottom: 5px;">$${populatedRequest.listing.pricing.rentPrice}</div>
              <div style="color: #6c757d; font-size: 13px;">Potential Monthly Earnings</div>
            </td>
            <td style="padding: 20px; background-color: #f8f9fa; text-align: center; width: 50%;">
              <div style="font-size: 32px; font-weight: 700; color: #024a47; margin-bottom: 5px;">2-4h</div>
              <div style="color: #6c757d; font-size: 13px;">Ideal Response Time</div>
            </td>
          </tr>
        </table>
      </div>

      <!-- Customer Support -->
      <div style="margin-top: 30px; padding: 20px; background-color: #f8f9fa; border-radius: 8px;">
        <h4 style="margin: 0 0 10px 0; color: #2c3e50; font-size: 16px;">Need Help?</h4>
        <p style="margin: 0; color: #495057; font-size: 14px; line-height: 1.6;">
          Questions about handling rental requests or managing the rental process? Our support team is here to help you succeed.
        </p>
      </div>

      <!-- Request ID -->
      <div style="margin-top: 20px; padding: 15px; background-color: #e9ecef; border-radius: 4px; text-align: center;">
        <p style="margin: 0; color: #6c757d; font-size: 12px;">
          Request ID: <strong>#${populatedRequest._id}</strong> • Account: ${vendor.email}
        </p>
      </div>
    </div>

    <!-- Footer -->
    <div style="background-color: #2c3e50; padding: 20px; text-align: center;">
      <p style="margin: 0; color: #ecf0f1; font-size: 12px;">
        Don't let this opportunity slip away - respond now!
      </p>
      <p style="margin: 10px 0 0 0; color: #95a5a6; font-size: 11px;">
        © 2025 RentSimple. All rights reserved.
      </p>
    </div>
  </div>
`
};
const userMailOptions = {
  from: 'orders@enrichifydata.com',
  to: populatedRequest.user.email,
  subject: '✅ Rental Request Sent Successfully - RentSimple',
  html: `
    <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; background-color: #ffffff;">
      <!-- Header -->
      <div style="background-color: #28a745; padding: 30px; text-align: center;">
        <h1 style="color: #ffffff; margin: 0; font-size: 28px;">✅ Request Sent!</h1>
        <p style="color: #e9ecef; margin-top: 10px; font-size: 16px;">Your rental request has been submitted successfully</p>
      </div>
      
      <!-- Time -->
      <div style="padding: 20px; background-color: #f8f9fa; border-bottom: 2px solid #e9ecef;">
        <p style="margin: 0; color: #7f8c8d; font-size: 14px;">Submitted On</p>
        <h2 style="margin: 5px 0 0 0; color: #2c3e50; font-size: 20px;">${new Date().toLocaleString('en-US', { 
          dateStyle: 'full', 
          timeStyle: 'short' 
        })}</h2>
      </div>

      <!-- Main Content -->
      <div style="padding: 30px;">
        <h3 style="color: #2c3e50; border-bottom: 2px solid #28a745; padding-bottom: 10px; margin-top: 0;">
          Request Confirmation
        </h3>
        
        <p style="color: #495057; font-size: 16px; line-height: 1.6; margin-top: 20px;">
          Hello <strong>${populatedRequest.user.name}</strong>,
        </p>
        
        <p style="color: #495057; font-size: 16px; line-height: 1.6;">
          Great news! Your rental request has been successfully sent to the vendor. They will review your request and respond soon.
        </p>

        <!-- Success Message -->
        <div style="margin-top: 25px; padding: 20px; background-color: #d4edda; border-left: 4px solid #28a745; border-radius: 4px;">
          <h4 style="margin: 0 0 10px 0; color: #155724; font-size: 16px;">✨ What Happens Next?</h4>
          <p style="margin: 0; color: #155724; font-size: 14px; line-height: 1.6;">
            The vendor will review your request and typically responds within 24-48 hours. We'll notify you immediately once they accept or respond to your request.
          </p>
        </div>

        <!-- Product Information -->
        ${populatedRequest.listing.images && populatedRequest.listing.images.length > 0 ? `
        <div style="text-align: center; margin: 25px 0;">
          <img src="${populatedRequest.listing.images.find(img => img.isPrimary)?.url || populatedRequest.listing.images[0].url}" 
               alt="${populatedRequest.listing.title}" 
               style="max-width: 100%; height: auto; border-radius: 8px; border: 1px solid #dee2e6;" />
        </div>
        ` : ''}

        <h4 style="color: #2c3e50; margin-top: 30px; margin-bottom: 15px;">Request Details:</h4>
        
        <table style="width: 100%; border-collapse: collapse; margin-top: 20px;">
          <tr>
            <td style="padding: 12px; background-color: #f8f9fa; width: 40%; font-weight: 600; color: #2c3e50;">Product</td>
            <td style="padding: 12px; border: 1px solid #dee2e6; color: #495057;">${populatedRequest.listing.title}</td>
          </tr>
          <tr>
            <td style="padding: 12px; background-color: #f8f9fa; font-weight: 600; color: #2c3e50;">Brand</td>
            <td style="padding: 12px; border: 1px solid #dee2e6; color: #495057;">${populatedRequest.listing.brand}</td>
          </tr>
          <tr>
            <td style="padding: 12px; background-color: #f8f9fa; font-weight: 600; color: #2c3e50;">Category</td>
            <td style="padding: 12px; border: 1px solid #dee2e6; color: #495057; text-transform: capitalize;">${populatedRequest.listing.category}</td>
          </tr>
          <tr>
            <td style="padding: 12px; background-color: #f8f9fa; font-weight: 600; color: #2c3e50;">Monthly Rent</td>
            <td style="padding: 12px; border: 1px solid #dee2e6; color: #28a745; font-weight: 700; font-size: 18px;">$${populatedRequest.listing.pricing.rentPrice}/mo</td>
          </tr>
          ${deliveryType ? `
          <tr>
            <td style="padding: 12px; background-color: #f8f9fa; font-weight: 600; color: #2c3e50;">Delivery Type</td>
            <td style="padding: 12px; border: 1px solid #dee2e6; color: #495057; text-transform: capitalize;">${deliveryType}</td>
          </tr>
          ` : ''}
          ${installationType ? `
          <tr>
            <td style="padding: 12px; background-color: #f8f9fa; font-weight: 600; color: #2c3e50;">Installation</td>
            <td style="padding: 12px; border: 1px solid #dee2e6; color: #495057; text-transform: capitalize;">${installationType}</td>
          </tr>
          ` : ''}
          <tr>
            <td style="padding: 12px; background-color: #f8f9fa; font-weight: 600; color: #2c3e50;">Vendor</td>
            <td style="padding: 12px; border: 1px solid #dee2e6; color: #495057;">${vendorFound.name || vendorFound.businessName}</td>
          </tr>
          <tr>
            <td style="padding: 12px; background-color: #f8f9fa; font-weight: 600; color: #2c3e50;">Status</td>
            <td style="padding: 12px; border: 1px solid #dee2e6;">
              <span style="background-color: #ffc107; color: #000; padding: 4px 12px; border-radius: 12px; font-size: 12px; font-weight: 600;">PENDING</span>
            </td>
          </tr>
        </table>

        <!-- Timeline -->
        <div style="margin-top: 30px;">
          <h4 style="color: #2c3e50; margin-bottom: 20px;">📋 Request Timeline:</h4>
          
          <div style="background-color: #f8f9fa; padding: 20px; border-radius: 8px;">
            <div style="margin-bottom: 15px; padding-left: 30px; position: relative;">
              <span style="position: absolute; left: 0; top: 0; background-color: #28a745; color: white; width: 24px; height: 24px; border-radius: 50%; display: inline-flex; align-items: center; justify-content: center; font-weight: bold; font-size: 12px;">✓</span>
              <div>
                <h5 style="margin: 0 0 5px 0; color: #2c3e50; font-size: 14px;">Request Submitted</h5>
                <p style="margin: 0; color: #6c757d; font-size: 13px;">Your request has been sent to the vendor</p>
              </div>
            </div>
            
            <div style="margin-bottom: 15px; padding-left: 30px; position: relative;">
              <span style="position: absolute; left: 0; top: 0; background-color: #ffc107; color: white; width: 24px; height: 24px; border-radius: 50%; display: inline-flex; align-items: center; justify-content: center; font-weight: bold; font-size: 12px;">2</span>
              <div>
                <h5 style="margin: 0 0 5px 0; color: #2c3e50; font-size: 14px;">Vendor Review</h5>
                <p style="margin: 0; color: #6c757d; font-size: 13px;">Waiting for vendor to review and respond (24-48 hours)</p>
              </div>
            </div>
            
            <div style="padding-left: 30px; position: relative;">
              <span style="position: absolute; left: 0; top: 0; background-color: #dee2e6; color: white; width: 24px; height: 24px; border-radius: 50%; display: inline-flex; align-items: center; justify-content: center; font-weight: bold; font-size: 12px;">3</span>
              <div>
                <h5 style="margin: 0 0 5px 0; color: #2c3e50; font-size: 14px;">Response & Next Steps</h5>
                <p style="margin: 0; color: #6c757d; font-size: 13px;">Once approved, coordinate delivery and payment details</p>
              </div>
            </div>
          </div>
        </div>

        <!-- Tips -->
        <div style="margin-top: 30px; padding: 20px; background-color: #e7f3ff; border-left: 4px solid #0d6efd; border-radius: 4px;">
          <h4 style="margin: 0 0 10px 0; color: #0d6efd; font-size: 16px;">💡 While You Wait</h4>
          <ul style="margin: 10px 0; padding-left: 20px; color: #495057; font-size: 14px; line-height: 1.8;">
            <li>Keep an eye on your email for vendor responses</li>
            <li>Check your dashboard for request status updates</li>
            <li>Have your delivery address ready for confirmation</li>
            <li>Prepare any questions you may have for the vendor</li>
          </ul>
        </div>

        <!-- Call to Action Button -->
        <div style="text-align: center; margin-top: 30px;">
          <a href="${process.env.FRONTEND_URL || 'https://rentsimpledeals.com'}/renterdashboard" 
             style="display: inline-block; background-color: #024a47; color: #ffffff; padding: 15px 40px; text-decoration: none; border-radius: 8px; font-weight: 600; font-size: 16px;">
            View My Requests
          </a>
        </div>

        <!-- Support Info -->
        <div style="margin-top: 30px; padding: 20px; background-color: #f8f9fa; border-radius: 8px;">
          <h4 style="margin: 0 0 10px 0; color: #2c3e50; font-size: 16px;">Need Help?</h4>
          <p style="margin: 0; color: #495057; font-size: 14px; line-height: 1.6;">
            If you have any questions or concerns about your rental request, our support team is here to help.
          </p>
        </div>

        <!-- Request ID -->
        <div style="margin-top: 20px; padding: 15px; background-color: #e9ecef; border-radius: 4px; text-align: center;">
          <p style="margin: 0; color: #6c757d; font-size: 12px;">Request ID: <strong>#${populatedRequest._id}</strong></p>
        </div>
      </div>

      <!-- Footer -->
      <div style="background-color: #2c3e50; padding: 20px; text-align: center;">
        <p style="margin: 0; color: #ecf0f1; font-size: 12px;">
          This is an automated confirmation from RentSimple.
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
// await transporter.sendMail(userMailOptions)
return res.status(200).json({
  message:"Request sent to vendor successfully"
})
}catch(e){
console.log(e.message)
return res.status(400).json({
  error:"Error while sending request"
})   
}
}

module.exports.getRequestsUser=async(req,res)=>{
    try{
        let requests = await requestModel.find({
            user: req.user._id,
            $or: [
              { status: 'pending' },
              { status: 'approved' },
              {status:'rejected'}
            ],
            approvedByUser:false
          });
          console.log(requests)
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


module.exports.getRequestsProfileUser=async(req,res)=>{
  try{
      let requests = await requestModel.find({
          user: req.user._id,
          $or: [
            {status:'approved'},
            {status:'pending'}
          ],
          deliveryType:'delivery'
        }).populate('listing');
        console.log(requests)
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

module.exports.rejectOffer = async(req, res) => {
  let {id} = req.params;
  const {rejectionReason}=req.body;
  try {
 
      const request = await requestModel.findOne({listing: id})
          .populate('listing')
          .populate('vendor')
          .populate('user');
     
      if (!request) {
          return res.status(404).json({
              error: "Request not found"
          });
      }
    
      // Update the request status
      const lastRequest = await requestModel
      .findOne({ listing: id.toString() })
      .sort({ _id: -1 }); // get the latest one
    
    const updateResult = await requestModel.updateOne(
      { _id: lastRequest._id },
      {
        $set: {
          status: "rejected",
          rejectionReason,
          approvedByVendor: false
        }
      }
    );
    
    await listing.updateOne({_id:id},{
      $set:{
        status:'inactive'
      }
    })
  
      
      // Send email to vendor
      if (request.vendor && request.vendor.email) {
          const mailOptions = {
              from: 'orders@enrichifydata.com',
              to: request.vendor.email,
              subject: 'Rental Offer Rejected by Customer - RentSimple',
              html: `
                  <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; background-color: #ffffff;">
                      <!-- Header -->
                      <div style="background-color: #dc3545; padding: 30px; text-align: center;">
                          <h1 style="color: #ffffff; margin: 0; font-size: 28px;">❌ Offer Rejected</h1>
                          <p style="color: #f8d7da; margin-top: 10px; font-size: 16px;">Customer declined your rental offer</p>
                      </div>
                      
                      <!-- Rejection Time -->
                      <div style="padding: 20px; background-color: #f8f9fa; border-bottom: 2px solid #e9ecef;">
                          <p style="margin: 0; color: #7f8c8d; font-size: 14px;">Rejected On</p>
                          <h2 style="margin: 5px 0 0 0; color: #2c3e50; font-size: 20px;">${new Date().toLocaleString('en-US', { 
                              dateStyle: 'full', 
                              timeStyle: 'short' 
                          })}</h2>
                      </div>

                      <!-- Main Content -->
                      <div style="padding: 30px;">
                          <h3 style="color: #2c3e50; border-bottom: 2px solid #dc3545; padding-bottom: 10px; margin-top: 0;">
                              Rental Offer Declined
                          </h3>
                          
                          <p style="color: #495057; font-size: 16px; line-height: 1.6; margin-top: 20px;">
                              Hello <strong>${request.vendor.name || request.vendor.username}</strong>,
                          </p>
                          
                          <p style="color: #495057; font-size: 16px; line-height: 1.6;">
                              We're writing to inform you that a customer has declined your rental offer. The rental request for your product has been rejected.
                          </p>

                          <!-- Product Information -->
                          ${request.listing && request.listing.images && request.listing.images.length > 0 ? `
                          <div style="text-align: center; margin: 20px 0;">
                              <img src="${request.listing.images.find(img => img.isPrimary)?.url || request.listing.images[0].url}" 
                                   alt="${request.listing.title}" 
                                   style="max-width: 100%; height: auto; border-radius: 8px; border: 1px solid #dee2e6;" />
                          </div>
                          ` : ''}

                          <h4 style="color: #2c3e50; margin-top: 30px; margin-bottom: 15px;">Rejected Offer Details:</h4>
                          
                          <table style="width: 100%; border-collapse: collapse; margin-top: 20px;">
                              ${request.listing ? `
                              <tr>
                                  <td style="padding: 12px; background-color: #f8f9fa; width: 40%; font-weight: 600; color: #2c3e50;">Product</td>
                                  <td style="padding: 12px; border: 1px solid #dee2e6; color: #495057;">${request.listing.title}</td>
                              </tr>
                              <tr>
                                  <td style="padding: 12px; background-color: #f8f9fa; font-weight: 600; color: #2c3e50;">Brand</td>
                                  <td style="padding: 12px; border: 1px solid #dee2e6; color: #495057;">${request.listing.brand || 'N/A'}</td>
                              </tr>
                              <tr>
                                  <td style="padding: 12px; background-color: #f8f9fa; font-weight: 600; color: #2c3e50;">Category</td>
                                  <td style="padding: 12px; border: 1px solid #dee2e6; color: #495057; text-transform: capitalize;">${request.listing.category || 'N/A'}</td>
                              </tr>
                              <tr>
                                  <td style="padding: 12px; background-color: #f8f9fa; font-weight: 600; color: #2c3e50;">Monthly Rent</td>
                                  <td style="padding: 12px; border: 1px solid #dee2e6; color: #dc3545; font-weight: 700; font-size: 18px;">$${request.listing.pricing?.rentPrice || 'N/A'}/mo</td>
                              </tr>
                              ` : ''}
                              ${request.user ? `
                              <tr>
                                  <td style="padding: 12px; background-color: #f8f9fa; font-weight: 600; color: #2c3e50;">Customer</td>
                                  <td style="padding: 12px; border: 1px solid #dee2e6; color: #495057;">${request.user.name || request.user.email}</td>
                              </tr>
                              ` : ''}
                              <tr>
                                  <td style="padding: 12px; background-color: #f8f9fa; font-weight: 600; color: #2c3e50;">Status</td>
                                  <td style="padding: 12px; border: 1px solid #dee2e6;">
                                      <span style="background-color: #dc3545; color: white; padding: 4px 12px; border-radius: 12px; font-size: 12px; font-weight: 600;">REJECTED</span>
                                  </td>
                              </tr>
                              ${request.deliveryType ? `
                              <tr>
                                  <td style="padding: 12px; background-color: #f8f9fa; font-weight: 600; color: #2c3e50;">Delivery Type</td>
                                  <td style="padding: 12px; border: 1px solid #dee2e6; color: #495057; text-transform: capitalize;">${request.deliveryType}</td>
                              </tr>
                              ` : ''}
                              ${request.installationType ? `
                              <tr>
                                  <td style="padding: 12px; background-color: #f8f9fa; font-weight: 600; color: #2c3e50;">Installation</td>
                                  <td style="padding: 12px; border: 1px solid #dee2e6; color: #495057; text-transform: capitalize;">${request.installationType}</td>
                              </tr>
                              ` : ''}
                              ${rejectionReason ? `
                                <tr>
                                    <td style="padding: 12px; background-color: #f8f9fa; font-weight: 600; color: #2c3e50;">Rejection Reason</td>
                                    <td style="padding: 12px; border: 1px solid #dee2e6; color: #dc3545; font-weight: 600;">${rejectionReason}</td>
                                </tr>
                                ` : ''}
                          </table>


                          <!-- What This Means -->
                          <div style="margin-top: 30px; padding: 20px; background-color: #d1ecf1; border-left: 4px solid #17a2b8; border-radius: 4px;">
                              <h4 style="margin: 0 0 10px 0; color: #0c5460; font-size: 16px;">💡 What This Means</h4>
                              <p style="margin: 0; color: #0c5460; font-size: 14px; line-height: 1.6;">
                                  The customer has decided not to proceed with renting this item. Your product remains available for other customers to rent. No further action is required from you.
                              </p>
                          </div>

                          <!-- Keep Going -->
                          <div style="margin-top: 30px; padding: 20px; background-color: #d4edda; border-left: 4px solid #28a745; border-radius: 4px;">
                              <h4 style="margin: 0 0 10px 0; color: #155724; font-size: 16px;">📈 Keep Growing</h4>
                              <ul style="margin: 10px 0; padding-left: 20px; color: #155724; line-height: 1.8;">
                                  <li>Your listing is still active and visible to customers</li>
                                  <li>Other customers can still request to rent your item</li>
                                  <li>Consider reviewing your pricing or listing details</li>
                                  <li>Keep your listings updated with clear photos and descriptions</li>
                              </ul>
                          </div>

                          <!-- Call to Action Button -->
                          <div style="text-align: center; margin-top: 30px;">
                              <a href="${process.env.FRONTEND_URL || 'https://rentsimpledeals.com'}/vendor/listings" 
                                 style="display: inline-block; background-color: #024a47; color: #ffffff; padding: 15px 40px; text-decoration: none; border-radius: 8px; font-weight: 600; font-size: 16px;">
                                  View My Listings
                              </a>
                          </div>

                          <!-- Tips Section -->
                          <div style="margin-top: 30px; padding: 20px; background-color: #fff3cd; border-left: 4px solid #ffc107; border-radius: 4px;">
                              <h4 style="margin: 0 0 10px 0; color: #856404; font-size: 16px;">💡 Tips to Increase Rentals</h4>
                              <ul style="margin: 10px 0; padding-left: 20px; color: #856404; line-height: 1.8;">
                                  <li>Ensure your product photos are clear and high-quality</li>
                                  <li>Write detailed, honest descriptions</li>
                                  <li>Keep your pricing competitive</li>
                                  <li>Respond quickly to rental requests</li>
                                  <li>Maintain excellent customer service</li>
                              </ul>
                          </div>

                          <!-- Support Info -->
                          <div style="margin-top: 30px; padding: 20px; background-color: #f8f9fa; border-radius: 8px;">
                              <h4 style="margin: 0 0 10px 0; color: #2c3e50; font-size: 16px;">Need Help?</h4>
                              <p style="margin: 0; color: #495057; font-size: 14px; line-height: 1.6;">
                                  If you have questions about this rejection or need tips on improving your listings, our support team is here to help you succeed.
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
          const userMailOptions = {
            from: 'orders@enrichifydata.com',
            to: request.user.email,
            subject: 'Offer Rejection Confirmed - RentSimple',
            html: `
                <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; background-color: #ffffff;">
                    <!-- Header -->
                    <div style="background-color: #6c757d; padding: 30px; text-align: center;">
                        <h1 style="color: #ffffff; margin: 0; font-size: 28px;">✅ Rejection Confirmed</h1>
                        <p style="color: #e9ecef; margin-top: 10px; font-size: 16px;">You have declined the rental offer</p>
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
                            Offer Rejection Confirmed
                        </h3>
                        
                        <p style="color: #495057; font-size: 16px; line-height: 1.6; margin-top: 20px;">
                            Hello <strong>${request.user.name}</strong>,
                        </p>
                        
                        <p style="color: #495057; font-size: 16px; line-height: 1.6;">
                            This confirms that you have successfully declined the rental offer from the vendor. The vendor has been notified of your decision.
                        </p>
  
                        <!-- Confirmation Message -->
                        <div style="margin-top: 25px; padding: 20px; background-color: #d1ecf1; border-left: 4px solid #17a2b8; border-radius: 4px;">
                            <h4 style="margin: 0 0 10px 0; color: #0c5460; font-size: 16px;">✓ What We've Done</h4>
                            <p style="margin: 0; color: #0c5460; font-size: 14px; line-height: 1.6;">
                                We've notified the vendor of your decision and closed this rental request. No further action is required from you regarding this offer.
                            </p>
                        </div>
  
                        <!-- Product Information -->
                        ${request.listing && request.listing.images && request.listing.images.length > 0 ? `
                        <div style="text-align: center; margin: 25px 0;">
                            <img src="${request.listing.images.find(img => img.isPrimary)?.url || request.listing.images[0].url}" 
                                 alt="${request.listing.title}" 
                                 style="max-width: 100%; height: auto; border-radius: 8px; border: 1px solid #dee2e6;" />
                        </div>
                        ` : ''}
  
                        <h4 style="color: #2c3e50; margin-top: 30px; margin-bottom: 15px;">Rejected Offer Details:</h4>
                        
                        <table style="width: 100%; border-collapse: collapse; margin-top: 20px;">
                            ${request.listing ? `
                            <tr>
                                <td style="padding: 12px; background-color: #f8f9fa; width: 40%; font-weight: 600; color: #2c3e50;">Product</td>
                                <td style="padding: 12px; border: 1px solid #dee2e6; color: #495057;">${request.listing.title}</td>
                            </tr>
                            <tr>
                                <td style="padding: 12px; background-color: #f8f9fa; font-weight: 600; color: #2c3e50;">Brand</td>
                                <td style="padding: 12px; border: 1px solid #dee2e6; color: #495057;">${request.listing.brand || 'N/A'}</td>
                            </tr>
                            <tr>
                                <td style="padding: 12px; background-color: #f8f9fa; font-weight: 600; color: #2c3e50;">Category</td>
                                <td style="padding: 12px; border: 1px solid #dee2e6; color: #495057; text-transform: capitalize;">${request.listing.category || 'N/A'}</td>
                            </tr>
                            <tr>
                                <td style="padding: 12px; background-color: #f8f9fa; font-weight: 600; color: #2c3e50;">Monthly Rent</td>
                                <td style="padding: 12px; border: 1px solid #dee2e6; color: #6c757d; font-weight: 700; font-size: 18px;">$${request.listing.pricing?.rentPrice || 'N/A'}/mo</td>
                            </tr>
                            ` : ''}
                            ${request.vendor ? `
                            <tr>
                                <td style="padding: 12px; background-color: #f8f9fa; font-weight: 600; color: #2c3e50;">Vendor</td>
                                <td style="padding: 12px; border: 1px solid #dee2e6; color: #495057;">${request.vendor.name || request.vendor.businessName || 'N/A'}</td>
                            </tr>
                            ` : ''}
                            ${request.deliveryType ? `
                            <tr>
                                <td style="padding: 12px; background-color: #f8f9fa; font-weight: 600; color: #2c3e50;">Delivery Type</td>
                                <td style="padding: 12px; border: 1px solid #dee2e6; color: #495057; text-transform: capitalize;">${request.deliveryType}</td>
                            </tr>
                            ` : ''}
                            ${request.installationType ? `
                            <tr>
                                <td style="padding: 12px; background-color: #f8f9fa; font-weight: 600; color: #2c3e50;">Installation</td>
                                <td style="padding: 12px; border: 1px solid #dee2e6; color: #495057; text-transform: capitalize;">${request.installationType}</td>
                            </tr>
                            ` : ''}
                            <tr>
                                <td style="padding: 12px; background-color: #f8f9fa; font-weight: 600; color: #2c3e50;">Status</td>
                                <td style="padding: 12px; border: 1px solid #dee2e6;">
                                    <span style="background-color: #6c757d; color: white; padding: 4px 12px; border-radius: 12px; font-size: 12px; font-weight: 600;">REJECTED</span>
                                </td>
                            </tr>
                        </table>
  
                        <!-- Explore Other Options -->
                        <div style="margin-top: 30px; padding: 20px; background-color: #d4edda; border-left: 4px solid #28a745; border-radius: 4px;">
                            <h4 style="margin: 0 0 10px 0; color: #155724; font-size: 16px;">🔍 Find What You're Looking For</h4>
                            <p style="margin: 0; color: #155724; font-size: 14px; line-height: 1.6;">
                                Not the right fit? Browse thousands of other rental options that might better suit your needs. We have a wide variety of products available from verified vendors.
                            </p>
                        </div>
  
                        <!-- Call to Action Buttons -->
                        <div style="text-align: center; margin-top: 30px;">
                            <a href="${process.env.FRONTEND_URL || 'https://rentsimpledeals.com'}/browse" 
                               style="display: inline-block; background-color: #024a47; color: #ffffff; padding: 15px 40px; text-decoration: none; border-radius: 8px; font-weight: 600; font-size: 16px; margin: 0 10px 10px 0;">
                                Browse Products
                            </a>
                            <a href="${process.env.FRONTEND_URL || 'https://rentsimpledeals.com'}/renterdashboard" 
                               style="display: inline-block; background-color: #6c757d; color: #ffffff; padding: 15px 40px; text-decoration: none; border-radius: 8px; font-weight: 600; font-size: 16px; margin: 0 0 10px 10px;">
                                View My Requests
                            </a>
                        </div>
  
                        <!-- Why Choose RentSimple -->
                        <div style="margin-top: 30px; padding: 20px; background-color: #e7f3f2; border-left: 4px solid #024a47; border-radius: 4px;">
                            <h4 style="margin: 0 0 10px 0; color: #024a47; font-size: 16px;">💡 Why Keep Looking on RentSimple?</h4>
                            <ul style="margin: 10px 0; padding-left: 20px; color: #495057; font-size: 14px; line-height: 1.8;">
                                <li><strong>Wide Selection:</strong> Thousands of products across multiple categories</li>
                                <li><strong>Verified Vendors:</strong> All vendors are vetted for quality and reliability</li>
                                <li><strong>Flexible Terms:</strong> Find rental options that fit your schedule and budget</li>
                                <li><strong>Secure Transactions:</strong> Safe and protected rental process</li>
                            </ul>
                        </div>
  
                        <!-- Support Info -->
                        <div style="margin-top: 30px; padding: 20px; background-color: #f8f9fa; border-radius: 8px;">
                            <h4 style="margin: 0 0 10px 0; color: #2c3e50; font-size: 16px;">Need Help?</h4>
                            <p style="margin: 0; color: #495057; font-size: 14px; line-height: 1.6;">
                                If you have questions or need assistance finding the right rental product, our support team is here to help you.
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
                            This is an automated confirmation from RentSimple.
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

          // await transporter.sendMail(mailOptions);
          // await transporter.sendMail(userMailOptions)
          console.log('📧 Offer rejection email sent to vendor:', request.vendor.email);
      }

      return res.status(200).json({
          message: "Offer rejected successfully"
      });
      
  } catch(e) {
      console.log(e.message);
      return res.status(400).json({
          error: "Error occurred while trying to reject offer"
      });
  }
}


module.exports.rejectRequestOffer=async(req,res)=>{
    let {id}=req.params;
    try{
await requestModel.updateOne({_id:id},{
    $set:{
        status:'rejected'
    }
})

return res.status(200).json({
    message:"Offer rejected sucessfully"
})
    }catch(e){

        console.log(e.message)
        return res.status(400).json({
            error:"Error occured while trying to reject offer"
        })
    }
}

module.exports.getRequestById=async(req,res)=>{
let {id}=req.params
let userId=req?.user?._id?req?.user?._id:req.user.id
    try{
      let user = await userModel.findById(userId)
      .select("credit paymentMethodToken")
      .lean();

      let paymentMethod = null;
      if (user?.paymentMethodToken) {
        try {
          paymentMethod = jwt.verify(
            user.paymentMethodToken,
            process.env.JWT_KEY
          );
        } catch (err) {
          
          paymentMethod = null;
        }
      }
  

      let credits = user?.credit || 0; 
let request=await requestModel.findById(id).populate('user')
.populate('listing')
.populate('vendor');
return res.status(200).json({
    request,
    credits,
    paymentMethod
})
    }catch(e){
        console.log(e.message)
        return res.status(400).json({
            error:"Error occured while fetching request"
        })
    }
}






module.exports.approveOfferByUser = async(req, res) => {
  let { id, totalPrice, paymentMethodId, newCredits, creditsUsed, totalBeforeCredits } = req.body;
  const FIXED_WARRANTY_FEE = 15;
  try {
    const stripe = require('stripe')(process.env.STRIPE_LIVE);
    
    let request = await requestModel.findById(id)
      .populate('user')
      .populate({
        path: 'listing',
        populate: { path: 'vendor' }
      });
    
    const vendor = request.listing.vendor;

    if (!vendor || !vendor.stripe_account_id || !vendor.stripe_connect_status) {
      return res.status(400).json({ 
        error: 'Vendor payment setup incomplete' 
      });
    }
    
    let customerId = request.user.stripe_customer_id || request.user.stripeCustomerId;
    
    if (!customerId) {
      const customer = await stripe.customers.create({
        email: request.user.email,
        name: request.user.name || request.user.username,
        metadata: { userId: request.user._id.toString() }
      },{
          idempotencyKey: `customer-${request.user._id.toString()}`
      });
      customerId = customer.id;
      
      await userModel.findByIdAndUpdate(request.user._id, {
        $set: { 
          stripe_customer_id: customerId,
          stripeCustomerId: customerId,
          paymentMethodToken: paymentMethodId,
          credit: newCredits
        }
      }, { new: true });
    } else {
      await userModel.findByIdAndUpdate(request.user._id, {
        $set: { 
          paymentMethodToken: paymentMethodId,
          credit: newCredits 
        }
      });
    }
    
    
    try {
      const paymentMethod = await stripe.paymentMethods.retrieve(paymentMethodId);
      if (paymentMethod.customer !== customerId) {
        await stripe.paymentMethods.attach(paymentMethodId, {
          customer: customerId
        },{
          idempotencyKey: `attach-${paymentMethodId}-${customerId}`
        });
        await stripe.customers.update(customerId, {
          invoice_settings: { default_payment_method: paymentMethodId }
        },{
            idempotencyKey: `update-customer-pm-${customerId}-${paymentMethodId}`
        });
      }
    } catch (attachError) {
      console.log('Payment method already attached:', attachError.message);
    }
    
    
    const creditsApplied = creditsUsed || 0;
    let deliveryFeeToCharge = 60;
    let serviceFeeToCharge = 12;
    let monthlyRentToCharge = request.listing.pricing.rentPrice;
    let warrantyFeeToCharge = 0;

    if (request.listing.powerType === 'Warranty') {
      warrantyFeeToCharge = FIXED_WARRANTY_FEE;
    }

    if (creditsApplied > 0) {
     
      let remainingCredits = creditsApplied;
      
   
      if (remainingCredits >= deliveryFeeToCharge) {
        remainingCredits -= deliveryFeeToCharge;
        deliveryFeeToCharge = 0;
      } else {
        deliveryFeeToCharge -= remainingCredits;
        remainingCredits = 0;
      }
      
    
      if (remainingCredits >= serviceFeeToCharge) {
        remainingCredits -= serviceFeeToCharge;
        serviceFeeToCharge = 0;
      } else {
        serviceFeeToCharge -= remainingCredits;
        remainingCredits = 0;
      }
      
      if (remainingCredits >= warrantyFeeToCharge) {
        remainingCredits -= warrantyFeeToCharge;
        warrantyFeeToCharge = 0;
      } else {
        warrantyFeeToCharge -= remainingCredits;
        remainingCredits = 0;
      }
      
  
      if (remainingCredits > 0) {
        monthlyRentToCharge = Math.max(0, monthlyRentToCharge - remainingCredits);
      }
    }

    console.log('💳 Charges after credits:', {
      deliveryFee: deliveryFeeToCharge,
      serviceFee: serviceFeeToCharge,
      warrantyFee: warrantyFeeToCharge,
      monthlyRent: monthlyRentToCharge,
      creditsApplied: creditsApplied,
      totalToCharge: totalPrice
    });
  
    const deliveryProduct = await stripe.products.create({
      name: 'Installation & Delivery Fee',
      description: 'One-time installation and delivery service fee'
    },{
       idempotencyKey: `service-product-${id}`
    });
    
    const serviceProduct = await stripe.products.create({
      name: 'Service Fee',
      description: 'Platform service fee'
    });
    
   
    const addInvoiceItems = [];

    if (deliveryFeeToCharge > 0) {
      const deliveryPrice = await stripe.prices.create({
        product: deliveryProduct.id,
        unit_amount: Math.round(deliveryFeeToCharge * 100),
        currency: 'usd',
      },{
     idempotencyKey: `delivery-price-${id}-${Math.round(deliveryFeeToCharge * 100)}`
      });
      addInvoiceItems.push({ price: deliveryPrice.id });
    }

    if (serviceFeeToCharge > 0) {
      const servicePrice = await stripe.prices.create({
        product: serviceProduct.id,
        unit_amount: Math.round(serviceFeeToCharge * 100),
        currency: 'usd',
      },{
          idempotencyKey: `service-price-${id}-${Math.round(serviceFeeToCharge * 100)}`
      });
      addInvoiceItems.push({ price: servicePrice.id });
    }
    
    const subscriptionPrice = await stripe.prices.create({
      unit_amount: Math.round(monthlyRentToCharge * 100),
      currency: 'usd',
      recurring: { interval: 'month' },
      product_data: {
        name: `Rental: ${request.listing.title}`,
        metadata: {
          listingId: request.listing._id.toString(),
          requestId: id
        }
      }
    },{
   idempotencyKey: `rent-price-${id}-${Math.round(monthlyRentToCharge * 100)}`
    });
    
    
    const subscriptionItems = [{ price: subscriptionPrice.id }];

// Add warranty as recurring fee if listing has it
if (request.listing.powerType === 'Warranty' && warrantyFeeToCharge > 0) {
  const warrantyPrice = await stripe.prices.create({
    unit_amount: Math.round(warrantyFeeToCharge * 100), // $15 = 1500 cents
    currency: 'usd',
    recurring: { interval: 'month' },
    product_data: {
      name: `Warranty Protection: ${request.listing.title}`,
      metadata: {
        listingId: request.listing._id.toString(),
        requestId: id,
        type: 'warranty',
        warrantyFee: warrantyFeeToCharge.toString()
      }
    }
  }, {
   idempotencyKey: `warranty-price-${id}-${Math.round(warrantyFeeToCharge * 100)}`
  });
  
  subscriptionItems.push({ price: warrantyPrice.id });
  
  console.log('Warranty added to subscription:', {
    warrantyFee: warrantyFeeToCharge,
    priceId: warrantyPrice.id
  });
}


    const PLATFORM_FEE_PERCENT = 20;
    const totalAmountCents = Math.round(totalPrice * 100);
    const platformFeeCents = Math.round(totalAmountCents * (PLATFORM_FEE_PERCENT / 100));
    const vendorPayoutCents = totalAmountCents - platformFeeCents;
    
    console.log('💰 Payment split:', {
      totalCharged: totalPrice,
      creditsUsed: creditsApplied,
      originalTotal: totalBeforeCredits || totalPrice,
      platformFee: platformFeeCents / 100,
      vendorPayout: vendorPayoutCents / 100
    });
    
    
    const subscription = await stripe.subscriptions.create({
      customer: customerId,
      items: [{ price: subscriptionPrice.id }],
      default_payment_method: paymentMethodId,
      add_invoice_items: addInvoiceItems,
      payment_behavior: 'default_incomplete',
      payment_settings: {
        payment_method_types: ['card'],
        save_default_payment_method: 'on_subscription'
      },
      expand: ['latest_invoice.payment_intent'],
      metadata: {
        requestId: id,
        userId: request.user._id.toString(),
        listingId: request.listing._id.toString(),
        vendorId: vendor._id.toString(),
        vendorStripeAccountId: vendor.stripe_account_id,
        totalAmount: totalPrice.toString(),
        creditsApplied: creditsApplied.toString(),
        originalTotal: (totalBeforeCredits || totalPrice).toString(),
        platformFee: (platformFeeCents / 100).toString(),
        vendorPayout: (vendorPayoutCents / 100).toString(),
        transferStatus: 'pending',
        hasWarranty: (request.listing.powerType === 'Warranty').toString(), // NEW
    warrantyFee: warrantyFeeToCharge.toString() 
      }
    },{
      idempotencyKey: `sub-${id}-${Date.now()}`
    });
    
    let paymentIntent = subscription.latest_invoice.payment_intent;
    
    console.log('📋 Initial Payment Intent Status:', paymentIntent.status);
    
  
    if (paymentIntent.status === 'requires_confirmation') {
      paymentIntent = await stripe.paymentIntents.confirm(paymentIntent.id, {
        payment_method: paymentMethodId
      },{
      idempotencyKey: `confirm-pi-${paymentIntent.id}`   
      });
    }
    
    if (paymentIntent.status === 'requires_action') {
      return res.status(200).json({
        requiresAction: true,
        clientSecret: paymentIntent.client_secret,
        paymentIntentId: paymentIntent.id,
        subscriptionId: subscription.id,
        message: 'Payment requires additional authentication'
      });
    }
    
    if (paymentIntent.status !== 'succeeded') {
      return res.status(400).json({
        error: 'Payment not completed',
        status: paymentIntent.status
      });
    }
    
    console.log('✅ Payment successful - money held in platform account');
    
   
    await requestModel.findByIdAndUpdate(id, {
      $set: {
        approvedByUser: true,
        paymentStatus: 'paid',
        paymentIntentId: paymentIntent.id,
        subscriptionId: subscription.id,
        status: 'pending_confirmation',
        totalAmount: totalPrice,
        creditsUsed: creditsApplied,
        originalTotal: totalBeforeCredits || totalPrice,
        platformFee: platformFeeCents / 100,
        vendorPayout: vendorPayoutCents / 100,
        transferStatus: 'pending',
        transferAmount: vendorPayoutCents
      }
    });
    
    const order = await orderModel.create({
      user: request.user._id,
      vendor: vendor._id,
      listing: request.listing._id,
      request: id,
      deliveryType: request.deliveryType,
      installationType: request.installationType,
      deliveryAddress: request.deliveryAddress,
      deliveryDate: request.deliveryDate || new Date(),
      deliveryTime: request.deliveryTime || 'TBD',
      monthlyRent: request.listing.pricing.rentPrice,
      deliveryFee: 60,
      serviceFee: 12,
      totalAmount: totalPrice,
      creditsUsed: creditsApplied,
      originalTotal: totalBeforeCredits || totalPrice,
      platformFee: platformFeeCents / 100,
      vendorPayout: vendorPayoutCents / 100,
      paymentIntentId: paymentIntent.id,
      paymentStatus: 'paid',
      paymentMethod: paymentMethodId,
      status: 'processing',
      subscriptionId: subscription.id,
      productImages: request.images && request.images[0] ? request.images[0] : {},
      rentalStartDate: new Date(),
      transferStatus: 'pending',
      transferAmount: vendorPayoutCents
    });
    
    await listing.findByIdAndUpdate(request.listing._id, {
      $set: {
        status: 'sold'
      }
    });
    
    const userMailOptions = {
      from: 'orders@enrichifydata.com',
      to: request.user.email,
      subject: 'Your Rental Request Has Been Approved',
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; background-color: #ffffff;">
          <!-- Header -->
          <div style="background-color: #024a47; padding: 30px; text-align: center;">
            <h1 style="color: #ffffff; margin: 0; font-size: 28px;">🎉 Rental Request Approved!</h1>
            <p style="color: #ecf0f1; margin-top: 10px; font-size: 16px;">Your vendor has confirmed availability</p>
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
            <!-- Welcome Message -->
            <div style="margin-bottom: 30px;">
              <h3 style="color: #2c3e50; margin-top: 0;">Hi ${request.user.name || 'there'}! 👋</h3>
              <p style="color: #495057; font-size: 15px; line-height: 1.6; margin: 0;">
                Great news — your rental request has been approved. Your vendor has officially confirmed availability, 
                and your rental is now scheduled to move forward.
              </p>
            </div>
    
            <!-- Rental Details Card -->
            <div style="background-color: #e7f3f2; padding: 20px; border-radius: 8px; margin-bottom: 25px; border-left: 4px solid #024a47;">
              <h4 style="margin: 0 0 15px 0; color: #024a47; font-size: 18px;">📦 Rental Details</h4>
              <table style="width: 100%; border-collapse: collapse;">
                <tr>
                  <td style="padding: 8px 0; color: #6c757d; font-size: 14px;">Item:</td>
                  <td style="padding: 8px 0; color: #2c3e50; font-weight: 600; font-size: 14px; text-align: right;">${request.listing.title}</td>
                </tr>
                <tr>
                  <td style="padding: 8px 0; color: #6c757d; font-size: 14px;">Brand:</td>
                  <td style="padding: 8px 0; color: #2c3e50; font-weight: 600; font-size: 14px; text-align: right;">${request.listing.brand}</td>
                </tr>
                <tr>
                  <td style="padding: 8px 0; color: #6c757d; font-size: 14px;">Category:</td>
                  <td style="padding: 8px 0; color: #2c3e50; font-weight: 600; font-size: 14px; text-align: right;">${request.listing.category.charAt(0).toUpperCase() + request.listing.category.slice(1)}</td>
                </tr>
                <tr>
                  <td style="padding: 8px 0; color: #6c757d; font-size: 14px;">Monthly Rent:</td>
                  <td style="padding: 8px 0; color: #024a47; font-weight: 700; font-size: 16px; text-align: right;">$${request.listing.pricing.rentPrice}/month</td>
                </tr>
                ${request.deliveryType ? `
                <tr>
                  <td style="padding: 8px 0; color: #6c757d; font-size: 14px;">Delivery Type:</td>
                  <td style="padding: 8px 0; color: #2c3e50; font-weight: 600; font-size: 14px; text-align: right;">${request.deliveryType}</td>
                </tr>
                ` : ''}
                ${request.installationType ? `
                <tr>
                  <td style="padding: 8px 0; color: #6c757d; font-size: 14px;">Installation:</td>
                  <td style="padding: 8px 0; color: #2c3e50; font-weight: 600; font-size: 14px; text-align: right;">${request.installationType}</td>
                </tr>
                ` : ''}
              </table>
            </div>
    
            <!-- Delivery Address -->
            ${request.deliveryAddress ? `
            <div style="background-color: #f8f9fa; padding: 20px; border-radius: 8px; margin-bottom: 25px;">
              <h4 style="margin: 0 0 10px 0; color: #2c3e50; font-size: 16px;">📍 Delivery Address</h4>
              <p style="margin: 0; color: #495057; font-size: 14px; line-height: 1.6;">
                ${request.deliveryAddress.street || ''}<br>
                ${request.deliveryAddress.city || ''}, ${request.deliveryAddress.state || ''} ${request.deliveryAddress.zipCode || ''}<br>
                ${request.deliveryAddress.country || 'USA'}
              </p>
            </div>
            ` : ''}
    
            <!-- What Happens Next -->
            <div style="margin-bottom: 25px;">
              <h3 style="color: #2c3e50; border-bottom: 2px solid #024a47; padding-bottom: 10px; margin-top: 0;">
                What Happens Next
              </h3>
              
              <div style="background-color: #f8f9fa; padding: 20px; border-radius: 8px; margin-top: 15px;">
                <div style="display: flex; align-items: start; margin-bottom: 15px;">
                  <span style="color: #024a47; margin-right: 10px; font-size: 18px; font-weight: bold;">•</span>
                  <p style="margin: 0; color: #495057; font-size: 14px; line-height: 1.6;">
                    Your payment method will be prepared for processing based on the rental terms
                  </p>
                </div>
                
                <div style="display: flex; align-items: start; margin-bottom: 15px;">
                  <span style="color: #024a47; margin-right: 10px; font-size: 18px; font-weight: bold;">•</span>
                  <p style="margin: 0; color: #495057; font-size: 14px; line-height: 1.6;">
                    You can review the pickup/delivery details inside your dashboard
                  </p>
                </div>
                
                <div style="display: flex; align-items: start; margin-bottom: 15px;">
                  <span style="color: #024a47; margin-right: 10px; font-size: 18px; font-weight: bold;">•</span>
                  <p style="margin: 0; color: #495057; font-size: 14px; line-height: 1.6;">
                    Messaging with your vendor is now unlocked for coordination
                  </p>
                </div>
                
                <div style="display: flex; align-items: start;">
                  <span style="color: #024a47; margin-right: 10px; font-size: 18px; font-weight: bold;">•</span>
                  <p style="margin: 0; color: #495057; font-size: 14px; line-height: 1.6;">
                    Any updates or changes will trigger real-time notifications
                  </p>
                </div>
              </div>
            </div>
    
            <!-- Call to Action Button -->
            <div style="text-align: center; margin-top: 30px;">
              <a href="${process.env.FRONTEND_URL || 'https://rentsimpledeals.com'}/dashboard" 
                 style="display: inline-block; background-color: #024a47; color: #ffffff; padding: 15px 40px; text-decoration: none; border-radius: 8px; font-weight: 600; font-size: 16px;">
                View All Details in Dashboard
              </a>
            </div>
    
            <!-- Help Section -->
            <div style="margin-top: 30px; padding: 20px; background-color: #f8f9fa; border-radius: 8px;">
              <h4 style="margin: 0 0 10px 0; color: #2c3e50; font-size: 16px;">Need Help?</h4>
              <p style="margin: 0; color: #495057; font-size: 14px; line-height: 1.6;">
                If you have any questions or need to make changes to your rental, you can message your vendor 
                directly through the dashboard or contact our support team.
              </p>
            </div>
    
            <!-- Request Reference -->
            <div style="margin-top: 20px; padding: 15px; background-color: #e9ecef; border-radius: 4px;">
              <p style="margin: 0; color: #6c757d; font-size: 12px; text-align: center;">
                Request ID: <strong>#${request._id.toString().slice(-8).toUpperCase()}</strong>
              </p>
            </div>
          </div>
    
          <!-- Footer -->
          <div style="background-color: #2c3e50; padding: 20px; text-align: center;">
            <p style="margin: 0; color: #ecf0f1; font-size: 12px;">
              Thanks for choosing RentSimple. We're committed to delivering a seamless, transparent rental experience at every step.
            </p>
            <p style="margin: 10px 0 0 0; color: #95a5a6; font-size: 11px;">
              © 2025 RentSimple. All rights reserved.
            </p>
          </div>
        </div>
      `
    };


    const vendorMailOptions = {
      from: 'orders@enrichifydata.com',
      to: request.listing.vendor.email,
      subject: 'Rental Successfully Approved',
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; background-color: #ffffff;">
          <!-- Header -->
          <div style="background-color: #024a47; padding: 30px; text-align: center;">
            <h1 style="color: #ffffff; margin: 0; font-size: 28px;">✅ Rental Successfully Approved</h1>
            <p style="color: #ecf0f1; margin-top: 10px; font-size: 16px;">Your confirmation has been submitted</p>
          </div>
          
          <!-- Approval Time -->
          <div style="padding: 20px; background-color: #f8f9fa; border-bottom: 2px solid #e9ecef;">
            <p style="margin: 0; color: #7f8c8d; font-size: 14px;">Confirmed On</p>
            <h2 style="margin: 5px 0 0 0; color: #2c3e50; font-size: 20px;">${new Date().toLocaleString('en-US', { 
              dateStyle: 'full', 
              timeStyle: 'short' 
            })}</h2>
          </div>
    
          <!-- Main Content -->
          <div style="padding: 30px;">
            <!-- Welcome Message -->
            <div style="margin-bottom: 30px;">
              <h3 style="color: #2c3e50; margin-top: 0;">Hi ${request.listing.vendor.name || 'there'}! 👋</h3>
              <p style="color: #495057; font-size: 15px; line-height: 1.6; margin: 0;">
                Your approval has been submitted successfully. The renter has been notified, and the rental request 
                is now confirmed on your end.
              </p>
            </div>
    
            <!-- Rental Details Card -->
            <div style="background-color: #e7f3f2; padding: 20px; border-radius: 8px; margin-bottom: 25px; border-left: 4px solid #024a47;">
              <h4 style="margin: 0 0 15px 0; color: #024a47; font-size: 18px;">📦 Rental Summary</h4>
              <table style="width: 100%; border-collapse: collapse;">
                <tr>
                  <td style="padding: 8px 0; color: #6c757d; font-size: 14px;">Item:</td>
                  <td style="padding: 8px 0; color: #2c3e50; font-weight: 600; font-size: 14px; text-align: right;">${request.listing.title}</td>
                </tr>
                <tr>
                  <td style="padding: 8px 0; color: #6c757d; font-size: 14px;">Renter:</td>
                  <td style="padding: 8px 0; color: #2c3e50; font-weight: 600; font-size: 14px; text-align: right;">${request.user.name}</td>
                </tr>
                <tr>
                  <td style="padding: 8px 0; color: #6c757d; font-size: 14px;">Monthly Rent:</td>
                  <td style="padding: 8px 0; color: #024a47; font-weight: 700; font-size: 16px; text-align: right;">$${request.listing.pricing.rentPrice}/month</td>
                </tr>
                ${request.deliveryType ? `
                <tr>
                  <td style="padding: 8px 0; color: #6c757d; font-size: 14px;">Delivery Type:</td>
                  <td style="padding: 8px 0; color: #2c3e50; font-weight: 600; font-size: 14px; text-align: right;">${request.deliveryType}</td>
                </tr>
                ` : ''}
                ${request.installationType ? `
                <tr>
                  <td style="padding: 8px 0; color: #6c757d; font-size: 14px;">Installation:</td>
                  <td style="padding: 8px 0; color: #2c3e50; font-weight: 600; font-size: 14px; text-align: right;">${request.installationType}</td>
                </tr>
                ` : ''}
                <tr>
                  <td style="padding: 8px 0; color: #6c757d; font-size: 14px;">Status:</td>
                  <td style="padding: 8px 0; color: #024a47; font-weight: 700; font-size: 14px; text-align: right;">ACTIVE</td>
                </tr>
              </table>
            </div>
    
            <!-- Delivery Address -->
            ${request.deliveryAddress ? `
            <div style="background-color: #f8f9fa; padding: 20px; border-radius: 8px; margin-bottom: 25px;">
              <h4 style="margin: 0 0 10px 0; color: #2c3e50; font-size: 16px;">📍 Delivery Location</h4>
              <p style="margin: 0; color: #495057; font-size: 14px; line-height: 1.6;">
                ${request.deliveryAddress.street || ''}<br>
                ${request.deliveryAddress.city || ''}, ${request.deliveryAddress.state || ''} ${request.deliveryAddress.zipCode || ''}<br>
                ${request.deliveryAddress.country || 'USA'}
              </p>
            </div>
            ` : ''}
    
            <!-- What to Expect Next -->
            <div style="margin-bottom: 25px;">
              <h3 style="color: #2c3e50; border-bottom: 2px solid #024a47; padding-bottom: 10px; margin-top: 0;">
                Here's What to Expect Next
              </h3>
              
              <div style="background-color: #f8f9fa; padding: 20px; border-radius: 8px; margin-top: 15px;">
                <div style="display: flex; align-items: start; margin-bottom: 15px;">
                  <span style="color: #024a47; margin-right: 10px; font-size: 18px; font-weight: bold;">•</span>
                  <p style="margin: 0; color: #495057; font-size: 14px; line-height: 1.6;">
                    The rental will appear as <strong>"Active"</strong> in your dashboard
                  </p>
                </div>
                
                <div style="display: flex; align-items: start; margin-bottom: 15px;">
                  <span style="color: #024a47; margin-right: 10px; font-size: 18px; font-weight: bold;">•</span>
                  <p style="margin: 0; color: #495057; font-size: 14px; line-height: 1.6;">
                    The renter now has full access to communicate and coordinate pickup/delivery
                  </p>
                </div>
                
                <div style="display: flex; align-items: start; margin-bottom: 15px;">
                  <span style="color: #024a47; margin-right: 10px; font-size: 18px; font-weight: bold;">•</span>
                  <p style="margin: 0; color: #495057; font-size: 14px; line-height: 1.6;">
                    Stripe will handle all billing and payout processes based on your connected account settings
                  </p>
                </div>
                
                <div style="display: flex; align-items: start;">
                  <span style="color: #024a47; margin-right: 10px; font-size: 18px; font-weight: bold;">•</span>
                  <p style="margin: 0; color: #495057; font-size: 14px; line-height: 1.6;">
                    If any issues arise, you can manage the request directly from your vendor dashboard
                  </p>
                </div>
              </div>
            </div>
    
            <!-- Call to Action Button -->
            <div style="text-align: center; margin-top: 30px;">
              <a href="${process.env.FRONTEND_URL || 'https://rentsimpledeals.com'}/vendordashboard" 
                 style="display: inline-block; background-color: #024a47; color: #ffffff; padding: 15px 40px; text-decoration: none; border-radius: 8px; font-weight: 600; font-size: 16px;">
                Access Your Dashboard
              </a>
            </div>
    
            <!-- Thank You Section -->
            <div style="margin-top: 30px; padding: 20px; background-color: #e7f3f2; border-left: 4px solid #024a47; border-radius: 4px;">
              <h4 style="margin: 0 0 10px 0; color: #024a47; font-size: 16px;">💚 Thank You</h4>
              <p style="margin: 0; color: #495057; font-size: 14px; line-height: 1.6;">
                Thanks for supporting a smooth, consistent experience for your renters. Your responsiveness helps 
                build trust and strengthens the RentSimple marketplace.
              </p>
            </div>
    
            <!-- Support Section -->
            <div style="margin-top: 20px; padding: 20px; background-color: #f8f9fa; border-radius: 8px;">
              <h4 style="margin: 0 0 10px 0; color: #2c3e50; font-size: 16px;">Need Assistance?</h4>
              <p style="margin: 0; color: #495057; font-size: 14px; line-height: 1.6;">
                Our vendor support team is here if you need help with payouts, managing rentals, or any other questions.
              </p>
            </div>
    
            <!-- Request Reference -->
            <div style="margin-top: 20px; padding: 15px; background-color: #e9ecef; border-radius: 4px;">
              <p style="margin: 0; color: #6c757d; font-size: 12px; text-align: center;">
                Request ID: <strong>#${request._id.toString().slice(-8).toUpperCase()}</strong>
              </p>
            </div>
          </div>
    
          <!-- Footer -->
          <div style="background-color: #2c3e50; padding: 20px; text-align: center;">
            <p style="margin: 0; color: #ecf0f1; font-size: 12px;">
              You're helping create a better rental experience for everyone.
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
      
      const info = await transporter.sendMail(vendorMailOptions);
      // await transporter.sendMail(userMailOptions)


    return res.status(200).json({
      success: true,
      message: "Payment received. Funds will be released to vendor after confirmation.",
      paymentIntentId: paymentIntent.id,
      subscriptionId: subscription.id,
      orderId: order._id,
      status: paymentIntent.status,
      transferStatus: 'pending',
      paymentSplit: {
        totalCharged: totalPrice,
        creditsUsed: creditsApplied,
        originalTotal: totalBeforeCredits || totalPrice,
        platformFee: platformFeeCents / 100,
        vendorPayout: vendorPayoutCents / 100,
        note: 'Vendor payout held until confirmation'
      }
    });
    
  } catch(e) {
    console.log('Payment error:', e.message);
    console.error('Full error:', e);
    return res.status(400).json({
      error: "Error occurred while processing payment: " + e.message
    });
  }
};






module.exports.releasePaymentToVendor = async(req, res) => {
  const { orderId } = req.body;
  
  try {
    const stripe = require('stripe')(process.env.STRIPE_LIVE);
  
    let order = await orderModel.findById(orderId)
      .populate('vendor')
      .populate('request');

      
    
      const requestId=order.request._id.toString()
    
    if (!order) {
      return res.status(404).json({ error: 'Order not found' });
    }
    
    
    if (order.transferStatus === 'completed') {
      return res.status(400).json({ 
        error: 'Payment already released to vendor' 
      });
    }
    
    const vendor = order.vendor;
    const transferAmountCents = order.transferAmount || order.vendorPayout * 100;
    
    console.log('💸 Transferring to vendor:', {
      vendorId: vendor._id,
      stripeAccountId: vendor.stripe_account_id,
      amount: transferAmountCents / 100
    });
    
    
    const transfer = await stripe.transfers.create({
      amount: Math.round(transferAmountCents),
      currency: 'usd',
      destination: vendor.stripe_account_id,
      description: `Payout for order ${order._id}`,
      metadata: {
        orderId: order._id.toString(),
        requestId: requestId || order.request.toString(),
        vendorId: vendor._id.toString(),
        subscriptionId: order.subscriptionId
      }
    });
    
    console.log('✅ Transfer successful:', transfer.id);

    await orderModel.findByIdAndUpdate(orderId, {
      $set: {
        transferStatus: 'completed',
        transferId: transfer.id,
        transferDate: new Date(),
        status: 'confirmed'
      }
    });
    
  
    if (requestId) {
      await requestModel.findByIdAndUpdate(requestId, {
        $set: {
          transferStatus: 'completed',
          transferId: transfer.id,
          status: 'confirmed'
        }
      });
    }
    
    return res.status(200).json({
      success: true,
      message: 'Payment successfully released to vendor',
      transferId: transfer.id,
      amount: transferAmountCents / 100,
      vendor: {
        id: vendor._id,
        name: vendor.name || vendor.username
      }
    });
    
  } catch(e) {
    console.log('Transfer error:', e.message);
    console.log('Full error:', e);
    
    return res.status(400).json({
      error: 'Failed to release payment to vendor: ' + e.message
    });
  }
};

module.exports.refundHeldPayment = async(req, res) => {
  const { orderId } = req.body;
  
  try {
    const stripe = require('stripe')(process.env.STRIPE_LIVE);
    
    let order = await orderModel.findById(orderId);
    
    if (!order) {
      return res.status(404).json({ error: 'Order not found' });
    }
    
   
    if (order.transferStatus === 'completed') {
      return res.status(400).json({ 
        error: 'Cannot refund - payment already released to vendor' 
      });
    }
    
   
    if (order.subscriptionId) {
      await stripe.subscriptions.cancel(order.subscriptionId);
    }
    
 
    const refund = await stripe.refunds.create({
      payment_intent: order.paymentIntentId,
      reason: 'requested_by_customer',
      metadata: {
        orderId: order._id.toString()
      }
    });
    
    console.log('✅ Refund successful:', refund.id);
    
   
    await orderModel.findByIdAndUpdate(orderId, {
      $set: {
        status: 'refunded',
        transferStatus: 'cancelled',
        refundId: refund.id,
        refundDate: new Date()
      }
    });
    
    return res.status(200).json({
      success: true,
      message: 'Payment refunded successfully',
      refundId: refund.id,
      amount: refund.amount / 100
    });
    
  } catch(e) {
    console.log('Refund error:', e.message);
    return res.status(400).json({
      error: 'Failed to refund payment: ' + e.message
    });
  }
};



module.exports.rejectDeliveryAndInstallation = async(req, res) => {
  const { orderId, reason } = req.body;
  const userId = req?.user?._id ? req.user._id : req.user.id;
  
  try {
    const stripe = require('stripe')(process.env.STRIPE_LIVE);
    
    
    const order = await orderModel.findById(orderId)
      .populate('user')
      .populate('vendor')
      .populate('listing')
      .populate('request');
    
    if (!order) {
      return res.status(404).json({ 
        success: false,
        error: 'Order not found' 
      });
    }
    
  
    if (order.user._id.toString() !== userId.toString()) {
      return res.status(403).json({ 
        success: false,
        error: 'Unauthorized: You do not own this order' 
      });
    }
    
   
    if (order.status !== 'processing' && order.status !== 'pending_confirmation') {
      return res.status(400).json({ 
        success: false,
        error: `Order cannot be rejected at this stage. Current status: ${order.status}`,
        currentStatus: order.status
      });
    }
   
    if (order.transferStatus === 'completed') {
      return res.status(400).json({ 
        success: false,
        error: 'Funds have already been transferred to vendor. Please contact support.',
        transferStatus: 'completed'
      });
    }
    
 
    if (order.rejectedAt) {
      return res.status(400).json({ 
        success: false,
        error: 'This order has already been rejected',
        rejectedAt: order.rejectedAt
      });
    }
    
    console.log('🚫 Processing delivery rejection:', {
      orderId: order._id,
      orderNumber: order.orderNumber,
      reason,
      subscriptionId: order.subscriptionId,
      paymentIntentId: order.paymentIntentId,
      totalAmount: order.totalAmount,
      user: order.user.name || order.user.username,
      vendor: order.vendor._id
    });
    
   
    if (order.subscriptionId) {
      try {
        const cancelledSubscription = await stripe.subscriptions.cancel(order.subscriptionId, {
          prorate: false,
          invoice_now: false
        });
        console.log('✅ Subscription cancelled:', {
          subscriptionId: order.subscriptionId,
          status: cancelledSubscription.status
        });
      } catch (subError) {
        console.log('⚠️ Subscription cancellation error:', subError.message);
       
        if (!subError.message.includes('No such subscription')) {
          
          console.error('Subscription cancel error details:', subError);
        }
      }
    }
    

    const monthlyRent = parseFloat(order.monthlyRent || 0);
    const deliveryFee = parseFloat(order.deliveryFee || 0);
    const serviceFee = parseFloat(order.serviceFee || 0);
    
 
    const creditAmount = monthlyRent + deliveryFee;
   
    const platformRetains = serviceFee;
    
    console.log('💰 Financial breakdown:', {
      totalPaid: order.totalAmount,
      creditToUser: creditAmount,
      platformKeeps: platformRetains,
      breakdown: {
        monthlyRent: monthlyRent,
        deliveryFee: deliveryFee,
        serviceFee: serviceFee
      }
    });
    
    
    const updatedUser = await userModel.findByIdAndUpdate(
      userId,
      {
        $inc: { credit: creditAmount }
      },
      { new: true }
    );
    
    if (!updatedUser) {
      throw new Error('Failed to update user credit balance');
    }
    
    console.log('✅ Credit added to user account:', {
      userId: userId,
      userName: updatedUser.name || updatedUser.username,
      creditAdded: creditAmount,
      previousBalance: (parseFloat(updatedUser.credit) - creditAmount).toFixed(2),
      newBalance: updatedUser.credit
    });
    
    
    try {
      const strike = await strikeModel.create({
        vendorId: order.vendor._id,
        orderId: order._id,
        disposition: `Delivery rejected by renter. Reason: ${reason}. Credit issued: $${creditAmount.toFixed(2)}`
      });
      
      console.log('⚠️ Vendor strike created:', {
        strikeId: strike._id,
        vendorId: order.vendor._id,
        orderId: order._id
      });
    } catch (strikeError) {
      console.error('Failed to create vendor strike:', strikeError.message);
     
    }
    
 
    const updatedOrder = await orderModel.findByIdAndUpdate(
      orderId,
      {
        $set: {
          status: 'cancelled',
          transferStatus: 'cancelled',
          rejectionReason: reason,
          rejectedAt: new Date(),
          rejectedBy: userId,
          refundStatus: 'credited',
          refundAmount: creditAmount,
          platformRetainedAmount: platformRetains,
          refundMethod: 'account_credit',
          cancelled_reason: `Delivery rejected by user: ${reason}`
        }
      },
      { new: true }
    );
    
    console.log('✅ Order updated:', {
      orderId: order._id,
      orderNumber: order.orderNumber,
      newStatus: updatedOrder.status,
      refundStatus: updatedOrder.refundStatus
    });
    
   
    if (order.request) {
      await requestModel.findByIdAndUpdate(
        order.request._id || order.request,
        {
          $set: {
            status: 'rejected',
            rejectionReason: reason,
            rejectedAt: new Date()
          }
        }
      );
      console.log('✅ Request updated to rejected status');
    }
    
   
    if (order.listing) {
      await listing.findByIdAndUpdate(
        order.listing._id,
        {
          $set: {
            status: 'active'
          }
        }
      );
      console.log('✅ Listing status updated to available:', order.listing.title);
    }
    
    
    console.log('📊 Transaction completed:', {
      action: 'rejection',
      orderId: order._id,
      orderNumber: order.orderNumber,
      user: updatedUser.name || updatedUser.username,
      vendor: order.vendor._id,
      creditAdded: creditAmount,
      platformRetained: platformRetains,
      strikeIssued: true,
      reason: reason,
      timestamp: new Date().toISOString()
    });
    

    
    return res.status(200).json({
      success: true,
      message: 'Delivery rejected successfully. Credit has been added to your account.',
      data: {
        orderId: order._id,
        orderNumber: order.orderNumber,
        orderStatus: 'cancelled',
        creditDetails: {
          creditAdded: creditAmount,
          previousBalance: (parseFloat(updatedUser.credit) - creditAmount).toFixed(2),
          newCreditBalance: parseFloat(updatedUser.credit).toFixed(2),
          platformRetained: platformRetains,
          reason: reason,
          note: 'Credit can be used for future rentals'
        },
        refundDetails: {
          method: 'account_credit',
          status: 'credited',
          processedAt: new Date().toISOString()
        },
        vendorPenalty: {
          strikeIssued: true,
          reason: 'Failed delivery'
        }
      }
    });
    
  } catch(e) {
    console.error('❌ Reject delivery error:', {
      error: e.message,
      stack: e.stack,
      orderId: req.body.orderId,
      userId: userId
    });
    
    return res.status(500).json({
      success: false,
      error: "An error occurred while rejecting the delivery",
      message: e.message,
      details: process.env.NODE_ENV === 'development' ? e.stack : undefined
    });
  }
};

module.exports.updateDeliveryAddress=async(req,res)=>{
  let {id}=req.params;
  let {deliveryAddress}=req.body;
  try{
await requestModel.findByIdAndUpdate(id,{
  $set:{
    deliveryAddress
  }
})
const updatedRequest = await requestModel.findById(id)
  .populate('vendor')
  .populate('listing')
  .populate('user');

  
  const vendorUpdateMailOptions = {
    from: 'orders@enrichifydata.com',
    to: updatedRequest.vendor.email,
    subject: '📍 Delivery Address Updated - Action Required',
    html: `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; background-color: #ffffff;">
        <!-- Header -->
        <div style="background-color: #0d6efd; padding: 30px; text-align: center;">
          <h1 style="color: #ffffff; margin: 0; font-size: 28px;">📍 Address Updated</h1>
          <p style="color: #e9ecef; margin-top: 10px; font-size: 16px;">Renter has updated their delivery address</p>
        </div>
        
        <!-- Time -->
        <div style="padding: 20px; background-color: #f8f9fa; border-bottom: 2px solid #e9ecef;">
          <p style="margin: 0; color: #7f8c8d; font-size: 14px;">Updated On</p>
          <h2 style="margin: 5px 0 0 0; color: #2c3e50; font-size: 20px;">${new Date().toLocaleString('en-US', { 
            dateStyle: 'full', 
            timeStyle: 'short' 
          })}</h2>
        </div>
  
        <!-- Main Content -->
        <div style="padding: 30px;">
          <h3 style="color: #2c3e50; margin-top: 0;">Hello ${updatedRequest.vendor.name || updatedRequest.vendor.businessName},</h3>
          <p style="color: #495057; font-size: 15px; line-height: 1.6;">
            The renter <strong>${updatedRequest.user.name}</strong> has updated their delivery address for the following rental request. Please review the new address details below.
          </p>
  
          <!-- Alert Notice -->
          <div style="margin: 25px 0; padding: 20px; background-color: #fff3cd; border-left: 4px solid #ffc107; border-radius: 4px;">
            <h4 style="margin: 0 0 10px 0; color: #856404; font-size: 16px;">⚠️ Action Required</h4>
            <p style="margin: 0; color: #856404; font-size: 14px; line-height: 1.6;">
              Please verify the new delivery address and confirm if you can service this location. If there are any issues, contact the renter as soon as possible.
            </p>
          </div>
  
          <!-- Request Information -->
          <div style="margin-bottom: 25px;">
            <h3 style="color: #2c3e50; border-bottom: 2px solid #0d6efd; padding-bottom: 10px;">
              📋 Request Information
            </h3>
            
            <table style="width: 100%; border-collapse: collapse; margin-top: 20px;">
              <tr>
                <td style="padding: 12px; background-color: #f8f9fa; width: 35%; font-weight: 600; color: #2c3e50;">Request ID</td>
                <td style="padding: 12px; border: 1px solid #dee2e6; color: #495057; font-family: monospace;">#${updatedRequest._id}</td>
              </tr>
              <tr>
                <td style="padding: 12px; background-color: #f8f9fa; font-weight: 600; color: #2c3e50;">Listing ID</td>
                <td style="padding: 12px; border: 1px solid #dee2e6; color: #495057; font-family: monospace;">#${updatedRequest.listing._id}</td>
              </tr>
              <tr>
                <td style="padding: 12px; background-color: #f8f9fa; font-weight: 600; color: #2c3e50;">Status</td>
                <td style="padding: 12px; border: 1px solid #dee2e6;">
                  <span style="background-color: ${updatedRequest.status === 'approved' ? '#28a745' : updatedRequest.status === 'rejected' ? '#dc3545' : '#ffc107'}; color: ${updatedRequest.status === 'pending' ? '#000' : '#fff'}; padding: 4px 12px; border-radius: 12px; font-size: 12px; font-weight: 600; text-transform: uppercase;">
                    ${updatedRequest.status}
                  </span>
                </td>
              </tr>
            </table>
          </div>
  
          <!-- Product Details -->
          <div style="margin-bottom: 25px;">
            <h3 style="color: #2c3e50; border-bottom: 2px solid #0d6efd; padding-bottom: 10px;">
              📦 Product Details
            </h3>
            
            ${updatedRequest.listing.images && updatedRequest.listing.images.length > 0 ? `
            <div style="text-align: center; margin: 20px 0;">
              <img src="${updatedRequest.listing.images.find(img => img.isPrimary)?.url || updatedRequest.listing.images[0].url}" 
                   alt="${updatedRequest.listing.title}" 
                   style="max-width: 100%; height: auto; border-radius: 8px; border: 1px solid #dee2e6;" />
            </div>
            ` : ''}
            
            <table style="width: 100%; border-collapse: collapse; margin-top: 20px;">
              <tr>
                <td style="padding: 12px; background-color: #f8f9fa; width: 35%; font-weight: 600; color: #2c3e50;">Product</td>
                <td style="padding: 12px; border: 1px solid #dee2e6; color: #495057;">${updatedRequest.listing.title}</td>
              </tr>
              <tr>
                <td style="padding: 12px; background-color: #f8f9fa; font-weight: 600; color: #2c3e50;">Brand</td>
                <td style="padding: 12px; border: 1px solid #dee2e6; color: #495057;">${updatedRequest.listing.brand}</td>
              </tr>
              <tr>
                <td style="padding: 12px; background-color: #f8f9fa; font-weight: 600; color: #2c3e50;">Category</td>
                <td style="padding: 12px; border: 1px solid #dee2e6; color: #495057; text-transform: capitalize;">${updatedRequest.listing.category}</td>
              </tr>
              <tr>
                <td style="padding: 12px; background-color: #f8f9fa; font-weight: 600; color: #2c3e50;">Condition</td>
                <td style="padding: 12px; border: 1px solid #dee2e6; color: #495057;">${updatedRequest.listing.condition}</td>
              </tr>
              <tr>
                <td style="padding: 12px; background-color: #f8f9fa; font-weight: 600; color: #2c3e50;">Monthly Rent</td>
                <td style="padding: 12px; border: 1px solid #dee2e6; color: #0d6efd; font-weight: 700; font-size: 18px;">$${updatedRequest.listing.pricing.rentPrice}/mo</td>
              </tr>
              ${updatedRequest.deliveryType ? `
              <tr>
                <td style="padding: 12px; background-color: #f8f9fa; font-weight: 600; color: #2c3e50;">Delivery Type</td>
                <td style="padding: 12px; border: 1px solid #dee2e6; color: #495057; text-transform: capitalize;">${updatedRequest.deliveryType}</td>
              </tr>
              ` : ''}
              ${updatedRequest.installationType ? `
              <tr>
                <td style="padding: 12px; background-color: #f8f9fa; font-weight: 600; color: #2c3e50;">Installation</td>
                <td style="padding: 12px; border: 1px solid #dee2e6; color: #495057; text-transform: capitalize;">${updatedRequest.installationType}</td>
              </tr>
              ` : ''}
              ${updatedRequest.listing.deliveryPrice ? `
              <tr>
                <td style="padding: 12px; background-color: #f8f9fa; font-weight: 600; color: #2c3e50;">Delivery Fee</td>
                <td style="padding: 12px; border: 1px solid #dee2e6; color: #495057;">$${updatedRequest.listing.deliveryPrice}</td>
              </tr>
              ` : ''}
              ${updatedRequest.listing.installationPrice ? `
              <tr>
                <td style="padding: 12px; background-color: #f8f9fa; font-weight: 600; color: #2c3e50;">Installation Fee</td>
                <td style="padding: 12px; border: 1px solid #dee2e6; color: #495057;">$${updatedRequest.listing.installationPrice}</td>
              </tr>
              ` : ''}
            </table>
          </div>
  
          <!-- New Delivery Address -->
          <div style="margin-bottom: 25px;">
            <h3 style="color: #2c3e50; border-bottom: 2px solid #28a745; padding-bottom: 10px;">
              📍 New Delivery Address
            </h3>
            
            <div style="margin-top: 20px; padding: 20px; background-color: #d4edda; border: 2px solid #28a745; border-radius: 8px;">
              <div style="color: #155724; font-size: 16px; line-height: 1.8;">
                <p style="margin: 0 0 8px 0; font-weight: 600; font-size: 18px;">📮 Updated Address:</p>
                <p style="margin: 0 0 5px 0;"><strong>Street:</strong> ${deliveryAddress.street}</p>
                <p style="margin: 0 0 5px 0;"><strong>City:</strong> ${deliveryAddress.city}</p>
                <p style="margin: 0 0 5px 0;"><strong>State:</strong> ${deliveryAddress.state}</p>
                <p style="margin: 0 0 5px 0;"><strong>Zip Code:</strong> ${deliveryAddress.zipCode}</p>
                <p style="margin: 0;"><strong>Country:</strong> ${deliveryAddress.country}</p>
              </div>
            </div>
          </div>
  
          <!-- Customer Information -->
          <div style="margin-bottom: 25px;">
            <h3 style="color: #2c3e50; border-bottom: 2px solid #0d6efd; padding-bottom: 10px;">
              👤 Customer Information
            </h3>
            
            <table style="width: 100%; border-collapse: collapse; margin-top: 20px;">
              <tr>
                <td style="padding: 12px; background-color: #f8f9fa; width: 35%; font-weight: 600; color: #2c3e50;">Name</td>
                <td style="padding: 12px; border: 1px solid #dee2e6; color: #495057;">${updatedRequest.user.name}</td>
              </tr>
              <tr>
                <td style="padding: 12px; background-color: #f8f9fa; font-weight: 600; color: #2c3e50;">Email</td>
                <td style="padding: 12px; border: 1px solid #dee2e6; color: #495057;">${updatedRequest.user.email}</td>
              </tr>
              ${updatedRequest.user.mobile ? `
              <tr>
                <td style="padding: 12px; background-color: #f8f9fa; font-weight: 600; color: #2c3e50;">Mobile</td>
                <td style="padding: 12px; border: 1px solid #dee2e6; color: #495057;">${updatedRequest.user.mobile}</td>
              </tr>
              ` : ''}
            </table>
          </div>
  
          <!-- Next Steps -->
          <div style="margin-bottom: 25px; padding: 20px; background-color: #e7f3ff; border-left: 4px solid #0d6efd; border-radius: 4px;">
            <h4 style="margin: 0 0 10px 0; color: #0d6efd; font-size: 16px;">📋 Next Steps</h4>
            <ol style="margin: 10px 0; padding-left: 20px; color: #495057; font-size: 14px; line-height: 1.8;">
              <li><strong>Verify the new address</strong> is within your delivery service area</li>
              <li><strong>Check for any additional delivery fees</strong> based on the new location</li>
              <li><strong>Contact the renter</strong> if you have any questions or concerns</li>
              <li><strong>Proceed with delivery coordination</strong> once address is confirmed</li>
            </ol>
          </div>
  
          <!-- Call to Action Button -->
          <div style="text-align: center; margin-top: 30px;">
            <a href="${process.env.FRONTEND_URL || 'https://rentsimpledeals.com'}/vendordashboard" 
               style="display: inline-block; background-color: #0d6efd; color: #ffffff; padding: 15px 40px; text-decoration: none; border-radius: 8px; font-weight: 600; font-size: 16px;">
              View Request Details
            </a>
          </div>
  
          <!-- Support -->
          <div style="margin-top: 30px; padding: 20px; background-color: #f8f9fa; border-radius: 8px;">
            <h4 style="margin: 0 0 10px 0; color: #2c3e50; font-size: 16px;">Need Help?</h4>
            <p style="margin: 0; color: #495057; font-size: 14px; line-height: 1.6;">
              If you cannot service this delivery address or need to discuss alternative arrangements, please contact the renter directly or reach out to our support team.
            </p>
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
  const transporter = nodemailer.createTransport({
    service: 'gmail',
    auth: {
        user: 'rentsimple159@gmail.com', 
        pass: 'mlgioecamzoitfdt' 
    }
    });
  
  // await transporter.sendMail(vendorUpdateMailOptions);
return res.status(200).json({
  message:"Delivery address updated successfully"
})
  }catch(e){
    console.log(e.message)
    return res.status(400).json({
      error:"Error occured while trying to update delivery address"
    })
  }
}