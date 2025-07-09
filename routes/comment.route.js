import { Router } from "express";
import { jwtVerify } from "../middlewares/auth.middleware.js";
import { upload } from "../middlewares/multer.middleware.js"
import {
    addComment,
    deleteComment,
    getVideoComments,
    updateComment
} from "../controllers/comment.controller.js";

const router = Router()

router
    .route('/comments/:videoId')
    .get(jwtVerify, getVideoComments)
    .post(jwtVerify, upload.none(), addComment)

router
    .route("/commets/:commentId")
    .patch(jwtVerify, updateComment)
    .delete(jwtVerify, deleteComment)

export default router