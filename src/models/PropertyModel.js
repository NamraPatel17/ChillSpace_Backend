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

    pricePerNight:{
        type:Number,
        required:true
    },

    amenities:[String],

    images:[String],

    maxGuests:Number,

    rating:{
        type:Number,
        default:0
    },

    availabilityStatus:{
        type:Boolean,
        default:true
    }

},{timestamps:true})