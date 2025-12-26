const cloudinary = require('cloudinary').v2;
const path = require('path');
const fs = require('fs');

cloudinary.config({
  cloud_name: "dbjwbveqn",
  api_key: "774241215571685",
  api_secret: "ysIyik3gF03KPDecu-lOHtBYLf8"
});

module.exports.cloudinaryUploadImage = async (fileToUpload) => {
  try {
 
    if (!fs.existsSync(fileToUpload)) {
      throw new Error('File not found');
    }

    const data = await cloudinary.uploader.upload(fileToUpload, {
      resource_type: 'auto',
      folder: 'products', 
      use_filename: true,
      unique_filename: true,
    });

    console.log('Cloudinary upload successful:', data.url);
    
    return {
      url: data.secure_url,
      public_id: data.public_id, 
      width: data.width,
      height: data.height
    };

  } catch (e) {
    console.log('Cloudinary upload error:', e.message);
    throw new Error(`Cloudinary upload failed: ${e.message}`);
  }
};