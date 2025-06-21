# Node-Project
# Always use try-catch syntax
# Use Async-await
# Database is in another continent
# Bcrypt is used for password hashing 
# Aggeregation pipline used for handling query request and more
# MiddleWare -> if you are going meet me
# For using Multer :-
## first -> configure it 
## second -> simply import wherever you need to use it
## multer is used just before the execution of any method

## This is a middleware that starts just before the saving password
userSchema.pre("save", async function (next) {
    this.password = bcript.hash(this.pasq, 10)
    next( )
})

so whenever the user tries to save the file i will always encrypt the password

The some() method checks if any array elements pass a test (provided as a callback function)
When to Use some():--
You would typically use some() when you need to answer a "yes/no" question about whether any element in an array meets a certain criteria

the trim() method is used to remove whitespace from both ends of a string









import { ApiError } from '../utils/ApiErrors.js';
import { asyncHandler } from '../utils/asyncHandler.js'
import { User } from '../models/user.model.js'
import { uploadOnCloudinary } from '../utils/cloudinary.js'
import { ApiResponse } from '../utils/ApiResponse.js'

const registerUser = asyncHandler(async (req, res) => {

    console.log("INSIDE REGISTER CONTROLLER");
    console.log("BODY:", req.body);
    console.log("FILES:", req.files);
    
    return res.status(200).json({ message: "debug complete" }); // TEMPORARY RETURN
    // 1. get user details from frontend
    // const { userName, email, fullName, password } = req.body;
    // console.log("Post datas: ", userName, email, fullName, password);

    // if (!userName || !email || !fullName || !password) {
    //     throw new ApiError(400, "All fields are required");
    // }

    // res.status(200).json({ message: "Working so far ✅" });

    // // 2. validation - not empty
    // if (
    //     [userName, email, fullName, password].some((field) => field?.trim() === "")
    // ) {
    //     throw new ApiError(400, "All field are required")
    // }

    // if (!email.includes('@')) {
    //     throw new ApiError(400, "Email must contain @")
    // }

    // // 3. check if user already exists: username, email
    // const existingUser = await User.findOne({
    //     $or: [{ userName }, { email }]
    // })
    // if (existingUser) {
    //     throw new ApiError(409, `User with ${email} or ${userName} already exits`)
    // }

    // // 4. check for images, check for avtar
    // // since we are using multer it provides us extra method like files
    // // use the name as mentioned on user.router.js since multer is injected there
    // const avatarLocalPath = req.files?.avatar[0]?.path
    // const coverImageLocalPath = req.files?.coverImage[0]?.path
    // // check for avatar image
    // if (!avatarLocalPath) {
    //     throw new ApiError(400, "Avatar file is required")
    // }

    // // 5. upload them to cloudinary, avtar
    // // it will take time so we need to use await
    // const avatarRes = await uploadOnCloudinary(avatarLocalPath)
    // const coverRes = await uploadOnCloudinary(coverImageLocalPath)
    // if (!avatarRes) {
    //     throw new ApiError(400, "Avatar file is required")
    // }

    // // 6. create user object - create entry in DB
    // const user = await User.create({
    //     fullName,
    //     avatar: avatarRes.url,
    //     coverImage: coverRes?.url || "", // if extist take it out otherwise let it ""
    //     email,
    //     password,
    //     userName: userName.toLowerCase()
    // })

    // // 7. remove password and refresh token field from response
    // // .select() -> by defalut selects all the fields so we need to mention which field to deselect
    // const userCreated = await User.findById(user._id).select(
    //     "-password -refreshToken"
    // )

    // // 8. check for user creation
    // if (!userCreated) {
    //     throw new ApiError(500, "Something went wrong while registering user")
    // }

    // 9. return response
    // return res.status(201).json(
    //     new ApiResponse(200, userCreated, "User Registered SuccessFully")
    // )

})

export { registerUser }