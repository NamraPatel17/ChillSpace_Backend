const mongoose = require("mongoose")

const paymentSchema = new mongoose.Schema({

    bookingId:{
        type:mongoose.Schema.Types.ObjectId,
        ref:"Booking"
    },

    paymentMethod:{
        type:String,
        enum:["Card","Wallet","Bank"]
    },

    transactionId:{
        type:String
    },

    paymentAmount:{
        type:Number
    },

    paymentStatus:{
        type:String,
        enum:["Success","Failed"]
    }

},{timestamps:true})

module.exports = mongoose.model("Payment",paymentSchema)