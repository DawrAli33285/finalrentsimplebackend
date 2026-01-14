const mongoose = require('mongoose');

const productSchema = new mongoose.Schema({
  photo: {
    type: String,
    required: true
  },
  monthly_price: {
    type: Number,
    required: true
  },
  combo:{
type:Boolean,
default:false
  },
  comboItem:{
type:String
  },
  key_features: {
    type: [String], 
    default: []     
  },
  stock_status: {
    type: String,
    enum: ['out of stock', 'available'],
    default: 'available'
  },
  name:{
    type:String,
    required:true
    
  }
});


const Product = mongoose.model('Product', productSchema);

module.exports = Product;
