import { Router } from "express";
import { publishAVideo } from "../controllers/video.controller.js";
import { upload } from "../middlewares/multer.middleware.js";

const router = Router();

router.route("/upload").post(
    upload.fields([
        { name: "video", maxCount: 1},
        { name: "thumbnail", maxCount: 1}
    ]),
    publishAVideo
)

export default router;