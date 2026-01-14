const mongoose = require('mongoose')

const cartSchema = mongoose.Schema({
    items: {
        type: [{
            type: mongoose.Schema.ObjectId,
            ref: 'Product'
        }],
        default: []
    },
    comboItem: {
        type: [{
            plugType: String,
            plugDescription: String
        }],
        default: [] 
    },
    user: {
        type: mongoose.Schema.ObjectId,
        ref: 'user'
    },
    tvSize:{
type:String
    },
},{timestamps:true})

const cartModel = mongoose.model('cart', cartSchema)

module.exports = cartModel;