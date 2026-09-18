const mongoose=require("mongoose")


const otpSchema=new mongoose.Schema({

    otp:{
        type:String,
        required:true
    },
    email:{
        type:String,
        required:true,
        unique:true,
        trim:true
    },
    expireAt:{
        type: Date,
        default: Date.now,
        expires: 180

    }
},{
    timestamps:true
})

const otpModel=mongoose.model("OTP",otpSchema)

module.exports={
    otpModel
}