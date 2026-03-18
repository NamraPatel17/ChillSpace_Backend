const Property = require("../models/PropertyModel")
const uploadToCloudinary = require("../utils/CloudinaryUtil")

// ADD PROPERTY
exports.addProperty = async (req,res)=>{
    try{
        
        const propertyData = { ...req.body }
        
        // Handle images if they were uploaded
        if (req.files && req.files.length > 0) {
            const imageUrls = []
            for (const file of req.files) {
                const cloudinaryResponse = await uploadToCloudinary(file.path)
                imageUrls.push(cloudinaryResponse.secure_url)
            }
            propertyData.images = imageUrls
        }

        const property = new Property(propertyData)
        const savedProperty = await property.save()

        res.status(201).json({
            message:"Property added successfully",
            data:savedProperty
        })

    }catch(err){
        res.status(500).json({message:err.message})
    }
}


// GET ALL PROPERTIES (with filters)
exports.getAllProperties = async (req,res)=>{
    try{

        const {
            location,
            minPrice,
            maxPrice,
            propertyType,
            amenities,
            minRating
        } = req.query

        const filter = {}

        if(location){
            // case-insensitive partial match on location
            filter.location = { $regex: location, $options: "i" }
        }

        if(propertyType){
            filter.propertyType = propertyType
        }

        if(minRating){
            filter.rating = { $gte: Number(minRating) }
        }

        if(minPrice || maxPrice){
            filter.pricePerNight = {}
            if(minPrice){
                filter.pricePerNight.$gte = Number(minPrice)
            }
            if(maxPrice){
                filter.pricePerNight.$lte = Number(maxPrice)
            }
        }

        if(amenities){
            // amenities can be comma separated string: "WiFi,Pool,Parking"
            const amenityList = Array.isArray(amenities)
                ? amenities
                : amenities.split(",").map(a => a.trim()).filter(Boolean)

            if(amenityList.length){
                filter.amenities = { $all: amenityList }
            }
        }

        const properties = await Property.find(filter)
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