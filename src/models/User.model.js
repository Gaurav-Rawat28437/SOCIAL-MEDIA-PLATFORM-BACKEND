const mongoose = require("mongoose")

const userSchema = new mongoose.Schema({
    email: {
        type: String,
        required: true,
        unique: true,
        trim: true,
        lowercase: true
    },
    password: {
        type: String,
        required: true,
    },
    username: {
        type: String,
        required: true,
        unique: true,
        trim: true,
        minLength: 2,
        maxLength: 20
    },
    firstName: {
        type: String,
        trim: true,
        minLength: 2,
        maxLength: 15
    },
    lastName: {
        type: String,
        trim: true
    },
    dateOfBirth: {
        type: String
    },
    gender: {
        type: String,
        enum: ["male", "female", "other"]
    },
    displayPicture: {
        type: String,
        default: ""
    },
    coverPicture: {
        type: String,
        default: ""
    },
    bio: {
        type: String,
        maxlength: 500,
        default: ""
    },
    isCompletedProfile: {
        type: Boolean,
        default: false
    },
    followersCount: {
        type: Number,
        default: 0
    },

    followingCount: {
        type: Number,
        default: 0
    },
    postCount: {
    type: Number,
    default: 0
},

thoughtCount: {
    type: Number,
    default: 0
}
}, {
    timestamps: true
})

const userModel = mongoose.model("user", userSchema)

module.exports = {
    userModel
}