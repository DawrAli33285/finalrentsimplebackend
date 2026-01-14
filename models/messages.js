const mongoose=require('mongoose')

const messagesSchema=mongoose.Schema({
    user:{
        type:mongoose.Schema.ObjectId,
        ref:'user'
    },
    vendor:{
        type:mongoose.Schema.ObjectId,
        ref:'Vendor'
    },
    message:{
        type:String
    },
    image:{
        type:String
    },
    seenByVendor:{
        type:Boolean,
        default:false
    },
    sendBy:{
type:String,
enum:['vendor','user']
    },
    seenByUser:{
        type:Boolean,
        default:false
    }
},{
    timestamps:true
})

const messageModel=mongoose.model('messages',messagesSchema)

module.exports=messageModel