const mongoose = require('mongoose');

const boostSchema = new mongoose.Schema({
  vendor: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Vendor',
    required: true
  },
  currentViews: { type: Number, default: 0 }, 
    isReachComplete: { type: Boolean, default: false },
  listing: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Listing',
    required: true
  },
  amount: {
    type: Number,
    required: true,
    min: 5
  },
  duration: {
    type: Number,
    required: true,
    min: 1,
    max: 30
  },
  startDate: {
    type: Date,
    default: Date.now
  },
  endDate: {
    type: Date,
    required: true
  },
  est_reach:{
type:Number
  },
  status: {
    type: String,
    enum: ['active', 'completed', 'cancelled'],
    default: 'active'
  },
  results: {
    initialViews: Number,
    currentViews: Number,
    additionalViews: Number,
    initialLikes: Number,
    currentLikes: Number
  },
  
  paymentId: String
}, {
  timestamps: true
});




module.exports = mongoose.model('Boost', boostSchema);