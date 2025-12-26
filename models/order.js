const mongoose = require('mongoose');

const orderSchema = mongoose.Schema({
    user: {
        type: mongoose.Schema.ObjectId,
        ref: 'user',
        required: true
    },
    vendor: {
        type: mongoose.Schema.ObjectId,
        ref: 'Vendor',
        required: true
    },
    listing: {
        type: mongoose.Schema.ObjectId,
        ref: 'Listing',
        required: true
    },
    request: {
        type: mongoose.Schema.ObjectId,
        ref: 'request',
        required: true
    },
    
   
    deliveryType: {
        type: String,
        required: true
    },
    installationType: {
        type: String,
    },
    deliveryAddress: {
        street: String,
        city: String,
        state: String,
        zipCode: String,
        country: String
    },
    deliveryDate: {
        type: Date,
        required: true
    },
    deliveryTime: {
        type: String,
        required: true
    },
    
   
    monthlyRent: {
        type: Number,
        required: true
    },
    deliveryFee: {
        type: Number,
        default: 60
    },
    serviceFee: {
        type: Number,
        default: 12
    },
    totalAmount: {
        type: Number,
        required: true
    },
    
    
    platformFee: {
        type: Number,
        required: true,
        default: 0
    },
    vendorPayout: {
        type: Number,
        required: true,
        default: 0
    },
    
   
    paymentIntentId: {
        type: String,
        required: true
    },
    paymentStatus: {
        type: String,
        enum: ['paid', 'pending', 'failed', 'refunded'],
        default: 'paid'
    },
    paymentMethod: {
        type: String
    },
    
   
    transferStatus: {
        type: String,
        enum: ['pending', 'completed', 'cancelled', 'failed'],
        default: 'pending'
    },
    transferAmount: {
        type: Number,
        default: 0
    },
    transferId: {
        type: String
    },
    transferDate: {
        type: Date
    },
    
    
    refundId: {
        type: String
    },
    refundAmount: {
        type: Number
    },
    refundDate: {
        type: Date
    },
    refundReason: {
        type: String
    },
    
  
    rejectionReason: {
        type: String
    },
    rejectedAt: {
        type: Date
    },
    rejectedBy: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'user'
    },
    refundStatus: {
        type: String,
        enum: ['none', 'pending', 'processed', 'credited', 'failed'],
        default: 'none'
    },
    platformRetainedAmount: {
        type: Number,
        default: 0
    },
    refundMethod: {
        type: String,
        enum: ['card', 'account_credit', 'none'],
        default: 'none'
    },
    
  
    status: {
        type: String,
        enum: [
            'pending_confirmation',
            'confirmed',
            'processing', 
            'in_transit', 
            'delivered', 
            'active', 
            'paused', 
            'completed', 
            'cancelled',
            'refunded'
        ], 
        default: 'confirmed'
    },
    
    cancelled_reason: {
        type: String
    },
    
  
    rentalStartDate: {
        type: Date
    },
    rentalEndDate: {
        type: Date
    },
    subscriptionId: {
        type: String
    },
    
  
    productImages: {
        type: Object,
        default: {}
    },
    
    
    notes: {
        type: String
    },
    
    
    trackingNumber: {
        type: String
    },
    
    orderNumber: {
        type: String,
        unique: true
    }
    
}, { timestamps: true });


orderSchema.pre('save', async function(next) {
    if (!this.orderNumber) {
        this.orderNumber = 'ORD-' + Date.now() + '-' + Math.floor(Math.random() * 1000);
    }
    next();
});


orderSchema.methods.canReleasePayment = function() {
    return this.transferStatus === 'pending' && 
           this.paymentStatus === 'paid' &&
           this.status !== 'cancelled' &&
           this.status !== 'refunded';
};


orderSchema.methods.canRefund = function() {
    return this.transferStatus === 'pending' && 
           this.paymentStatus === 'paid' &&
           !this.refundId;
};


orderSchema.methods.canReject = function() {
    return (this.status === 'processing' || this.status === 'pending_confirmation') &&
           this.transferStatus === 'pending' &&
           !this.rejectedAt;
};


orderSchema.virtual('vendorPayoutPercentage').get(function() {
    if (!this.totalAmount || this.totalAmount === 0) return 0;
    return ((this.vendorPayout / this.totalAmount) * 100).toFixed(1);
});


orderSchema.virtual('platformFeePercentage').get(function() {
    if (!this.totalAmount || this.totalAmount === 0) return 0;
    return ((this.platformFee / this.totalAmount) * 100).toFixed(1);
});


orderSchema.set('toJSON', { virtuals: true });
orderSchema.set('toObject', { virtuals: true });

const orderModel = mongoose.model('order', orderSchema);

module.exports = orderModel;