const AdminActivity = require("../models/AdminActivityModel")


// CREATE ACTIVITY LOG
exports.createActivity = async (req,res)=>{
    try{

        const activity = new AdminActivity(req.body)
        const savedActivity = await activity.save()

        res.status(201).json({
            message:"Activity logged",
            data:savedActivity
        })

    }catch(err){
        res.status(500).json({message:err.message})
    }
}


// GET ALL ACTIVITIES
exports.getAllActivities = async (req,res)=>{
    try{

        const activities = await AdminActivity.find()
        .populate("adminId","fullName email")

        res.status(200).json(activities)

    }catch(err){
        res.status(500).json({message:err.message})
    }
}