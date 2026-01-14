const messageModel = require('../models/messages');
const ordersModel = require('../models/order');
const requestModel = require('../models/request');
const userModel = require('../models/user')
const jwt = require('jsonwebtoken')


const cache = new Map();
const CACHE_TTL = 5 * 60 * 1000; 


const getCachedData = (key) => {
  const cached = cache.get(key);
  if (cached && Date.now() - cached.timestamp < CACHE_TTL) {
    return cached.data;
  }
  return null;
};


const setCachedData = (key, data) => {
  cache.set(key, {
    data,
    timestamp: Date.now()
  });
};

module.exports.getDashboardData = async (req, res) => {
  try {
    console.log("HEY")
    const stripe = require('stripe')(process.env.STRIPE_LIVE);
let id=req.user?._id?req.user?._id:req?.user?.id
    let user=await userModel.findById(id)
    let orders=await ordersModel.find({})
    orders=orders?.filter(u=>u?.user?.toString()==id?.toString())
 
    let paymentMethodId = jwt.verify(user.paymentMethodToken, process.env.PAYMENT_METHOD_JWT_KEY);
    paymentMethodId=paymentMethodId.paymentMethodId

    paymentMethod = await stripe.customers.retrievePaymentMethod(
      user.customerId,
      paymentMethodId
    );
 
   
return res.status(200).json({
  orders,
  user,
  paymentMethod
})

  } catch (error) {
    console.error('Dashboard data fetch error:', error.message);
    
 
    if (error.name === 'CastError') {
      return res.status(400).json({
        error: "Invalid user ID format"
      });
    }
    
    if (error.type === 'StripeError') {
      return res.status(503).json({
        error: "Payment service temporarily unavailable"
      });
    }

    return res.status(500).json({
      error: "Unable to fetch data at this time"
    });
  }
}


setInterval(() => {
  const now = Date.now();
  for (const [key, value] of cache.entries()) {
    if (now - value.timestamp > CACHE_TTL) {
      cache.delete(key);
    }
  }
}, CACHE_TTL);


  module.exports.getRenterDashboardData = async(req, res) => {
    try {
      let id = req?.user?._id ? req?.user?._id : req.user.id;
      
      let user=await userModel.findById(id)
     
      let pendingApprovals = await ordersModel
        .find({ status: 'processing', user: id })
        .populate('listing')
        .populate('vendor')
        .sort({ createdAt: -1 });

     
      let orders = await ordersModel
        .find({ user: id })
        .populate('user')
        .populate('listing')
        .populate('vendor')
        .sort({ createdAt: -1 });

     
      let completedOrders = await ordersModel
        .find({ user: id, status: 'confirmed' })
        .populate('user')
        .populate('listing')
        .populate('vendor')
        .sort({ createdAt: -1 });

     
      const activeRentalStatuses = ['active', 'delivered', 'in_transit', 'processing', 'confirmed'];
     
      const activeRentals = orders.filter(order => 
        activeRentalStatuses.includes(order.status)
      );

      
      const stats = {
        activeRentals: activeRentals.length, 
        
        totalSpent: orders
          .filter(order => order.paymentStatus === 'paid')
          .reduce((sum, order) => sum + (order.totalAmount || 0), 0),
        
        completedRentals: completedOrders.length 
      };

      const recentReceipts = orders
        .filter(order => order.paymentStatus === 'paid')
        .slice(0, 5) 
        .map(order => ({
          _id: order._id,
          rental: order,
          amount: order.totalAmount,
          paidDate: order.createdAt,
          status: order.paymentStatus,
          receiptNumber: order.orderNumber
        }));

      const renter = await userModel.findById(id).select('name email credit');
      const messagesLength = await messageModel.countDocuments({
        user: id,
        seenByUser: false
      });

      return res.status(200).json({
        success: true,
        data: {
          stats,
          activeRentals: activeRentals.slice(0, 5), 
          pendingApprovals,
          recentReceipts,
          renter,
          unreadMessages:  messagesLength,
          completedOrders,
          user
        }
      });

    } catch(e) {
      console.log(e.message);
      return res.status(400).json({
        success: false,
        error: "Error occurred while trying to fetch dashboard data"
      });
    }
  };