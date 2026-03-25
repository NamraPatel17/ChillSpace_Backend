const userSchema = require("../models/UserModel")
const bcrypt = require("bcrypt")
const mailSend = require("../utils/MailUtil")
const jwt = require("jsonwebtoken")
const crypto = require("crypto")
const secret = "secret"

const registerUser = async(req,res)=>{

    try{
        //const {firstName,lastName,email,password} = req.body   dont do this for now.,.

        //10 is salt round.. please check documentation for more details
        const hashedPassword = await bcrypt.hash(req.body.password,10)

        //const savedUser = await userSchema.create(req.body)
        const savedUser = await userSchema.create({...req.body,password:hashedPassword})
        //send mail...
        await mailSend(
          savedUser.email,
          "Welcome to our app",
          "Welcome.html"
        )
        res.status(201).json({
            message:"user created successfully",
            data:savedUser
        })

        
    }catch(err){
        console.log("REGISTER ERROR:", err)  // <‑‑ add this
        // Duplicate email error from MongoDB
        if (err.code === 11000 && err.keyPattern && err.keyPattern.email) {
            return res.status(400).json({
                message: "Email already registered"
            })
        }
        
        res.status(500).json({
            message:"error while creating user",
            err:err.message || err
        })
    }
}

const loginUser= async(req,res)=>{
    try{
        //select * from users where email =? -->userObj
        //userObj.password[encrypted] --> req.body ->plain password
        //compare() using bcrypt

        const {email,password} = req.body
        //const foundUserFromEmail = await userSchema.findOne({modelColumnName:req.body.email})
        const foundUserFromEmail = await userSchema.findOne({email:email}) //admin@yopmail.com
        console.log(foundUserFromEmail)
        if(foundUserFromEmail){
            if (foundUserFromEmail.accountStatus === "Suspended") {
                return res.status(403).json({ message: "Your account has been suspended. Please contact support." });
            }
            if (foundUserFromEmail.accountStatus === "Deleted") {
                return res.status(403).json({ message: "This account has been deleted." });
            }

            //password compare
            const isPasswordMatched = await bcrypt.compare(password,foundUserFromEmail.password)
            //..if password compare it will return true else false
            if(isPasswordMatched){
                const token = jwt.sign(foundUserFromEmail.toObject(),secret)
                res.status(200).json({
                    message:"Login Success",
                    token:token,
                    role:foundUserFromEmail.role,
                    data: {
                        _id: foundUserFromEmail._id,
                        fullName: foundUserFromEmail.fullName,
                        email: foundUserFromEmail.email
                    }
                })  
            }
            else{
                //401 -->unauthorized
                res.status(401).json({
                    message:"Invalid Credentials"
                })
            }

        }
        else{
            res.status(404).json({
                message:"user not found."
            })
        }




    }catch(err){

        res.status(500).json({
            message:"error while logging in",
            err:err
        })
    }
}

const getProfile = async (req, res) => {
    try {
        const user = await userSchema.findById(req.user._id).select("-password")
        if (!user) {
            return res.status(404).json({ message: "User not found" })
        }
        res.status(200).json(user)
    } catch (err) {
        res.status(500).json({ message: "Error fetching profile", error: err.message })
    }
}

const updateProfile = async (req, res) => {
    try {
        const updates = req.body
        
        // Ensure sensitive fields like password or role cannot be updated here
        delete updates.password
        delete updates.role
        delete updates.verificationStatus
        delete updates.accountStatus

        const updatedUser = await userSchema.findByIdAndUpdate(
            req.user._id,
            { $set: updates },
            { new: true, runValidators: true }
        ).select("-password")

        res.status(200).json({
            message: "Profile updated successfully",
            data: updatedUser
        })
    } catch (err) {
        res.status(500).json({ message: "Error updating profile", error: err.message })
    }
}

const forgotPassword = async (req, res) => {
    try {
        const { email } = req.body;
        const user = await userSchema.findOne({ email });

        if (!user) {
            return res.status(404).json({ message: "User not found with this email" });
        }

        // Generate 20-character hex crypto token
        const resetToken = crypto.randomBytes(20).toString('hex');

        // Set expiration (1 hour from now)
        user.resetPasswordToken = resetToken;
        user.resetPasswordExpires = Date.now() + 3600000; // 1 hour

        await user.save();

        // Use frontend URL depending on env
        const frontendURL = process.env.FRONTEND_URL || "http://localhost:5173";
        const resetLink = `${frontendURL}/reset-password/${resetToken}`;

        // Send Email with {{resetLink}} replacement
        await mailSend(
            user.email,
            "ChillSpace - Password Reset",
            "ResetPassword.html",
            { resetLink }
        );

        res.status(200).json({ message: "Password reset link sent to your email" });
    } catch (err) {
        console.error("FORGOT PASSWORD ERROR:", err);
        res.status(500).json({ message: "Error processing forgot password request", error: err.message });
    }
}

const resetPassword = async (req, res) => {
    try {
        const { token } = req.params;
        const { newPassword } = req.body;

        // Find user by token & check if token is unexpired
        const user = await userSchema.findOne({
            resetPasswordToken: token,
            resetPasswordExpires: { $gt: Date.now() }
        });

        if (!user) {
            return res.status(400).json({ message: "Password reset token is invalid or has expired" });
        }

        // Hash new password
        const hashedPassword = await bcrypt.hash(newPassword, 10);

        // Update user
        user.password = hashedPassword;
        user.resetPasswordToken = undefined;
        user.resetPasswordExpires = undefined;

        await user.save();

        res.status(200).json({ message: "Password has been successfully reset" });
    } catch (err) {
        console.error("RESET PASSWORD ERROR:", err);
        res.status(500).json({ message: "Error resetting password", error: err.message });
    }
}

module.exports = {
    registerUser,
    loginUser,
    getProfile,
    updateProfile,
    forgotPassword,
    resetPassword
}