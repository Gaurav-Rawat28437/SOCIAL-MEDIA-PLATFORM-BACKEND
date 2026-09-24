const express = require("express")
const router = express.Router()

const { chatListModel } = require("../models/chatList.model")
const { chatMessage } = require("../models/chatMessage.modal")


router.get("/user-chatList", async (req, res) => {
    try {
        const loggedInUser = req.foundUser

        let userChatList = await chatListModel.findOne({
            user: loggedInUser._id
        }).populate(
            "chatList",
            "_id username firstName lastName displayPicture"
        )

        if (!userChatList) {
            userChatList = await chatListModel.create({
                user: loggedInUser._id,
                chatList: []
            })
        }

        const chatListWithUnreadCount = await Promise.all(
            userChatList.chatList.map(async (user) => {
                const unreadCount = await chatMessage.countDocuments({
                    sender: user._id,
                    receiver: loggedInUser._id,
                    isSeen: false
                })

                return {
                    ...user.toObject(), unreadCount
                }
            })
        )

        return res.status(200).json({
            success: true,
            data: {
                ...userChatList.toObject(),
                chatList: chatListWithUnreadCount
            }
        })
    } catch (error) {
        console.log(error)

        return res.status(500).json({
            success: false,
            msg: error.message
        })
    }
})


router.patch("/user-chatList/:userId", async (req, res) => {
    try {
        const { userId } = req.params
        const loggedInUser = req.foundUser

        if (!userId) {
            return res.status(400).json({
                success: false,
                msg: "user not add in user chatlist"
            })
        }


        const userChatList = await chatListModel.findOne({ user: loggedInUser._id })

        if (!userChatList) {
            return res.status(404).json({
                success: false,
                msg: "chatList not found"
            })
        }

        const list = userChatList.chatList

        if (!list.includes(userId)) {
            list.push(userId)
            userChatList.chatList = list
            await userChatList.save()
        }

        return res.status(200).json({
            success: true,
            msg: "user is added in chatList",
            data: userChatList
        })




    }
    catch (error) {
        console.log(error)

    }
})

router.get("/user-chatMessage/:userId", async (req, res) => {
    try {

        const { userId } = req.params
        const loggedInUser = req.foundUser._id

        const page = Math.max(Number(req.query.page) || 1, 1)

        const limit = Math.min(
            Math.max(Number(req.query.limit) || 20, 1),
            50
        )

        const skip = (page - 1) * limit

        const messages = await chatMessage.find({
            $or: [
                {
                    sender: loggedInUser,
                    receiver: userId
                },
                {
                    sender: userId,
                    receiver: loggedInUser
                }
            ]
        })
            .sort({ createdAt: -1 })
            .skip(skip)
            .limit(limit)

        messages.reverse()

        const totalMessages = await chatMessage.countDocuments({
            $or: [
                {
                    sender: loggedInUser,
                    receiver: userId
                },
                {
                    sender: userId,
                    receiver: loggedInUser
                }
            ]
        })

        const totalPages = Math.ceil(totalMessages / limit)

        return res.status(200).json({
            success: true,
            data: {
                messages,
                currentPage: page,
                totalPages,
                totalMessages,
                hasNextPage: page < totalPages,
                hasPreviousPage: page < totalPages
            }
        })

    } catch (error) {

        console.log(error)

        return res.status(500).json({
            success: false,
            msg: "Failed to get chat messages"
        })

    }
})


router.patch("/user-chatMessage/:userId/seen", async (req, res) => {
    try {

        const { userId } = req.params
        const loggedInUser = req.foundUser._id

        await chatMessage.updateMany(
            {
                sender: userId,
                receiver: loggedInUser,
                isSeen: false
            },
            {
                $set: {
                    isSeen: true
                }
            }
        )

        return res.status(200).json({
            success: true,
            msg: "Messages marked as seen"
        })

    } catch (error) {
        console.log(error)

        return res.status(500).json({
            success: false,
            msg: "Failed to mark messages as seen"
        })
    }
})

router.patch("/user-chatList/:userId/top", async (req, res) => {
    try {
        const { userId } = req.params
        const loggedInUser = req.foundUser

        const userChatList = await chatListModel.findOne({
            user: loggedInUser._id
        })

        if (!userChatList) {
            return res.status(404).json({
                success: false,
                msg: "chatList not found"
            })
        }

        userChatList.chatList = [
            new mongoose.Types.ObjectId(userId),
            ...userChatList.chatList.filter(
                id => id.toString() !== userId
            )
        ]

        await userChatList.save()

        return res.status(200).json({
            success: true,
            msg: "user moved to top of chatList",
            data: userChatList
        })

    } catch (error) {
        console.log(error)

        return res.status(500).json({
            success: false,
            msg: error.message
        })
    }
})

module.exports = { chatRouter: router }