const User = require("../models/UserModel")
const Property = require("../models/PropertyModel")
const Booking = require("../models/BookingModel")
const Review = require("../models/ReviewModel")
const AdminActivity = require("../models/AdminActivityModel")
const Verification = require("../models/VerificationModel")

// PRIVATE HELPER — silently log an admin action
const logActivity = async (adminId, actionType, description) => {
    try {
        await AdminActivity.create({ adminId, actionType, description })
    } catch (_) { /* non-blocking — never fail a request due to logging */ }
}

// CREATE ACTIVITY LOG
exports.createActivity = async (req,res)=>{
    try{
        const activity = new AdminActivity(req.body)
        const savedActivity = await activity.save()
        res.status(201).json({ message:"Activity logged", data:savedActivity })
    }catch(err){
        res.status(500).json({message:err.message})
    }
}

// GET ALL ACTIVITIES
exports.getAllActivities = async (req,res)=>{
    try{
        const activities = await AdminActivity.find()
            .populate("adminId","fullName email")
            .sort({ createdAt: -1 })
        res.status(200).json(activities)
    }catch(err){
        res.status(500).json({message:err.message})
    }
}

exports.getAdminAnalytics = async (req, res) => {
    try {
        // 1. Basic Counts
        const totalUsers = await User.countDocuments({})
        
        // Auto-complete confirmed bookings that are past checkout date
        await Booking.updateMany(
            { bookingStatus: "Confirmed", checkOutDate: { $lt: new Date() } },
            { bookingStatus: "Completed" }
        )

        const activeListings = await Property.countDocuments({ availabilityStatus: true })
        const allBookings = await Booking.find()

        const totalBookings   = allBookings.length
        const confirmedCount  = allBookings.filter(b => b.bookingStatus === "Confirmed").length
        const pendingCount    = allBookings.filter(b => b.bookingStatus === "Pending").length
        const cancelledCount  = allBookings.filter(b => b.bookingStatus === "Cancelled").length
        const completedCount  = allBookings.filter(b => b.bookingStatus === "Completed").length

        // 2. Revenue – confirmed + completed only
        const revenue = allBookings
            .filter(b => b.bookingStatus === "Confirmed" || b.bookingStatus === "Completed")
            .reduce((sum, b) => sum + (b.totalPrice || 0), 0)

        // 3. Occupancy rate (active bookings ÷ total)
        const occupancyRate = totalBookings > 0
            ? Math.round(((confirmedCount + completedCount) / totalBookings) * 100)
            : 0

        // 4. Avg rating – property reviews only
        const propertyReviews = await Review.find({
            $or: [{ reviewType: "property" }, { reviewType: { $exists: false } }]
        })
        let avgRating = "0.0"
        if (propertyReviews.length > 0) {
            const sum = propertyReviews.reduce((acc, r) => acc + (r.rating || 0), 0)
            avgRating = (sum / propertyReviews.length).toFixed(1)
        }

        // 5. Recent Activity
        const recentBookings    = await Booking.find().sort({ createdAt: -1 }).limit(5).populate("guestId", "fullName").populate("propertyId", "title")
        const recentProperties  = await Property.find().sort({ createdAt: -1 }).limit(5).populate("hostId", "fullName")
        const recentReviews     = await Review.find({ $or: [{ reviewType: "property" }, { reviewType: { $exists: false } }] }).sort({ createdAt: -1 }).limit(5).populate("guestId", "fullName").populate("propertyId", "title")

        let activities = []

        recentBookings.forEach(b => {
            activities.push({
                user: b.guestId?.fullName || "Unknown Guest",
                action: "Made a booking",
                property: b.propertyId?.title || "Unknown Property",
                date: b.createdAt
            })
        })
        recentProperties.forEach(p => {
            activities.push({
                user: p.hostId?.fullName || "Unknown Host",
                action: "Listed a new property",
                property: p.title,
                date: p.createdAt
            })
        })
        recentReviews.forEach(r => {
            activities.push({
                user: r.guestId?.fullName || "Unknown Guest",
                action: "Left a review",
                property: r.propertyId?.title || "Unknown Property",
                date: r.createdAt
            })
        })

        activities.sort((a, b) => new Date(b.date) - new Date(a.date))
        activities = activities.slice(0, 8).map(a => {
            const diffMins  = Math.floor((new Date() - new Date(a.date)) / (1000 * 60))
            const diffHours = Math.floor(diffMins / 60)
            const diffDays  = Math.floor(diffHours / 24)
            const timeStr   = diffMins < 1 ? "Just now"
                            : diffMins < 60 ? `${diffMins}m ago`
                            : diffHours < 24 ? `${diffHours}h ago`
                            : `${diffDays}d ago`
            return { user: a.user, action: a.action, property: a.property, time: timeStr }
        })

        res.status(200).json({
            stats: { totalUsers, activeListings, totalBookings, revenue },
            bookingBreakdown: { confirmed: confirmedCount, pending: pendingCount, cancelled: cancelledCount, completed: completedCount },
            performance: {
                satisfaction: avgRating,
                occupancy: occupancyRate,
                responseTime: 2.3,
                revenueGrowth: 18.7
            },
            recentActivity: activities
        })

    } catch (err) {
        res.status(500).json({ message: err.message })
    }
}

