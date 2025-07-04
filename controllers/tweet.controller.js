import mongoose, { isValidObjectId } from "mongoose"
import { Tweet } from "../models/tweet.model.js"
import { User } from "../models/user.model.js"
import { ApiError } from "../utils/ApiErrors.js"
import { ApiResponse } from "../utils/ApiResponse.js"
import { asyncHandler } from "../utils/asyncHandler.js"
import { deleteOnCloudinary, uploadOnCloudinary } from "../utils/cloudinary.js"
import fs, { existsSync } from 'fs'
import { error } from "console"
import { json } from "stream/consumers"

const createTweet = asyncHandler(async (req, res) => {
    //TODO: create tweet

    // 1. getting description from user
    const { description } = req.body

    // 2. validate description
    if (!description || description?.trim() === '') {
        throw new ApiError(400, "Description can't be empty")
    }

    // 3. Extracting post path
    console.log(req.file);

    const tweetPostPath = req.file?.path
    if (!tweetPostPath) {
        throw new ApiError(400, "Tweet Post is Required")
    }

    // 4. upload tweetPost
    let tweetPost;
    try {
        tweetPost = await uploadOnCloudinary(tweetPostPath)
        if (!tweetPost) {
            if (fs.existsSync(tweetPostPath)) fs.unlinkSync(tweetPostPath)
            throw new ApiError(500, "Something went wrong while uploading the post to cloudinary")
        }
    } catch (error) {
        if (fs.existsSync(tweetPostPath)) fs.unlinkSync(tweetPostPath)
        throw new ApiError(500, 'Error uploding post image')
    }

    // 5. Creating Post on database
    const tweet = await Tweet.create({
        content: tweetPost.secure_url,
        description,
        owner: req.user?._id
    })

    // 6. validate post
    if (!tweet) {
        throw new ApiError(500, "Error Creating Post")
    }

    const populatedTweet = await Tweet.findById(tweet?._id).populate('owner', '_id userName fullName avatar')

    console.log("Tweet Post details: ", populatedTweet);


    // 7. return response
    return res.status(201)
        .json(
            new ApiResponse(
                201,
                populatedTweet,
                "Tweet Crreated Successfully"
            )
        )

})

const getUserTweets = asyncHandler(async (req, res) => {
    // TODO: get user tweets

    // 1. getting the userName, fullName from user
    const { userName, fullName, page = 1, limit = 10, sortType = 'asc', sortBy = 'createdAt' } = req.query

    // 2. pagination params
    const pageNo = Math.max(1, Number(page));
    const totalPage = Math.min(50, Number(limit))
    const offset = (pageNo - 1) * totalPage

    // 3. pipeline
    const pipeline = []

    // 6. inserting owner's detail
    pipeline.push({
        $lookup: {
            from: 'users',
            localField: 'owner',
            foreignField: '_id',
            as: 'ownerDetails'
        }
    })

    // 7. Unwind owner details
    pipeline.push({
        $unwind: {
            path: '$ownerDetails',
            preserveNullAndEmptyArrays: true
        }
    })

    if (userName || fullName) {
        const orConditions = [];
        if (userName) orConditions.push({ 'ownerDetails.userName': userName });
        if (fullName) orConditions.push({ 'ownerDetails.fullName': fullName });

        pipeline.push({
            $match: { $or: orConditions }
        });
    }

    pipeline.push({
        $addFields: {
            viewsCount: { $ifNull: ["$views", 0] },
            likesCount: { $ifNull: ["$likes", 0] }
        }
    })
    pipeline.push({
        $project: {
            "ownerDetails._id": 1,
            "ownerDetails.userName": 1,
            "ownerDetails.fullName": 1,
            content: 1,
            description: 1,
            createdAt: 1,
            updatedAt: 1,
            viewsCount: 1,
            likesCount: 1,
            "ownerDetails.avatar": 1
        }
    })

    // 8. Sort stage
    let sortVal = -1
    if (sortType && sortType.trim()) {
        const normalizedSortType = sortType.toLowerCase().trim()
        if (normalizedSortType === 'ascending' || normalizedSortType === 'asc') {
            sortVal = 1
        } else if (normalizedSortType === 'descending' || normalizedSortType === 'desc') {
            sortVal = -1
        }
    }

    const sortObject = {}
    sortObject[sortBy] = sortVal
    pipeline.push({ $sort: sortObject })
    pipeline.push({ $skip: offset })
    pipeline.push({ $limit: totalPage })

    const tweet = await Tweet.aggregate(pipeline)
    const responseData = {
        tweet,
        pagination: {
            pageNo: pageNo,
            totalPage: totalPage
        }
    }

    return res.status(200)
        .json(
            new ApiResponse(
                200,
                responseData,
                "Tweet Fetch Successfully"
            )
        )
})

