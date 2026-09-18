const express = require("express")
const validator = require("validator")
const { userModel } = require("../models/User.model")
const { isLoggedIn } = require("../middleware/isLoggedIn.middleware")
const { followModel } = require("../models/follow.model")

const router = express.Router()


router.put("/completeProfile", isLoggedIn, async (req, res) => {

    try {
        const {
            firstName,
            lastName,
            dateOfBirth,
            gender,
            displayPicture,
            bio
        } = req.body

        const foundUser = req.foundUser

        if (!firstName) throw new Error("firstName is not recieved from frontend")

        if (!dateOfBirth) throw new Error("dateOfBirth is not recieved from frontend")

        if (!gender) throw new Error("gender is not recieved from frontend")

        if (firstName.length < 2 || firstName.length > 15) {
            throw new Error("firstName length should be 2 to 15")
        }

        if (!["male", "female", "other"].includes(gender.toLowerCase())) {
            throw new Error("gender should be male, female or other")
        }

        if (!validator.isDate(dateOfBirth, {
            format: "DD/MM/YYYY",
            strictMode: true
        })) {
            throw new Error("Please enter a valid date in DD/MM/YYYY format")
        }

        const [day, month, year] = dateOfBirth.split("/").map(Number)

        const dobDate = new Date(year, month - 1, day)

        const today = new Date()

        today.setHours(0, 0, 0, 0)
        dobDate.setHours(0, 0, 0, 0)

        if (dobDate > today) {
            throw new Error("Date of birth cannot be greater than today")
        }


        foundUser.firstName = firstName
        foundUser.lastName = lastName
        foundUser.dateOfBirth = dateOfBirth
        foundUser.gender = gender.toLowerCase()
        foundUser.displayPicture = displayPicture
        foundUser.bio = bio
        foundUser.isCompletedProfile = true

        await foundUser.save()

        res.status(200).json({
            success: true,
            msg: "user profile is complete",
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

    } catch (error) {
        res.status(400).json({
            success: false,
            msg: error.message,
            error: error
        })
    }
})

router.patch("/update", isLoggedIn, async (req, res) => {
    try {
        if (req.body === undefined) throw new Error("nothing received form frontend,body is undefined")

        const {
            firstName,
            lastName,
            bio,
            displayPicture,
            coverPicture,
            username,
            gender
        } = req.body

        const foundUser = req.foundUser

        if (firstName !== undefined) {
            if (foundUser.firstName !== firstName) {

                if (firstName.length < 2 || firstName.length > 15) throw new Error("please enter firstName in between character 2 to 15")

                foundUser.firstName = firstName
            }

        }

        if (lastName !== undefined) {
            if (foundUser.lastName !== lastName) {

                foundUser.lastName = lastName
            }

        }

        if (bio !== undefined) {
            if (foundUser.bio !== bio) {

                foundUser.bio = bio
            }

        }

        if (displayPicture !== undefined) {

            if (displayPicture !== "" && !validator.isURL(displayPicture)) {
                throw new Error("please provide valide url of image")
            }

            if (foundUser.displayPicture !== displayPicture) {
                foundUser.displayPicture = displayPicture
            }

        }

        if (coverPicture !== undefined) {

            if (coverPicture !== "" && !validator.isURL(coverPicture)) {
                throw new Error("please provide valid url of cover image")
            }

            if (foundUser.coverPicture !== coverPicture) {
                foundUser.coverPicture = coverPicture
            }

        }

        if (username !== undefined) {
            if (foundUser.username !== username) {

                foundUser.username = username
            }

        }

        if (gender !== undefined) {

            if (gender === "") {
                throw new Error("gender cannot be empty")
            }

            const validGenders = ["male", "female", "other"]

            if (!validGenders.includes(gender.toLowerCase())) {
                throw new Error("gender should be male, female or other")
            }

            if (foundUser.gender !== gender.toLowerCase()) {
                foundUser.gender = gender.toLowerCase()
            }

        }


        await foundUser.save()

        res.status(200).json({
            success: true,
            msg: "User profile updated successfully",

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
                createdAt: foundUser.createdAt,
            }
        })
    }
    catch (error) {
        res.status(400).json({
            success: false,
            msg: error.message,
            error: error
        })
    }
})


router.get("/user/:userId", isLoggedIn, async (req, res) => {
    try {
        const id = req.params.userId
        const loggedInUser=req.foundUser._id

        const foundUser = await userModel
            .findById(id)
            .select("-password")

        if (!foundUser) {
            return res.status(404).json({
                success: false,
                msg: "User not found"
            })
        }

        const isFollowing=await followModel.exists({follower:loggedInUser,
            following:foundUser._id
        })?true:false

        return res.status(200).json({
            success: true,
            msg: "User found",
            data:{
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
                followersCount: foundUser.followersCount,
                followingCount: foundUser.followingCount,
                postCount: foundUser.postCount,
                thoughtCount: foundUser.thoughtCount,
                createdAt:foundUser.createdAt,
                isFollowing
            }
        })

    } catch (error) {
        console.log(error)

        return res.status(500).json({
            success: false,
            msg: "Unable to get user profile"
        })
    }
})

module.exports = {
    profileRouter: router
}