const mongoose = require("mongoose")

const chatListSchema=mongoose.Schema({
    user:{
        type: mongoose.Schema.Types.ObjectId,
        ref: "user",
        required: true
    },
    chatList:[{
        type: mongoose.Schema.Types.ObjectId,
        ref: "user",
    }]
},{
   timestamps: true
})

const chatListModel=mongoose.model("chatList",chatListSchema)

module.exports ={
    chatListModel
}