const mongoose=require('mongoose')

const requestSchema=mongoose.Schema({
    user:{
        type:mongoose.Schema.ObjectId,
        ref:'user'
    },
    deliveryType:{
type:String
    },
    installationType:{
type:String
    },
    images: [{
        front: String,
        side: String,
        serial_tag: String,
        condition: String
      }],
      approvedByVendor:{
type:Boolean,
default:false
      },

    approvedByUser:{
type:Boolean,
default:false
    },
    vendor:{
        type:mongoose.Schema.ObjectId,
        ref:'Vendor'
    },
    listing:{
type:mongoose.Schema.ObjectId,
ref:'Listing'
    },
    status:{
        type:String,
        enum:['approved','rejected','pending'],
        default:'pending'
    },
    rejectionReason:{
        type:String,
        enum:[
            'Unit No Longer Available',
            'Delivery Location Not Serviceable',
            'Scheduling Conflict',
            'Condition / Maintenance Check Needed',
            'Renter History or Profile Concerns',
            'Incorrect or Incomplete Renter Information',
            'Unit Mis-Listed'
        ]
    },
    deliveryAddress: {
        street: String,
        city: String,
        state: String,
        zipCode: String,
        country: String
    },

    pickUpAddress:{
        type:String
    }
},{timestamps:true})


const requestModel=mongoose.model('request',requestSchema)

module.exports=requestModel