const mongoose = require("mongoose")

const chatMessageSchema = new mongoose.Schema({

    sender: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "user",
        required: true
    },

    receiver: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "user",
        required: true
    },

    text: {
        type: String,
        required: true,
        trim: true
    },
    isSeen: {
        type: Boolean,
        default: false
    },
    reply: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "chatMessage",
        default: null
    }

}, {
    timestamps: true
})

const chatMessage = mongoose.model("chatMessage", chatMessageSchema)

module.exports = { chatMessage }