import { ApiError } from "../utils/ApiErrors.js";
import { asyncHandler } from "../utils/asyncHandler.js";
import jwt from "jsonwebtoken";
import { User } from "../models/user.model.js";


export const jwtVerify = asyncHandler(async (req, _, next) => {
    try {
        // jwt token format: Authorization: Bearer <token>
        const token = req.cookies?.accessToken || req.header('Authorization')?.replace("Bearer ", "")

        if (!token) {
            throw new ApiError(401, "Unauthorized Request")
        }

        const decodedToken = jwt.verify(token, process.env.ACCESS_TOKEN_SECRET)
        
        if (!decodedToken) {
            throw new ApiError(401, "Invalid Access Token")
        }
        
        const user = await User.findById(decodedToken?._id).select('-password -refreshToken')

        req.user = user; // added user(method) to req
        next() // moving the middleware
    } catch (error) {
        throw new ApiError(401, error?.message || 'Invalid Access Token')
    }
})