const mailer = require("nodemailer")
const fs = require("fs")
const path = require("path")
require("dotenv").config()

const mailSend = async(to,subject,templateName)=>{
 try{

    const transporter = mailer.createTransport({
        service:"gmail",
        auth:{
            user:process.env.EMAIL_USER,
            pass:process.env.EMAIL_PASSWORD
        }
    })

    const filePath = path.join(__dirname,"Templates",templateName)

    const htmlContent = fs.readFileSync(filePath,"utf8")
    console.log(filePath)

    const mailOptions = {
        from:process.env.EMAIL_USER,
        to:to,
        subject:subject,
        html:htmlContent
    }

    return await transporter.sendMail(mailOptions)

 }catch(err){
    console.log("MAIL ERROR:",err)
 }
}
module.exports = mailSend