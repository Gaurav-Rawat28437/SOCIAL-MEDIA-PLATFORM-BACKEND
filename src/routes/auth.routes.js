const express = require("express")
const router = express.Router()
require("dotenv").config()

const { Resend } = require("resend")
const resend = new Resend(process.env.RESEND_API)
const validator = require("validator")
const bcrypt = require("bcrypt")
const jwt = require("jsonwebtoken")


const { otpModel } = require("../models/otp.model")
const { verifiedMailModel } = require("../models/verified.model")
const { userModel } = require("../models/User.model")
const { otpLimiter, loginLimiter, verifyLimiter } = require("../middleware/rateLimiter")
const { isLoggedIn } = require("../middleware/isLoggedIn.middleware")

router.post("/send-otp", otpLimiter, async (req, res) => {
    try {
        const { email } = req.body

        if (!email) {
            throw new Error("email not received from frontend")
        }

        if (!validator.isEmail(email)) {
            throw new Error("please enter a valid email....")
        }

        const verifiedUser = await verifiedMailModel.findOne({ email })

        if (verifiedUser) {
            await verifiedMailModel.deleteOne({ email })
        }

        const existingUser = await userModel.findOne({ email });

        if (existingUser) {
            return res.status(409).json({
                success: false,
                msg: "Account already exists. Please login."
            })
        }
        const otp = Math.floor(100000 + Math.random() * 900000)

        const emailResponse = await resend.emails.send({
            from: "Gaurav <shubham@noisy.co.in>",
            subject: "Your OTP for Email Verification",
            to: email,
            html: ` 
                <div style="font-family: Arial, sans-serif; max-width: 500px; margin: 40px auto; padding: 30px; border: 1px solid #e5e7eb; border-radius: 12px; background-color: #ffffff;">

                    <h2 style="text-align: center; color: #111827; margin-bottom: 10px;">
                        Verify Your Email
                    </h2>
                    
                    <p style="font-size: 16px; color: #4b5563;">
                        Hello,
                    </p>

                    <p style="font-size: 16px; color: #4b5563; line-height: 1.6;">
                        Welcome to <strong>MUUV App</strong>! Please use the verification code below to verify your email address.
                    </p>

                    <div style="text-align: center; margin: 30px 0;">
                        <span style="display: inline-block; padding: 15px 25px; background-color: #f3f4f6; border-radius: 8px; font-size: 32px; font-weight: bold; letter-spacing: 8px; color: #2563eb;">
                            ${otp}
                        </span>
                    </div>

                    <p style="font-size: 14px; color: #6b7280; line-height: 1.5;">
                        This verification code will expire in <strong>3 minutes</strong>.
                        Please do not share this code with anyone.
                    </p>

                    <p style="font-size: 14px; color: #6b7280; line-height: 1.5;">
                        If you did not request this verification code, you can safely ignore this email.
                    </p>

                    <hr style="border: none; border-top: 1px solid #e5e7eb; margin: 25px 0;">

                    <p style="text-align: center; font-size: 12px; color: #9ca3af;">
                        © 2026 Social App. All rights reserved.
                    </p>

                </div>
                    `
        })

        if (emailResponse.error) {
            throw new Error("Unable to send OTP email. Please try again.")
        }

        const createOtp = await otpModel.findOneAndUpdate({ email }, { otp, expireAt: new Date() }, { upsert: true, returnDocument: "after" })

        if (!createOtp) {
            throw new Error("opt not save in mongo")
        }

        res.status(201).json({
            success: true,
            msg: "otp is send",
        })
    }
    catch (error) {
        res.status(400).json({
            msg: error.message,
            error: error
        })
    }
})

router.post("/verify-otp", verifyLimiter, async (req, res) => {
    try {
        const { email, otp } = req.body
        console.log(email, typeof (otp))

        if (!email || !otp) {
            throw new Error("email or otp not received from frontend")
        }

        if (!validator.isEmail(email)) {
            throw new Error("please enter a valid email....")
        }

        const foundOtp = await otpModel.findOne({ email, otp })
        console.log(foundOtp)

        if (!foundOtp) {
            throw new Error("Invalid OTP,please try again...")
        }

        const expiryTime = new Date(
            foundOtp.expireAt.getTime() + 180 * 1000
        )

        if (expiryTime < new Date()) {
            await otpModel.deleteOne({
                _id: foundOtp._id
            })

            throw new Error("OTP has expired, please request a new OTP")
        }

        await verifiedMailModel.create({
            email
        })

        await otpModel.deleteOne({
            _id: foundOtp._id
        })

        return res.status(200).json({
            success: true,
            msg: "Email verified successfully"
        })


    }
    catch (error) {
        res.status(400).json({
            msg: error.message,
            error: error
        })
    }
})

