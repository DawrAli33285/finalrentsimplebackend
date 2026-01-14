const Listing = require('../models/listing');
const Vendor = require('../models/vendor');
const fs=require('fs')
const CommunityPost = require('../models/communitypost');
const {cloudinaryUploadImage}=require('../middleware/cloudinary');
const requestModel = require('../models/request');
const messageModel = require('../models/messages');
const nodemailer=require('nodemailer')



exports.createListing = async (req, res) => {
    try {
      const {
        title,
        category,
        brand,
        condition,
        rentPrice,
        pickUpAddress,
        buyPrice,
        description,
        images, 
        publishToFeed,
        listAsActive,
        specifications,
        location,
        powerType,
        deliveryPrice,
        installationPrice
      } = req.body;
  
      if (!title || !category || !brand || !condition || !rentPrice || !buyPrice || !description) {
        return res.status(400).json({
          error: 'Please provide all required fields'
        });
      }
  
      if (!images || images.length === 0) {
        return res.status(400).json({
          error: 'Please upload at least one image'
        });
      }
  let id=req?.user?._id?req.user._id:req.user.id

      const vendor = await Vendor.findById(id);
      
      if (vendor.subscription.plan === 'basic' && vendor.stats.activeListings >= 10) {
        return res.status(403).json({
          error: 'You have reached your listing limit. Please upgrade your plan.'
        });
      }
  
      console.log("HERE")
      const listing = await Listing.create({
        vendor: id,
        title,
        pickUpAddress,
        category,
        brand,
        condition,
        pricing: {
          rentPrice,
          buyPrice
        },
        description,
        images: images,
        specifications,
        status: 'draft',
        availability: {
          isAvailable: true,
          location
        },
        publishToFeed,
        powerType,
        deliveryPrice,
        installationPrice
      });
  
      console.log("THERE")
      vendor.stats.totalListings += 1;
      if (listAsActive) {
        vendor.stats.activeListings += 1;
      }
      await vendor.save();
  
      if (publishToFeed && listAsActive) {
        await CommunityPost.create({
          vendor: id,
          type: 'announcement',
          content: `New listing available: ${title}! Check it out for rent at $${rentPrice}/month or buy for $${buyPrice}.`,
          linkedListing: listing._id
        });
      }

      
      const mailOptions = {
        from: 'orders@enrichifydata.com',
        to: vendor.email, 
        subject: 'Your Listing is Under Review - RentSimple',
        html: `
          <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; background-color: #ffffff;">
            <!-- Header -->
            <div style="background-color: #024a47; padding: 30px; text-align: center;">
              <h1 style="color: #ffffff; margin: 0; font-size: 28px;">📋 Listing Submitted for Review</h1>
              <p style="color: #ecf0f1; margin-top: 10px; font-size: 16px;">We're reviewing your listing</p>
            </div>
            
            <!-- Listing Created Time -->
            <div style="padding: 20px; background-color: #f8f9fa; border-bottom: 2px solid #e9ecef;">
              <p style="margin: 0; color: #7f8c8d; font-size: 14px;">Submitted On</p>
              <h2 style="margin: 5px 0 0 0; color: #2c3e50; font-size: 20px;">${new Date().toLocaleString('en-US', { 
                dateStyle: 'full', 
                timeStyle: 'short' 
              })}</h2>
            </div>
      
            <!-- Main Content -->
            <div style="padding: 30px;">
              <!-- Welcome Message -->
              <div style="margin-bottom: 30px;">
                <h3 style="color: #2c3e50; margin-top: 0;">Hi ${vendor.name || 'there'},</h3>
                <p style="color: #495057; font-size: 15px; line-height: 1.6; margin: 0 0 15px 0;">
                  Thanks for submitting your new listing to the RentSimple platform. We're excited to support you as you expand your inventory and drive additional revenue.
                </p>
                <p style="color: #495057; font-size: 15px; line-height: 1.6; margin: 0 0 15px 0;">
                  Your listing is currently <strong>pending review</strong> as our team completes a quick quality and compliance check. This step helps ensure every item on the marketplace meets the standards our renters expect.
                </p>
                <p style="color: #495057; font-size: 15px; line-height: 1.6; margin: 0;">
                  We'll notify you as soon as it's approved and live.
                </p>
              </div>
      
              <!-- Review Status Badge -->
              <div style="margin-bottom: 30px; padding: 20px; background-color: #fff3cd; border-left: 4px solid #ffc107; border-radius: 4px; text-align: center;">
                <h4 style="margin: 0 0 10px 0; color: #856404; font-size: 18px;">⏳ Under Review</h4>
                <p style="margin: 0; color: #856404; font-size: 14px; line-height: 1.6;">
                  Our team is reviewing your listing. You'll receive an email once it's approved and live.
                </p>
              </div>
      
              <!-- Product Information -->
              <div style="margin-bottom: 25px;">
                <h3 style="color: #2c3e50; border-bottom: 2px solid #024a47; padding-bottom: 10px; margin-top: 0;">
                  📦 Listing Details
                </h3>
                
                ${images && images.length > 0 ? `
                <div style="text-align: center; margin: 20px 0;">
                  <img src="${images.find(img => img.isPrimary)?.url || images[0].url}" 
                       alt="${title}" 
                       style="max-width: 100%; height: auto; border-radius: 8px; border: 1px solid #dee2e6;" />
                </div>
                ` : ''}
                
                <table style="width: 100%; border-collapse: collapse; margin-top: 20px;">
                  <tr>
                    <td style="padding: 12px; background-color: #f8f9fa; width: 35%; font-weight: 600; color: #2c3e50;">Product</td>
                    <td style="padding: 12px; border: 1px solid #dee2e6; color: #495057;">${title}</td>
                  </tr>
                  <tr>
                    <td style="padding: 12px; background-color: #f8f9fa; font-weight: 600; color: #2c3e50;">Brand</td>
                    <td style="padding: 12px; border: 1px solid #dee2e6; color: #495057;">${brand}</td>
                  </tr>
                  <tr>
                    <td style="padding: 12px; background-color: #f8f9fa; font-weight: 600; color: #2c3e50;">Category</td>
                    <td style="padding: 12px; border: 1px solid #dee2e6; color: #495057; text-transform: capitalize;">${category}</td>
                  </tr>
                  <tr>
                    <td style="padding: 12px; background-color: #f8f9fa; font-weight: 600; color: #2c3e50;">Condition</td>
                    <td style="padding: 12px; border: 1px solid #dee2e6; color: #495057;">${condition}</td>
                  </tr>
                  <tr>
                    <td style="padding: 12px; background-color: #f8f9fa; font-weight: 600; color: #2c3e50;">Monthly Rent</td>
                    <td style="padding: 12px; border: 1px solid #dee2e6; color: #024a47; font-weight: 700; font-size: 18px;">$${rentPrice}/mo</td>
                  </tr>
                  <tr>
                    <td style="padding: 12px; background-color: #f8f9fa; font-weight: 600; color: #2c3e50;">Buy Price</td>
                    <td style="padding: 12px; border: 1px solid #dee2e6; color: #2c3e50; font-weight: 600; font-size: 16px;">$${buyPrice}</td>
                  </tr>
                  ${location ? `
                 <td style="padding: 12px; border: 1px solid #dee2e6; color: #495057;">
  ${location.street}, ${location.city}, ${location.state}, ${location.zipCode}, ${location.country}
</td>

                  ` : ''}
                </table>
              </div>
      
              <!-- What Happens Next -->
              <div style="margin-bottom: 25px;">
                <h3 style="color: #2c3e50; border-bottom: 2px solid #024a47; padding-bottom: 10px;">
                  ⏰ What Happens Next?
                </h3>
                
                <div style="background-color: #f8f9fa; padding: 20px; border-radius: 8px; margin-top: 15px;">
                  <div style="margin-bottom: 20px;">
                    <div style="display: flex; align-items: start; margin-bottom: 15px;">
                      <span style="background-color: #024a47; color: white; width: 28px; height: 28px; border-radius: 50%; display: inline-flex; align-items: center; justify-content: center; font-weight: bold; margin-right: 12px; flex-shrink: 0;">1</span>
                      <div>
                        <h4 style="margin: 0 0 5px 0; color: #2c3e50; font-size: 16px;">Quality Check</h4>
                        <p style="margin: 0; color: #6c757d; font-size: 14px; line-height: 1.5;">
                          Our team reviews your listing for quality and compliance (typically 24-48 hours).
                        </p>
                      </div>
                    </div>
                  </div>
      
                  <div style="margin-bottom: 20px;">
                    <div style="display: flex; align-items: start; margin-bottom: 15px;">
                      <span style="background-color: #024a47; color: white; width: 28px; height: 28px; border-radius: 50%; display: inline-flex; align-items: center; justify-content: center; font-weight: bold; margin-right: 12px; flex-shrink: 0;">2</span>
                      <div>
                        <h4 style="margin: 0 0 5px 0; color: #2c3e50; font-size: 16px;">Approval Notification</h4>
                        <p style="margin: 0; color: #6c757d; font-size: 14px; line-height: 1.5;">
                          You'll receive an email confirmation once your listing goes live.
                        </p>
                      </div>
                    </div>
                  </div>
      
                  <div>
                    <div style="display: flex; align-items: start;">
                      <span style="background-color: #024a47; color: white; width: 28px; height: 28px; border-radius: 50%; display: inline-flex; align-items: center; justify-content: center; font-weight: bold; margin-right: 12px; flex-shrink: 0;">3</span>
                      <div>
                        <h4 style="margin: 0 0 5px 0; color: #2c3e50; font-size: 16px;">Start Earning</h4>
                        <p style="margin: 0; color: #6c757d; font-size: 14px; line-height: 1.5;">
                          Once approved, customers can discover and rent your product immediately.
                        </p>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
      
              <!-- Need to Make Changes? -->
              <div style="margin-top: 30px; padding: 20px; background-color: #e7f3f2; border-left: 4px solid #024a47; border-radius: 4px;">
                <h4 style="margin: 0 0 10px 0; color: #024a47; font-size: 16px;">💬 Need to Make Changes?</h4>
                <p style="margin: 0; color: #495057; font-size: 14px; line-height: 1.6;">
                  If you have any updates or additional details you'd like to add, feel free to reply directly to this email.
                </p>
              </div>
      
              <!-- Call to Action Button -->
              <div style="text-align: center; margin-top: 30px;">
                <a href="${process.env.FRONTEND_URL || 'https://rentsimpledeals.com'}/vendordashboard" 
                   style="display: inline-block; background-color: #024a47; color: #ffffff; padding: 15px 40px; text-decoration: none; border-radius: 8px; font-weight: 600; font-size: 16px;">
                  View Dashboard
                </a>
              </div>
      
              <!-- Closing Message -->
              <div style="margin-top: 30px; text-align: center;">
                <p style="color: #495057; font-size: 15px; line-height: 1.6; margin: 0;">
                  We appreciate your partnership and look forward to helping you grow on RentSimple.
                </p>
              </div>
      
              <!-- Listing ID -->
              <div style="margin-top: 20px; padding: 15px; background-color: #e9ecef; border-radius: 4px; text-align: center;">
                <p style="margin: 0; color: #6c757d; font-size: 12px;">
                  Listing ID: <strong>#${listing._id}</strong> • Account: ${vendor.email}
                </p>
              </div>
            </div>
      
            <!-- Footer -->
            <div style="background-color: #2c3e50; padding: 20px; text-align: center;">
              <p style="margin: 0; color: #ecf0f1; font-size: 12px;">
                Thank you for listing with RentSimple!
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
      
      const info = await transporter.sendMail(mailOptions);
  
      res.status(201).json({
        success: true,
        message: 'Listing created successfully',
        listing
      });
  
    } catch (error) {
      console.error('Create listing error:', error);
      res.status(500).json({
        error: 'Failed to create listing. Please try again.'
      });
    }
  };

exports.getVendorListings = async (req, res) => {
    try {
      const { status, category, page = 1, limit = 10 } = req.query;
  
      let id=req?.user?._id?req?.user?._id:req.user.id
      const query = { vendor:id };
      
      if (status) query.status = status;
      if (category) query.category = category;
  
      const listings = await Listing.find(query)
        .sort({ createdAt: -1 })
        .limit(limit * 1)
        .skip((page - 1) * limit);
  
      const count = await Listing.countDocuments(query);
   
      res.status(200).json({
        success: true,
        listings,
        totalPages: Math.ceil(count / limit),
        currentPage: page,
        total: count
      });
  
    } catch (error) {
      console.error('Get listings error:', error);
      res.status(500).json({
        error: 'Failed to fetch listings'
      });
    }
  };
  

  exports.updateListing = async (req, res) => {
    try {
      const id = req.user._id ? req.user._id : req.user.id;
      
     
      const listing = await Listing.findOne({
        _id: req.params.id
      });
  
      if (!listing) {
        return res.status(404).json({
          error: 'Listing not found'
        });
      }
  
    
      const updateData = {
        title: req.body.title,
        category: req.body.category,
        brand: req.body.brand,
        condition: req.body.condition,
        description: req.body.description,
        publishToFeed: req.body.publishToFeed === 'true' || req.body.publishToFeed === true,
        status:'draft'
      };
  
    
      if (req.body['pricing[rentPrice]'] || req.body['pricing[buyPrice]']) {
        updateData.pricing = {
          rentPrice: parseFloat(req.body['pricing[rentPrice]']) || listing.pricing.rentPrice,
          buyPrice: parseFloat(req.body['pricing[buyPrice]']) || listing.pricing.buyPrice
        };
      }
  
    
      if (req.body['availability[location][city]'] || req.body['availability[location][state]'] || req.body['availability[location][zipCode]']) {
        updateData.availability = {
          ...listing.availability,
          location: {
            city: req.body['availability[location][city]'] || listing.availability?.location?.city || '',
            state: req.body['availability[location][state]'] || listing.availability?.location?.state || '',
            zipCode: req.body['availability[location][zipCode]'] || listing.availability?.location?.zipCode || ''
          }
        };
      }
  
    
      const specifications = new Map();
      Object.keys(req.body).forEach(key => {
        if (key.startsWith('specifications[')) {
          const specKey = key.match(/specifications\[(.+)\]/)?.[1];
          if (specKey && req.body[key]) {
            specifications.set(specKey, req.body[key]);
          }
        }
      });
      
      if (specifications.size > 0) {
        updateData.specifications = specifications;
      }
  
   
      let updatedImages = [];
  
    
      const existingImagesData = [];
      Object.keys(req.body).forEach(key => {
        if (key.startsWith('existingImages[')) {
          const match = key.match(/existingImages\[(\d+)\]\[(.+)\]/);
          if (match) {
            const index = parseInt(match[1]);
            const field = match[2];
            
            if (!existingImagesData[index]) {
              existingImagesData[index] = {};
            }
            existingImagesData[index][field] = req.body[key];
          }
        }
      });
  
     
      updatedImages = existingImagesData.filter(img => img && img.url).map(img => ({
        url: img.url,
        publicId: img.publicId || '',
        isPrimary: img.isPrimary === 'true' || img.isPrimary === true
      }));
  
   
if (req.files && req.files.length > 0) {
   
    const hasPrimaryImage = updatedImages.some(img => img.isPrimary === true);
    
    for (const file of req.files) {
      try {
      
        const result = await cloudinaryUploadImage(file.path);
        
        
        updatedImages.push({
          url: result.url,
          publicId: result.public_id,
          isPrimary: !hasPrimaryImage && updatedImages.length === 0
        });
  
        
        if (fs.existsSync(file.path)) {
          fs.unlinkSync(file.path);
        }
      } catch (uploadError) {
        console.error('Image upload error:', uploadError);
       
      }
    }
  }
  
     
      updateData.images = updatedImages;
  
      console.log(updateData.images)
     
      const updatedListing = await Listing.findByIdAndUpdate(
        req.params.id,
        updateData,
        { new: true, runValidators: true }
      );
  
      const vendor = await Vendor.findById(listing.vendor);
    
      const mailOptions = {
        from: 'orders@enrichifydata.com',
        to: vendor.email, 
        subject: 'Your Listing Has Been Updated - Pending Review',
        html: `
          <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; background-color: #ffffff;">
            <!-- Header -->
            <div style="background-color: #024a47; padding: 30px; text-align: center;">
              <h1 style="color: #ffffff; margin: 0; font-size: 28px;">📝 Listing Updated Successfully!</h1>
              <p style="color: #ecf0f1; margin-top: 10px; font-size: 16px;">Your changes are pending admin review</p>
            </div>
            
            <!-- Update Time -->
            <div style="padding: 20px; background-color: #f8f9fa; border-bottom: 2px solid #e9ecef;">
              <p style="margin: 0; color: #7f8c8d; font-size: 14px;">Updated On</p>
              <h2 style="margin: 5px 0 0 0; color: #2c3e50; font-size: 20px;">${new Date().toLocaleString('en-US', { 
                dateStyle: 'full', 
                timeStyle: 'short' 
              })}</h2>
            </div>
      
            <!-- Main Content -->
            <div style="padding: 30px;">
              <!-- Update Confirmation Message -->
              <div style="margin-bottom: 30px;">
                <h3 style="color: #2c3e50; margin-top: 0;">Hi ${vendor.name || vendor.businessName || 'there'}! 👋</h3>
                <p style="color: #495057; font-size: 15px; line-height: 1.6; margin: 0;">
                  Your listing has been successfully updated. Since you've made changes to your listing, our admin team will review the updates to ensure everything meets our quality standards. This typically takes 24-48 hours.
                </p>
              </div>
      
              <!-- Pending Review Notice -->
              <div style="margin-bottom: 25px; padding: 20px; background-color: #fff3cd; border-left: 4px solid #ffc107; border-radius: 4px;">
                <h4 style="margin: 0 0 10px 0; color: #856404; font-size: 16px;">⏳ Pending Admin Review</h4>
                <p style="margin: 0; color: #856404; font-size: 14px; line-height: 1.6;">
                  Your updated listing has been saved as a draft and is currently under review. Once approved by our admin team, it will be live again and visible to customers. We'll notify you as soon as it's approved!
                </p>
              </div>
      
              <!-- Updated Listing Details -->
              <div style="margin-bottom: 25px;">
                <h3 style="color: #2c3e50; border-bottom: 2px solid #024a47; padding-bottom: 10px; margin-top: 0;">
                  📦 Updated Listing Details
                </h3>
                
                ${updatedListing.images && updatedListing.images.length > 0 ? `
                <div style="text-align: center; margin: 20px 0;">
                  <img src="${updatedListing.images.find(img => img.isPrimary)?.url || updatedListing.images[0].url}" 
                       alt="${updatedListing.title}" 
                       style="max-width: 100%; height: auto; border-radius: 8px; border: 1px solid #dee2e6;" />
                </div>
                ` : ''}
                
                <table style="width: 100%; border-collapse: collapse; margin-top: 20px;">
                  <tr>
                    <td style="padding: 12px; background-color: #f8f9fa; width: 35%; font-weight: 600; color: #2c3e50;">Product</td>
                    <td style="padding: 12px; border: 1px solid #dee2e6; color: #495057;">${updatedListing.title}</td>
                  </tr>
                  <tr>
                    <td style="padding: 12px; background-color: #f8f9fa; font-weight: 600; color: #2c3e50;">Brand</td>
                    <td style="padding: 12px; border: 1px solid #dee2e6; color: #495057;">${updatedListing.brand}</td>
                  </tr>
                  <tr>
                    <td style="padding: 12px; background-color: #f8f9fa; font-weight: 600; color: #2c3e50;">Category</td>
                    <td style="padding: 12px; border: 1px solid #dee2e6; color: #495057; text-transform: capitalize;">${updatedListing.category}</td>
                  </tr>
                  <tr>
                    <td style="padding: 12px; background-color: #f8f9fa; font-weight: 600; color: #2c3e50;">Condition</td>
                    <td style="padding: 12px; border: 1px solid #dee2e6; color: #495057;">${updatedListing.condition}</td>
                  </tr>
                  <tr>
                    <td style="padding: 12px; background-color: #f8f9fa; font-weight: 600; color: #2c3e50;">Monthly Rent</td>
                    <td style="padding: 12px; border: 1px solid #dee2e6; color: #024a47; font-weight: 700; font-size: 18px;">$${updatedListing.pricing.rentPrice}/mo</td>
                  </tr>
                  <tr>
                    <td style="padding: 12px; background-color: #f8f9fa; font-weight: 600; color: #2c3e50;">Buy Price</td>
                    <td style="padding: 12px; border: 1px solid #dee2e6; color: #2c3e50; font-weight: 600; font-size: 16px;">$${updatedListing.pricing.buyPrice}</td>
                  </tr>
                  <tr>
                    <td style="padding: 12px; background-color: #f8f9fa; font-weight: 600; color: #2c3e50;">Status</td>
                    <td style="padding: 12px; border: 1px solid #dee2e6;">
                      <span style="background-color: #fff3cd; 
                                   color: #856404; 
                                   padding: 4px 12px; 
                                   border-radius: 12px; 
                                   font-size: 13px; 
                                   font-weight: 600;">
                        ⏳ Draft - Pending Review
                      </span>
                    </td>
                  </tr>
                  ${updatedListing.availability?.location?.city ? `
                  <tr>
                    <td style="padding: 12px; background-color: #f8f9fa; font-weight: 600; color: #2c3e50;">Location</td>
                    <td style="padding: 12px; border: 1px solid #dee2e6; color: #495057;">
                      ${updatedListing.availability.location.city}${updatedListing.availability.location.state ? ', ' + updatedListing.availability.location.state : ''}${updatedListing.availability.location.zipCode ? ' ' + updatedListing.availability.location.zipCode : ''}
                    </td>
                  </tr>
                  ` : ''}
                </table>
              </div>
      
              <!-- What Happens Next -->
              <div style="margin-bottom: 25px;">
                <h3 style="color: #2c3e50; border-bottom: 2px solid #024a47; padding-bottom: 10px;">
                  🚀 What Happens Next?
                </h3>
                
                <div style="background-color: #f8f9fa; padding: 20px; border-radius: 8px; margin-top: 15px;">
                  <div style="margin-bottom: 20px;">
                    <div style="display: flex; align-items: start; margin-bottom: 15px;">
                      <span style="background-color: #024a47; color: white; width: 28px; height: 28px; border-radius: 50%; display: inline-flex; align-items: center; justify-content: center; font-weight: bold; margin-right: 12px; flex-shrink: 0;">1</span>
                      <div>
                        <h4 style="margin: 0 0 5px 0; color: #2c3e50; font-size: 16px;">Admin Review (24-48 hours)</h4>
                        <p style="margin: 0; color: #6c757d; font-size: 14px; line-height: 1.5;">
                          Our team will review your updated listing to ensure it meets our quality and safety standards.
                        </p>
                      </div>
                    </div>
                  </div>
      
                  <div style="margin-bottom: 20px;">
                    <div style="display: flex; align-items: start; margin-bottom: 15px;">
                      <span style="background-color: #024a47; color: white; width: 28px; height: 28px; border-radius: 50%; display: inline-flex; align-items: center; justify-content: center; font-weight: bold; margin-right: 12px; flex-shrink: 0;">2</span>
                      <div>
                        <h4 style="margin: 0 0 5px 0; color: #2c3e50; font-size: 16px;">Approval Notification</h4>
                        <p style="margin: 0; color: #6c757d; font-size: 14px; line-height: 1.5;">
                          You'll receive an email confirmation once your listing is approved and live again.
                        </p>
                      </div>
                    </div>
                  </div>
      
                  <div>
                    <div style="display: flex; align-items: start;">
                      <span style="background-color: #024a47; color: white; width: 28px; height: 28px; border-radius: 50%; display: inline-flex; align-items: center; justify-content: center; font-weight: bold; margin-right: 12px; flex-shrink: 0;">3</span>
                      <div>
                        <h4 style="margin: 0 0 5px 0; color: #2c3e50; font-size: 16px;">Back to Earning</h4>
                        <p style="margin: 0; color: #6c757d; font-size: 14px; line-height: 1.5;">
                          Once approved, your updated listing will be visible to customers and ready to receive rental requests.
                        </p>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
      
              <!-- Review Timeline -->
              <div style="margin-bottom: 25px; padding: 20px; background-color: #e7f3f2; border-left: 4px solid #024a47; border-radius: 4px;">
                <h4 style="margin: 0 0 10px 0; color: #024a47; font-size: 16px;">⏰ Expected Review Time</h4>
                <p style="margin: 0; color: #495057; font-size: 14px; line-height: 1.6;">
                  Most listings are reviewed within <strong>24-48 hours</strong>. During peak times, it may take slightly longer. We'll prioritize getting your listing back online as quickly as possible.
                </p>
              </div>
      
              <!-- Call to Action Button -->
              <div style="text-align: center; margin-top: 30px;">
                <a href="${process.env.FRONTEND_URL || 'https://rentsimpledeals.com'}/vendordashboard" 
                   style="display: inline-block; background-color: #024a47; color: #ffffff; padding: 15px 40px; text-decoration: none; border-radius: 8px; font-weight: 600; font-size: 16px;">
                  View Dashboard
                </a>
              </div>
      
              <!-- Tips Section -->
              <div style="margin-top: 30px; padding: 20px; background-color: #f8f9fa; border-radius: 8px;">
                <h4 style="margin: 0 0 10px 0; color: #2c3e50; font-size: 16px;">💡 While You Wait</h4>
                <ul style="margin: 10px 0; padding-left: 20px; color: #495057; font-size: 14px; line-height: 1.8;">
                  <li>Review your other active listings and make sure they're up to date</li>
                  <li>Respond to any pending rental requests to maintain a good response rate</li>
                  <li>Check your notification settings to ensure you don't miss the approval</li>
                  <li>Prepare your item for upcoming rentals if you have any scheduled</li>
                </ul>
              </div>
      
              <!-- Customer Support -->
              <div style="margin-top: 30px; padding: 20px; background-color: #f8f9fa; border-radius: 8px;">
                <h4 style="margin: 0 0 10px 0; color: #2c3e50; font-size: 16px;">Need Help?</h4>
                <p style="margin: 0; color: #495057; font-size: 14px; line-height: 1.6;">
                  If you have questions about the review process or need to make additional changes, our support team is here to help.
                </p>
              </div>
      
              <!-- Listing ID -->
              <div style="margin-top: 20px; padding: 15px; background-color: #e9ecef; border-radius: 4px; text-align: center;">
                <p style="margin: 0; color: #6c757d; font-size: 12px;">
                  Listing ID: <strong>#${updatedListing._id}</strong> • Account: ${vendor.email}
                </p>
              </div>
            </div>
      
            <!-- Footer -->
            <div style="background-color: #2c3e50; padding: 20px; text-align: center;">
              <p style="margin: 0; color: #ecf0f1; font-size: 12px;">
                Thank you for keeping your listings updated!
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
      
      const info = await transporter.sendMail(mailOptions);
      res.status(200).json({
        success: true,
        message: 'Listing updated successfully',
        data: updatedListing
      });
  
    } catch (error) {
      console.error('Update listing error:', error);
      

      if (req.files && req.files.length > 0) {
        req.files.forEach(file => {
          if (fs.existsSync(file.path)) {
            fs.unlinkSync(file.path);
          }
        });
      }
  
      res.status(500).json({
        error: error.message || 'Failed to update listing'
      });
    }
  };



  exports.deleteListing = async (req, res) => {
    try {
      let id = req?.user?._id ? req?.user?._id : req.user.id;
      
      const listing = await Listing.findOne({
        _id: req.params.id,
        vendor: id
      });
  
      if (!listing) {
        return res.status(404).json({
          error: 'Listing not found'
        });
      }
  
      await listing.deleteOne();
  

      const vendor = await Vendor.findById(id);
      
      if (vendor) {
        vendor.stats.totalListings -= 1;
        if (listing.status === 'active') {
          vendor.stats.activeListings -= 1;
        }
        await vendor.save();
      }
  
      res.status(200).json({
        success: true,
        message: 'Listing deleted successfully'
      });
  
    } catch (error) {
      console.error('Delete listing error:', error);
      res.status(500).json({
        error: 'Failed to delete listing'
      });
    }
  };




exports.updateStatus=async(req,res)=>{
  let {status,id}=req.body;
  try{
await Listing.findByIdAndUpdate(id,{
  $set:{
    status
  }
})

return res.status(200).json({
  message:"Status updated sucessfully"
})

  }catch(e){
    console.log(e.message)
    return res.status(400).json({
      error:"Error while trying to update status"
    })
  }
}



  exports.getDashboardData = async (req, res) => {
    try {
      const vendorId = req.user._id?req.user._id:req.user.id; 
      console.log(vendorId)

      const vendor = await Vendor.findById(vendorId).select({
        stripe_connect_status: 1,
        sucessPopup: 1,
      });
      
      
      if (!vendor) {
        return res.status(404).json({
          success: false,
          message: 'Vendor not found'
        });
      }
  
      const requests=await requestModel.find({approvedByVendor:false,status:'pending',vendor:vendorId})
     const messages=await messageModel.find({vendor:vendorId,seenByVendor:false})

      const listings = await Listing.find({ vendor: vendorId });
      
   
      const listingStats = {
        total: listings.length,
        active: listings.filter(l => l.status === 'active').length,
        draft: listings.filter(l => l.status === 'draft').length,
        rented: listings.filter(l => l.status === 'rented').length,
        sold: listings.filter(l => l.status === 'sold').length,
        boosted: listings.filter(l => l.visibility.isBoosted).length
      };
  
    
      const totalEngagement = listings.reduce((acc, listing) => {
        return {
          views: acc.views + listing.engagement.views,
          likes: acc.likes + listing.engagement.likes,
          inquiries: acc.inquiries + listing.engagement.inquiries,
          shares: acc.shares + listing.engagement.shares
        };
      }, { views: 0, likes: 0, inquiries: 0, shares: 0 });
  
   
      const communityPosts = await CommunityPost.find({ 
        vendor: vendorId,
        isActive: true 
      });
  
      const postStats = {
        total: communityPosts.length,
        totalLikes: communityPosts.reduce((sum, post) => sum + post.engagement.likes, 0),
        totalComments: communityPosts.reduce((sum, post) => sum + post.engagement.comments, 0),
        totalShares: communityPosts.reduce((sum, post) => sum + post.engagement.shares, 0)
      };
  
      

      const recentListings = await Listing.find({ vendor: vendorId })
  .sort({ createdAt: -1 })
  .limit(5)
  .select('title category status pricing.rentPrice pricing.buyPrice engagement createdAt images');

const recentListingsWithDelivery = await Promise.all(
  recentListings.map(async (listing) => {
    const request = await requestModel.findOne({ 
      listing: listing._id 
    }).select('deliveryType');
    
    return {
      ...listing.toObject(),
      deliveryType: request?.deliveryType || null
    };
  })
);
const topListings = await Listing.find({ vendor: vendorId })
.sort({ 'engagement.views': -1 })
.limit(5)
.select('title category engagement.views engagement.likes engagement.inquiries');


const topListingsWithDelivery = await Promise.all(
topListings.map(async (listing) => {
  const request = await requestModel.findOne({ 
    listing: listing._id 
  }).select('deliveryType');
  
  return {
    ...listing.toObject(),
    deliveryType: request?.deliveryType || null
  };
})
);
      
      const recentPosts = await CommunityPost.find({ 
        vendor: vendorId,
        isActive: true 
      })
        .sort({ createdAt: -1 })
        .limit(5)
        .select('type content engagement createdAt')
        .populate('linkedListing', 'title');
  
    
      const thirtyDaysAgo = new Date();
      thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
      
      const recentActivity = await Listing.find({
        vendor: vendorId,
        updatedAt: { $gte: thirtyDaysAgo }
      }).select('status updatedAt');
  
   console.log(recentListingsWithDelivery)
      const dashboardData = {
        success: true,
        data: {
          requests,
          messages,
          vendor: {
            id: vendor._id,
            name: vendor.name,
            email: vendor.email,
            businessName: vendor.businessName,
            subscription: vendor.subscription,
            boostCredits: vendor.boostCredits,
            isVerified: vendor.isVerified,
            stripe_connect_status:vendor.stripe_connect_status,
            sucessPopup:vendor.sucessPopup
          },
          stats: {
            listings: listingStats,
            engagement: totalEngagement,
            communityPosts: postStats,
            vendorStats: vendor.stats
          },
          recentListings: recentListingsWithDelivery,  
          topListings: topListingsWithDelivery,  
          recentPosts,
          recentActivity: recentActivity.length,
          subscriptionStatus: {
            plan: vendor.subscription.plan,
            status: vendor.subscription.status,
            daysRemaining: vendor.subscription.endDate 
              ? Math.ceil((new Date(vendor.subscription.endDate) - new Date()) / (1000 * 60 * 60 * 24))
              : null
          }
        }
      };
  
      res.status(200).json(dashboardData);
  
    } catch (error) {
      console.error('Dashboard data error:', error);
      res.status(500).json({
        success: false,
        message: 'Error fetching dashboard data',
        error: error.message
      });
    }
  };



  exports.getVendorListingsFeed = async (req, res) => {
    try {
      const vendorId = req.user._id || req.user.id;
      
 
      const {
        page = 1,
        limit = 12,
        search = '',
        category = 'all',
        sortBy = 'visibility', 
        status = ''
      } = req.query;
  
  
      let query = { vendor: vendorId };
  
      if (category && category !== 'all') {
        query.category = category;
      }
  
    
      if (status) {
        query.status = status;
      }
  
      
      if (search) {
        query.$or = [
          { title: { $regex: search, $options: 'i' } },
          { brand: { $regex: search, $options: 'i' } },
          { description: { $regex: search, $options: 'i' } }
        ];
      }
  
      
      let sortOptions = {};
      switch (sortBy) {
        case 'visibility':
          sortOptions = { 'visibility.visibilityScore': -1, createdAt: -1 };
          break;
        case 'views':
          sortOptions = { 'engagement.views': -1 };
          break;
        case 'engagement':
         
          sortOptions = { createdAt: -1 }; 
          break;
        case 'recent':
          sortOptions = { createdAt: -1 };
          break;
        default:
          sortOptions = { 'visibility.visibilityScore': -1, createdAt: -1 };
      }
  
     
      const skip = (parseInt(page) - 1) * parseInt(limit);
  
     
      let listings = await Listing.find(query)
        .sort(sortOptions)
        .skip(skip)
        .limit(parseInt(limit))
        .select('title category brand condition pricing description images status visibility engagement availability createdAt updatedAt publishToFeed')
        .lean();
  
     
      if (sortBy === 'engagement') {
        listings.sort((a, b) => {
          const engagementA = 
            (a.engagement.likes || 0) + 
            (a.engagement.inquiries || 0) + 
            (a.engagement.shares || 0);
          const engagementB = 
            (b.engagement.likes || 0) + 
            (b.engagement.inquiries || 0) + 
            (b.engagement.shares || 0);
          return engagementB - engagementA;
        });
      }
  
      
      const totalListings = await Listing.countDocuments(query);
      const totalPages = Math.ceil(totalListings / parseInt(limit));
      const hasMore = parseInt(page) < totalPages;
  
    
      const allListings = await Listing.find({ vendor: vendorId });
      
      const stats = {
        total: allListings.length,
        active: allListings.filter(l => l.status === 'active').length,
        draft: allListings.filter(l => l.status === 'draft').length,
        rented: allListings.filter(l => l.status === 'rented').length,
        sold: allListings.filter(l => l.status === 'sold').length,
        boosted: allListings.filter(l => l.visibility.isBoosted).length,
        totalViews: allListings.reduce((sum, l) => sum + (l.engagement.views || 0), 0),
        totalEngagement: allListings.reduce((sum, l) => 
          sum + (l.engagement.likes || 0) + 
          (l.engagement.inquiries || 0) + 
          (l.engagement.shares || 0), 0
        )
      };
  
      res.status(200).json({
        success: true,
        data: listings,
        pagination: {
          currentPage: parseInt(page),
          totalPages,
          totalListings,
          limit: parseInt(limit),
          hasMore
        },
        stats,
        filters: {
          search,
          category,
          sortBy,
          status
        }
      });
  
    } catch (error) {
      console.error('Get vendor listings feed error:', error);
      res.status(500).json({
        success: false,
        error: 'Failed to fetch listings feed',
        message: error.message
      });
    }
  };

  exports.getListingById = async (req, res) => {
    try {
      const { id } = req.params;
 
      const vendorId = req.user._id || req.user.id;
  
      const listing = await Listing.findOne({ _id: id })
        .populate('vendor', 'name businessName email')
        .lean();

      if (!listing) {
        return res.status(404).json({
          success: false,
          error: 'Listing not found'
        });
      }
  
      res.status(200).json({
        success: true,
        data: listing
      });
  
    } catch (error) {
      console.error('Get listing by ID error:', error);
      res.status(500).json({
        success: false,
        error: 'Failed to fetch listing',
        message: error.message
      });
    }
  };