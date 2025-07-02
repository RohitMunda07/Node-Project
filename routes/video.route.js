import { Router } from "express";
import { getAllVideos, getVideoById, publishAVideo } from "../controllers/video.controller.js";
import { upload } from "../middlewares/multer.middleware.js";
import { jwtVerify } from "../middlewares/auth.middleware.js";

const router = Router();

router.route("/upload").post(
    jwtVerify,
    upload.fields([
        { name: "video", maxCount: 1},
        { name: "thumbnail", maxCount: 1}
    ]),
    publishAVideo
)

router.route("/getAllVideos").get(
    jwtVerify,
    getAllVideos
)

router.route("/:videoId").get(
    jwtVerify,
    getVideoById
)

export default router;