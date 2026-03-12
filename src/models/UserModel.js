const mongoose = require("mongoose")

const userSchema = new mongoose.Schema({

    fullName:{
        type:String,
        required:true
    },

    email:{
        type:String,
        required:true,
        unique:true
    },

    password:{
        type:String,
        required:true
    },

    phoneNumber:{
        type:String
    },

    role:{
        type:String,
        enum:["Admin","Host","Guest"],
        default:"Guest"
    },

    verificationStatus:{
        type:Boolean,
        default:false
    },

    accountStatus:{
        type:String,
        enum:["Active","Suspended","Deleted"],
        default:"Active"
    }

},{timestamps:true})

module.exports = mongoose.model("User",userSchema)