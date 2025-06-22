import { ApiError } from '../utils/ApiErrors.js';
import { asyncHandler } from '../utils/asyncHandler.js'
import { User } from '../models/user.model.js'
import { uploadOnCloudinary } from '../utils/cloudinary.js'
import { ApiResponse } from '../utils/ApiResponse.js'
import jwt from 'jsonwebtoken'
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

        console.log("Tokens inside the generation function \n", "accessToken: ", accessToken, "\nrefreshToken: ", refreshToken);

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

    // 1. req body -> data
    console.log('req.headers inside the login funciton: ', req.headers || {});
    console.log('req.body inside the login funciton: ', req.body || {});
    const { userName, email, password } = req.body;

    // username or email based login
    if (!(userName || email)) {
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

    // access and refresh token
    const { accessToken, refreshToken } = await generateAccessTokenAndRefreshToken(user._id)
    console.log("Tokens inside the login function \n", "accessToken: ", accessToken, "\nrefreshToken: ", refreshToken);

    // updating the user with token except unwanted fields like password and refreshToken
    const LoggedInUser = await User.findById(user._id).select("-password -refreshToken")

    // sending cookies
    const options = {
        httpOnly: true,
        secure: true,
    }

    // sending response (send cookie)
    return res
        .status(200)
        .cookie("refreshToken", refreshToken, options)
        .cookie("accessToken", accessToken, options)
        .json(
            new ApiResponse(
                200,
                {
                    // it might possible the user is on mobile so he can't store the data's on local storage
                    user: LoggedInUser,
                    refreshToken,
                    accessToken
                },
                "User Logged In Successfully"
            )
        )
})

const logOutUser = asyncHandler(async (req, res) => {
    await User.findByIdAndUpdate(
        req.user._id,
        {
            $set: { refreshToken: undefined }
        },
        {
            new: true
        }
    )
    // sending cookies
    const options = {
        httpOnly: true,
        secure: true,
    }

    return res
        .status(200)
        .clearCookie("refreshToken", options)
        .clearCookie("accessToken", options)
        .json(
            new ApiResponse(200, {}, "User Logged Out")
        )
})

// creating end point to refresh token
const refreshAccessToken = asyncHandler(async (req, res) => {
    // getting token from user
    const incomingRefreshToken = req.cookies.refreshToken || req.body.refreshToken

    // what if we didn't get the token
    if (!incomingRefreshToken) {
        throw new ApiError(400, "Unauthorize Request")
    }

    try {
        // verifying incoming token
        const decodedToken = jwt.verify(incomingRefreshToken, process.env.REFRESH_TOKEN_SECRET)

        const user = await User.findById(decodedToken?._id)

        if (incomingRefreshToken !== user?.refreshToken) {
            throw new ApiError(401, "Invalid Refresh Token or Token Expired/Used")
        }

        const { accessToken, newRefreshToken } = await generateAccessTokenAndRefreshToken(user._id)

        const options = {
            httpOnly: true,
            secure: true
        }

        return res
            .status(200)
            .cookie("accessToken", accessToken, options)
            .cookie("refreshToken", newRefreshToken)
            .json(
                new ApiResponse(
                    200,
                    { accessToken, refreshToken: newRefreshToken },
                    "Access Token Updated"
                )
            )
    } catch (error) {
        throw new ApiError(402, error?.message || "Errror Decoding Token")
    }

})


export { registerUser, loginUser, logOutUser, refreshAccessToken }


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
