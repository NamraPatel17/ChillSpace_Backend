const mongoose = require('mongoose')
require("dotenv").config()

const dbConnection = ()=>{

    mongoose.connect(process.env.MONGO_URL).then(()=>{
        console.log("db connected")
    }).catch((err)=>{
        console.log("database not connted..",err)
    })

}

module.exports = dbConnection