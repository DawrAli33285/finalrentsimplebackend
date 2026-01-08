const express = require('express');
const app = express();


const fs=require('fs')
const nodemailer=require('nodemailer')


const SupportTicket  = require('./models/ticket');
const {SupportMessage}=require('./models/support')

const http = require('http');
const socketIo = require('socket.io');
const jwt = require('jsonwebtoken');

const server = http.createServer(app);
const io = socketIo(server, {
  cors: {
    origin: "*", 
    methods: ["GET", "POST"]
  }
});
const cors=require('cors')
const {scheduleBoostExpiryCheck}=require('./utils/cronjob')
const connection=require('./connection/connection')
const authRoutes=require('./routes/auth')
const paymentRoutes=require('./routes/payment')
const productRoutes=require('./routes/products')
const orderRoutes=require('./routes/order')

const cartRoutes=require('./routes/cart')
const dashboardRoutes=require('./routes/dashboard')
const adminRoutes=require('./routes/admin')
const vendorRoutes=require('./routes/vendor')
const vendorAuthRoutes=require('./routes/vendorauth')
const communityRoutes=require('./routes/community')
const userlistenings=require('./routes/userlistening')
const requestRoutes=require('./routes/request')
const messagesRoutes=require('./routes/messages')
const {handleStripeConnectWebhook}=require('./controller/payment')
const orderCron=require('./utils/order');
const adminModel = require('./models/admin');
require('dotenv').config();
app.use(cors())

app.post(
  '/webhook',
  express.raw({ type: 'application/json' }),
  handleStripeConnectWebhook
);

app.use(express.json())


scheduleBoostExpiryCheck();

const onlineUsers = new Map();

const getActiveRentersCount = () => {
  let count = 0;
  for (let [userId, userData] of onlineUsers.entries()) {
    if (userData.userType === 'user') {
      count++;
    }
  }
  return count;
};
const activeConversations = new Map(); 


