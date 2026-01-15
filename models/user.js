const mongoose=require('mongoose')

const userSchema=mongoose.Schema({
    name:{
        type:String,
        required:true
    },
    email:{
        type:String,
        required:true
    },
    stripe_customer_id: {
        type: String,
        default: null
    },
    paymentMethodToken: {
        type: String
    },
mobile:{
    type:String,
    required:true
},
password:{
    type:String,
    required:true
},

customerId:{
    type:String
},
billingPaused:{
    type:Boolean,
    default:false
},
deletedUser:{
    type:Boolean,
    default:false
},
credit: {
    type: Number,  
    default: 0
},
status:{
    type:String,
    enum:['active','inactive'],
    default:'active'
},
deliveryAddress:{
    type:String
}
},{
    timestamps:true
})


const userModel=mongoose.model("user",userSchema)

module.exports=userModel