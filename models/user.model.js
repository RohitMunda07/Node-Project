import mongoose, { Schema } from "mongoose";
import jwt from 'jsonwebtoken'
import bcript from 'bcrypt'

const userSchema = new Schema({
    userName: {
        type: String,
        required: true,
        unique: true,
        lowerCase: true,
        trim: true,
        index: true // searchable
    },
    email: {
        type: String,
        required: true,
        unique: true,
        lowerCase: true,
        trim: true,
    },
    fullName: {
        type: String,
        required: true,
        trim: true,
        index: true
    },
    avtar: {
        type: String, // cloudinary url
        required: true
    },
    coverImage: {
        type: String // cloudinary url
    },
    watchHistory: [{
        type: Schema.Types.ObjectId,
        ref: 'Video',
    }],
    password: {
        type: String, // encrypted password
        required: [true, 'Password is required']
    },
    refreshToken: {
        type: String
    }

}, { timestamp: true })


userSchema.pre("save", async function (next) {
    if (!isModified('password')) return next()

    this.password = bcript.hash(this.password, 10)
    next()
})

// we also need to check the password
// it will take time to compare the password so we need to use async await
userSchema.methods.isPasswordCorrect = async function (password) {
    return await bcript.compare(password, this.password)
}

// generating Access Token and Refresh Token
userSchema.methods.generateAccessToken = function () {
    return jwt.sign(
        {
            _id: this.id,
            email: this.email,
            userName: this.userName,
            fullName: this.fullName
        },
        process.env.ACCESS_TOKEN_SECRET,
        {
            expiresIn: process.env.ACCESS_TOKEN_EXPIRY
        }
    )
}

userSchema.methods.generateRefreshToken = function () {
    return jwt.sign(
        {
            _id: this.id,
        },
        process.env.REFRESH_TOKEN_SECRET,
        {
            expiresIn: process.env.REFRESH_TOKEN_EXPIRY
        }
    )
}

export const User = mongoose.model("User", userSchema)