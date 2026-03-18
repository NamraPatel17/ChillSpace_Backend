const Property = require("../models/PropertyModel")
const Booking = require("../models/BookingModel")

// GET HOST ANALYTICS
exports.getHostAnalytics = async (req, res) => {
    try {
        const hostId = req.user._id

        // Find all properties owned by this host
        const properties = await Property.find({ hostId })
        const propertyIds = properties.map(p => p._id)

        // Find all bookings for these properties
        const bookings = await Booking.find({ propertyId: { $in: propertyIds } })

        const totalBookings = bookings.length
        
        // Calculate Earnings (Only Confirmed or Completed bookings)
        const validBookings = bookings.filter(b => 
            b.bookingStatus === "Confirmed" || b.bookingStatus === "Completed"
        )
        
        let totalEarnings = 0
        validBookings.forEach(booking => {
            // Subtracting an assumed 10% platform fee
            const payout = booking.totalPrice * 0.90
            totalEarnings += payout
        })

        // Simple breakdown by status
        const statusBreakdown = {
            Pending: bookings.filter(b => b.bookingStatus === "Pending").length,
            Confirmed: bookings.filter(b => b.bookingStatus === "Confirmed").length,
            Completed: bookings.filter(b => b.bookingStatus === "Completed").length,
            Cancelled: bookings.filter(b => b.bookingStatus === "Cancelled").length
        }

        res.status(200).json({
            totalProperties: properties.length,
            totalBookings,
            totalEarnings,
            statusBreakdown
        })

    } catch (err) {
        res.status(500).json({ message: err.message })
    }
}