// GET ALL BOOKINGS (ADMIN)
exports.getAllBookings = async (req, res) => {
    try {
        // Auto-complete confirmed bookings that are past checkout date
        await Booking.updateMany(
            { bookingStatus: "Confirmed", checkOutDate: { $lt: new Date() } },
            { bookingStatus: "Completed" }
        )

        const bookings = await Booking.find()
            .populate("guestId", "fullName email")
            .populate("propertyId", "title location")
            .sort({ createdAt: -1 });

        const stats = {
            total: bookings.length,
            confirmed: bookings.filter(b => b.bookingStatus === 'Confirmed').length,
            pending: bookings.filter(b => b.bookingStatus === 'Pending').length,
            cancelled: bookings.filter(b => b.bookingStatus === 'Cancelled').length,
            completed: bookings.filter(b => b.bookingStatus === 'Completed').length,
        };

        res.status(200).json({ bookings, stats });
    } catch (err) {
        res.status(500).json({ message: err.message });
    }
}

// GET ALL DISPUTES (ADMIN)
exports.getAllDisputes = async (req, res) => {
    try {
        // Return mock data until the Dispute model is fully formalized
        const disputes = [
            {
                id: "DSP-001",
                guest: "John Doe",
                host: "Sarah Wilson",
                property: "Beach Villa in Malibu",
                issue: "Property condition doesn't match listing",
                status: "pending",
                priority: "high",
                date: "March 15, 2026",
                description: "Guest reported that the property was not as clean as advertised.",
            },
            {
                id: "DSP-002",
                guest: "Emily Chen",
                host: "Mike Brown",
                property: "Downtown Loft in NYC",
                issue: "Cancellation refund dispute",
                status: "in-progress",
                priority: "medium",
                date: "March 14, 2026",
                description: "Host cancelled last minute, guest requesting full refund plus compensation.",
            },
            {
                id: "DSP-003",
                guest: "David Lee",
                host: "Anna Taylor",
                property: "Mountain Cabin in Aspen",
                issue: "Missing amenities",
                status: "resolved",
                priority: "low",
                date: "March 12, 2026",
                description: "Hot tub was not functional during stay.",
            },
            {
                id: "DSP-004",
                guest: "Maria Garcia",
                host: "Tom Anderson",
                property: "Lakeside Cottage",
                issue: "Noise complaint",
                status: "pending",
                priority: "medium",
                date: "March 16, 2026",
                description: "Neighbors complained about excessive noise from guests.",
            },
            {
                id: "DSP-005",
                guest: "James Wilson",
                host: "Lisa Chen",
                property: "City Apartment in LA",
                issue: "Damage claim dispute",
                status: "in-progress",
                priority: "high",
                date: "March 13, 2026",
                description: "Host claims damages, guest denies responsibility.",
            }
        ];

        const stats = {
            pending: disputes.filter(d => d.status === "pending").length,
            inProgress: disputes.filter(d => d.status === "in-progress").length,
            resolved: disputes.filter(d => d.status === "resolved").length
        };

        res.status(200).json({ disputes, stats });
    } catch (err) {
        res.status(500).json({ message: err.message });
    }
}

