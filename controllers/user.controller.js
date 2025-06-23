import { ApiError } from '../utils/ApiErrors.js';
import { asyncHandler } from '../utils/asyncHandler.js'
import { User } from '../models/user.model.js'
import { uploadOnCloudinary } from '../utils/cloudinary.js'
import { ApiResponse } from '../utils/ApiResponse.js'
import jwt from 'jsonwebtoken'
import fs from 'fs'
import { upload } from '../middlewares/multer.middleware.js';
import { channel, subscribe } from 'diagnostics_channel';
import mongoose from 'mongoose';

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
    let coverImageRes, coverRes;

    try {
        coverImageRes = await uploadOnCloudinary(avatarLocalPath);
        coverRes = await uploadOnCloudinary(coverImageLocalPath);
    } catch (err) {
        throw new ApiError(500, "Cloudinary Upload Failed: " + err.message);
    }

    // 6. create user object - create entry in DB
    const user = await User.create({
        fullName,
        avatar: coverImageRes.url,
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

// change password only when use is logged in => access of user(method assigned by middleware)
const changeCurrentPassword = asyncHandler(async (req, res) => {
    // taking fields from user
    const { oldPassoword, newPassword } = req.body // basically in json format

    const user = await User.findById(req.user?._id)

    const isOldPasswordCorrect = await user.isPasswordCorrect(oldPassoword)

    if (!isOldPasswordCorrect) {
        throw new ApiError(400, "Invalid Old Password")
    }

    user.password = newPassword
    user.save({ validateBeforeSave: false })

    return res
        .status(200)
        .json(
            new ApiResponse(
                200,
                {},
                "Password Changed Successfully"
            )
        )
})

// get current user
const getCurrentUser = asyncHandler(async (req, res) => {
    return res.status(200).json(200, req.user, "User Fetch Successfully")
})

// update Account Details
const updateAccoutDetails = asyncHandler(async (req, res) => {
    // getting fields from user
    const { fullName, email } = req.body

    if (!(fullName || email)) {
        throw new ApiError(400, "Error fetching FullName or Email")
    }

    const user = await User.findByIdAndUpdate(
        req.user?._id,
        {
            $set: {
                fullName,
                email: email
            }
        },
        { new: true } // returns the updated user with new values
    ).select("-password -refreshToken")

    return res
        .status(200)
        .json(
            new ApiResponse(200, user, "Account Updated Successfully")
        )
})

// update user Avatar
const updateUserAvatar = asyncHandler(async (req, res) => {
    // multer provides req.file for single image upload
    const avatarLocalPath = req.file?.path

    if (!avatarLocalPath) {
        throw new ApiError(400, "Avatar Not Available")
    }

    try {
        const coverImageRes = await uploadOnCloudinary(avatarLocalPath)
        if (!coverImageRes.url) {
            throw new ApiError(500, "Something went wrong while uploading avatar")
        }
    } catch (error) {
        throw new ApiError(500, error?.message || "Error in Uploading file")
    }

    const user = await User.findByIdAndUpdate(
        req.user?._id,
        { $set: { avatar: coverImageRes?.url } },
        { new: true }
    ).select("-password -refreshToken")

    return res
        .status(200)
        .json(
            new ApiResponse(
                200,
                user,
                "Avatar Updated Successfully"
            )
        )

})

// update user CoverImage
const updateUserCoverImage = asyncHandler(async (req, res) => {
    // multer provides req.file for single image upload
    const coverImageLocalPath = req.file?.path

    if (!coverImageLocalPath) {
        throw new ApiError(400, "Cover Image Not Available")
    }

    try {
        const coverImageRes = await uploadOnCloudinary(coverImageLocalPath)
        if (!coverImageRes.url) {
            throw new ApiError(500, "Something went wrong while uploading avatar")
        }
    } catch (error) {
        throw new ApiError(500, error?.message || "Error in Uploading file")
    }

    const user = await User.findByIdAndUpdate(
        req.user?._id,
        { $set: { coverImage: coverImageRes?.url } },
        { new: true }
    ).select("-password -refreshToken")

    return res
        .status(200)
        .json(
            new ApiResponse(
                200,
                user,
                "Cover Image Updated Successfully"
            )
        )

})

// getting user's channel profile
const getUserChannelProfile = asyncHandler(async (req, res) => {
    const { username } = req.params // this is the url

    if (!username?.trim()) {
        throw new ApiError(400, "Username not found")
    }

    // channel is an array
    const channel = await User.aggregate([
        {
            $match: {
                userName: username?.toLowerCase()
            }
        },
        {
            $lookup: {
                from: "subscriptions",
                localField: "_id",
                foreignField: "channel",
                as: "Subscribers"
            }
        },
        {
            $lookup: {
                from: "subscriptions",
                localField: "_id",
                foreignField: "subscriber",
                as: "SubscribeTo"
            }
        },
        {
            $addFields: {
                subscribeCount: {
                    $size: "$subscribers"
                },
                channelsSubscribedToCount: {
                    $size: "$subscribeTo"
                },
                isSubscribed: {
                    $cond: {
                        // Is the current user has subscribed or not 
                        if: { $in: [req.user?._id, "subscribers.subscriber"] },
                        then: true,
                        else: false
                    }
                }
            }
        },
        {
            $project: {
                fullName: 1,
                userName: 1,
                subscribeCount: 1,
                channelsSubscribedToCount: 1,
                isSubscribed: 1,
                avatar: 1,
                coverImage: 1,
                email: 1
            }
        }
    ])

    console.log("channel: ", channel)

    if (!channel) {
        throw new ApiError(400, "Channel does not exits")
    }

    return res
        .status(200)
        .json(
            new ApiResponse(
                200,
                channel[0], // always return the first value of aggregation
                "Channel fetch SuccessFull"
            )
        )
})

// getting watch history
const getUserWatchHistory = asyncHandler(async (req, res) => {
    const user = await User.aggregate([
        {
            $match: {
                // we need to use mongoos to typecast the string user._id to mongoDB valid id
                _id: new mongoose.Types.ObjectId(req.user?._id)
            }
        },
        {
            // At this point I'm under user document
            $lookup: {
                from: "videos", // mongoDB stores the name in lowerCase and adds 's' at last of document name
                localField: "watchHistory",
                foreignField: "_id",
                as: "watchHistory",
                pipeline: [
                    // At this point I'm under video document
                    {
                        $lookup: {
                            from: "users",
                            localField: "owner",
                            foreignField: "_id",
                            as: "owner", // since we have plenty of filed inside this owner(all fields of user)
                            pipeline: [
                                // these data have been stored under owner field
                                {
                                    $project: {
                                        avatar: 1,
                                        userName: 1,
                                        fullName: 1
                                    }
                                }
                            ]
                        }
                    },
                    {
                        $addFields: {
                            // using owner name will overwrite the existing field
                            owner: {
                                $first: "$owner", // at this line we are returning the object to front-end
                                // $arrayEleAt: ["$owner", 0] // alternat method
                            }
                        }
                    }
                ]
            }
        }
    ])

    return res
    .status(200)
    .json(
        new ApiResponse(
            200,
            user[0].watchHistory,
            "Watch history fetched successfully"
        )
    )
})


export {
    registerUser,
    loginUser,
    logOutUser,
    refreshAccessToken,
    changeCurrentPassword,
    getCurrentUser,
    updateAccoutDetails,
    updateUserAvatar,
    updateUserCoverImage,
    getUserChannelProfile,
    getUserWatchHistory
}


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
//   let coverImageRes, coverRes;
//   try {
//     coverImageRes = await uploadOnCloudinary(avatarPath);
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
//     avatar: coverImageRes?.url,
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
