const Property = require("../models/Property")

// ADD PROPERTY
exports.addProperty = async (req,res)=>{
    try{

        const property = new Property(req.body)
        const savedProperty = await property.save()

        res.status(201).json({
            message:"Property added successfully",
            data:savedProperty
        })

    }catch(err){
        res.status(500).json({message:err.message})
    }
}


// GET ALL PROPERTIES
exports.getAllProperties = async (req,res)=>{
    try{

        const properties = await Property.find()
        .populate("hostId","fullName email")

        res.status(200).json(properties)

    }catch(err){
        res.status(500).json({message:err.message})
    }
}


// GET PROPERTY BY ID
exports.getPropertyById = async (req,res)=>{
    try{

        const property = await Property.findById(req.params.id)
        .populate("hostId")

        if(!property){
            return res.status(404).json({message:"Property not found"})
        }

        res.status(200).json(property)

    }catch(err){
        res.status(500).json({message:err.message})
    }
}


// UPDATE PROPERTY
exports.updateProperty = async (req,res)=>{
    try{

        const updatedProperty = await Property.findByIdAndUpdate(
            req.params.id,
            req.body,
            {new:true}
        )

        res.status(200).json({
            message:"Property updated",
            data:updatedProperty
        })

    }catch(err){
        res.status(500).json({message:err.message})
    }
}


// DELETE PROPERTY
exports.deleteProperty = async (req,res)=>{
    try{

        await Property.findByIdAndDelete(req.params.id)

        res.status(200).json({
            message:"Property deleted"
        })

    }catch(err){
        res.status(500).json({message:err.message})
    }
}