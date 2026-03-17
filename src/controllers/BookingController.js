const Booking = require("../models/Booking")


// CREATE BOOKING
exports.createBooking = async (req,res)=>{
    try{

        const booking = new Booking(req.body)
        const savedBooking = await booking.save()

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
        }).populate("propertyId")

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