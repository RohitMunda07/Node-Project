import { Router } from "express";
import { jwtVerify } from "../middlewares/auth.middleware.js";
import { createTweet, deleteTweet, getUserTweets, updateTweet } from "../controllers/tweet.controller.js";
import { upload } from "../middlewares/multer.middleware.js";

const router = Router()

router.route("/").post(
    jwtVerify,
    upload.single("tweetPost"),
    createTweet
).get(
    jwtVerify,
    getUserTweets
)

router.route("/:tweetId").patch(
    jwtVerify,
    upload.single('tweetPost'),
    updateTweet
).delete(
    jwtVerify,
    deleteTweet
)

export default router;