// GET ALL PAYMENTS (ADMIN)
exports.getAllPayments = async (req, res) => {
    try {
        const bookings = await Booking.find()
            .populate("guestId", "fullName email")
            .populate({
                path: 'propertyId',
                populate: { path: 'hostId', select: 'fullName' }
            })
            .sort({ createdAt: -1 });

        let totalRevenue = 0;
        let platformFees = 0;
        let hostPayouts = 0;
        let processing = 0;

        const transactions = bookings.map(b => {
            const amount = b.totalPrice || 0;
            const fee = amount * 0.10; // Platform 10% fee assumption
            const payout = amount * 0.90;

            if (b.bookingStatus === 'Confirmed' || b.bookingStatus === 'Completed') {
                totalRevenue += amount;
                platformFees += fee;
                hostPayouts += payout;
            } else if (b.bookingStatus === 'Pending') {
                processing += amount;
            }
            // Cancelled bookings: don't add to any sum

            const txStatus =
                b.bookingStatus === 'Confirmed' || b.bookingStatus === 'Completed' ? 'Completed' :
                b.bookingStatus === 'Cancelled' ? 'Cancelled' :
                'Processing';

            return {
                id: "TX-" + b._id.toString().substring(b._id.toString().length - 8).toUpperCase(),
                date: new Date(b.createdAt).toLocaleDateString('en-GB'),
                guest: b.guestId?.fullName || "Unknown",
                host: b.propertyId?.hostId?.fullName || "Unknown Host",
                property: b.propertyId?.title || "Unknown Property",
                amount: amount,
                platformFee: fee,
                hostPayout: payout,
                status: txStatus
            };
        });

        // Compute top earning hosts
        const hostEarnings = {};
        bookings.forEach(b => {
            if (b.bookingStatus === 'Confirmed' || b.bookingStatus === 'Completed') {
                const hostName = b.propertyId?.hostId?.fullName || "Unknown Host";
                if (!hostEarnings[hostName]) {
                    hostEarnings[hostName] = { name: hostName, earnings: 0, properties: new Set() };
                }
                hostEarnings[hostName].earnings += (b.totalPrice || 0) * 0.90;
                if (b.propertyId?._id) {
                    hostEarnings[hostName].properties.add(b.propertyId._id.toString());
                }
            }
        });

        const topHosts = Object.values(hostEarnings)
            .map(h => ({ name: h.name, earnings: h.earnings, properties: h.properties.size }))
            .sort((a, b) => b.earnings - a.earnings)
            .slice(0, 4);

        const stats = {
            totalRevenue,
            platformFees,
            hostPayouts,
            processing
        };

        res.status(200).json({ transactions, stats, topHosts });
    } catch (err) {
        res.status(500).json({ message: err.message });
    }
}

// GET ALL PROPERTIES (ADMIN)
exports.getAllProperties = async (req, res) => {
    try {
        const properties = await Property.find()
            .populate("hostId", "fullName email")
            .sort({ createdAt: -1 });

        // Efficiently load relationships to avoid N+1 queries
        const bookings = await Booking.find({}, "propertyId");
        const bookingCounts = {};
        bookings.forEach(b => {
            const pId = b.propertyId?.toString();
            if (pId) {
                bookingCounts[pId] = (bookingCounts[pId] || 0) + 1;
            }
        });

        const reviews = await Review.find({}, "propertyId rating");
        const reviewStats = {};
        reviews.forEach(r => {
            const pId = r.propertyId?.toString();
            if (pId && r.rating) {
                if (!reviewStats[pId]) reviewStats[pId] = { sum: 0, count: 0 };
                reviewStats[pId].sum += r.rating;
                reviewStats[pId].count += 1;
            }
        });

        let activeCount = 0;
        let underReviewCount = 0;

        const formattedProperties = properties.map(p => {
            if (p.availabilityStatus) {
                activeCount++;
            } else {
                underReviewCount++;
            }

            const pIdStr = p._id.toString();
            const ratingObj = reviewStats[pIdStr];
            const rating = ratingObj ? (ratingObj.sum / ratingObj.count).toFixed(1) : "New";

            return {
                id: p._id,
                title: p.title,
                host: p.hostId?.fullName || "Unknown",
                location: p.location,
                price: "₹" + p.pricePerNight + "/night",
                rating: rating,
                status: p.availabilityStatus ? "Active" : "Under Review",
                bookings: bookingCounts[pIdStr] || 0,
                image: p.images && p.images.length > 0 ? p.images[0] : null
            };
        });

        const stats = {
            total: properties.length,
            active: activeCount,
            underReview: underReviewCount
        };

        res.status(200).json({ properties: formattedProperties, stats });
    } catch (err) {
        res.status(500).json({ message: err.message });
    }
}

