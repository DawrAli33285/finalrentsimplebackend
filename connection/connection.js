const mongoose=require('mongoose')

// let connection=mongoose.connect('mongodb://127.0.0.1/newrent')

// let connection=mongoose.connect('mongodb+srv://dawar:dawar@cluster0.o4ljlqt.mongodb.net')
let connection=mongoose.connect('mongodb+srv://twdnightowl_db_user:m3GTcSuQCLhi7jDL@cluster0.jjj7d4g.mongodb.net')


// let connection=mongoose.connect('mongodb+srv://developer:developer@cluster0.k1ekxcf.mongodb.net/')

// const connection=mongoose.connect(`mongodb+srv://user:user@cluster0.pfn059x.mongodb.net/?retryWrites=true&w=majority&appName=Cluster0`)

module.exports=connection;