import { Router } from "express";
import { registerUser } from "../controllers/user.controller.js";
import { upload } from '../middlewares/multer.middleware.js'

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
