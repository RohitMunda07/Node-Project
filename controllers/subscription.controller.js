import mongoose, { isValidObjectId } from "mongoose"
import { User } from "../models/user.model.js"
import { Subscription } from "../models/subscription.model.js"
import { ApiError } from "../utils/ApiErrors.js"
import { ApiResponse } from "../utils/ApiResponse.js"
import { asyncHandler } from "../utils/asyncHandler.js"


const toggleSubscription = asyncHandler(async (req, res) => {
    // TODO: toggle subscription

    // 1. taking channelId
    const { channelId } = req.params

    // console.log("🔍 Raw channelId from req.params:", channelId);
    // console.log("🔍 isValidObjectId:", mongoose.Types.ObjectId.isValid(channelId));

    // 2. validate channelId
    if (!channelId) {
        throw new ApiError(400, 'channelId is required')
    }
    if (!mongoose.Types.ObjectId.isValid(channelId)) {
        throw new ApiError(400, 'Invalid ChannelId')
    }

    const currentUserId = req.user?._id

    if (channelId === currentUserId.toString()) {
        throw new ApiError(400, 'Can\'t subscriber to yourself')
    }

    // 3. finding the channel
    const existingSubscription = await Subscription.findOne({
        channel: channelId,
        subscriber: currentUserId,
    })

    let isSubscribed

    if (existingSubscription) {
        await Subscription.findByIdAndDelete(existingSubscription._id)
        isSubscribed = false
    } else {
        await Subscription.create({
            channel: channelId,
            subscriber: currentUserId,
        })
        isSubscribed = true
    }

    return res.status(200)
        .json(
            new ApiResponse(
                200,
                { isSubscribed },
                `Subscription ${isSubscribed ? 'added' : 'removed'} successfully`
            )
        )

})

// controller to return subscriber list of a channel
const getUserChannelSubscribers = asyncHandler(async (req, res) => {
    const { channelId } = req.params

    // 2. valide channelId
    if (!channelId || !isValidObjectId(channelId)) {
        throw new ApiError(400, 'Valid channelId is required')
    }

    // 3. getting subscribers
    const channel = await Subscription.aggregate([
        {
            $match: {
                channel: new mongoose.Types.ObjectId(channelId)
            }
        },
        {
            $lookup: {
                from: 'users',
                localField: 'subscriber',
                foreignField: '_id',
                as: 'subscribers'
            }
        },
        {
            $addFields: {
                subscriberCount: {
                    $size: '$subscribers'
                }
            }
        },
        {
            $project: {
                'subscribers._id': 1,
                'subscribers.userName': 1,
                'subscribers.fullName': 1,
                subscriberCount: 1,
            }
        }

    ])

    console.log("channel: ", channel)

    if (!channel) {
        throw new ApiError(500, 'Error getting Subscribers')
    }

    return res.status(200)
        .json(
            new ApiResponse(
                200,
                channel,
                "Subscribers Fetch Successfully"
            )
        )

})

// controller to return channel list to which user has subscribed
const getSubscribedChannels = asyncHandler(async (req, res) => {
    
    // this is my id lucky --> subscribedTo one011 so lucky should call this method
    const { subscriberId } = req.params

    // 1. Validate channelId
    if (!subscriberId || !isValidObjectId(subscriberId)) {
        throw new ApiError(400, 'Valid channelId is required')
    }

    const currentUserId = req.user?._id

    // 2. getting list of channel Subscribed
    const subscribedToList = await Subscription.aggregate([
        {
            $match: {
                subscriber: new mongoose.Types.ObjectId(subscriberId)
            }
        },
        {
            $lookup: {
                from: 'users',
                localField: 'channel',
                foreignField: '_id',
                as: 'subscribedTo'
            }
        },
        {
            $addFields: {
                subscribedToCount: { $size: '$subscribedTo' }
            }
        },
        {
            $project: {
                'subscribedTo._id': 1,
                'subscribedTo.userName': 1,
                'subscribedTo.fullName': 1,
                subscribedToCount: 1
            }
        }
    ])

    // return response
    return res.status(200)
        .json(
            new ApiResponse(
                200,
                subscribedToList,
                "Fetched to whome you subscribed"
            )
        )
})

export {
    toggleSubscription,
    getUserChannelSubscribers,
    getSubscribedChannels
}