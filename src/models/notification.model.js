const mongoose = require("mongoose")

const notificationSchema = new mongoose.Schema(
    {
        receiver: {
            type: mongoose.Schema.Types.ObjectId,
            ref: "user",
            required: true
        },
        sender: {
            type: mongoose.Schema.Types.ObjectId,
            ref: "user",
            required: true
        },
        type: {
            type: String,
            enum: ["follow", "like", "comment"],
            required: true
        },
        post: {
            type: mongoose.Schema.Types.ObjectId,
            ref: "post",
            default: null
        },
        isRead: {
            type: Boolean,
            default: false
        }
    },
    {
        timestamps: true
    }
)

const notificationModel = mongoose.model(
    "Notification",
    notificationSchema
)

module.exports = { notificationModel }