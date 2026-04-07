const mailer = require("nodemailer")
const fs = require("fs")
const path = require("path")
require("dotenv").config()

const mailSend = async(to,subject,templateName, replacements = {})=>{
 try{

    const transporter = mailer.createTransport({
        service:"gmail",
        auth:{
            user:process.env.EMAIL_USER,
            pass:process.env.EMAIL_PASSWORD
        }
    })

    const filePath = path.join(__dirname,"Templates",templateName)

    let htmlContent = fs.readFileSync(filePath,"utf8")

    // Inject dynamic variables into HTML payload
    for (const [key, value] of Object.entries(replacements)) {
        htmlContent = htmlContent.replace(new RegExp(`{{${key}}}`, 'g'), value);
    }

    const mailOptions = {
        from:process.env.EMAIL_USER,
        to:to,
        subject:subject,
        html:htmlContent
    }

    return await transporter.sendMail(mailOptions)

 }catch(err){
    console.error("[Mail] Send failed:", err.message)
 }
}
module.exports = mailSend