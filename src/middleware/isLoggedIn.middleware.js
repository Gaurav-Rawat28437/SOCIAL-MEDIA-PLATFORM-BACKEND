const jwt = require("jsonwebtoken")

const {userModel} =require("../models/User.model")


const isLoggedIn = async(req, res, next) => {
    try {
        const { token } = req.cookies
        

        const decoded = jwt.verify(token, process.env.JWT_SECRET)
    
        const foundUser= await userModel.findById(decoded.id).select("-password")
        
        if(!foundUser) throw new Error("token is invalid")

        req.foundUser=foundUser
        next()

    }
    catch (error) {
        res.status(400).json({
            msg:"please login first",
            error:error
        })
    }
}

module.exports = {
    isLoggedIn
}