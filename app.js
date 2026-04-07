const express = require("express")
const app = express()
const cors = require("cors")
//load env file.. using process
require("dotenv").config()
app.use(express.json())
// Configure CORS properly for production
const allowedOrigins = process.env.FRONTEND_URL ? [process.env.FRONTEND_URL, 'http://localhost:5173'] : ['http://localhost:5173', 'http://localhost:3000']
app.use(cors({
    origin: function(origin, callback) {
        if (!origin || allowedOrigins.indexOf(origin) !== -1) {
            callback(null, true)
        } else {
            callback(new Error('Not allowed by CORS'))
        }
    },
    credentials: true
}))
const DBConnection = require("./src/utils/DBConnection")
DBConnection()

const userRoutes = require("./src/routes/UserRoutes")
const propertyRoutes = require("./src/routes/PropertyRoutes")
const bookingRoutes = require("./src/routes/BookingRoutes")
const reviewRoutes = require("./src/routes/ReviewRoutes")
const adminRoutes = require("./src/routes/AdminRoutes")
const paymentRoutes = require("./src/routes/PaymentRoutes")
const messageRoutes = require("./src/routes/MessageRoutes")
const verificationRoutes = require("./src/routes/VerificationRoutes")
const hostRoutes = require("./src/routes/HostRoutes")
const disputeRoutes = require("./src/routes/DisputeRoutes")
const razorpayRoutes = require("./src/routes/RazorpayRoutes")

app.use("/users", userRoutes)
app.use("/properties", propertyRoutes)
app.use("/bookings", bookingRoutes)
app.use("/reviews", reviewRoutes)
app.use("/admin", adminRoutes)
app.use("/payments", paymentRoutes)
app.use("/messages", messageRoutes)
app.use("/verifications", verificationRoutes)
app.use("/hosts", hostRoutes)
app.use("/disputes", disputeRoutes)
app.use("/razorpay", razorpayRoutes)




// Global Error Handler
app.use((err, req, res, next) => {
    console.error("[Global Error]", err.message);
    const statusCode = err.status || 500;
    res.status(statusCode).json({
        message: process.env.NODE_ENV === 'production' ? 'Internal Server Error' : err.message
    });
});

const PORT = process.env.PORT || 3000
app.listen(PORT,()=>{
    console.log(`server started on port ${PORT}`)
})