router.post("/sign-up", async (req, res) => {
    try {
        const { email, username, password } = req.body

        if (!email || !password || !username) {
            throw new Error("email , password and username not received form frontend...")
        }

        if (!validator.isEmail(email)) {
            throw new Error("please enter valid email...")
        }

        if (!validator.isStrongPassword(password)) {
            throw new Error("please enter strong password...")
        }

        if (username.length < 2 || username.length > 20) {
            throw new Error("please enter usernamelength btw 2 to 20...")
        }

        const foundVerifyUser = await userModel.findOne({
            $or: [
                { email },
                { username }
            ]
        })

        if (foundVerifyUser) {
            return res.status(409).json({
                msg: "user already exist"
            })
        }

        const verifiedEmail = await verifiedMailModel.findOne({ email })

        if (!verifiedEmail) {
            return res.status(403).json({
                success: false,
                msg: "Please verify your email first"
            })
        }

        const hashedPassword = await bcrypt.hash(password, 10)

        const createUser = await userModel.create({ username, email, password: hashedPassword })

        await verifiedMailModel.deleteOne({ email })

        res.status(201).json({
            success: true,
            msg: "user successfully create"
        })

    }
    catch (error) {
        res.status(400).json({
            msg: error.message,
            error: error
        })
    }

})


router.post("/login", loginLimiter, async (req, res) => {
    try {

        const { email, password, username } = req.body

        if (!email && !username) {
            throw new Error("please enter username or email...")
        }
        if (!password) {
            throw new Error("please enter password...")
        }

        const foundUser = await userModel.findOne({
            $or: [
                { email },
                { username }
            ]
        })

        if (!foundUser) {
            throw new Error("user not found,please create an account first")
        }

        const correctPassword = await bcrypt.compare(password, foundUser.password)

        if (!correctPassword) {
            throw new Error("password is incorrect,please enter valid password...")
        }


        const token = jwt.sign({ id: foundUser._id }, process.env.JWT_SECRET, { expiresIn: "7d" }) //can add expireing data init by passing {expiresIn:"7d"} it will expire in 7days

        const isProduction = process.env.NODE_ENV === "production"

        res.cookie("token", token, {
            httpOnly: true,
            secure: isProduction,
            sameSite: isProduction ? "none" : "lax",
            maxAge: 7 * 24 * 60 * 60 * 1000
        })

        res.set("Cache-Control", "no-store")

        res.status(200).json({
            success: true,
            msg: "user login successfully",
            data: {
                _id: foundUser._id,
                firstName: foundUser.firstName,
                lastName: foundUser.lastName,
                username: foundUser.username,
                email: foundUser.email,
                gender: foundUser.gender,
                dateOfBirth: foundUser.dateOfBirth,
                displayPicture: foundUser.displayPicture,
                coverPicture: foundUser.coverPicture,
                bio: foundUser.bio,
                isCompletedProfile: foundUser.isCompletedProfile,
                followersCount: foundUser.followersCount,
                followingCount: foundUser.followingCount,
                postCount: foundUser.postCount,
                thoughtCount: foundUser.thoughtCount,
                createdAt: foundUser.createdAt
            }
        })
    }
    catch (error) {
        res.status(400).json({
            msg: error.message,
            error: error
        })
    }
})


router.post("/logout", isLoggedIn, async (req, res) => {
    try {
        res.cookie("token", "GauravSinghRawat")
        res.status(200).json({
            success: true,
            msg: "user logout successfully"
        })
    }
    catch (error) {
        res.status(400).json({
            msg: error.message,
            error: error
        })
    }
})


router.get("/get-user-data", async (req, res) => {

    try {
        const { token } = req.cookies

        if (!token) {
            throw new Error("Please login again")
        }

        const decode = jwt.verify(token, process.env.JWT_SECRET)

        const foundUser = await userModel.findById(decode.id)

        if (!foundUser) throw new Error("User logout,please login again...")

        res.set("Cache-Control", "no-store")

        res.status(200).json({
            success: true,
            msg: "user login successfully",
            data: {
                _id: foundUser._id,
                firstName: foundUser.firstName,
                lastName: foundUser.lastName,
                username: foundUser.username,
                email: foundUser.email,
                gender: foundUser.gender,
                dateOfBirth: foundUser.dateOfBirth,
                displayPicture: foundUser.displayPicture,
                coverPicture: foundUser.coverPicture,
                bio: foundUser.bio,
                isCompletedProfile: foundUser.isCompletedProfile,
                followersCount: foundUser.followersCount,
                followingCount: foundUser.followingCount,
                postCount: foundUser.postCount,
                thoughtCount: foundUser.thoughtCount,
                createdAt: foundUser.createdAt
            }
        })

    }
    catch (error) {
        res.status(401).json({
            msg: error.message,
            error: error
        })
    }
})

module.exports = {
    authRouter: router
}