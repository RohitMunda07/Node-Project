import mongoose, { isValidObjectId } from "mongoose"
import { Like } from "../models/like.model.js"
import { ApiError } from "../utils/ApiErrors.js"
import { ApiResponse } from "../utils/ApiResponse.js"
import { asyncHandler } from "../utils/asyncHandler.js"

const toggleVideoLike = asyncHandler(async (req, res) => {
    //TODO: toggle like on video
    const { videoId } = req.params

    // validate videoId
    if (!videoId || !isValidObjectId(videoId)) {
        throw new ApiError(400, 'Invalid VideoId')
    }

    const userId = req.user?._id

    // Check Existing Like (find method returns an array)
    const existingLike = await Like.findOne(
        {
            video: videoId,
            likedBy: userId
        }
    )

    // not exist-case
    let likeWithData = null
    let isLiked = false

    if (!existingLike) {
        const createLike = await Like.create({
            video: videoId,
            likedBy: userId
        })
        isLiked = true
        // console.log(createLike._id); // should print a valid ObjectId

        likeWithData = await Like.aggregate([
            {
                $match: {
                    _id: createLike._id
                }
            },
            {
                $lookup: {
                    from: 'videos',
                    localField: 'video',
                    foreignField: '_id',
                    as: 'likedVideo'
                }
            },
            {
                $unwind: '$likedVideo'
            },
            {
                $lookup: {
                    from: 'users',
                    localField: 'likedBy',
                    foreignField: '_id',
                    as: 'likedByPerson'
                }
            },
            {
                $unwind: '$likedByPerson'
            },
            {
                $addFields: {
                    likeStatus: true
                }
            },
            {
                $project: {
                    video: '$likedVideo._id',
                    videoTitle: '$likedVideo.title',
                    videoOwner: '$likedVideo.owner',
                    likedBy: '$likedByPerson._id',
                    likedByName: '$likedByPerson.userName',
                    likedByAvatar: '$likedByPerson.avatar',
                    likeStatus: 1
                }
            }
        ])
    }
    // exist-case
    else {
        await Like.findByIdAndDelete(existingLike?._id)
        isLiked = false
    }

    return res.status(isLiked ? 201 : 200)
        .json(
            new ApiResponse(
                200,
                likeWithData?.[0] || null,
                `Video ${isLiked ? 'liked' : 'Unliked'} Successfully`
            )
        )
})

const toggleCommentLike = asyncHandler(async (req, res) => {
    //TODO: toggle like on comment
    const { commentId } = req.params

    // validate commentId
    if (!commentId || !isValidObjectId(commentId)) {
        throw new ApiError(400, "Invalid CommentId")
    }

    const userId = req.user._id

    // existing comment
    const existingLikeComment = await Like.findOne({ likedBy: userId, comment: commentId })

    let likeWithData = null;
    let isLiked = false;

    if (!existingLikeComment) {
        const createLike = Like.create({
            likedBy: userId,
            comment: commentId
        })
        isLiked = true;

        likeWithData = await Like.aggregate([
            {
                $match: {
                    _id: createLike._id
                }
            },

            {
                $lookup: {
                    from: 'users',
                    localField: 'likedBy',
                    foreignField: '_id',
                    as: 'likedByPerson'
                }
            },

            {
                $unwind: '$likedByPerson'
            },

            {
                $lookup: {
                    from: 'comments',
                    localField: 'comment',
                    foreignField: '_id',
                    as: 'commentLike'
                }
            },

            {
                $unwind: '$commentLike'
            },

            {
                $addFields: {
                    likeStatus: true
                }
            },

            {
                $project: {
                    comment: '$commentLike._id',
                    commentContent: '$commentLike.content',
                    commentOwner: 'commentLike.owner',
                    likedBy: '$likedByPerson._id',
                    likedByName: '$likedByPerson._userName',
                    likedByAvatar: '$likedByPerson.avatar',
                    likeStatus: 1
                }
            }

        ])
    }
    else {
        await Like.findByIdAndDelete(existingLikeComment._id)
    }

    return res(isLiked ? 201 : 200)
        .json(
            new ApiResponse(
                200,
                likeWithData?.[0] || null,
                `Comment ${isLiked ? 'liked' : 'Unliked'} Successfully`

            )
        )

})

const toggleTweetLike = asyncHandler(async (req, res) => {
    //TODO: toggle like on tweet
    const { tweetId } = req.params

    // validate commentId
    if (!tweetId || !isValidObjectId(tweetId)) {
        throw new ApiError(400, "Invalid CommentId")
    }

    const userId = req.user._id

    // existing comment
    const existingLikeTweet = await Like.findOne({ likedBy: userId, tweet: tweetId })

    let likeWithData = null;
    let isLiked = false;

    if (!existingLikeTweet) {
        const createLike = await Like.create({
            likedBy: userId,
            tweet: tweetId
        })
        isLiked = true;

        likeWithData = await Like.aggregate([
            {
                $match: {
                    _id: createLike._id
                }
            },

            {
                $lookup: {
                    from: 'users',
                    localField: 'likedBy',
                    foreignField: '_id',
                    as: 'likedByPerson'
                }
            },

            {
                $unwind: '$likedByPerson'
            },

            {
                $lookup: {
                    from: 'tweets',
                    localField: 'tweet',
                    foreignField: '_id',
                    as: 'tweetLike'
                }
            },

            {
                $unwind: '$tweetLike'
            },

            {
                $lookup: {
                    from: 'users',
                    localField: 'tweetLike.owner',   // tweet.owner is a userId
                    foreignField: '_id',
                    as: 'tweetOwner'
                }
            },

            {
                $unwind: '$tweetOwner'
            },

            {
                $addFields: {
                    likeStatus: true
                }
            },

            {
                $project: {
                    tweet: '$tweetLike._id',
                    tweetContent: '$tweetLike.content',
                    tweetOwner: '$tweetOwner.userName',
                    likedById: '$likedByPerson._id',
                    likedByName: '$likedByPerson.userName',
                    likedByAvatar: '$likedByPerson.avatar',
                    likeStatus: 1
                }
            }

        ])
    }
    else {
        await Like.findByIdAndDelete(existingLikeTweet._id)
    }

    return res.status(isLiked ? 201 : 200)
        .json(
            new ApiResponse(
                200,
                likeWithData?.[0] || null,
                `Tweet ${isLiked ? 'liked' : 'Unliked'} Successfully`

            )
        )

}
)

const getLikedVideos = asyncHandler(async (req, res) => {
    //TODO: get all liked videos
    const userId = req.user._id

    const existingLikeVideos = await Like.find({ likedBy: userId })
        .populate('likedBy', '_id userName avatar')

    if (!existingLikeVideos) {
        throw new ApiError(404, 'Liked Videos Not Found')
    }

    // const likedvideos = 

    return res.status(200)
        .json(
            new ApiResponse(
                200,
                existingLikeVideos,
                'Fetched All Liked Videos'
            )
        )

})

export {
    toggleCommentLike,
    toggleTweetLike,
    toggleVideoLike,
    getLikedVideos
}


// const createLike = await Like.aggregate([
//     {
//         $lookup: {
//             from: 'videos',
//             localField: 'video',
//             foreignField: '_id',
//             as: 'likedVideo'
//         }
//     },
//     {
//         $lookup: {
//             from: 'users',
//             localField: 'likedBy',
//             foreignField: '_id',
//             as: 'likedByPerson'
//         }
//     },
//     {
//         $addFields: {

//         }
//     }
// ])