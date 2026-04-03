const Dispute = require("../models/DisputeModel")
const Booking = require("../models/BookingModel")

// POST /disputes — guest or host raises a dispute
exports.raiseDispute = async (req, res) => {
    try {
        const { bookingId, reason, description } = req.body
        const raisedBy = req.user._id

        if (!bookingId || !reason || !description) {
            return res.status(400).json({ message: "bookingId, reason and description are required" })
        }

        // Verify the booking exists and the caller is linked to it
        const booking = await Booking.findById(bookingId)
            .populate("guestId", "fullName email")
            .populate("hostId", "fullName email")

        if (!booking) {
            return res.status(404).json({ message: "Booking not found" })
        }

        const isGuest = booking.guestId?._id.toString() === raisedBy.toString()
        const isHost  = booking.hostId?._id.toString()  === raisedBy.toString()

        if (!isGuest && !isHost) {
            return res.status(403).json({ message: "You are not part of this booking" })
        }

        const against = isGuest ? booking.hostId?._id : booking.guestId?._id

        // Prevent duplicate open disputes for same booking by same user
        const exists = await Dispute.findOne({ bookingId, raisedBy, status: { $ne: "resolved" } })
        if (exists) {
            return res.status(409).json({ message: "You already have an open dispute for this booking" })
        }

        const dispute = new Dispute({ bookingId, raisedBy, against, reason, description })
        await dispute.save()

        res.status(201).json({ message: "Dispute raised successfully", dispute })
    } catch (err) {
        res.status(500).json({ message: err.message })
    }
}

// GET /admin/disputes — admin sees all disputes
exports.getAllDisputes = async (req, res) => {
    try {
        const { status } = req.query

        const filter = {}
        if (status && status !== "all") filter.status = status

        const disputes = await Dispute.find(filter)
            .sort({ createdAt: -1 })
            .populate("bookingId", "checkInDate checkOutDate totalPrice")
            .populate("raisedBy", "fullName email")
            .populate("against", "fullName email")

        const stats = {
            pending:    await Dispute.countDocuments({ status: "pending" }),
            inProgress: await Dispute.countDocuments({ status: "in-progress" }),
            resolved:   await Dispute.countDocuments({ status: "resolved" })
        }

        const formatted = disputes.map(d => ({
            id: d._id,
            issue: d.reason,
            description: d.description,
            status: d.status,
            priority: d.priority,
            adminNote: d.adminNote,
            guest: d.raisedBy?.fullName || "Unknown",
            guestEmail: d.raisedBy?.email,
            host: d.against?.fullName || "Unknown",
            hostEmail: d.against?.email,
            property: d.bookingId ? `Booking #${d.bookingId._id.toString().slice(-6)}` : "N/A",
            date: new Date(d.createdAt).toLocaleDateString('en-GB')
        }))

        res.status(200).json({ disputes: formatted, stats })
    } catch (err) {
        res.status(500).json({ message: err.message })
    }
}

// PUT /admin/disputes/:id — admin updates status/priority/note
exports.updateDispute = async (req, res) => {
    try {
        const { id } = req.params
        const { status, priority, adminNote } = req.body

        const updates = {}
        if (status)    updates.status    = status
        if (priority)  updates.priority  = priority
        if (adminNote !== undefined) updates.adminNote = adminNote

        const dispute = await Dispute.findByIdAndUpdate(id, updates, { new: true })
        if (!dispute) return res.status(404).json({ message: "Dispute not found" })

        res.status(200).json({ message: "Dispute updated", dispute })
    } catch (err) {
        res.status(500).json({ message: err.message })
    }
}

// GET /disputes/my — logged-in user's disputes
exports.getMyDisputes = async (req, res) => {
    try {
        const disputes = await Dispute.find({ raisedBy: req.user._id })
            .sort({ createdAt: -1 })
            .populate("bookingId", "checkInDate checkOutDate")
            .populate("against", "fullName")

        res.status(200).json(disputes)
    } catch (err) {
        res.status(500).json({ message: err.message })
    }
}
