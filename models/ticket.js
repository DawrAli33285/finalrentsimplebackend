const mongoose = require('mongoose');

const supportTicketSchema = new mongoose.Schema({
  // Participant information
  userType: {
    type: String,
    enum: ['user', 'Vendor'], // model names EXACTLY as defined
    required: true
  },
  
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    required: true,
    refPath: 'userType',   // <-- dynamic reference here
    index: true
  },  
  
  // Ticket status
  status: {
    type: String,
    enum: ['open', 'pending', 'resolved', 'closed'],
    default: 'open',
    index: true
  },
  
  // Subject/Title (optional but helpful)
  subject: {
    type: String,
    default: 'Support Request'
  },
  
  // Priority (optional)
  priority: {
    type: String,
    enum: ['low', 'medium', 'high', 'urgent'],
    default: 'medium'
  },
  
  // Assigned admin (optional - for ticket assignment)
  assignedAdmin: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'admin',
    default: null
  },
  
  // Metadata
  lastMessageAt: {
    type: Date,
    default: Date.now,
    index: true
  },
  
  closedAt: {
    type: Date,
    default: null
  }
}, {
  timestamps: true
});

// Compound index for efficient queries
supportTicketSchema.index({ userId: 1, status: 1 });
supportTicketSchema.index({ userType: 1, status: 1 });

const SupportTicket = mongoose.model('SupportTicket', supportTicketSchema);


module.exports = SupportTicket;