import { Router } from "express";
import { loginUser, logOutUser, registerUser, refreshAccessToken, updateUserAvatar, updateUserCoverImage, changeCurrentPassword, getCurrentUser, updateAccoutDetails, getUserChannelProfile, getUserWatchHistory } from "../controllers/user.controller.js";
import { upload } from '../middlewares/multer.middleware.js'
import { jwtVerify } from "../middlewares/auth.middleware.js";
import jwt from "jsonwebtoken";

const router = Router();

// router.post("/register", upload.fields([
//   { name: "avatar", maxCount: 1 },
//   { name: "coverImage", maxCount: 1 }
// ]), registerUser);

router.route("/register").post(
    upload.fields([
        { name: "avatar", maxCount: 1 },
        { name: "coverImage", maxCount: 1 }
    ]),
    registerUser
)

router.route("/login").post(loginUser)

// secure routes
router.route('/logout').post(jwtVerify, logOutUser)
router.route('/refresh-token').post(refreshAccessToken)
router.route('/change-password').post(jwtVerify, changeCurrentPassword)
router.route('/current-user').get(jwtVerify, getCurrentUser)
router.route('/update-account').patch(jwtVerify, updateAccoutDetails)
router.route('/avatar').patch(
    jwtVerify, // jwtVerify checks if the incoming request has a valid JWT (usually in cookies or headers).
    upload.single('avatar'), // handles single file with fieldname 'avatar'
    updateUserAvatar
)
router.route('/cover-image').patch(
    jwtVerify, // jwtVerify is essential for securing routes and making sure only logged-in users can perform certain actions.
    upload.single('coverImage'), // handles single file with fieldname 'coverImage'
    updateUserCoverImage
)
router.route('/c/:username').get(jwtVerify, getUserChannelProfile) // since we are retriving the data from url
router.route('/watch-history').get(jwtVerify, getUserWatchHistory)

// debug code
router.post('/debug', upload.any(), (req, res) => {
    console.log("DEBUG BODY:", req.body);
    console.log("DEBUG FILES:", req.files);
    res.json({ body: req.body, files: req.files });
});


export default router;


// import { Router } from "express";
// import { upload } from '../middlewares/multer.middleware.js';

// const router = Router();

// router.post("/register", upload.fields([
//   { name: "avatar", maxCount: 1 },
//   { name: "coverImage", maxCount: 1 }
// ]), (req, res) => {
//   console.log("BODY:", req.body);
//   console.log("FILES:", req.files);
//   res.status(200).json({ message: "✅ File and data received" });
// });

// export default router;
