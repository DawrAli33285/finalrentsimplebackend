const mongoose = require('mongoose');

const vendorSchema = new mongoose.Schema({
  name: {
    type: String,
    required: [true, 'Vendor name is required'],
    trim: true
  },
  email: {
    type: String,
    required: [true, 'Email is required'],
    unique: true,
    lowercase: true,
    trim: true
  },
  mobile: {
    type: String,
    required: [true, 'Mobile number is required']
  },
  password: {
    type: String,
    required: [true, 'Password is required'],
    minlength: 6,
    select: false
  },
  businessName: {
    type: String,
    trim: true
  },
  businessAddress: {
    street: String,
    city: String,
    state: String,
    zipCode: String,
    country: String
  },
  sucessPopup:{
type:Boolean,
default:false
  },
  subscription: {
    plan: {
      type: String,
      enum: ['free', 'basic', 'pro', 'enterprise'],
      default: 'free'
    },
    status: {
      type: String,
      enum: ['active', 'inactive', 'trial', 'cancelled'],
      default: 'trial'
    },
    startDate: Date,
    endDate: Date,
    stripeCustomerId: String,
    stripeSubscriptionId: String
  },
  stats: {
    totalListings: { type: Number, default: 0 },
    activeListings: { type: Number, default: 0 },
    totalViews: { type: Number, default: 0 },
    totalEngagements: { type: Number, default: 0 },
    totalRevenue: { type: Number, default: 0 }
  },
  boostCredits: {
    type: Number,
    default: 0
  },
  status:{
    type:String,
    enum:['active','inactive'],
    default:'active'
},
  isVerified: {
    type: Boolean,
    default: false
  },
  stripe_account_id: {
    type: String,
    default: null
},
stripe_connect_status:{
  type:Boolean,
  default:false
},
  isActive: {
    type: Boolean,
    default: true
  },
  verificationToken: String,
  resetPasswordToken: String,
  resetPasswordExpire: Date
}, {
  timestamps: true
});


module.exports = mongoose.model('Vendor', vendorSchema);