// GET ALL REVIEWS (ADMIN)
exports.getAllReviews = async (req, res) => {
    try {
        const reviews = await Review.find()
            .populate("guestId", "fullName profilePicture")
            .populate("hostReviewer", "fullName profilePicture")
            .populate({
                path: "propertyId",
                select: "title hostId",
                populate: { path: "hostId", select: "fullName" }
            })
            .sort({ createdAt: -1 });

        let totalPoints = 0;
        let fiveStarCount = 0;
        const distMap = { 5: 0, 4: 0, 3: 0, 2: 0, 1: 0 };

        const propertyReviews = reviews.filter(r => r.reviewType === "property" || !r.reviewType);
        const guestReviews    = reviews.filter(r => r.reviewType === "guest");

        const formattedPropertyReviews = propertyReviews.map(r => {
            const rating = r.rating || 0;
            totalPoints += rating;
            if (rating === 5) fiveStarCount++;
            const bucket = Math.round(rating);
            if (bucket >= 1 && bucket <= 5) distMap[bucket]++;
            return {
                id: r._id,
                guest: r.guestId?.fullName || "Unknown Guest",
                guestPicture: r.guestId?.profilePicture || "",
                host: r.propertyId?.hostId?.fullName || "Unknown Host",
                property: r.propertyId?.title || "Unknown Property",
                rating,
                reviewText: r.reviewText || "",
                date: new Date(r.createdAt).toLocaleDateString('en-GB'),
                verified: true
            };
        });

        const formattedGuestReviews = guestReviews.map(r => ({
            id: r._id,
            reviewer: r.hostReviewer?.fullName || "Unknown Host",
            reviewerPicture: r.hostReviewer?.profilePicture || "",
            guest: r.guestId?.fullName || "Unknown Guest",
            guestPicture: r.guestId?.profilePicture || "",
            property: r.propertyId?.title || "Unknown Property",
            rating: r.rating || 0,
            reviewText: r.reviewText || "",
            date: new Date(r.createdAt).toLocaleDateString('en-GB'),
        }));

        const total = propertyReviews.length;
        const averageRating = total > 0 ? (totalPoints / total).toFixed(1) : "0.0";

        const distribution = [
            { stars: 5, count: distMap[5], percentage: total > 0 ? Math.round((distMap[5] / total) * 100) : 0 },
            { stars: 4, count: distMap[4], percentage: total > 0 ? Math.round((distMap[4] / total) * 100) : 0 },
            { stars: 3, count: distMap[3], percentage: total > 0 ? Math.round((distMap[3] / total) * 100) : 0 },
            { stars: 2, count: distMap[2], percentage: total > 0 ? Math.round((distMap[2] / total) * 100) : 0 },
            { stars: 1, count: distMap[1], percentage: total > 0 ? Math.round((distMap[1] / total) * 100) : 0 },
        ];

        // Guest review distribution
        const guestDistMap = { 5: 0, 4: 0, 3: 0, 2: 0, 1: 0 };
        let guestFiveStarCount = 0;
        let guestTotalPoints = 0;
        guestReviews.forEach(r => {
            const rating = r.rating || 0;
            guestTotalPoints += rating;
            if (rating === 5) guestFiveStarCount++;
            const bucket = Math.round(rating);
            if (bucket >= 1 && bucket <= 5) guestDistMap[bucket]++;
        });
        const guestTotal = guestReviews.length;
        const guestAvgRating = guestTotal > 0 ? (guestTotalPoints / guestTotal).toFixed(1) : "0.0";
        const guestDistribution = [
            { stars: 5, count: guestDistMap[5], percentage: guestTotal > 0 ? Math.round((guestDistMap[5] / guestTotal) * 100) : 0 },
            { stars: 4, count: guestDistMap[4], percentage: guestTotal > 0 ? Math.round((guestDistMap[4] / guestTotal) * 100) : 0 },
            { stars: 3, count: guestDistMap[3], percentage: guestTotal > 0 ? Math.round((guestDistMap[3] / guestTotal) * 100) : 0 },
            { stars: 2, count: guestDistMap[2], percentage: guestTotal > 0 ? Math.round((guestDistMap[2] / guestTotal) * 100) : 0 },
            { stars: 1, count: guestDistMap[1], percentage: guestTotal > 0 ? Math.round((guestDistMap[1] / guestTotal) * 100) : 0 },
        ];

        const stats = { total, averageRating, fiveStar: fiveStarCount, verified: total, guestAvgRating, guestFiveStar: guestFiveStarCount };

        res.status(200).json({ reviews: formattedPropertyReviews, guestReviews: formattedGuestReviews, stats, distribution, guestDistribution });
    } catch (err) {
        res.status(500).json({ message: err.message });
    }
}

