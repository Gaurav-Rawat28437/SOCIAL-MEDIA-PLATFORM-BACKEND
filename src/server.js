const app = require("./app")
require("dotenv").config()
const mongoose = require("mongoose")

const http = require("http")
const fn = require("socket.io")

const dns = require("dns")

dns.setServers([
    "8.8.8.8",
    "8.8.4.4"
])


const server = http.createServer(app)
const { chatMessage } = require("./models/chatMessage.modal")
const { chatListModel } = require("./models/chatList.model")

const io = fn(server, {
    cors: {
        origin: [process.env.FE_URL, "http://localhost:5173", "http://localhost:5174", "http://localhost:5175"]
    },
    // credentials:true,
})



io.on("connection", (socket) => {

    socket.on("identify", (userId) => {
        socket.userId = userId
    })

    socket.on("join-room", ({ sender, receiver }) => {

        const roomId = [sender.trim(), receiver.trim()].sort().join("")
        socket.join(roomId)
    })

    socket.on("send-msg", async ({ sender, receiver, text, senderUser }) => {

        const roomId = [sender.trim(), receiver.trim()].sort().join("")

        const message = await chatMessage.create({
            sender,
            receiver,
            text,
        })

        const senderChatList = await chatListModel.findOne({
            user: sender
        })

        if (senderChatList) {
            senderChatList.chatList = [
                receiver,
                ...senderChatList.chatList.filter(
                    id => id.toString() !== receiver
                )
            ]

            await senderChatList.save()
        }

        const receiverChatList = await chatListModel.findOne({
            user: receiver
        })

        if (receiverChatList) {
            receiverChatList.chatList = [
                sender,
                ...receiverChatList.chatList.filter(
                    id => id.toString() !== sender
                )
            ]

            await receiverChatList.save()
        }

        socket.to(roomId).emit("resv-msg", {
            sender,
            receiver,
            text,
            _id: message._id,
            createdAt: message.createdAt
        })

        const receiverSocket = [...io.sockets.sockets.values()]
            .find(socket => socket.userId === receiver)

        if (receiverSocket) {
            receiverSocket.emit("receive-global-listener", {
                sender,
                receiver,
                senderUser,
            })
        }


    })

    socket.on("mark-seen", ({ sender, receiver }) => {

        const roomId = [sender.trim(), receiver.trim()].sort().join("")

        socket.to(roomId).emit("messages-seen", {
            sender,
            receiver
        })

    })





})



const PORT = process.env.PORT || 8080

mongoose.connect(process.env.MONGO_URL)
    .then(() => {

        console.log("MONGO DB is connected...")


        server.listen(PORT, () => {
            console.log(`server is running on port ${PORT}...`)
        })
    })
    .catch((error) => {
        console.log(error)
    })

