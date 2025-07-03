import mongoose, { isValidObjectId } from "mongoose"
import fs from 'fs'
import { ObjectId } from "mongodb"
import { Video } from "../models/video.model.js"
import { User } from "../models/user.model.js"
import { ApiError } from "../utils/ApiErrors.js"
import { ApiResponse } from "../utils/ApiResponse.js"
import { asyncHandler } from "../utils/asyncHandler.js"
import { deleteOnCloudinary, uploadOnCloudinary, uploadVideoOnCloudinary } from "../utils/cloudinary.js"



const getAllVideos = asyncHandler(async (req, res) => {
    //TODO: get all videos based on query, sort, pagination

    // 1. getting details from user
    const { page = 1, limit = 10, query, sortBy, sortType, userId } = req.query

    // 2. valide functionality
    if (!sortBy || !sortType) {
        throw new ApiError(400, "sortBy and sortType are required")
    }

    // 3. base filter
    const filter = { isPublished: true }

    // 4. if query exists - add search functionality
    if (query) {
        filter.$or = [
            { title: { $regex: query, $options: 'i' } },
            { description: { $regex: query, $options: 'i' } }
        ]
    }

    // 5. if userId exists - filter by owner
    if (userId) {
        // validate userId
        if (!isValidObjectId(userId)) {
            throw new ApiError(400, "User Id not found")
        }

        // injecting direct id
        filter.owner = userId;
    }

    // 6. handle sorting
    // 1 for ascending order, -1 for descending order
    let sortVal;
    if (sortType && sortType.trim !== '') {
        const normalizedSortType = sortType.toLowerCase();
        if (normalizedSortType === 'ascending' || normalizedSortType === 'asc') {
            sortVal = 1;
        } else if (normalizedSortType === 'descending' || normalizedSortType === 'desc') {
            sortVal = -1;
        } else {
            throw new ApiError(400, "sortType must be 'asc', 'desc', 'ascending', or 'descending'")
        }
    }

    // 7. dynamic sorting
    let sortObject = {}
    sortObject[sortBy] = sortVal


    // 8. pagination offset value
    let offset = (Number(page) - 1) * Number(limit);

    // 9. get total count for pagination info
    const totalVideos = await Video.countDocuments(filter)
    const totalPage = Math.ceil(totalVideos) / Number(limit)

    // 10. fetch videos with all filters, sorting, and pagination
    const video = await Video.find(filter)
        .sort(sortObject)
        .limit(limit)
        .skip(offset)

    // 11. create response with pagination info

    // 12. return response
    const responseData = {
        video,
        pagination: {
            totalPage,
            totalVideos,
            currentPage: Number(page),
            videosPerPage: Number(limit),
            hasNextPage: Number(page) < totalPage,
            hasPreviousPage: Number(page) > 1
        }
    }

    return res.status(200)
        .json(
            new ApiResponse(
                200,
                responseData,
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
    //TODO: get video by id
    const { videoId } = req.params
    // "_id": "68652e812131a4456a63d781",
    // "owner": "6856b4fca1f1d9df1b2dada5",

    if (videoId && !isValidObjectId(videoId)) {
        throw new ApiError(400, "Invalid Video Id")
        // id is valid but it also checks the format => {{server}}/videos/getVideoById68652d7299804def9a48ff74 -> invalid
    }

    const filter = {
        _id: videoId,
        isPublished: true
    }

    const video = await Video.findOne(filter)
    console.log("videoId: ", videoId)

    if (!video) {
        throw new ApiError(500, "Video not found")
    }

    return res.status(200)
        .json(
            new ApiResponse(
                200,
                video,
                `Video with id='${videoId}' Fetched Successfylly`
            )
        )
})

const updateVideo = asyncHandler(async (req, res) => {
    //TODO: update video details like title, description, thumbnail

    // 1. getting data from user
    const { title, description } = req.body || {}

    const { videoId } = req.params


    // 2. validate videoId
    if (!videoId || !isValidObjectId(videoId)) {
        throw new ApiError(400, "Invalid Video Id")
    }

    // 3. validate data fields
    if (!req.files) {
        throw new ApiError(400, "Files are Required")
    }

    // 4. local Path Extractions
    let thumbnailFile = req.files?.thumbnail?.[0]
    let videoFile = req.files?.video?.[0]

    if (!thumbnailFile || !videoFile) {
        throw new ApiError(400, "Thumbnail and Video files are required")
    }

    // assigning the local path 
    const thumbnailPath = thumbnailFile.path
    const videoPath = videoFile.path

    // 5. finding the existing path
    const existingVideo = await Video.findById(videoId)
    if (!existingVideo) {
        throw new ApiError(404, "Not Found")
    }

    // 6. validating title and description
    // handling the undefined case
    if (!title || !description) {
        throw new ApiError(400, "Title and Description are required")
    }

    // handling the empty sting case
    if (title.trim() === '' || description.trim() === '') {
        throw new ApiError(400, "title and description can't be empty")
    }

    // 7. uploading to cloudinary
    let newThumbnail;
    let newVideo;

    try {
        if (existingVideo.thumbnail) {
            await deleteOnCloudinary(existingVideo.thumbnail)
        }
        if (existingVideo.video) {
            await deleteOnCloudinary(existingVideo.video)
        }

        // updating the thumbnail and video
        newThumbnail = await uploadOnCloudinary(thumbnailPath)
        newVideo = await uploadVideoOnCloudinary(videoPath)

        // Check if uploads were successful
        if (!newThumbnail || !newVideo) {
            throw new Error("Failed to upload files to cloudinary")
        }

    } catch {
        console.error("Cloudinary error:", error)
    }

    try {
        // Clean up local files if upload fails
        if (fs.existsSync(thumbnailPath)) fs.unlinkSync(thumbnailPath)
        if (fs.existsSync(videoPath)) fs.unlinkSync(videoPath)
    } catch {
        throw new ApiError(500, "An Error occur while removing existing files")
    }

    // 8. dynamic data update
    const updateData = {
        title: title.trim(),
        description: description.trim(),
        thumbnail: newThumbnail.secure_url,
        video: newVideo.secure_url
    }

    // 9. genetating response
    const updatedVideo = await Video.findByIdAndUpdate(
        videoId,
        updateData,
        { new: true, runValidators: true }
    )
    if (!updatedVideo) {
        throw new ApiError(404, "Failed to update video in database")
    }

    return res.status(200)
        .json(
            new ApiResponse(
                200,
                updatedVideo,
                "Video Updated Successfully"
            )
        )
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