const updateTweet = asyncHandler(async (req, res) => {
    //TODO: update tweet

    // 1. getting the tweetId
    const { tweetId } = req.params
    const { description } = req.body || {}
    const tweetPost = req.file?.path

    // 2. validate tweetId
    if (!tweetId) {
        throw new ApiError(400, 'TweetId is required')
    }

    if (!isValidObjectId(tweetId)) {
        throw new ApiError(400, "Invalid TweetId")
    }

    if (!description || description.trim() === '') {
        throw new ApiError(400, "description can't be empty")
    }

    // 3. finding existing tweetId
    const existingTweet = await Tweet.findById(tweetId)
    if (!existingTweet) {
        throw new ApiError(404, "Tweet post not found")
    }
    const userId = existingTweet.owner._id;

    // 4. deleting previous post and uploading the new post
    let newPostPath;
    try {
        await deleteOnCloudinary(existingTweet.content)
        newPostPath = await uploadOnCloudinary(tweetPost)
        if (!newPostPath) {
            if (fs.existsSync(tweetPost)) fs.unlinkSync(tweetPost)
            throw new ApiError(500, 'Cloudinary Upload failed')
        }
    } catch (error) {
        throw new ApiError(500, 'Something went wrong while deleting the previous post: ', error?.message)
    }

    const updatedDetails = {
        content: newPostPath.secure_url,
        description: description.trim(),

    }

    // 5. updating the tweet
    if (String(userId) !== req.user._id.toString()) {
        throw new ApiError(403, "You are not authorized to update this tweet")
    }
    const newPost = await Tweet.findByIdAndUpdate(
        tweetId,
        updatedDetails,
        { new: true, runValidators: true }
    ).populate('owner', '_id userName fullName')

    // 6. return response
    return res.status(201)
        .json(
            new ApiResponse(
                201,
                newPost,
                "Post Updated Successfully"
            )
        )


})

const deleteTweet = asyncHandler(async (req, res) => {
    //TODO: delete tweet

    // 1. getting the tweetId 
    const { tweetId } = req.params

    // 2. validate tweetId
    if (!tweetId) {
        throw new ApiError(400, "TweetId is required")
    }

    if (!isValidObjectId(tweetId)) {
        throw new ApiError(400, "Invalid TweetId")
    }

    // 3. finding existing tweetPost
    const existingTweet = await Tweet.findById(tweetId).populate('owner')
    if (!existingTweet) {
        throw new ApiError(404, `Tweet not found with id ${tweetId}`)
    }

    const userId = existingTweet.owner._id

    // 5.Check ownership
    if (String(existingTweet.owner._id) !== req.user._id.toString()) {
        throw new ApiError(403, "You are not authorized to delete this tweet")
    }

    // 4. delete tweet
    await Tweet.findByIdAndDelete(tweetId)

    // 5. getting remaining tweets
    const remainingTweets = await Tweet.find({ owner: userId }).populate('owner', '_id userName fullName')

    // 6. return response
    return res.status(200)
        .json(
            new ApiResponse(
                200,
                remainingTweets,
                `Tweet with id: ${tweetId} Deleted Successfully`
            )
        )

})

export {
    createTweet,
    getUserTweets,
    updateTweet,
    deleteTweet
}