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

    idDocuments: [{
        url: { type: String, required: true },
        uploadedAt: { type: Date, default: Date.now },
        status: { type: String, enum: ["Pending", "Approved", "Rejected"], default: "Pending" }
    }],

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

    payoutMethod: {
        bankName: { type: String, default: "" },
        accountName: { type: String, default: "" },
        accountNumber: { type: String, default: "" },
        routingNumber: { type: String, default: "" }
    },

    paymentMethod: {
        cardNumber: { type: String, default: "" },
        expiryDate: { type: String, default: "" },
        cvv: { type: String, default: "" },
        nameOnCard: { type: String, default: "" }
    },

    resetPasswordToken: {
        type: String
    },

    resetPasswordExpires: {
        type: Date
    }

},{timestamps:true})

module.exports = mongoose.model("User",userSchema)