// DELETE REVIEW (ADMIN)
exports.deleteReview = async (req, res) => {
    try {
        const { id } = req.params;
        const review = await Review.findByIdAndDelete(id);
        if (!review) return res.status(404).json({ message: "Review not found" });
        res.status(200).json({ message: "Review deleted successfully" });
    } catch (err) {
        res.status(500).json({ message: err.message });
    }
}

// GET ALL USERS (ADMIN)
exports.getAllUsers = async (req, res) => {
    try {
        const users = await User.find({}).sort({ createdAt: -1 });

        // Efficiently load relationships to avoid N+1 queries
        // Group properties by host
        const properties = await Property.find({}, "hostId");
        const propertyCounts = {};
        properties.forEach(p => {
            const hId = p.hostId?.toString();
            if (hId) {
                propertyCounts[hId] = (propertyCounts[hId] || 0) + 1;
            }
        });

        // Group bookings by guest
        const bookings = await Booking.find({}, "guestId");
        const bookingCounts = {};
        bookings.forEach(b => {
            const gId = b.guestId?.toString();
            if (gId) {
                bookingCounts[gId] = (bookingCounts[gId] || 0) + 1;
            }
        });

        let activeHosts = 0;
        let suspendedCount = 0;

        const formattedUsers = users.map(u => {
            if (u.role === "Host" && u.accountStatus !== "Suspended") activeHosts++;
            if (u.accountStatus === "Suspended") suspendedCount++;
            const uIdStr = u._id.toString();

            return {
                id: uIdStr,
                name: u.fullName || "Unknown",
                email: u.email,
                role: u.role,
                status: u.accountStatus || "Active",
                verified: u.verificationStatus || false,
                properties: propertyCounts[uIdStr] || 0,
                bookings: bookingCounts[uIdStr] || 0,
                joined: new Date(u.createdAt).toLocaleDateString('en-GB')
            };
        });

        const stats = {
            total: users.length,
            activeHosts: activeHosts,
            suspended: suspendedCount
        };

        res.status(200).json({ users: formattedUsers, stats });
    } catch (err) {
        res.status(500).json({ message: err.message });
    }
}

// VERIFY USER (ADMIN)
exports.verifyUser = async (req, res) => {
    try {
        const { id } = req.params;
        const user = await User.findByIdAndUpdate(id, { verificationStatus: true }, { new: true });
        if (!user) return res.status(404).json({ message: "User not found" });
        res.status(200).json({ message: "User verified successfully", user });
    } catch (err) {
        res.status(500).json({ message: err.message });
    }
}

// SUSPEND USER (ADMIN)
exports.suspendUser = async (req, res) => {
    try {
        const { id } = req.params;
        const user = await User.findByIdAndUpdate(id, { accountStatus: "Suspended" }, { new: true });
        if (!user) return res.status(404).json({ message: "User not found" });
        await logActivity(req.user._id, "SUSPEND_USER", `Suspended user: ${user.fullName} (${user.email})`);
        res.status(200).json({ message: "User suspended successfully", user });
    } catch (err) {
        res.status(500).json({ message: err.message });
    }
}