io.on('connection', (socket) => {
  console.log('User connected:', socket.id);


  socket.on('join', ({ userId, userType }) => {
    console.log(`${userType} ${userId} joined`);
    socket.join(userId);
    socket.userId = userId;
    socket.userType = userType;
    
    onlineUsers.set(userId, {
      socketId: socket.id,
      userType: userType
    });
    
    
    socket.broadcast.emit('userOnline', {
      userId: userId,
      userType: userType,
      isOnline: true
    });

   
    if (userType === 'user') {
      const count = getActiveRentersCount();
      io.emit('activeRentersCount', count);
    }
  });


  socket.on('getActiveRenters', () => {
    const count = getActiveRentersCount();
    socket.emit('activeRentersCount', count);
    console.log('Sent active renters count:', count);
    console.log('Current online users:', Array.from(onlineUsers.entries()));
  });
 

  socket.on('setActiveConversation', (data) => {
    const { userId, conversationId } = data;
    
    if (conversationId) {
      activeConversations.set(userId, conversationId);
      console.log(`✅ ${userId} is now viewing conversation with ${conversationId}`);
    } else {
      activeConversations.delete(userId);
      console.log(`✅ ${userId} left conversation`);
    }
  });
  socket.on('sendMessage', async (data) => {
    try {
      const { conversationId, senderId, receiverId, message, sendBy, timestamp, tempId, image, isNewConversation, vendor, user } = data;
      
      console.log('New message received via socket:', data);
      
   
      const receiverOnline = onlineUsers.has(receiverId);
      const receiverViewingConversation = activeConversations.get(receiverId) === senderId;
      
   
      const isRead = receiverOnline && receiverViewingConversation;
      
      console.log(`📊 Receiver ${receiverId} - Online: ${receiverOnline}, Viewing: ${receiverViewingConversation}, Mark as read: ${isRead}`);
      
      
      if (isRead && tempId) {
        const Message = require('./models/messages');
        
        try {
          if (sendBy === 'user') {
            await Message.findByIdAndUpdate(tempId, { seenByVendor: true });
          } else if (sendBy === 'vendor') {
            await Message.findByIdAndUpdate(tempId, { seenByUser: true });
          }
          console.log('✅ Message marked as read because receiver is actively viewing conversation');
        } catch (dbError) {
          console.error('Error updating message read status:', dbError);
        }
      }
      
   
      io.to(receiverId).emit('newMessage', {
        id: tempId,
        senderId: senderId,
        receiverId: receiverId,
        message: message,
        image: image,
        sendBy: sendBy,
        timestamp: timestamp,
        read: isRead, 
        conversationId: conversationId,
        isNewConversation: isNewConversation, 
        vendor: vendor,
        user: user 
      });
  
    
      socket.emit('messageSent', {
        tempId: tempId,
        read: isRead, 
        success: true
      });
  
      console.log('Message emitted to receiver');
    } catch (error) {
      console.error('Error emitting message:', error);
      socket.emit('error', { 
        message: 'Failed to emit message',
        error: error.message 
      });
    }
  });
  
  



socket.on('sendAdminSupportMessage', async (data) => {
  try {
    const { ticketId, message, sendBy, adminId, timestamp, messageId, userId } = data;
    
    console.log('Admin support message sent via socket:', data);
    
  
    io.to(userId).emit('newSupportMessage', {
      ticketId: ticketId,
      message: {
        _id: messageId,
        message: message,
        sentBy: 'admin',
        createdAt: timestamp,
        seenByUser: false
      }
    });
    
    console.log('Admin message emitted to user:', userId);
  } catch (error) {
    console.error('Error emitting admin support message:', error);
  }
});


socket.on('ticketClosed', (data) => {
  try {
    const { ticketId, userId, userType, closedAt } = data;
    
    console.log('Ticket closed by user:', data);
    
  
    io.to('admin-room').emit('ticketClosed', {
      ticketId: ticketId,
      userId: userId,
      userType: userType,
      closedAt: closedAt
    });
    
    console.log('Ticket closed notification sent to admin room');
  } catch (error) {
    console.error('Error handling ticket closed event:', error);
  }
});

socket.on('newTicketCreated', async (data) => {
  try {
    const { ticketId, message, sendBy, userId, timestamp, messageId, userType } = data;
    
    console.log('New ticket created via socket:', data);
    
  
    const SupportTicket = require('./models/ticket'); 
    
    const populatedTicket = await SupportTicket.findById(ticketId)
      .populate('userId', 'name email avatar');
    
    io.to('admin-room').emit('newTicket', {
      ticket: populatedTicket,
      message: {
        _id: messageId,
        message: message,
        sentBy: sendBy,
        createdAt: timestamp,
        seenByAdmin: false
      },
      userType: userType
    });
    
    console.log('✅ Emitted newTicket event to admin-room');
  } catch (error) {
    console.error('Error handling newTicketCreated:', error);
  }
});
socket.on('sendSupportMessage', async (data) => {
  try {
    const { ticketId, message, sendBy, userId, timestamp, messageId, userType } = data;
    
    console.log('Support message sent via socket:', data);
    

    io.to('admin-room').emit('newSupportMessage', {
      ticketId: ticketId,
      message: {
        _id: messageId,
        message: message,
        sentBy: sendBy,
        createdAt: timestamp,
        seenByAdmin: false
      },
      userType: userType
    });
    
    console.log('Support message emitted to admin room');
  } catch (error) {
    console.error('Error emitting support message:', error);
  }
});


socket.on('supportMessagesRead', async (data) => {
  try {
    const { ticketId, userId, userType } = data;
    
    console.log('Support messages read by user:', data);
    
    
    io.to('admin-room').emit('supportMessageRead', {
      ticketId: ticketId,
      userId: userId,
      userType: userType,
      timestamp: new Date()
    });
    
    console.log('Support message read confirmation sent to admin');
  } catch (error) {
    console.error('Error emitting support read confirmation:', error);
  }
});




socket.on('joinAdminRoom', () => {
  socket.join('admin-room');
  console.log('Admin joined admin-room:', socket.id);
});

  socket.on('messagesSeen', async (data) => {
    try {
      const { conversationId, userId, vendorId, seenBy } = data;
      
      console.log('Messages seen:', data);
      
      const Message = require('./models/messages'); 
      
     
      if (seenBy === 'user') {
        await Message.updateMany(
          { 
            user: userId, 
            vendor: vendorId, 
            sendBy: 'vendor', 
            seenByUser: false 
          },
          { seenByUser: true }
        );
        
     
        io.to(vendorId).emit('messagesRead', {
          conversationId: userId,
          seenBy: 'user',
          timestamp: new Date()
        });
        
        console.log('User marked vendor messages as read');
      } else if (seenBy === 'vendor') {
        await Message.updateMany(
          { 
            user: userId, 
            vendor: vendorId, 
            sendBy: 'user', 
            seenByVendor: false 
          },
          { seenByVendor: true }
        );
        
        
        io.to(userId).emit('messagesRead', {
          conversationId: vendorId,
          seenBy: 'vendor',
          timestamp: new Date()
        });
        
        console.log('Vendor marked user messages as read');
      }
    } catch (error) {
      console.error('Error marking messages as seen:', error);
      socket.emit('error', { 
        message: 'Failed to update read status',
        error: error.message 
      });
    }
  });


  socket.on('typing', (data) => {
    const { conversationId, receiverId, isTyping, typerType } = data;
    
    console.log('Typing event:', data);
    
    
    io.to(receiverId).emit('userTyping', {
      conversationId: conversationId,
      isTyping: isTyping,
      typerType: typerType
    });
  });


  socket.on('disconnect', () => {
    console.log('User disconnected:', socket.id);
    
    if (socket.userId) {
      onlineUsers.delete(socket.userId);
      activeConversations.delete(socket.userId); 
      
      socket.broadcast.emit('userOffline', {
        userId: socket.userId,
        userType: socket.userType,
        isOnline: false
      });
    }
  });

  socket.on('error', (error) => {
    console.error('Socket error:', error);
  });
});


