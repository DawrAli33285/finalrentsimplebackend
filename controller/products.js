const productModel = require('../models/products');
const { cloudinaryUploadImage } = require('../middleware/cloudinary'); 
const fs = require('fs');

module.exports.createProduct = async (req, res) => {
    let { ...data } = req.body;
  
    try {
     
        if (req.file) {
            console.log('File received:', req.file.path);
          
            const cloudinaryResult = await cloudinaryUploadImage(req.file.path);
            
            if (cloudinaryResult.url) {
             
                data.photo = cloudinaryResult.url;
                console.log('Image uploaded to Cloudinary:', cloudinaryResult.url);
                
                
                fs.unlinkSync(req.file.path);
            } else {
                throw new Error('Failed to upload image to Cloudinary');
            }
        }
        
       
        const newProduct = await productModel.create(data);
        
        return res.status(201).json({
            success: true,
            message: "Product created successfully",
            product: newProduct
        });
        
    } catch (e) {
        console.log('Error:', e.message);
        
       
        if (req.file && fs.existsSync(req.file.path)) {
            fs.unlinkSync(req.file.path);
        }
        
        return res.status(400).json({
            error: "Facing issue while creating product, please try again",
            details: e.message
        });
    }
}


module.exports.deleteProduct=async(req,res)=>{
    let {id}=req.params;
    try{

        await productModel.findByIdAndDelete(id)
        return res.status(200).json({
            message:"Product deleted sucessfully"
        })
    }catch(e){
        return res.status(400).json({
            error: "Facing issue while deleting product, please try again",
            details: e.message
        });
    }
}


module.exports.getProducts=async(req,res)=>{
    try{
let products=await productModel.find({})
return res.status(200).json({
    products
})
    }catch(e){
        return res.status(400).json({
            error: "Facing issue while fetching products, please try again",
            details: e.message
        });
    }
}