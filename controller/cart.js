const cartModel = require('../models/cart')
const mongoose = require('mongoose')

module.exports.addItemsToCart = async (req, res) => {
    const { cartItems } = req.body;

   
    if (!cartItems || !Array.isArray(cartItems)) {
        return res.status(400).json({
            error: "cartItems array is required"
        });
    }

    if (cartItems.length === 0) {
        return res.status(400).json({
            error: "cartItems array cannot be empty"
        });
    }

    try {
      
        const applianceIds = [];
        const comboItems = [];

        for (const item of cartItems) {
            if (!item._id) {
                return res.status(400).json({
                    error: "Each item must have an _id"
                });
            }

            if (!mongoose.Types.ObjectId.isValid(item._id)) {
                return res.status(400).json({
                    error: `Invalid applianceId format: ${item._id}`
                });
            }

            applianceIds.push(item._id);

          
            if (item.comboItem && item.comboItem.plugType) {
                comboItems.push({
                    plugType: item.comboItem.plugType,
                    plugDescription: item.comboItem.plugDescription || ''
                });
            }
        }

        const updateData = {
            $set: { 
                items: applianceIds,
                comboItem: comboItems
            }
        };

      
        const updatedCart = await cartModel.findOneAndUpdate(
            { user: req.user._id }, 
            updateData, 
            { 
                new: true, 
                upsert: true, 
                setDefaultsOnInsert: true,
                lean: true 
            }
        ).populate({
            path: 'items',
            select: 'name monthly_price photo key_features combo stock_status',
            options: { lean: true } 
        }); 

        return res.status(200).json({
            message: `${applianceIds.length} product(s) added to cart successfully`,
            cart: updatedCart
        });

    } catch (e) {
        console.error("Error:", e.message);
        return res.status(500).json({
            error: "Facing issue while storing items to cart please try again"
        });
    }
}
module.exports.removeItemsFromCart = async (req, res) => {
    try {
        await cartModel.findOneAndUpdate(
            { user: req.user._id },
            {
                $set: {
                    items: [],
                    comboItem: []
                }
            },
            { 
                upsert: true,
                setDefaultsOnInsert: true,
                lean: true 
            }
        );
        
        return res.status(200).json({
            message: "Successfully removed items"
        });
        
    } catch (e) {
        console.error("Error removing cart items:", e.message);
        return res.status(500).json({
            error: "Facing issue while removing items from cart please try again"
        });
    }
}

module.exports.getCartItems=async(req,res)=>{
    try {
        
     let cartItems=await cartModel.findOne({user:req.user._id},{items:1,tvSize:1}).populate('items')
     return res.status(200).json({
        cartItems
     })

    } catch (e) {
        console.log(e.message);
        return res.status(500).json({
            error: "Facing issue while fetching items from cart please try again",
            details: e.message
        });
    }
}

module.exports.removeFromCart = async (req, res) => {
    let { applianceId } = req.body;
    console.log(applianceId)
    

    if (!applianceId) {
        return res.status(400).json({
            error: "applianceId is required"
        });
    }



    try {
 
        console.log(req.user._id)
        const updatedCart = await cartModel.findOneAndUpdate(
            { user: req.user._id }, 
            { 
                $pull: { 
                    items: applianceId  
                } 
            },
            { 
                new: true, 
            }
        ).populate('items');

       
        if (!updatedCart) {
            return res.status(404).json({
                error: "Cart not found for this user"
            });
        }

        return res.status(200).json({
            message: "Item removed from cart successfully",
            cart: updatedCart
        });

    } catch (e) {
        console.log(e.message);
        return res.status(500).json({
            error: "Facing issue while deleting items from cart please try again",
            details: e.message
        });
    }
}

module.exports.updateTvscreen=async(req,res)=>{
    let {tvSize}=req.body;
    console.log("TVSIZE")
    console.log(tvSize)
    try{
await cartModel.updateOne({user:req.user._id},{
    $set:{
        tvSize
    }
})
return res.status(200).json({
    message:"Tv Screen added sucessfully"
})
    }catch(e){
        console.log(e.message);
        return res.status(500).json({
            error: "Facing issue while deleting items from cart please try again",
            details: e.message
        });
    }
}