import { ApiError } from '../utils/ApiErrors.js';
import { asyncHandler } from '../utils/asyncHandler.js'
import { User } from '../models/user.model.js'
import { uploadOnCloudinary } from '../utils/cloudinary.js'
import { ApiResponse } from '../utils/ApiResponse.js'
import fs from 'fs'

// it is a internal function we don't need to use ascyncHandle(used for server communication)
const generateAccessTokenAndRefreshToken = async (userId) => {
    try {
        const user = await User.findById(userId);
        const accessToken = await user.generateAccessToken();
        const refreshToken = await user.generateRefreshToken();

        // assigning refresh token in database
        user.refreshToken = refreshToken;
        await user.save({ validateBeforeSave: false }) // inOrder to avoid required fields like password

        return { accessToken, refreshToken }
    } catch (error) {
        throw new ApiError(500, "Something went wrong while generating refresh and access token")
    }
}

const registerUser = asyncHandler(async (req, res) => {

    console.log("INSIDE REGISTER CONTROLLER");
    console.log("BODY:", req.body);
    console.log("FILES:", req.files);

    // return res.status(200).json({ message: "debug complete" }); // TEMPORARY RETURN
    // 1. get user details from frontend
    const { userName, email, fullName, password } = req.body;
    console.log("Post datas: ", userName, email, fullName, password);
    console.log("req.body: ", req.body);

    if (!userName || !email || !fullName || !password) {
        throw new ApiError(400, "All fields are required");
    }

    // res.status(200).json({ message: "Working so far ✅" });

    // 2. validation - not empty
    if (
        [userName, email, fullName, password].some((field) => field?.trim() === "")
    ) {
        throw new ApiError(400, "All field are required")
    }

    if (!email.includes('@')) {
        throw new ApiError(400, "Email must contain @")
    }

    // 3. check if user already exists: username, email
    const existingUser = await User.findOne({
        $or: [{ userName }, { email }]
    })
    if (existingUser) {
        throw new ApiError(409, `User with ${email} or ${userName} already exits`)
    }

    // 4. check for images, check for avtar
    // since we are using multer it provides us extra method like files
    // use the name as mentioned on user.router.js since multer is injected there
    const avatarLocalPath = req.files?.avatar[0]?.path
    // const coverImageLocalPath = req.files?.coverImage[0]?.path
    let coverImageLocalPath;
    if (req.files && Array.isArray(req.files.coverImage) && req.files.coverImage.length > 0) {
        coverImageLocalPath = req.files.coverImage[0].path
    }
    console.log("req.files: ", req.files);
    // check for avatar image
    if (!avatarLocalPath) {
        throw new ApiError(400, "Avatar file is required")
    }

    // 5. upload them to cloudinary, avtar
    // it will take time so we need to use await
    let avatarRes, coverRes;

    try {
        avatarRes = await uploadOnCloudinary(avatarLocalPath);
        coverRes = await uploadOnCloudinary(coverImageLocalPath);
    } catch (err) {
        throw new ApiError(500, "Cloudinary Upload Failed: " + err.message);
    }

    // 6. create user object - create entry in DB
    const user = await User.create({
        fullName,
        avatar: avatarRes.url,
        coverImage: coverRes?.url || "", // if extist take it out otherwise let it ""
        email,
        password,
        userName: userName.toLowerCase()
    })

    // 7. remove password and refresh token field from response
    // .select() -> by defalut selects all the fields so we need to mention which field to deselect
    const userCreated = await User.findById(user._id).select(
        "-password -refreshToken"
    )

    // 8. check for user creation
    if (!userCreated) {
        throw new ApiError(500, "Something went wrong while registering user")
    }

    // 9. return response
    return res.status(201).json(
        new ApiResponse(200, userCreated, "User Registered SuccessFully")
    )

})

const loginUser = asyncHandler(async (req, res) => {

    // username or email based login

    // access and refresh token
    // send cookie

    // 1. req body -> data
    const { userName, email, password } = req.body;
    if (!userName || !email) {
        throw new ApiError(401, "username or email is required!!")
    }

    // 2. find the user on database
    const user = await User.findOne({
        $or: [{ userName }, { email }]
    })
    // if user not found on database
    if (!user) {
        throw new ApiError(400, "User not found")
    }

    // 3. password check
    const isPasswordValid = await user.isPasswordCorrect(password)
    if (!isPasswordValid) {
        throw new ApiError(400, "Password is invalid")
    }

    const { accessToken, refreshToken } = generateAccessTokenAndRefreshToken(user._id)

    // updating the user with token except unwanted fields like password and refreshToken
    const LoggedInUser = User.findById(user._id).select("-password -refreshToken")
})

export { registerUser }


// import { ApiError } from '../utils/ApiErrors.js';
// import { asyncHandler } from '../utils/asyncHandler.js';
// import { User } from '../models/user.model.js';
// import { uploadOnCloudinary } from '../utils/cloudinary.js';
// import { ApiResponse } from '../utils/ApiResponse.js';


// // const registerUser = async (req, res) => {
// //   try {
// //     console.log("---- Inside Register Controller ----");
// //     console.log("BODY:", req.body);
// //     console.log("FILES:", req.files);

// //     return res.status(200).json({
// //       success: true,
// //       message: "Data received",
// //       body: req.body,
// //       files: req.files,
// //     });
// //   } catch (err) {
// //     console.error("ERROR in controller:", err);
// //     return res.status(500).json({ message: "Internal Server Error" });
// //   }
// // };


// const registerUser = asyncHandler(async (req, res) => {
//   console.log("🔁 Inside Register Controller");
//   console.log("BODY:", req.body);
//   console.log("FILES:", req.files);

//   // 1. Extract fields
//   const { userName, email, fullName, password } = req.body;

//   // 2. Validation
//   if (![userName, email, fullName, password].every(Boolean)) {
//     throw new ApiError(400, "All fields are required");
//   }

//   if (!email.includes('@')) {
//     throw new ApiError(400, "Invalid email format");
//   }

//   // 3. Check if user exists
//   const existingUser = await User.findOne({
//     $or: [{ userName: userName.toLowerCase() }, { email }]
//   });

//   if (existingUser) {
//     throw new ApiError(409, `User with ${email} or ${userName} already exists`);
//   }

//   // 4. Check and extract file paths
//   const avatarPath = req.files?.avatar?.[0]?.path;
//   const coverImageLocalPath = req.files?.coverImage?.[0]?.path;

//   if (!avatarPath) {
//     throw new ApiError(400, "Avatar file is required");
//   }

//   // 5. Upload to Cloudinary
//   let avatarRes, coverRes;
//   try {
//     avatarRes = await uploadOnCloudinary(avatarPath);
//     coverRes = coverImageLocalPath ? await uploadOnCloudinary(coverImageLocalPath) : null;
//   } catch (error) {
//     throw new ApiError(500, `Cloudinary Upload Failed: ${error.message}`);
//   }

//   // 6. Create user
//   const user = await User.create({
//     fullName,
//     email,
//     password,
//     userName: userName.toLowerCase(),
//     avatar: avatarRes?.url,
//     coverImage: coverRes?.url || ""
//   });

//   // 7. Return sanitized response
//   const userCreated = await User.findById(user._id).select("-password -refreshToken");

//   if (!userCreated) {
//     throw new ApiError(500, "User creation failed");
//   }

//   return res.status(201).json(
//     new ApiResponse(201, userCreated, "User registered successfully ✅")
//   );
// });

// export { registerUser };
