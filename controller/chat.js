const messageModel = require("../models/messages");
const orderModel = require("../models/order");
const userModel = require("../models/user");
const Vendor=require('../models/vendor')

const nodemailer=require('nodemailer')
exports.sendMessage=async(req,res)=>{
    let {...data}=req.body;
    let id=req?.user?._id?req?.user?._id:req.user.id
    try{
        data={
            ...data,
            user:id,
            sendBy:'user'
        }
let message=await messageModel.create(data)
let vendor=await Vendor.findById(data.vendor)
let user = await userModel.findById(id);


return res.status(200).json({
    message:"Message sent sucessfully",
id:message._id
})
    }catch(e){
console.log(e.message)
return res.status(400).json({
    error:"Error occured while trying to send message"
})
    }
}

exports.getMessages=async(req,res)=>{
    let {vendor}=req.body;
    try{
        let id=req?.user?._id?req?.user?._id:req.user.id
let messages=await messageModel.find({user:id,vendor})
return res.status(200).json({
    messages
})

    }catch(e){
console.log(e.message)
return res.status(400).json({
    error:"Error occured while trying to fetch messages"
})
    }
}



exports.getConversations = async (req, res) => {
    try {
        const userId = req?.user?._id ? req?.user?._id : req.user.id;

        console.log('=== Getting Conversations ===');
        console.log('User ID:', userId);

       
        let conversations = await messageModel
            .find({ user: userId })
            .populate('vendor')
            .lean();

        console.log('Existing conversations count:', conversations.length);
        console.log('Existing conversation vendor IDs:', 
            conversations.map(c => c.vendor?._id?.toString())
        );

    
        const userOrders = await orderModel
            .find({
                user: userId,
                status: { 
                    $in: [
                        'confirmed', 
                        'processing', 
                        'in_transit', 
                        'delivered', 
                        'active', 
                        'paused', 
                        'completed'
                    ] 
                }
            })
            .select('vendor status')
            .lean();

        console.log('Orders found:', userOrders.length);
        console.log('Order details:', userOrders.map(o => ({
            vendor: o.vendor?.toString(),
            status: o.status
        })));

       
        const orderVendorIds = [...new Set(
            userOrders
                .map(order => order.vendor?.toString())
                .filter(Boolean)
        )];

        console.log('Unique vendor IDs from orders:', orderVendorIds);

      
        const existingConversationVendorIds = conversations
            .map(conv => conv.vendor?._id?.toString())
            .filter(Boolean);

       
        const vendorsWithoutConversations = orderVendorIds.filter(
            vendorId => !existingConversationVendorIds.includes(vendorId)
        );

        console.log('Vendors needing conversations:', vendorsWithoutConversations);

       
        if (vendorsWithoutConversations.length > 0) {
            const newConversations = await Promise.all(
                vendorsWithoutConversations.map(async (vendorId) => {
                    try {
                        console.log(`Creating conversation for vendor: ${vendorId}`);
                        
                       
                        const newConversation = await messageModel.create({
                            user: userId,
                            vendor: vendorId,
                            message: 'hi',
                            sendBy: 'user',
                            seenByUser: true,
                            seenByVendor: false,
                            createdAt: new Date()
                        });
                        console.log(`✓ Conversation created with ID: ${newConversation._id}`);
                        
                     
                        const populatedConv = await messageModel
                            .findById(newConversation._id)
                            .populate('vendor')
                            .lean();
                        
                        return populatedConv;
                    } catch (error) {
                        console.error(`✗ Error creating conversation for vendor ${vendorId}:`, error.message);
                        return null;
                    }
                })
            );

        
            const validNewConversations = newConversations.filter(Boolean);
            console.log('New conversations created:', validNewConversations.length);
            
            conversations = [...conversations, ...validNewConversations];
        }

        console.log('=== Final conversation count:', conversations.length, '===\n');

        return res.status(200).json({
            success: true,
            count: conversations.length,
            conversations
        });

    } catch (e) {
        console.error('Error in getConversations:', e);
        return res.status(500).json({
            success: false,
            error: "Error occurred while trying to fetch conversations",
            message: e.message
        });
    }
};

exports.getConversation=async(req,res)=>{
    const {vendor}=req.params;
    try{
        let id=req?.user?._id?req?.user?._id:req.user.id
        let conversation=await messageModel.find({user:id,vendor}).populate('vendor')
        return res.status(200).json({
            conversation
        })
    }catch(e){
        console.log(e.message)
        return res.status(400).json({
            error:"Error occured while trying to fetch conversation"
        })
    }

}




module.exports.seenMessages=async(req,res)=>{
    let {vendor}=req.params;
    try{
  let id=req?.user?._id?req?.user?._id:req.user.id
  await messageModel.updateMany({vendor,user:id},{$set:{
  seenByUser:true
  }})
  return res.status(200).json({
    message:"Messages seen sucessfully"
  })
    }catch(e){
      return res.status(400).json({
        error:"Error occured while trying to update messages"
      })
    }
  }

  module.exports.unSeenMessagesLength = async (req, res) => {
    let id = req?.user?._id || req.user.id;
  
    try {
      const messagesLength = await messageModel.countDocuments({
        user: id,
        seenByUser: false
      });
  
      return res.status(200).json({ messagesLength });
    } catch (e) {
      console.log(e.message);
      return res.status(400).json({
        error: "Error while trying to get messages length"
      });
    }
  };
  