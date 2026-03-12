const mongoose = require("mongoose")

const adminActivitySchema = new mongoose.Schema({

    adminId:{
        type:mongoose.Schema.Types.ObjectId,
        ref:"User"
    },

    actionType:{
        type:String
    },

    description:{
        type:String
    }

},{timestamps:true})

module.exports = mongoose.model("AdminActivity",adminActivitySchema)