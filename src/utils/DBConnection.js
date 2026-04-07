const mongoose = require('mongoose')
require("dotenv").config()

const dbConnection = ()=>{

    mongoose.connect(process.env.MONGO_URL).then(() => {
        console.log("[DB] Connected to MongoDB")
    }).catch((err) => {
        console.error("[DB] Connection failed:", err.message)
        process.exit(1) // Exit process on DB failure in production
    })

}

module.exports = dbConnection