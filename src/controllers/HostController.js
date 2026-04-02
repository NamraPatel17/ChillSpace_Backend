const Property = require("../models/PropertyModel")
const Booking = require("../models/BookingModel")
const Review = require("../models/ReviewModel")

// GET HOST ANALYTICS
exports.getHostAnalytics = async (req, res) => {
    try {
        const hostId = req.user._id

        // Find all properties owned by this host
        const properties = await Property.find({ hostId })
        const propertyIds = properties.map(p => p._id)
        
        // Auto-complete confirmed bookings that are past checkout date
        await Booking.updateMany(
            { propertyId: { $in: propertyIds }, bookingStatus: "Confirmed", checkOutDate: { $lt: new Date() } },
            { bookingStatus: "Completed" }
        )

        // Find all bookings for these properties, sorted by newest first
        const bookings = await Booking.find({ propertyId: { $in: propertyIds } })
            .sort({ createdAt: -1 })
            .populate("propertyId", "title")
            .populate("guestId", "fullName")

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

        const recentBookings = bookings.slice(0, 5).map(b => ({
            id: b._id,
            property: b.propertyId ? b.propertyId.title : "Unknown Property",
            guest: b.guestId ? b.guestId.fullName : "Unknown Guest",
            checkIn: new Date(b.checkInDate).toLocaleDateString(),
            checkOut: new Date(b.checkOutDate).toLocaleDateString(),
            amount: `$${b.totalPrice}`,
            status: b.bookingStatus
        }))

        res.status(200).json({
            totalProperties: properties.length,
            totalBookings,
            totalEarnings,
            statusBreakdown,
            recentBookings
        })

    } catch (err) {
        res.status(500).json({ message: err.message })
    }
}

// GET ALL HOST BOOKINGS
exports.getHostBookings = async (req, res) => {
    try {
        const hostId = req.user._id

        // Find all properties owned by this host
        const properties = await Property.find({ hostId })
        const propertyIds = properties.map(p => p._id)
        
        // Auto-complete confirmed bookings that are past checkout date
        await Booking.updateMany(
            { propertyId: { $in: propertyIds }, bookingStatus: "Confirmed", checkOutDate: { $lt: new Date() } },
            { bookingStatus: "Completed" }
        )

        // Find all bookings for these properties, sorted by newest check-in
        const bookings = await Booking.find({ propertyId: { $in: propertyIds } })
            .sort({ checkInDate: -1 })
            .populate("propertyId", "title")
            .populate("guestId", "fullName email profilePicture verificationStatus")

        // Pre-fetch all reviews written by this host to determine which guests have been rated
        const hostReviews = await Review.find({ hostReviewer: hostId, reviewType: "guest" })
        const reviewedBookingIds = new Set(hostReviews.map(r => r.bookingId?.toString()))

        const formattedBookings = bookings.map(b => ({
            id: b._id,
            property: b.propertyId ? b.propertyId.title : "Unknown Property",
            guest: b.guestId ? b.guestId.fullName : "Unknown Guest",
            email: b.guestId ? b.guestId.email : "Unknown Email",
            checkIn: new Date(b.checkInDate).toLocaleDateString(),
            checkOut: new Date(b.checkOutDate).toLocaleDateString(),
            nights: Math.ceil((new Date(b.checkOutDate) - new Date(b.checkInDate)) / (1000 * 60 * 60 * 24)),
            amount: `$${b.totalPrice}`,
            status: b.bookingStatus,
            isRatedByHost: reviewedBookingIds.has(b._id.toString()),
            guestVerified: b.guestId?.verificationStatus || false
        }))

        // Stats to power the top of the bookings page
        const stats = {
            total: bookings.length,
            confirmed: bookings.filter(b => b.bookingStatus === "Confirmed").length,
            pending: bookings.filter(b => b.bookingStatus === "Pending").length,
            cancelled: bookings.filter(b => b.bookingStatus === "Cancelled").length,
            completed: bookings.filter(b => b.bookingStatus === "Completed").length
        }

        res.status(200).json({ bookings: formattedBookings, stats })

    } catch (err) {
        res.status(500).json({ message: err.message })
    }
}

