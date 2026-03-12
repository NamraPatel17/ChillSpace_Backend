const mongoose = require("mongoose")

const propertySchema = new mongoose.Schema({

    hostId:{
        type:mongoose.Schema.Types.ObjectId,
        ref:"User"
    },

    title:{
        type:String,
        required:true
    },

    description:{
        type:String
    },

    propertyType:{
        type:String,
        enum:["Apartment","House","Villa"]
    },

    pricePerNight:{
        type:Number
    },

    availabilityStatus:{
        type:Boolean,
        default:true
    }

},{timestamps:true})

module.exports = mongoose.model("Property",propertySchema)