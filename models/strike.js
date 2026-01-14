const mongoose = require('mongoose')

const strikeSchema = mongoose.Schema({
    vendorId: {
        type: mongoose.Schema.ObjectId,
        ref: 'Vendor'
    },
    orderId: {
        type: mongoose.Schema.ObjectId,
        ref: 'order'
    },
    disposition: {
        type: String
    }
}, { timestamps: true })

const strikeModel = mongoose.model('strike', strikeSchema)  

module.exports = strikeModel