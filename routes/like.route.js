import { Router } from "express";
import { jwtVerify } from '../middlewares/auth.middleware.js'
import {
    getLikedVideos,
    toggleCommentLike,
    toggleTweetLike,
    toggleVideoLike
} from "../controllers/like.controller.js";

const router = Router()
router
    .route('/toggle-like/video/:videoId')
    .patch(jwtVerify, toggleVideoLike)

router
    .route('/toggle-like/comment:commentId')
    .patch(jwtVerify, toggleCommentLike)

router
    .route('/toggle-like/tweet/:tweetId')
    .patch(jwtVerify, toggleTweetLike)

router
    .route('/get-all-liked-videos')
    .get(jwtVerify, getLikedVideos)

export default router