// GET HOST EARNINGS
exports.getHostEarnings = async (req, res) => {
    try {
        const hostId = req.user._id

        // Find all properties owned by this host
        const properties = await Property.find({ hostId })
        const propertyIds = properties.map(p => p._id)

        // Find all bookings for these properties, newest check-outs first
        const bookings = await Booking.find({ propertyId: { $in: propertyIds } })
            .sort({ checkOutDate: -1 })
            .populate("propertyId", "title")
            .populate("guestId", "fullName email")

        let totalEarnings = 0
        let thisMonthEarnings = 0
        let thisMonthBookingsCount = 0
        let pendingPayouts = 0

        const currentDate = new Date()
        const currentMonth = currentDate.getMonth()
        const currentYear = currentDate.getFullYear()

        const transactions = []
        
        // Prepare monthly earnings chart logic
        const monthlyData = {}
        const monthNames = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"]

        bookings.forEach(b => {
            const date = new Date(b.createdAt)
            const payout = b.totalPrice * 0.90 // 10% platform fee abstraction

            if (b.bookingStatus === "Completed") {
                totalEarnings += payout
                
                // Track monthly earnings for chart (Completed only)
                const monthName = monthNames[date.getMonth()]
                if (!monthlyData[monthName]) monthlyData[monthName] = 0
                monthlyData[monthName] += payout
                
                // Track this month's earnings AND bookings
                if (date.getMonth() === currentMonth && date.getFullYear() === currentYear) {
                    thisMonthEarnings += payout
                    thisMonthBookingsCount++
                }

                // Add to transactions history
                transactions.push({
                    id: b._id.toString().slice(-6),
                    date: date.toLocaleDateString(),
                    property: b.propertyId ? b.propertyId.title : "Unknown",
                    guest: b.guestId ? b.guestId.fullName : "Unknown",
                    amount: `$${payout}`,
                    status: "Completed"
                })

            } else if (b.bookingStatus === "Confirmed" || b.bookingStatus === "Pending") {
                pendingPayouts += payout

                // Add to transactions history
                transactions.push({
                    id: b._id.toString().slice(-6),
                    date: date.toLocaleDateString(),
                    property: b.propertyId ? b.propertyId.title : "Unknown",
                    guest: b.guestId ? b.guestId.fullName : "Unknown",
                    amount: `$${payout}`,
                    status: "Pending"
                })
            }
        })

        const averagePerBooking = totalEarnings > 0 && transactions.length > 0 
            ? Math.round(totalEarnings / transactions.filter(t => t.status !== "Cancelled").length) 
            : 0

        // Parse monthlyData into Chart array e.g [{month: 'Jan', amount: 100}]
        const earningsChart = Object.keys(monthlyData).map(m => ({
            month: m,
            amount: monthlyData[m]
        }))

        res.status(200).json({
            totalEarnings,
            thisMonthEarnings,
            thisMonthBookingsCount,
            pendingPayouts,
            pendingCount: transactions.filter(t => t.status === "Pending").length,
            averagePerBooking,
            earningsChart,
            transactions: transactions.slice(0, 10) // top 10 most recent
        })

    } catch (err) {
        res.status(500).json({ message: err.message })
    }
}

// GET HOST PROPERTIES (With Stats)
exports.getHostProperties = async (req, res) => {
    try {
        const hostId = req.user._id

        const properties = await Property.find({ hostId }).sort({ createdAt: -1 })
        
        const propertyIds = properties.map(p => p._id)
        const Review = require("../models/ReviewModel")
        const allReviews = await Review.find({ propertyId: { $in: propertyIds }, reviewType: "property" }).lean()

        const propertiesWithStats = await Promise.all(properties.map(async (p) => {
            const bookingsCount = await Booking.countDocuments({ propertyId: p._id, bookingStatus: { $in: ["Confirmed", "Completed", "Pending"] } })
            
            const propReviews = allReviews.filter(r => r.propertyId && r.propertyId.toString() === p._id.toString())
            let calculatedRating = 0
            if (propReviews.length > 0) {
                const sum = propReviews.reduce((acc, curr) => acc + (curr.rating || 5), 0)
                calculatedRating = Number((sum / propReviews.length).toFixed(1))
            } else {
                calculatedRating = 0
            }

            return {
                id: p._id,
                name: p.title,
                location: p.location,
                image: p.images && p.images.length > 0 ? p.images[0] : "https://images.unsplash.com/photo-1542718610-a1d656d1884c?w=400",
                price: `$${p.pricePerNight}`,
                status: p.availabilityStatus ? "Active" : "Inactive",
                bookings: bookingsCount,
                rating: calculatedRating,
                views: Math.floor(Math.random() * 300) + 50 // mock views since we don't track page hits yet
            }
        }))

        res.status(200).json(propertiesWithStats)

    } catch (err) {
        res.status(500).json({ message: err.message })
    }
}

// GET HOST REVIEWS

exports.getHostReviews = async (req, res) => {
    try {
        const hostId = req.user._id

        // Find all properties owned by host
        const properties = await Property.find({ hostId })
        const propertyIds = properties.map(p => p._id)

        // Find all reviews for these properties, excluding host-written guest reviews
        const reviews = await Review.find({ 
            propertyId: { $in: propertyIds },
            $or: [{ reviewType: "property" }, { reviewType: { $exists: false } }]
        })
            .sort({ createdAt: -1 })
            .populate("propertyId", "title")
            .populate("guestId", "fullName profilePicture")

        let totalScore = 0
        const stats = {
            totalReviews: reviews.length,
            fiveStars: 0,
            fourStars: 0,
            threeStars: 0,
            twoStars: 0,
            oneStars: 0
        }

        const mappedReviews = reviews.map(r => {
            const rating = r.rating || 0
            totalScore += rating

            if (rating === 5) stats.fiveStars++
            else if (rating === 4) stats.fourStars++
            else if (rating === 3) stats.threeStars++
            else if (rating === 2) stats.twoStars++
            else if (rating >= 1) stats.oneStars++

            return {
                id: r._id,
                property: r.propertyId ? r.propertyId.title : "Unknown Property",
                guest: r.guestId ? r.guestId.fullName : "Unknown Guest",
                guestPicture: r.guestId ? r.guestId.profilePicture || "" : "",
                rating: rating,
                date: new Date(r.createdAt).toLocaleDateString(),
                comment: r.reviewText,
                response: r.hostResponse
            }
        })

        stats.averageRating = stats.totalReviews > 0 ? (totalScore / stats.totalReviews).toFixed(1) : 0

        res.status(200).json({ stats, reviews: mappedReviews })

    } catch (err) {
        res.status(500).json({ message: err.message })
    }
}
