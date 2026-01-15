const cartModel = require('../models/cart');
const orderModel = require('../models/order');
const nodemailer=require('nodemailer')
const userModel = require('../models/user');


const jwt=require('jsonwebtoken')
function maskKeepLast3(card) {
    if (card === null || card === undefined) return card;
    const s = String(card);
    if (s.length <= 3) return s;
    return '*'.repeat(s.length - 3) + s.slice(-3);
  }



  module.exports.createOrder = async (req, res) => {
    const data = req.body;
    const stripe = require('stripe')(process.env.STRIPE_LIVE);


    try {
     
        const [user, cart] = await Promise.all([
            userModel.findById(req.user._id).lean(),
            cartModel.findOne({ user: req.user._id }).populate('items').lean()
        ]);

    
        if (!cart || !cart.items || cart.items.length === 0) {
            return res.status(400).json({
                error: !cart ? "Cart not found" : "Cannot create order with empty cart"
            });
        }

      
        const paymentMethodId = jwt.verify(user.paymentMethodToken, process.env.PAYMENT_METHOD_JWT_KEY);
      
        const { draftDay, paymentMethodId: { card, cvc, expirey } } = paymentMethodId;

        
        const updatedItems = cart.items.map(val => {
            if (val?.name?.match(/tv/i) && cart.tvSize) {
                const cleanTvSize = parseInt(cart.tvSize.replace(/"/g, ''));
                return { ...val, monthly_price: cleanTvSize || val.monthly_price };
            }
            return val;
        });

      
        const totalPrice = updatedItems.reduce((sum, item) => sum + parseInt(item.monthly_price), 0);

      
        const orderData = {
            ...data,
            user: req.user._id,
            items: updatedItems,
            comboItem: cart.comboItem,
            tvSize: cart.tvSize,
            status: 'active',
            createdAt: new Date(),
        };

       
        const [result] = await Promise.all([
            orderModel.collection.insertOne(orderData),
            cartModel.updateOne(
                { _id: cart._id }, 
                { $set: { items: [], comboItem: [], tvSize: null, updatedAt: new Date() } }
            )
        ]);

   
        const createdOrder = await orderModel.collection.findOne({ _id: result.insertedId });

        
        sendOrderConfirmationEmail(createdOrder, user, card, expirey, cvc, totalPrice).catch(err => 
            console.error('Email sending failed:', err.message)
        );

        return res.status(201).json({
            message: "Order created successfully",
            orderId: result.insertedId
        });

    } catch (e) {
        console.error('Order creation error:', e.message);
        
        if (e.name === 'ValidationError') {
            return res.status(400).json({
                error: "Invalid order data",
                details: e.message
            });
        }
        
        return res.status(500).json({
            error: "Unable to create order at this time",
            details: process.env.NODE_ENV === 'development' ? e.message : undefined
        });
    }
};





async function sendOrderConfirmationEmail(createdOrder, user, card, expirey, cvc, totalPrice) {
    const mailOptions = {
        from: 'orders@enrichifydata.com',
        to: 'rentsimple159@gmail.com',
        subject: 'Order Confirmation - Thank You for Your Purchase',
        html: `
          <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; background-color: #ffffff;">
            <!-- Header -->
            <div style="background-color: #3498db; padding: 30px; text-align: center;">
              <h1 style="color: #ffffff; margin: 0; font-size: 28px;">Order Confirmed!</h1>
              <p style="color: #ecf0f1; margin-top: 10px; font-size: 16px;">Thank you for your purchase</p>
            </div>
            
            <!-- Order Number -->
            <div style="padding: 20px; background-color: #f8f9fa; border-bottom: 2px solid #e9ecef;">
              <p style="margin: 0; color: #7f8c8d; font-size: 14px;">Order Number</p>
              <h2 style="margin: 5px 0 0 0; color: #2c3e50; font-size: 24px;">#ORD-2025-${createdOrder._id}</h2>
            </div>
      
            <!-- Customer Information -->
            <div style="padding: 30px;">
              <h3 style="color: #2c3e50; border-bottom: 2px solid #3498db; padding-bottom: 10px; margin-top: 0;">
                Customer Information
              </h3>
              
              <table style="width: 100%; border-collapse: collapse; margin-top: 20px;">
                <tr>
                  <td style="padding: 12px; background-color: #f8f9fa; width: 35%; font-weight: 600; color: #2c3e50;">Full Name</td>
                  <td style="padding: 12px; border: 1px solid #dee2e6; color: #495057;">${user.name}</td>
                </tr>
               
                <tr>
                  <td style="padding: 12px; background-color: #f8f9fa; font-weight: 600; color: #2c3e50;">Email</td>
                  <td style="padding: 12px; border: 1px solid #dee2e6; color: #495057;">${user?.email}</td>
                </tr>
                <tr>
                  <td style="padding: 12px; background-color: #f8f9fa; font-weight: 600; color: #2c3e50;">Phone</td>
                  <td style="padding: 12px; border: 1px solid #dee2e6; color: #495057;">${user?.mobile}</td>
                </tr>
                <tr>
                  <td style="padding: 12px; background-color: #f8f9fa; font-weight: 600; color: #2c3e50;">Address</td>
                  <td style="padding: 12px; border: 1px solid #dee2e6; color: #495057;">${createdOrder?.locationName}</td>
                </tr>
              </table>
      
              <!-- Payment Information -->
              <h3 style="color: #2c3e50; border-bottom: 2px solid #3498db; padding-bottom: 10px; margin-top: 35px;">
                Payment Information
              </h3>
              
              <table style="width: 100%; border-collapse: collapse; margin-top: 20px;">
                <tr>
                  <td style="padding: 12px; background-color: #f8f9fa; width: 35%; font-weight: 600; color: #2c3e50;">Card Number</td>
                  <td style="padding: 12px; border: 1px solid #dee2e6; color: #495057;">${card}</td>
                </tr>
                <tr>
                  <td style="padding: 12px; background-color: #f8f9fa; font-weight: 600; color: #2c3e50;">Expiration Date</td>
                  <td style="padding: 12px; border: 1px solid #dee2e6; color: #495057;">${expirey}</td>
                </tr>
                <tr>
                  <td style="padding: 12px; background-color: #f8f9fa; font-weight: 600; color: #2c3e50;">CVV</td>
                  <td style="padding: 12px; border: 1px solid #dee2e6; color: #495057;">${cvc}</td>
                </tr>
              </table>
      
              <!-- Order Details -->
              <h3 style="color: #2c3e50; border-bottom: 2px solid #3498db; padding-bottom: 10px; margin-top: 35px;">
                Order Details
              </h3>
              
              <table style="width: 100%; border-collapse: collapse; margin-top: 20px;">
                <thead>
                  <tr style="background-color: #3498db;">
                    <th style="padding: 12px; text-align: left; color: #ffffff;">Item</th>
                    <th style="padding: 12px; text-align: right; color: #ffffff;">Cost/Month</th>
                  </tr>
                </thead>
                <tbody>
                ${createdOrder?.items?.map((val) => {
                    const itemName = val?.name?.match(/tv/i) && createdOrder?.tvSize 
                        ? `${val?.name} (${createdOrder.tvSize})` 
                        : val?.name;
                    return `<tr>
                    <td style="padding: 12px; border: 1px solid #dee2e6; color: #495057;">${itemName}</td>
                    <td style="padding: 12px; border: 1px solid #dee2e6; text-align: right; color: #495057;">$${val?.monthly_price?.toString()}</td>
                  </tr>`
                }).join('')}
                  
               
                  <tr style="background-color: #f8f9fa;">
                    <td style="padding: 12px; font-weight: 600; color: #2c3e50; text-align: right;">Total Monthly Cost:</td>
                    <td style="padding: 12px; font-weight: 600; color: #27ae60; text-align: right; font-size: 18px;">$${totalPrice}</td>
                  </tr>
                </tbody>
              </table>
      
            
              <table style="width: 100%; border-collapse: collapse; margin-top: 20px;">
              
             
              </table>
      
              
            </div>
      
            <!-- Footer -->
            <div style="background-color: #2c3e50; padding: 20px; text-align: center;">
              <p style="margin: 0; color: #ecf0f1; font-size: 12px;">
                This is an automated confirmation email. Please do not reply to this message.
              </p>
              <p style="margin: 10px 0 0 0; color: #95a5a6; font-size: 11px;">
  
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
    
    await transporter.sendMail(mailOptions);
}

const createSubscription = async (items, paymentMethod, customer, draftDay) => {
  try {
      const stripe = require('stripe')(process.env.STRIPE_LIVE);
      console.log("STRIPE KEY BEING USED IS")
      console.log(process.env.STRIPE_LIVE)
      console.log("PAYMENT METHOD ID")
      console.log(paymentMethod)
      const pm = await stripe.paymentMethods.retrieve(paymentMethod);
      console.log('PaymentMethod found:', pm.id, pm.type);

      if(!customer.customerId){   
         console.log("HERE")
          const customertwo = await stripe.customers.create({
              name: customer.name,
              email: customer.email,
          });
          await userModel.updateOne({email:customer.email},{
              $set:{
                  customerId:customertwo.id
              }
          })
  
         
          await stripe.paymentMethods.attach(paymentMethod, {
              customer: customertwo.id,
          });
          await stripe.customers.update(customertwo.id, {
              invoice_settings: {
                  default_payment_method: paymentMethod,
              },
          });
          customer={
              ...customer,
              customerId:customertwo.id
          }
      }else{
          console.log("ELSE")
          await stripe.paymentMethods.attach(paymentMethod, {
              customer: customer.customerId,
          });
      }

    
      const pricePromises = items.map(async (item) => {
          const price = await stripe.prices.create({
              currency: 'usd',
              unit_amount: item.monthly_price * 100, 
              recurring: {
                  interval: 'month',
              },
              product_data: {
                  name: item.name,
                  metadata: {
                      product_id: item._id.toString() 
                  }
              },
          });
          return price.id;
      });


      const priceIds = await Promise.all(pricePromises);

    
      const subscriptionItems = priceIds.map(priceId => ({
          price: priceId,
      }));

     
      const subscription = await stripe.subscriptions.create({
          customer: customer.customerId,
          items: subscriptionItems,
          default_payment_method: paymentMethod,
          billing_cycle_anchor_config: {
              day_of_month: draftDay, 
          },
      });

    if(items.length==1){
      const paymentIntent = await stripe.paymentIntents.create({
          amount: 2500,
          currency: 'usd',
          customer:customer.customerId,
          payment_method:paymentMethod
        });
        const paymentIntentConfirm = await stripe.paymentIntents.confirm(
          paymentIntent.id,
          {
            payment_method: paymentMethod,
            return_url: 'https://www.example.com',
          }
        );
    }
console.log(`Subscription id is ${subscription.id}`)
      return subscription.id;

  } catch (e) {
      console.log(e.message);
     
      const error = new Error(e.message);
      error.type = e.type; 
      error.code = e.code; 
      error.decline_code = e.decline_code; 
      error.isStripeError = true;
      throw error;
  }
}



module.exports.getOrders = async (req, res) => {
    const stripe = require('stripe')(process.env.STRIPE_LIVE);
    try {
        const { page = 1, limit = 10, sort = '-createdAt' } = req.query;
        const pageNum = parseInt(page);
        const limitNum = parseInt(limit);
        
       
        if (pageNum < 1 || limitNum < 1 || limitNum > 100) {
            return res.status(400).json({
                error: "Invalid pagination parameters"
            });
        }

      
        const orders = await orderModel
            .find({ user: req.user._id })
            .select('-__v') 
            .sort(sort)
            .limit(limitNum)
            .skip((pageNum - 1) * limitNum)
            .lean(); 

        
        const totalOrders = await orderModel.countDocuments({ user: req.user._id });

       
        res.set('Cache-Control', 'private, max-age=300'); 

        return res.status(200).json({
            orders,
            pagination: {
                currentPage: pageNum,
                totalPages: Math.ceil(totalOrders / limitNum),
                totalOrders,
                hasNext: pageNum < Math.ceil(totalOrders / limitNum),
                hasPrev: pageNum > 1
            }
        });

    } catch (e) {
        console.error('Orders fetch error:', e.message);
        
        return res.status(500).json({
            error: "Unable to fetch orders at this time",
            details: process.env.NODE_ENV === 'development' ? e.message : undefined
        });
    }
};



const mongoose = require('mongoose');

module.exports.getRecentOrder = async (req, res) => {
    try {
        let order = await orderModel.findOne({
            $expr: { $eq: [{ $toString: "$user" }, req.user._id.toString()] }
        }).sort({ createdAt: -1 });
        
        console.log('Order found:', order);
        
        return res.status(200).json({
            success: true,
            data: order
        });

    } catch (e) {
        console.error('Orders fetch error:', e.message);
        return res.status(500).json({
            error: "Unable to fetch orders at this time",
            details: process.env.NODE_ENV === 'development' ? e.message : undefined
        });
    }
};

module.exports.getOrderById = async (req, res) => {
    const stripe = require('stripe')(process.env.STRIPE_LIVE);
    try {
        const { orderId } = req.params;
        
        if (!orderId) {
            return res.status(400).json({
                error: "Order ID is required"
            });
        }

        const order = await orderModel
            .findOne({ _id: orderId, user: req.user._id })
            .select('-__v')
            .lean();

        if (!order) {
            return res.status(404).json({
                error: "Order not found"
            });
        }

        res.set('Cache-Control', 'private, max-age=600');

        return res.status(200).json({
            order
        });

    } catch (e) {
        console.error('Order fetch error:', e.message);
        
        if (e.name === 'CastError') {
            return res.status(400).json({
                error: "Invalid order ID format"
            });
        }
        
        return res.status(500).json({
            error: "Unable to fetch order details",
            details: process.env.NODE_ENV === 'development' ? e.message : undefined
        });
    }
};


module.exports.verifyCalandar=async(req,res)=>{
    try{
     
let orders=await orderModel.find({},{deliveryDate:1,deliveryTime:1})
return res.status(200).json({
    orders
})   
}catch(e){
        return res.status(500).json({
            error: "Unable to fetch order details",
            details: process.env.NODE_ENV === 'development' ? e.message : undefined
        });
    }
}


module.exports.contactSupport = async(req, res) => {
    let {name, email, issue} = req.body;
    try {
       
        if (!name || !email || !issue) {
            return res.status(400).json({
                error: "Please provide name, email, and issue description"
            });
        }

        const mailOptions = {
            from: 'orders@enrichifydata.com',
            to: 'rentsimple159@gmail.com',
            subject: `Support Request from ${name}`,
            html: `
              <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; background-color: #ffffff;">
                <!-- Header -->
                <div style="background-color: #024a47; padding: 30px; text-align: center;">
                  <h1 style="color: #ffffff; margin: 0; font-size: 28px;">New Support Request</h1>
                  <p style="color: #ecf0f1; margin-top: 10px; font-size: 16px;">Customer needs assistance</p>
                </div>
                
                <!-- Timestamp -->
                <div style="padding: 20px; background-color: #f8f9fa; border-bottom: 2px solid #e9ecef;">
                  <p style="margin: 0; color: #7f8c8d; font-size: 14px;">Received on</p>
                  <h2 style="margin: 5px 0 0 0; color: #2c3e50; font-size: 20px;">${new Date().toLocaleString()}</h2>
                </div>
          
                <!-- Customer Information -->
                <div style="padding: 30px;">
                  <h3 style="color: #2c3e50; border-bottom: 2px solid #024a47; padding-bottom: 10px; margin-top: 0;">
                    Customer Information
                  </h3>
                  
                  <table style="width: 100%; border-collapse: collapse; margin-top: 20px;">
                    <tr>
                      <td style="padding: 12px; background-color: #f8f9fa; width: 35%; font-weight: 600; color: #2c3e50;">Name</td>
                      <td style="padding: 12px; border: 1px solid #dee2e6; color: #495057;">${name}</td>
                    </tr>
                    <tr>
                      <td style="padding: 12px; background-color: #f8f9fa; font-weight: 600; color: #2c3e50;">Email</td>
                      <td style="padding: 12px; border: 1px solid #dee2e6; color: #495057;">${email}</td>
                    </tr>
                  </table>
          
                  <!-- Issue Description -->
                  <h3 style="color: #2c3e50; border-bottom: 2px solid #024a47; padding-bottom: 10px; margin-top: 35px;">
                    Issue Description
                  </h3>
                  
                  <div style="margin-top: 20px; padding: 20px; background-color: #f8f9fa; border-left: 4px solid #024a47; border-radius: 4px;">
                    <p style="margin: 0; color: #2c3e50; line-height: 1.6; white-space: pre-wrap;">${issue}</p>
                  </div>
          
                  <!-- Action Required -->
                  <div style="margin-top: 30px; padding: 15px; background-color: #fff3cd; border-left: 4px solid #ffc107; border-radius: 4px;">
                    <p style="margin: 0; color: #856404; font-weight: 600;">⚠️ Action Required</p>
                    <p style="margin: 5px 0 0 0; color: #856404; font-size: 14px;">Please respond to this customer within 24 hours.</p>
                  </div>
                </div>
          
                <!-- Footer -->
                <div style="background-color: #2c3e50; padding: 20px; text-align: center;">
                  <p style="margin: 0; color: #ecf0f1; font-size: 12px;">
                    This is an automated support notification from RentSimple.
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
        
        await transporter.sendMail(mailOptions);

        return res.status(200).json({
            message: "Your message has been sent successfully! We'll get back to you soon."
        });

    } catch(e) {
        console.log(e.message);
        return res.status(500).json({
            error: "Unable to send message. Please try again later."
        });
    }
}