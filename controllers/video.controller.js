import mongoose, { isValidObjectId } from "mongoose"
import { Video } from "../models/video.model.js"
import { User } from "../models/user.model.js"
import { ApiError } from "../utils/ApiErrors.js"
import { ApiResponse } from "../utils/ApiResponse.js"
import { asyncHandler } from "../utils/asyncHandler.js"
import { uploadOnCloudinary, uploadVideoOnCloudinary } from "../utils/cloudinary.js"



const getAllVideos = asyncHandler(async (req, res) => {
    //TODO: get all videos based on query, sort, pagination

    // 1. getting details from user
    const { page = 1, limit = 10, query, sortBy, sortType, userId } = req.query

    // 2. valide functionality
    if (!sortBy || !sortType) {
        throw new ApiError(400, "Sort By or Sort Type is required")
    }

    // base filter
    const filter = { isPublished: true }

    // if query exists
    if (query) {
        filter.$or = [
            { title: { $regex: query, $options: 'i' } },
            { description: { $regex: query, $options: 'i' } }
        ]
    }

    // if userId exists
    if (userId) {
        // validate userId
        if (!isValidObjectId(userId)) {
            throw new ApiError(400, "User Id not found")
        }

        // injecting direct id
        filter.owner = userId;
    }

    const video = await Video.find(filter)

    return res.status(200)
        .json(
            new ApiResponse(
                201,
                video,
                "All Videos"
            )
        )

})

const publishAVideo = asyncHandler(async (req, res) => {
    // TODO: get video, upload to cloudinary, create video

    // 1. get video details
    const { title, description } = req.body

    if (!title || !description) {
        throw new ApiError(400, "Title or Description no received")
    }

    if (
        [title, description].some((field) => field.trim() === '')
    ) {
        throw new ApiError(400, "All Fields are required")
    }

    // 2. check for an existing video
    const existingVideo = await Video.findOne({ title })
    if (existingVideo) {
        throw new ApiError(400, `Video with the title ${title} already exist`)
    }

    console.log('req.body(title & description): ', req.body);


    // 3. Extracting the video path
    const videoPath = req.files?.video?.[0]?.path;
    const thumbnailPath = req.files?.thumbnail?.[0]?.path;

    if (!videoPath) {
        throw new ApiError(400, "Video file is missing");
    }

    if (!thumbnailPath) {
        throw new ApiError(400, "Thumbnail file is missing");
    }

    console.log("req.file (video): ", req.files);

    // 4. Upload to cloudinary
    let videoUrl;
    let thumbnailUrl;
    let duration;
    try {

        console.log("Files received by multer:", req.files);
        const videoResponseoUrl = await uploadVideoOnCloudinary(videoPath);
        videoUrl = videoResponseoUrl?.secure_url;
        duration = videoResponseoUrl.duration;
        console.log('videoResponseFromCloudinary:', videoResponseoUrl);

        const thumbnailResponse = await uploadOnCloudinary(thumbnailPath);
        thumbnailUrl = thumbnailResponse?.secure_url;
    } catch (error) {
        throw new ApiError(500, "Cloudinary Upload Failed: " + error?.message)
    }

    // 5. Creating Video Object 
    const video = await Video.create({
        video: videoUrl,
        thumbnail: thumbnailUrl,
        owner: req.user._id,
        title,
        description,
        duration,
        isPublished: true
    })

    // 6. return response
    return res.status(201).json(
        new ApiResponse(
            201,
            video,
            "Video Published SuccessFully"
        )
    )

})

const getVideoById = asyncHandler(async (req, res) => {
    const { videoId } = req.params
    //TODO: get video by id
})

const updateVideo = asyncHandler(async (req, res) => {
    const { videoId } = req.params
    //TODO: update video details like title, description, thumbnail

})

const deleteVideo = asyncHandler(async (req, res) => {
    const { videoId } = req.params
    //TODO: delete video
})

const togglePublishStatus = asyncHandler(async (req, res) => {
    const { videoId } = req.params
})

export {
    getAllVideos,
    publishAVideo,
    getVideoById,
    updateVideo,
    deleteVideo,
    togglePublishStatus
}