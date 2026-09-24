const express=require("express")
const cors=require("cors")
require("dotenv").config()
const app=express()
const cookieParser=require("cookie-parser")

const {authRouter}=require("./routes/auth.routes")
const {profileRouter}=require("./routes/profile.routes")
const { postRouter } = require("./routes/post.routes")
const { isLoggedIn } = require("./middleware/isLoggedIn.middleware")
const { likeRouter } = require("./routes/like.routes")
const { commentRouter } = require("./routes/comment.routes")
const { userRouter } = require("./routes/user.routes")
const { chatRouter } = require("./routes/chat.routes")




app.use(cors({
    origin:[process.env.FE_URL,"http://localhost:5173","http://localhost:5174","http://localhost:5175"],
    credentials: true
}))

app.use(express.json())
app.use(cookieParser())

app.use("/api/auth",authRouter)
app.use("/api/profile",profileRouter)
app.use("/api/post",isLoggedIn,postRouter)
app.use("/api/like",isLoggedIn,likeRouter)
app.use("/api/comment",isLoggedIn,commentRouter)
app.use("/api/user", isLoggedIn, userRouter)
app.use("/api/chat",isLoggedIn,chatRouter)

app.use((req,res)=>{
    res.status(400).json({
        error:"api not found,this api is not a part of server"
    })
})

app.get("/",(req,res)=>{
    try{
        res.json({
            msg:"all good"
        })
    }
    catch(error){
        console.log(error)
        res.json({
            msg:error.message,
            error:error
        })
    }
})

module.exports=app