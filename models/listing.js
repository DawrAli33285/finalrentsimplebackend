const mongoose = require('mongoose');

const listingSchema = new mongoose.Schema({
  vendor: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Vendor',
    required: true
  },
  title: {
    type: String,
    required: [true, 'Listing title is required'],
    trim: true,
    maxlength: 200
  },
  category: {
    type: String,
    required: [true, 'Category is required'],
    enum: ['refrigerator', 'washer', 'dryer', 'dishwasher', 'oven', 'microwave', 'other']
  },
  brand: {
    type: String,
    required: [true, 'Brand is required'],
    trim: true
  },
  condition: {
    type: String,
    required: [true, 'Condition is required'],
    enum: ['New', 'Like New', 'Good', 'Fair']
  },
  pricing: {
    rentPrice: {
      type: Number,
      required: [true, 'Rent price is required'],
      min: 0
    },
    buyPrice: {
      type: Number,
      required: [true, 'Buy price is required'],
      min: 0
    }
  },
  description: {
    type: String,
    required: [true, 'Description is required'],
    maxlength: 2000
  },
  images: [{
    url: String,
    publicId: String,
    isPrimary: Boolean
  }],
  specifications: {
    type: Map,
    of: String
  },
  status: {
    type: String,
    enum: ['draft', 'active', 'inactive', 'rented', 'sold'],
    default: 'draft'
  },
  visibility: {
    isBoosted: {
      type: Boolean,
      default: false
    },
    est_react:Number,
    boostEndDate: Date,
    boostAmount: Number,
    visibilityScore: {
      type: Number,
      default: 0
    }
  },
  engagement: {
    views: { type: Number, default: 0 },
    likes: { type: Number, default: 0 },
    inquiries: { type: Number, default: 0 },
    shares: { type: Number, default: 0 }
  },
  availability: {
    isAvailable: {
      type: Boolean,
      default: true
    },
    availableFrom: Date,
    location: {
      city: String,
      state: String,
      zipCode: String
    }
  },
  publishToFeed: {
    type: Boolean,
    default: false
  },
  pickUpAddress:{
    type:String
  },
  powerType:{
    type:String
  },
  deliveryPrice:{
    type:Number
  },
  installationPrice:{
    type:Number
  },
  warrantyPrice:{
    type:Number
  },
  warranty:{
    type:Boolean,
    default:false
  },
  dimensions:{
    length:String,
    width:String,
    height:String
  }
}, {
  timestamps: true
});


listingSchema.methods.calculateVisibilityScore = function() {
  let score = 50; 
  
  if (this.visibility.isBoosted) {
    score += 35;
  }
  
 
  const engagementScore = Math.min(25, 
    (this.engagement.views / 10) + 
    (this.engagement.likes * 2) + 
    (this.engagement.inquiries * 3)
  );
  score += engagementScore;
  

  if (this.images && this.images.length > 0) score += 5;
  if (this.description && this.description.length > 100) score += 5;
  if (this.specifications && this.specifications.size > 0) score += 5;
  

  if (this.status === 'active') score += 10;
  
  this.visibility.visibilityScore = Math.max(0, Math.min(100, Math.round(score)));
};


module.exports = mongoose.model('Listing', listingSchema);