import mongoose, { isValidObjectId } from "mongoose"
import { Comment } from "../models/comment.model.js"
import { ApiError } from "../utils/ApiErrors.js"
import { ApiResponse } from "../utils/ApiResponse.js"
import { asyncHandler } from "../utils/asyncHandler.js"
import { SORT_TYPES } from "../src/constant.js"

const getVideoComments = asyncHandler(async (req, res) => {
    //TODO: get all comments for a video
    const { videoId } = req.params
    const { page = 1, limit = 10, sortBy = 'createdAt', sortType = 'newest' } = req.query

    // validate videoId
    if (!videoId || !isValidObjectId(videoId)) {
        throw new ApiError(400, 'Invalid VideoId')
    }

    const pageNo = Math.max(1, Number(page))
    const totalPage = Math.min(50, Number(limit))
    let offset = (pageNo - 1) * totalPage

    const normalizeSortType = String(sortType).toLowerCase()
    if (!Object.values(SORT_TYPES).includes(normalizeSortType)) {
        throw new ApiError(400, 'Sort Type must be "newst" or "oldest"')
    }

    // dynamic sorting
    const sortObject = {
        sortBy: normalizeSortType === SORT_TYPES.NEWEST ? 1 : -1
    }

    // totalComments
    const totalComments = await Comment.countDocuments({ video: videoId })

    // find comment
    const allComments = await Comment.find({ video: videoId })
        .populate('video', 'video thumbnail title')
        .populate('owner', '_id userName avatar')
        .skip(offset)
        .limit(totalPage)
        .sort(sortObject)

    const totalPages = Math.ceil(totalComments / totalPage)

    const responseData = {
        allComments,
        pagination: {
            currentPage: pageNo,
            totalComments,
            totalPages,
            commentPerPage: Number(limit),
            hasNextPage: pageNo < totalPage,
            hasPreviousPage: pageNo > 1
        }
    }

    return res.status(200)
        .json(
            new ApiResponse(
                200,
                responseData,
                'Fetch All Comments SuccessFully'
            )
        )
})

const addComment = asyncHandler(async (req, res) => {
    // TODO: add a comment to a video
    const { videoId } = req.params
    const { content } = req.body

    console.log(content);


    if (!videoId || !isValidObjectId(videoId)) {
        throw new ApiError(400, 'Valid VideoId is required ')
    }

    // validate informations
    if (!content) {
        throw new ApiError(400, 'Comment content is required')
    }

    const userId = req.user?._id

    const newComment = await Comment.create({
        content: content,
        video: videoId,
        owner: userId,
    })

    if (!newComment) {
        throw new ApiError(500, 'Error Creating Comment')
    }

    const populateComment = await Comment.findById(newComment._id)
        .populate('owner', 'userName avatar')

    return res.status(201)
        .json(
            new ApiResponse(
                201,
                populateComment,
                "Comment Created SuccessFully"
            )
        )
})

const updateComment = asyncHandler(async (req, res) => {
    // TODO: update a comment
    const { commentId } = req.params
    const { content } = req.body
    if (!content || !content.trim() || typeof content !== 'string') {
        throw new ApiError(400, "Content is required and must be a non-empty string");
    }

    if (!commentId || !isValidObjectId(commentId)) {
        throw new ApiError(400, 'Valid CommentId is required')
    }

    const userId = req.user._id

    const existingComment = await Comment.findById(commentId)

    if (!existingComment) {
        throw new ApiError(404, 'Comment not found')
    }

    // ownership check
    if (String(existingComment.owner) !== String(userId)) {
        throw new ApiError(403, "Unauthorized Request: You can't update the comment")
    }

    const updatedComment = await Comment.findByIdAndUpdate(commentId,
        { content },
        { new: true }
    ).populate('owner', 'userName avatar')

    if (!updatedComment) {
        throw new ApiError(500, 'Error while updating the comment')
    }

    return res.status(201)
        .json(
            new ApiResponse(
                201,
                updatedComment,
                'Comment Update Successfully'
            )
        )
})

const deleteComment = asyncHandler(async (req, res) => {
    // TODO: delete a comment
    const { commentId } = req.params
    if (!commentId || !isValidObjectId(commentId)) {
        throw new ApiError(400, 'Valid CommentId is Required')
    }

    const existingComment = await Comment.findById(commentId)

    if (!existingComment) {
        throw new ApiError(404, 'Comment Not Found')
    }

    // ownership check
    const userId = req.user._id
    if (String(existingComment.owner) !== String(userId)) {
        throw new ApiError(400, "Unauthorized Request: You can't delete the comment")
    }

    // delete existing comment
    await Comment.findByIdAndDelete(commentId)

    const remainingComments = await Comment.find({ video: existingComment.video })
        .populate('owner', 'userName avatar')
        .sort({ createdAt: -1 })

    return res.status(200)
        .json(
            new ApiResponse(
                200,
                remainingComments,
                'Comment Deleted Successfully'
            )
        )
})

export {
    getVideoComments,
    addComment,
    updateComment,
    deleteComment
}