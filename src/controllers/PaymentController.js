const Payment = require("../models/PaymentModel")
const Booking = require("../models/BookingModel")

// PROCESS PAYMENT (Hold in Escrow ideally)
exports.processPayment = async (req, res) => {
    try {
        const { bookingId, paymentMethod, transactionId, paymentAmount } = req.body

        // Verify the booking exists
        const booking = await Booking.findById(bookingId)
        if (!booking) {
            return res.status(404).json({ message: "Booking not found" })
        }

        const payment = new Payment({
            bookingId,
            paymentMethod,
            transactionId,
            paymentAmount,
            paymentStatus: "Success"
        })

        const savedPayment = await payment.save()

        // Optionally update booking status to "Confirmed"
        booking.bookingStatus = "Confirmed"
        await booking.save()

        res.status(201).json({
            message: "Payment processed successfully. Funds held in escrow.",
            data: savedPayment
        })
    } catch (err) {
        res.status(500).json({ message: err.message })
    }
}

// GET PAYMENT DETAILS
exports.getPaymentById = async (req, res) => {
    try {
        const payment = await Payment.findById(req.params.id)
            .populate("bookingId")

        if (!payment) {
            return res.status(404).json({ message: "Payment not found" })
        }

        res.status(200).json(payment)
    } catch (err) {
        res.status(500).json({ message: err.message })
    }
}

// GET ALL PAYMENTS (Admin use)
exports.getAllPayments = async (req, res) => {
    try {
        const payments = await Payment.find().populate("bookingId")
        res.status(200).json(payments)
    } catch (err) {
        res.status(500).json({ message: err.message })
    }
}

// RELEASE PAYOUT TO HOST (After Check-in)
exports.releasePayout = async (req, res) => {
    try {
        const payment = await Payment.findById(req.params.id)
        
        if (!payment) {
            return res.status(404).json({ message: "Payment not found" })
        }

        if (payment.paymentStatus !== "Success") {
            return res.status(400).json({ message: "Payment was not successful, cannot release payout" })
        }

        // Calculate platform fee (e.g. 10%)
        const platformFee = payment.paymentAmount * 0.10
        const hostPayout = payment.paymentAmount - platformFee

        res.status(200).json({
            message: "Payout released to host successfully.",
            details: {
                totalAmount: payment.paymentAmount,
                platformFee,
                hostPayout
            }
        })
    } catch (err) {
        res.status(500).json({ message: err.message })
    }
}
