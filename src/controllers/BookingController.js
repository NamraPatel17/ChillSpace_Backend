const Booking = require("../models/BookingModel")
const Property = require("../models/PropertyModel")
const User = require("../models/UserModel")
const mailSend = require("../utils/MailUtil")


// CREATE BOOKING
exports.createBooking = async (req,res)=>{
    try{

        const { propertyId, checkInDate, checkOutDate, totalPrice } = req.body
        const guestId = req.user._id // enforce guest ID from the validated token

        if(!propertyId || !checkInDate || !checkOutDate){
            return res.status(400).json({
                message:"propertyId, checkInDate and checkOutDate are required"
            })
        }

        const checkIn = new Date(checkInDate)
        const checkOut = new Date(checkOutDate)

        if(checkOut <= checkIn){
            return res.status(400).json({
                message:"checkOutDate must be after checkInDate"
            })
        }

        // prevent double bookings: any confirmed booking that overlaps the range
        const overlapping = await Booking.findOne({
            propertyId,
            bookingStatus:"Confirmed",
            $or:[
                {
                    checkInDate:{ $lt: checkOut },
                    checkOutDate:{ $gt: checkIn }
                }
            ]
        })

        if(overlapping){
            return res.status(400).json({
                message:"Property is not available for the selected dates"
            })
        }

        // Also check against host-blocked dates (unavailableDates)
        const property = await Property.findById(propertyId)
        const isBlocked = property.unavailableDates?.some(range => {
            return (checkIn < range.endDate && checkOut > range.startDate)
        })

        if (isBlocked) {
            return res.status(400).json({
                message: "Property is restricted by host for the selected dates"
            })
        }

        const booking = new Booking({
            propertyId,
            guestId,
            hostId: property.hostId, // added hostId reference
            checkInDate:checkIn,
            checkOutDate:checkOut,
            totalPrice
        })

        const savedBooking = await booking.save()

        // Send booking confirmation email to guest
        try {
            const guest = await User.findById(guestId)
            const property = await Property.findById(propertyId)
            if (guest && guest.email) {
                await mailSend(
                    guest.email,
                    "ChillSpace - Booking Confirmation",
                    "BookingConfirmation.html",
                    {
                        guestName: guest.fullName || "Guest",
                        propertyName: property ? property.title : "Your Property",
                        checkIn: checkIn.toDateString(),
                        checkOut: checkOut.toDateString(),
                        totalPrice
                    }
                )
            }
        } catch (mailErr) {
            console.error("Booking email failed (non-critical):", mailErr.message)
        }

        res.status(201).json({
            message:"Booking created successfully",
            data:savedBooking
        })

    }catch(err){
        res.status(500).json({message:err.message})
    }
}


// GET ALL BOOKINGS
exports.getAllBookings = async (req,res)=>{
    try{

        const bookings = await Booking.find()
        .populate("propertyId")
        .populate("guestId","fullName email")
        .populate("hostId", "fullName email")

        res.status(200).json(bookings)

    }catch(err){
        res.status(500).json({message:err.message})
    }
}


// GET BOOKINGS BY USER
exports.getBookingsByGuest = async (req,res)=>{
    try{

        const bookings = await Booking.find({
            guestId:req.params.guestId
        }).populate("propertyId").populate("hostId", "fullName")

        res.status(200).json(bookings)

    }catch(err){
        res.status(500).json({message:err.message})
    }
}


// UPDATE BOOKING STATUS
exports.updateBookingStatus = async (req,res)=>{
    try{

        const booking = await Booking.findByIdAndUpdate(
            req.params.id,
            {bookingStatus:req.body.bookingStatus},
            {new:true}
        )

        res.status(200).json({
            message:"Booking status updated",
            data:booking
        })

    }catch(err){
        res.status(500).json({message:err.message})
    }
}


// CANCEL BOOKING
exports.cancelBooking = async (req,res)=>{
    try{

        const booking = await Booking.findByIdAndUpdate(
            req.params.id,
            {bookingStatus:"Cancelled"},
            {new:true}
        )

        res.status(200).json({
            message:"Booking cancelled",
            data:booking
        })

    }catch(err){
        res.status(500).json({message:err.message})
    }
}