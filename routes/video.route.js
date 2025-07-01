import { Router } from "express";
import { getAllVideos, publishAVideo } from "../controllers/video.controller.js";
import { upload } from "../middlewares/multer.middleware.js";
import { jwtVerify } from "../middlewares/auth.middleware.js";

const router = Router();

router.route("/upload").post(
    // jwtVerify,
    upload.fields([
        { name: "video", maxCount: 1},
        { name: "thumbnail", maxCount: 1}
    ]),
    publishAVideo
)

router.route("/getAllVideos").get(
    getAllVideos
)

export default router;