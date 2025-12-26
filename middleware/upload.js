


const multer = require('multer');
const path = require('path');
const fs = require('fs');


const BASE_UPLOAD_PATH = '/tmp/public/files/images';


const createUploadDirs = () => {
  const dirs = [
    BASE_UPLOAD_PATH,
    path.join(BASE_UPLOAD_PATH, 'products'),
    path.join(BASE_UPLOAD_PATH, 'profiles'),
    path.join(BASE_UPLOAD_PATH, 'temp')
  ];
  
  dirs.forEach(dir => {
    if (!fs.existsSync(dir)) {
      fs.mkdirSync(dir, { recursive: true });
      console.log(`Created directory: ${dir}`);
    }
  });
};


createUploadDirs();

const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    
    let uploadPath = BASE_UPLOAD_PATH;
    

    if (req.route.path.includes('product')) {
      uploadPath = path.join(BASE_UPLOAD_PATH, 'products');
    } else if (req.route.path.includes('profile')) {
      uploadPath = path.join(BASE_UPLOAD_PATH, 'profiles');
    }
    
    cb(null, uploadPath);
  },
  filename: (req, file, cb) => {
    
    const uniqueName = Date.now() + '-' + Math.round(Math.random() * 1E9);
    const fileName = file.fieldname + '-' + uniqueName + path.extname(file.originalname);
    cb(null, fileName); 
  }
});

const fileFilter = (req, file, cb) => {
  
  if (file.mimetype.startsWith('image/')) {
    cb(null, true);
  } else {
    cb(new Error('Only images are allowed! Please upload JPG, PNG, or GIF files.'), false);
  }
};


const upload = multer({ 
  storage, 
  fileFilter
});

module.exports = upload;