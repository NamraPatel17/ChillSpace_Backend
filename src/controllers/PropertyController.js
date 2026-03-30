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

        // Process array fields if they arrive as strings
        if (typeof propertyData.houseRules === 'string') {
            try { 
                propertyData.houseRules = JSON.parse(propertyData.houseRules) 
            } catch(e) { 
                // Split by newline or comma if not JSON
                propertyData.houseRules = propertyData.houseRules.split(/[\n,]/).map(r => r.trim()).filter(Boolean)
            }
        }
        if (typeof propertyData.amenities === 'string') {
            try { propertyData.amenities = JSON.parse(propertyData.amenities) } catch(e) { propertyData.amenities = propertyData.amenities.split(',').map(a => a.trim()) }
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
            minRating,
            minBedrooms,
            guests,
            hostId
        } = req.query

        const filter = {}

        if (hostId) {
            filter.hostId = hostId
        }

        if(location){
            // case-insensitive partial match on location
            filter.location = { $regex: location, $options: "i" }
        }

        if(propertyType){
            const typeList = propertyType.split(",").map(t => t.trim()).filter(Boolean)
            if (typeList.length > 0) {
                filter.propertyType = { $in: typeList }
            }
        }

        if(minBedrooms){
            filter.bedrooms = { $gte: Number(minBedrooms) }
        }

        if(guests){
            filter.maxGuests = { $gte: Number(guests) }
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
        .lean()

        // Sync with true reviews count and average rating dynamically
        const Review = require("../models/ReviewModel")
        const allReviews = await Review.find({ reviewType: "property" }).lean()

        const propertiesWithStats = properties.map(property => {
            const propReviews = allReviews.filter(r => r.propertyId && r.propertyId.toString() === property._id.toString())
            if (propReviews.length > 0) {
                const sum = propReviews.reduce((acc, curr) => acc + (curr.rating || 5), 0)
                property.rating = Number((sum / propReviews.length).toFixed(1))
                property.reviewsCount = propReviews.length
            } else {
                property.rating = 0
                property.reviewsCount = 0
            }
            return property
        })

        res.status(200).json(propertiesWithStats)

    }catch(err){
        res.status(500).json({message:err.message})
    }
}


// GET PROPERTY BY ID
exports.getPropertyById = async (req,res)=>{
    try{

        const property = await Property.findById(req.params.id)
        .populate("hostId")
        .lean()

        if(!property){
            return res.status(404).json({message:"Property not found"})
        }

        // Attach computed stats
        const Review = require("../models/ReviewModel")
        const propReviews = await Review.find({ propertyId: req.params.id, reviewType: "property" }).lean()
        if (propReviews.length > 0) {
            const sum = propReviews.reduce((acc, curr) => acc + (curr.rating || 5), 0)
            property.rating = Number((sum / propReviews.length).toFixed(1))
            property.reviewsCount = propReviews.length
        } else {
            property.rating = 0
            property.reviewsCount = 0
        }

        res.status(200).json(property)

    }catch(err){
        res.status(500).json({message:err.message})
    }
}


// UPDATE PROPERTY
exports.updateProperty = async (req,res)=>{
    try{
        const uploadToCloudinary = require("../utils/CloudinaryUtil")

        // keepImages: JSON array of existing image URLs the host wants to keep
        let keepImages = []
        if(req.body.keepImages){
            try { keepImages = JSON.parse(req.body.keepImages) } catch(e){ keepImages = [] }
        }

        // Upload any newly attached files to Cloudinary
        let newImageUrls = []
        if(req.files && req.files.length > 0){
            for(const file of req.files){
                const result = await uploadToCloudinary(file.path)
                newImageUrls.push(result.secure_url)
            }
        }

        const combinedImages = [...keepImages, ...newImageUrls]

        const updateData = { ...req.body }
        delete updateData.keepImages
        if(combinedImages.length > 0){
            updateData.images = combinedImages
        }

        const updatedProperty = await Property.findByIdAndUpdate(
            req.params.id,
            updateData,
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

// GET PROPERTY AVAILABILITY (merged bookings + blocked dates)
exports.getPropertyAvailability = async (req, res) => {
    try {
        const Booking = require("../models/BookingModel")
        const propertyId = req.params.id

        const property = await Property.findById(propertyId)
        if (!property) return res.status(404).json({ message: "Property not found" })

        // 1. Get Confirmed/Pending bookings
        const bookings = await Booking.find({
            propertyId,
            bookingStatus: { $in: ["Confirmed", "Pending"] }
        })

        const bookedRanges = bookings.map(b => ({
            startDate: b.checkInDate,
            endDate: b.checkOutDate,
            type: "booked"
        }))

        // 2. Get Host-Blocked dates
        const blockedRanges = (property.unavailableDates || []).map(r => ({
            startDate: r.startDate,
            endDate: r.endDate,
            type: "blocked",
            reason: r.reason,
            id: r._id
        }))

        res.status(200).json({
            bookedRanges,
            blockedRanges,
            merged: [...bookedRanges, ...blockedRanges]
        })
    } catch (err) {
        res.status(500).json({ message: err.message })
    }
}

// HOST: BLOCK DATES
exports.addPropertyUnavailableRange = async (req, res) => {
    try {
        const { startDate, endDate, reason } = req.body
        const property = await Property.findById(req.params.id)

        if (!property) return res.status(404).json({ message: "Property not found" })
        if (property.hostId.toString() !== req.user._id.toString()) {
            return res.status(403).json({ message: "Unauthorized" })
        }

        property.unavailableDates.push({ startDate, endDate, reason })
        await property.save()

        res.status(200).json({ message: "Dates blocked successfully", data: property.unavailableDates })
    } catch (err) {
        res.status(500).json({ message: err.message })
    }
}

// HOST: UNBLOCK DATES
exports.removePropertyUnavailableRange = async (req, res) => {
    try {
        const { rangeId } = req.params
        const property = await Property.findById(req.params.id)

        if (!property) return res.status(404).json({ message: "Property not found" })
        if (property.hostId.toString() !== req.user._id.toString()) {
            return res.status(403).json({ message: "Unauthorized" })
        }

        property.unavailableDates = property.unavailableDates.filter(r => r._id.toString() !== rangeId)
        await property.save()

        res.status(200).json({ message: "Dates unblocked", data: property.unavailableDates })
    } catch (err) {
        res.status(500).json({ message: err.message })
    }
}

// ADMIN: UPDATE STATUS (Suspend/Activate)
exports.updatePropertyStatus = async (req, res) => {
    try {
        const { status } = req.body // boolean: true (Active), false (Suspended)
        const property = await Property.findByIdAndUpdate(
            req.params.id, 
            { availabilityStatus: status },
            { new: true }
        )
        if (!property) return res.status(404).json({ message: "Property not found" })
        res.status(200).json({ message: `Property ${status ? 'activated' : 'suspended'} successfully`, data: property })
    } catch (err) {
        res.status(500).json({ message: err.message })
    }
}