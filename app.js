const express = require("express")
const app = express()
const cors = require("cors")
//load env file.. using process
require("dotenv").config()
app.use(express.json())
app.use(cors()) //allow all requests

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

app.use("/users", userRoutes)
app.use("/properties", propertyRoutes)
app.use("/bookings", bookingRoutes)
app.use("/reviews", reviewRoutes)
app.use("/admin", adminRoutes)
app.use("/payments", paymentRoutes)
app.use("/messages", messageRoutes)
app.use("/verifications", verificationRoutes)
app.use("/hosts", hostRoutes)




const PORT = process.env.PORT
app.listen(PORT,()=>{
    console.log(`server started on port ${PORT}`)
})
//server creation


