const mongoose=require('mongoose')

const supportMessageSchema = new mongoose.Schema({
    // Reference to ticket
    ticketId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'SupportTicket',
      required: true,
      index: true
    },
    
    // Sender information
    sentBy: {
      type: String,
      enum: ['user', 'admin', 'Vendor'], // who sent the message
      required: true
    },
    
    senderId: {
      type: mongoose.Schema.Types.ObjectId,
      required: true,
      refPath: 'senderModel' // Dynamic reference
    },
    
    senderModel: {
      type: String,
      required: true,
      enum: ['user', 'admin', 'Vendor']
    },
    
    // Message content
    message: {
      type: String,
      required: true,
      trim: true
    },
    
    // Message type (for future features)
    messageType: {
      type: String,
      enum: ['text', 'image', 'file', 'system'],
      default: 'text'
    },
    
    // Attachments (optional)
    attachments: [{
      url: String,
      type: String, // 'image', 'pdf', 'document', etc.
      filename: String,
      size: Number
    }],
    
    // Read status
    seenByAdmin: {
      type: Boolean,
      default: false
    },
    
    seenByUser: {
      type: Boolean,
      default: false
    },
    
    seenAt: {
      type: Date,
      default: null
    }
  }, {
    timestamps: true
  });
  
  // Indexes for performance
  supportMessageSchema.index({ ticketId: 1, createdAt: -1 });
  supportMessageSchema.index({ ticketId: 1, seenByAdmin: 1 });
  supportMessageSchema.index({ ticketId: 1, seenByUser: 1 });
  
  const SupportMessage = mongoose.model('SupportMessage', supportMessageSchema);
  module.exports = { SupportMessage };