const express = require("express")
const router = express.Router()

const { notificationModel } = require("../models/notification.model")


router.get("/", async (req, res) => {
    try {
        const loggedInUser = req.foundUser

        const page = Number(req.query.page) || 1
        const limit = Number(req.query.limit) || 10
        const skip = (page - 1) * limit

        const totalNotifications = await notificationModel.countDocuments({
            receiver: loggedInUser._id
        })

        const notifications = await notificationModel.find({
            receiver: loggedInUser._id
        })
            .sort({ createdAt: -1 })
            .skip(skip)
            .limit(limit)
            .populate(
                "sender",
                "_id username firstName lastName displayPicture"
            )
            .populate(
                "post",
                "_id content imgUrl authorId"
            )

        const totalPages = Math.ceil(
            totalNotifications / limit
        )

        return res.status(200).json({
            success: true,
            data: notifications,
            currentPage: page,
            totalPages,
            hasMore: page < totalPages
        })
    } catch (error) {
        console.log(error)

        return res.status(500).json({
            success: false,
            msg: "Failed to get notifications"
        })
    }
})

router.get("/unread-count", async (req, res) => {
    try {
        const loggedInUser = req.foundUser

        const unreadCount = await notificationModel.countDocuments({
            receiver: loggedInUser._id,
            isRead: false
        })

        return res.status(200).json({
            success: true,
            unreadCount
        })
    } catch (error) {
        console.log(error)

        return res.status(500).json({
            success: false,
            msg: "Failed to get unread notification count"
        })
    }
})

router.patch("/read", async (req, res) => {
    try {
        const loggedInUser = req.foundUser

        await notificationModel.updateMany(
            {
                receiver: loggedInUser._id,
                isRead: false
            },
            {
                $set: {
                    isRead: true
                }
            }
        )

        return res.status(200).json({
            success: true,
            msg: "Notifications marked as read"
        })
    } catch (error) {
        console.log(error)

        return res.status(500).json({
            success: false,
            msg: "Failed to mark notifications as read"
        })
    }
})

module.exports = { notificationRouter: router }