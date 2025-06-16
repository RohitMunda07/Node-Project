import express from 'express'
import cookieParser from 'cookie-parser'
import cors from 'cors'

const app = express()

// configuration for CORS
app.use(cors({
    origin: process.env.CORS_ORIGIN,
    credentials: true
}))

// configuration for accepting json file
app.use(express.json({limit: '20kb'}))

// configuration for URL
app.use(express.urlencoded({extended: true, limit: "16"}))

// configuration for public assets to store files like avtar, pdf etc on our own server
app.use(express.static("public"))

// confuguration for cookies
app.use(cookieParser())

// importing userRouter
import userRouter from '../routes/user.route.js'

app.use("/api/v1/users", userRouter)
// working -> http://localhost3000/api/v1/users/register

export { app }