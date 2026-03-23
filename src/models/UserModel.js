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
    },

    bio:{
        type:String,
        default:""
    },

    language:{
        type:String,
        default:"English"
    },

    profilePicture:{
        type:String,
        default:""
    },

    notificationPreferences:{
        email: { type: Boolean, default: true },
        sms: { type: Boolean, default: true },
        bookings: { type: Boolean, default: true },
        reviews: { type: Boolean, default: true },
        marketing: { type: Boolean, default: false }
    },

    resetPasswordToken: {
        type: String
    },

    resetPasswordExpires: {
        type: Date
    }

},{timestamps:true})

module.exports = mongoose.model("User",userSchema)