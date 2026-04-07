const crypto = require("crypto")
const axios = require("axios")
const Booking = require("../models/BookingModel")

// ─── Razorpay REST API base (Basic Auth: key_id:key_secret) ──────────────────
const getRazorpayAuth = () => {
    const key = process.env.RAZORYPAY_API_KEY
    const secret = process.env.RAZORYPAY_API_SECRET
    return Buffer.from(`${key}:${secret}`).toString("base64")
}

// ─── POST /razorpay/create-order ─────────────────────────────────────────────
exports.createOrder = async (req, res) => {
    try {
        const { amount, currency = "INR", receipt } = req.body

        if (!amount || amount <= 0) {
            return res.status(400).json({ message: "Invalid amount" })
        }

        const response = await axios.post(
            "https://api.razorpay.com/v1/orders",
            {
                amount: Math.round(amount * 100),  // paise
                currency,
                receipt: (receipt || `rcpt_${Date.now()}`).substring(0, 40),
                payment_capture: 1
            },
            {
                headers: {
                    "Authorization": `Basic ${getRazorpayAuth()}`,
                    "Content-Type": "application/json"
                }
            }
        )

        const order = response.data
        res.status(200).json({
            orderId: order.id,
            amount: order.amount,
            currency: order.currency,
            receipt: order.receipt,
            keyId: process.env.RAZORYPAY_API_KEY
        })
    } catch (err) {
        const errMsg = err.response?.data?.error?.description || err.message || "Failed to create payment order"
        console.error("Razorpay create-order error:", err.response?.data || err.message)
        res.status(500).json({ message: errMsg })
    }
}

// ─── POST /razorpay/verify ───────────────────────────────────────────────────
exports.verifyPayment = async (req, res) => {
    try {
        const {
            razorpay_order_id,
            razorpay_payment_id,
            razorpay_signature,
            bookingData
        } = req.body

        // HMAC-SHA256 signature verification
        const body = razorpay_order_id + "|" + razorpay_payment_id
        const expectedSignature = crypto
            .createHmac("sha256", process.env.RAZORYPAY_API_SECRET)
            .update(body)
            .digest("hex")

        if (expectedSignature !== razorpay_signature) {
            return res.status(400).json({ message: "Payment verification failed — invalid signature" })
        }

        // Create Confirmed booking 
        const booking = new Booking({
            propertyId: bookingData.propertyId,
            guestId: bookingData.guestId,
            checkInDate: bookingData.checkInDate,
            checkOutDate: bookingData.checkOutDate,
            totalPrice: bookingData.totalPrice,
            bookingStatus: "Confirmed",
            paymentStatus: "Paid",
            paymentId: razorpay_payment_id,
            orderId: razorpay_order_id
        })

        await booking.save()

        res.status(201).json({
            message: "Payment verified and booking confirmed!",
            booking,
            paymentId: razorpay_payment_id
        })
    } catch (err) {
        console.error("Payment verification error:", err.message)
        res.status(500).json({ message: "Payment verification failed", error: err.message })
    }
}

// ─── GET /razorpay/key ───────────────────────────────────────────────────────
exports.getKey = (req, res) => {
    res.status(200).json({ keyId: process.env.RAZORYPAY_API_KEY })
}
