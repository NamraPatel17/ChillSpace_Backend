const mongoose = require("mongoose");

const propertySchema = new mongoose.Schema({

    hostId:{
        type:mongoose.Schema.Types.ObjectId,
        ref:"User",
        required:true
    },

    title:{
        type:String,
        required:true
    },

    description:String,

    propertyType:{
        type:String,
        enum:["Apartment","House","Villa"]
    },

    location:{
        type:String,
        required:true
    },

    street: String,
    city: String,
    country: String,

    pricePerNight:{
        type:Number,
        required:true
    },

    amenities:[String],

    images:[String],

    maxGuests:Number,

    bedrooms: {
        type: Number,
        default: 1
    },

    bathrooms: {
        type: Number,
        default: 1
    },

    rating:{
        type:Number,
        default:0
    },

    availabilityStatus:{
        type:Boolean,
        default:true
    }

},{timestamps:true})

module.exports = mongoose.model("Property", propertySchema);