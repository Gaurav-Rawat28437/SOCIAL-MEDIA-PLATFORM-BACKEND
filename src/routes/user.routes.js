const express = require("express")
const { userModel } = require("../models/User.model")
const { followModel } = require("../models/follow.model")

const router = express.Router()

router.get("/search-user", async (req, res) => {
    try {
        const search = req.query.search || ""

        const getUsers = await userModel.find({
            _id: { $ne: req.foundUser._id },
            $or: [
                {
                    username: {
                        $regex: search,
                        $options: "i"
                    }
                },
                {
                    firstName: {
                        $regex: search,
                        $options: "i"
                    }
                },
                {
                    lastName: {
                        $regex: search,
                        $options: "i"
                    }
                }
            ]
        }).
        select("_id username firstName lastName displayPicture")

        if (getUsers.length === 0) {
            return res.status(200).json({
                success: true,
                msg: "No Users found",
                users: getUsers
            })
        }

        return res.status(200).json({
            success: true,
            msg: "Users found",
            users: getUsers
        })

    } catch (error) {
        console.log(error)

        return res.status(500).json({
            success: false,
            msg: "Users not found"
        })
    }
})

router.post("/follow/:userId",async(req,res)=>{
    try {
        const followerId = req.foundUser.id
        const followingId = req.params.userId

        if (followerId === followingId) {
            return res.status(400).json({
                success: false,
                message: "You cannot follow yourself"
            })
        }

        await followModel.create({
            follower: followerId,
            following: followingId
        })

        await userModel.findByIdAndUpdate(followerId, {
            $inc: { followingCount: 1 }
        })

        await userModel.findByIdAndUpdate(followingId, {
            $inc: { followersCount: 1 }
        })

        return res.status(201).json({
            success: true,
            message: "User followed successfully"
        })

    } catch (error) {
        console.log(error)

        return res.status(500).json({
            success: false,
            message: "Internal server error"
        })
    }
})

router.delete("/follow/:userId", async (req, res) => {
    try {
        const followerId = req.foundUser.id
        const followingId = req.params.userId

        const follow = await followModel.findOneAndDelete({
            follower: followerId,
            following: followingId
        })

        if (!follow) {
            return res.status(400).json({
                success: false,
                message: "You are not following this user"
            })
        }

        await userModel.findByIdAndUpdate(followerId, {
            $inc: { followingCount: -1 }
        })

        await userModel.findByIdAndUpdate(followingId, {
            $inc: { followersCount: -1 }
        })

        return res.status(200).json({
            success: true,
            message: "User unfollowed successfully"
        })

    } catch (error) {
        console.log(error)

        return res.status(500).json({
            success: false,
            message: "Internal server error"
        })
    }
})

router.get("/follow/:userId/followers", async (req, res) => {
    try {
        const userId = req.params.userId

        const page = Number(req.query.page) || 1
        const limit = Number(req.query.limit) || 10
        const skip = (page - 1) * limit

        const followers = await followModel
            .find({ following: userId })
            .populate("follower", "_id username firstName lastName displayPicture")
            .skip(skip)
            .limit(limit)

        const totalFollowers = await followModel.countDocuments({
            following: userId
        })

        return res.status(200).json({
            success: true,
            data: followers,
            page,
            limit,
            total: totalFollowers,
            hasMore: skip + followers.length < totalFollowers
        })

    } catch (error) {
        console.log(error)

        return res.status(500).json({
            success: false,
            message: "Internal server error"
        })
    }
})

router.get("/follow/:userId/following", async (req, res) => {
    try {
        const userId = req.params.userId

        const page = Number(req.query.page) || 1
        const limit = Number(req.query.limit) || 10
        const skip = (page - 1) * limit

        const following = await followModel
            .find({ follower: userId })
            .populate("following", "_id username firstName lastName displayPicture")
            .skip(skip)
            .limit(limit)

        const totalFollowing = await followModel.countDocuments({
            follower: userId
        })

        return res.status(200).json({
            success: true,
            data: following,
            page,
            limit,
            total: totalFollowing,
            hasMore: skip + following.length < totalFollowing
        })

    } catch (error) {
        console.log(error)

        return res.status(500).json({
            success: false,
            message: "Internal server error"
        })
    }
})

module.exports = {
    userRouter: router
}