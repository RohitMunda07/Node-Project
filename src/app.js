import express from 'express'
import cookieParser from 'cookie-parser'
import cors from 'cors'
// importing userRouter
import userRouter from '../routes/user.route.js'
import videoRouter from '../routes/video.route.js'
import tweetRouter from '../routes/tweet.route.js'
import multer from 'multer'

const app = express()

// configuration for CORS
app.use(cors({
    origin: process.env.CORS_ORIGIN,
    credentials: true
}))

// configuration for accepting json file
app.use(express.json({limit: '20kb'}))

// // configuration for URL
app.use(express.urlencoded({extended: true, limit: "16"}))


// configuration for public assets to store files like avtar, pdf etc on our own server
app.use(express.static("public"))

// confuguration for cookies
app.use(cookieParser())

// user route
app.use("/api/v1/users", userRouter)

// video route
app.use("/api/v1/videos", videoRouter)
// working -> http://localhost3000/api/v1/users/register

// tweet route
app.use("/api/v1/tweets", tweetRouter)




















// ✅ Error handler for multer
// app.use((err, req, res, next) => {
//     if (err instanceof multer.MulterError) {
//         return res.status(400).json({ message: `Multer Error: ${err.message}` });
//     } else if (err) {
//         return res.status(500).json({ message: `Unexpected Error: ${err.message}` });
//     }

//     next();
// });


export { app }