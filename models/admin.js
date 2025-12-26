const mongoose=require('mongoose')
const adminSchema=mongoose.Schema({
    password:{
        type:String
    },
    email:{
        type:String
    }
})



const adminModel=mongoose.model('admin',adminSchema)

module.exports=adminModel