app.set('io', io);

connection
app.use(authRoutes)
app.use(paymentRoutes)
app.use(productRoutes)
app.use(cartRoutes)
app.use(orderRoutes)
app.use(dashboardRoutes)
app.use(adminRoutes)
app.use(vendorRoutes)
app.use(vendorAuthRoutes)
app.use(communityRoutes)
app.use(userlistenings)
app.use(requestRoutes)
app.use(messagesRoutes)






app.post('/adminsupportsendmessage', async(req, res) => {
  let { ticketId, message, adminId } = req.body;
  
  try {
    const ticket = await SupportTicket.findById(ticketId)
      .populate('userId');
  
    let adminFound = await adminModel.findOne({ email: adminId });
    adminId = adminFound._id;
    
    if (!ticket) {
      return res.status(404).json({ error: 'Ticket not found' });
    }
    
    ticket.lastMessageAt = new Date();
    ticket.status = 'pending'; 
    if (!ticket.assignedAdmin) {
      ticket.assignedAdmin = adminId;
    }
    await ticket.save();
    
    const newMessage = await SupportMessage.create({
      ticketId: ticketId,
      sentBy: 'admin',
      senderId: adminId,
      senderModel: 'admin',
      message: message,
      seenByAdmin: true,
      seenByUser: false
    });
    
   
    
    res.json({ 
      success: true, 
      messageId: newMessage._id,
      userId: ticket.userId._id 
    });
    
  } catch (error) {
    console.log(error.message);
    res.status(500).json({ error: error.message });
  }
});


app.patch('/closeTicket/:ticketId',async(req, res) => {
  const { ticketId } = req.params;
  
  try {
    const ticket = await SupportTicket.findOne({
      _id: ticketId
    });
    
    if (!ticket) {
      return res.status(404).json({ error: 'Ticket not found' });
    }
    
    ticket.status = 'closed';
    await ticket.save();
    
   
    if (typeof io !== 'undefined' && io) {
      io.to('admin-room').emit('ticketClosed', {
        ticketId: ticketId,
        userId: ticket.userId,
        closedAt: new Date()
      });
    }
    
    res.json({ success: true });
  } catch (error) {
    console.log(error.message);
    res.status(500).json({ error: error.message });
  }
})


app.get('/cancelsub',async(req,res)=>{
  try{
    const stripe = require('stripe')(process.env.STRIPE_LIVE);
    const subscription = await stripe.subscriptions.cancel(
      'sub_1SD8BS5uH62846vETzknXRKM'
    );
   
    console.log(subscription)
  }catch(e){
console.log(e.message)
  }
})

app.get('/connect-billcom', async (req, res) => {
    try {
      const loginResponse = await fetch('https://gateway.stage.bill.com/connect/v3/login', {
        method: 'POST',
        headers: {
          'content-type': 'application/json',
          
        },
        body: JSON.stringify({
          username: 'Dawar Dawar',
          password: '6AYdXnaVr&2K7jA=@',
          devKey:"01MSDYSSYQKZDONT3681"
        })
      });
      
      const loginData = await loginResponse.json();
      console.log('Login response:', loginData);
      
    } catch (error) {
      console.error('Error:', error);
      res.status(500).json({ error: 'Server error' });
    }
  });   


  orderCron

  server.listen(process.env.PORT, "0.0.0.0", () => {
    console.log(`Server listening on port ${process.env.PORT}`);
  });
  