// UNSUSPEND USER (ADMIN)
exports.unsuspendUser = async (req, res) => {
    try {
        const { id } = req.params;
        const user = await User.findByIdAndUpdate(id, { accountStatus: "Active" }, { new: true });
        if (!user) return res.status(404).json({ message: "User not found" });
        await logActivity(req.user._id, "UNSUSPEND_USER", `Reactivated user: ${user.fullName} (${user.email})`);
        res.status(200).json({ message: "User reactivated successfully", user });
    } catch (err) {
        res.status(500).json({ message: err.message });
    }
}

// DELETE USER (ADMIN)
exports.deleteUser = async (req, res) => {
    try {
        const { id } = req.params;
        const user = await User.findByIdAndDelete(id);
        if (!user) return res.status(404).json({ message: "User not found" });
        await logActivity(req.user._id, "DELETE_USER", `Deleted user: ${user.fullName} (${user.email})`);
        res.status(200).json({ message: "User deleted successfully", user });
    } catch (err) {
        res.status(500).json({ message: err.message });
    }
}

// UPDATE BOOKING STATUS (ADMIN)
exports.updateBookingStatus = async (req, res) => {
    try {
        const { id } = req.params;
        const { status } = req.body;

        const booking = await Booking.findByIdAndUpdate(
            id,
            { bookingStatus: status },
            { new: true }
        ).populate("guestId", "fullName email").populate("propertyId", "title");

        if (!booking) return res.status(404).json({ message: "Booking not found" });
        await logActivity(req.user._id, "UPDATE_BOOKING", `Changed booking #${id.slice(-6)} to "${status}" — Property: ${booking.propertyId?.title}`);
        res.status(200).json({ message: `Booking status updated to ${status}`, booking });
    } catch (err) {
        res.status(500).json({ message: err.message });
    }
}

// GET ALL PENDING VERIFICATIONS (ADMIN) — reads from VerificationModel
exports.getPendingVerifications = async (req, res) => {
    try {
        const pendingVerifs = await Verification.find({ status: "Pending" })
            .populate("userId", "fullName email role profilePicture")
            .sort({ createdAt: -1 });

        const formatted = pendingVerifs.map(v => ({
            id: v.userId?._id,
            verificationId: v._id,
            name: v.userId?.fullName || "Unknown",
            email: v.userId?.email || "",
            role: v.userId?.role || "",
            profilePicture: v.userId?.profilePicture || "",
            documentUrl: v.documentUrl,
            remarks: v.remarks || "",
            submittedAt: new Date(v.createdAt).toLocaleDateString('en-GB')
        }));

        res.status(200).json({ pendingVerifications: formatted });
    } catch (err) {
        res.status(500).json({ message: err.message });
    }
}

// APPROVE VERIFICATION (ADMIN) — updates VerificationModel + sets User.verificationStatus
exports.approveVerification = async (req, res) => {
    try {
        const { verificationId } = req.body;

        const verif = await Verification.findByIdAndUpdate(
            verificationId,
            { status: "Approved", remarks: "" },
            { new: true }
        ).populate("userId", "fullName email");

        if (!verif) return res.status(404).json({ message: "Verification request not found" });

        await User.findByIdAndUpdate(verif.userId._id, { verificationStatus: true });
        await logActivity(req.user._id, "APPROVE_VERIFICATION", `Approved ID verification for ${verif.userId.fullName} (${verif.userId.email})`);

        res.status(200).json({ message: "Verification approved successfully" });
    } catch (err) {
        res.status(500).json({ message: err.message });
    }
}

// REJECT VERIFICATION (ADMIN) — updates VerificationModel + clears User.verificationStatus
exports.rejectVerification = async (req, res) => {
    try {
        const { verificationId, remarks } = req.body;

        const verif = await Verification.findByIdAndUpdate(
            verificationId,
            { status: "Rejected", remarks: remarks || "" },
            { new: true }
        ).populate("userId", "fullName email");

        if (!verif) return res.status(404).json({ message: "Verification request not found" });

        await User.findByIdAndUpdate(verif.userId._id, { verificationStatus: false });
        await logActivity(req.user._id, "REJECT_VERIFICATION", `Rejected ID verification for ${verif.userId.fullName} — Reason: ${remarks || "No reason given"}`);

        res.status(200).json({ message: "Verification rejected" });
    } catch (err) {
        res.status(500).json({ message: err.message });
    }
}