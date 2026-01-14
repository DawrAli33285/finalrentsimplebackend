const mongoose = require('mongoose');

const communityPostSchema = new mongoose.Schema({
  vendor: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Vendor',
    required: true
  },
  type: {
    type: String,
    enum: ['announcement', 'tip', 'update', 'promotion'],
    required: true
  },
  content: {
    type: String,
    required: [true, 'Content is required'],
    maxlength: 5000
  },
  linkedListing: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Listing'
  },
  images: [{
    url: String,
    publicId: String
  }],
  likes: [{
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Vendor',
      required: true
    },
    createdAt: {
      type: Date,
      default: Date.now
    }
  }],
  comments: [{
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Vendor',
      required: true
    },
    text: {
      type: String,
      required: true,
      maxlength: 1000
    },
    createdAt: {
      type: Date,
      default: Date.now
    }
  }],
  engagement: {
    likes: { type: Number, default: 0 },
    comments: { type: Number, default: 0 },
    shares: { type: Number, default: 0 }
  },
  isActive: {
    type: Boolean,
    default: true
  }
}, {
  timestamps: true
});

communityPostSchema.pre('save', function(next) {
  this.engagement.likes = this.likes.length;
  this.engagement.comments = this.comments.length;
  next();
});

module.exports = mongoose.model('CommunityPost', communityPostSchema);