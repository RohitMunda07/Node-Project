import mongoose, { isValidObjectId } from "mongoose"
import { Playlist } from "../models/playlist.model.js"
import { ApiError } from "../utils/ApiErrors.js"
import { ApiResponse } from "../utils/ApiResponse.js"
import { asyncHandler } from "../utils/asyncHandler.js"


const createPlaylist = asyncHandler(async (req, res) => {
    //TODO: create playlist
    const { name, description } = req.body

    // validate data
    if (!name || !description) {
        throw new ApiError(400, 'Name and Description is required')
    }

    const playlist = await Playlist.create({
        name,
        description,
        videos: [],
        owner: req.user?._id
    })

    const populatePlaylist = await Playlist.findById(playlist?._id).populate('owner', 'userName fullName avatar')

    if (!playlist) {
        throw new ApiError(500, 'Error Creating Playlist')
    }

    return res.status(201)
        .json(
            new ApiResponse(
                201,
                populatePlaylist,
                'Playlist created successfully'
            )
        )


})

const getUserPlaylists = asyncHandler(async (req, res) => {
    //TODO: get user playlists
    const { userId } = req.params

    // console.log("userId is: ", userId);
    // console.log("typeOfuserId is: ", typeof (userId));


    // validate userId
    if (!userId) {
        throw new ApiError(400, 'UserId is required')
    }
    if (!isValidObjectId(userId)) {
        throw new ApiError(400, 'Invalid UserId')
    }

    const existingPlaylist = await Playlist.find(
        { owner: userId }
    )

    if (!existingPlaylist) {
        throw new ApiError(404, 'Playlist not found')
    }

    return res.status(200)
        .json(
            new ApiResponse(
                200,
                existingPlaylist,
                "Playlist fetch successfully"
            )
        )
})

const getPlaylistById = asyncHandler(async (req, res) => {
    //TODO: get playlist by id
    const { playlistId } = req.params

    if (!playlistId) {
        throw new ApiError(400, 'PlaylistId is required')
    }

    if (!isValidObjectId(playlistId)) {
        throw new ApiError(400, 'Invalid PlaylistId')
    }

    const existingPlaylist = await Playlist.findById(playlistId).populate('owner', 'userName fullName avatar')

    if (!existingPlaylist) {
        throw new ApiError(404, `Playlist with the ID: ${playlistId} not found`)
    }

    return res.status(200)
        .json(
            new ApiResponse(
                200,
                existingPlaylist,
                'Playlist fetched successfully'
            )
        )
})

const addVideoToPlaylist = asyncHandler(async (req, res) => {
    const { playlistId, videoId } = req.params
    console.log(playlistId, videoId);


    // valisate playlistId, videoId
    if (!playlistId || !isValidObjectId(playlistId)) {
        throw new ApiError(400, 'Invalid PlaylistId')
    }
    if (!videoId || !isValidObjectId(videoId)) {
        throw new ApiError(400, 'Invalid VideoId')
    }

    const updatedPlaylist = await Playlist.findByIdAndUpdate(playlistId,
        { $addToSet: { videos: videoId } }, // use $push if you want to allow duplicates
        { new: true }
    ).populate('videos', 'title description thumbnail')

    return res.status(201)
        .json(
            new ApiResponse(
                201,
                updatedPlaylist,
                'Video added to playlist successfully'
            )
        )
})

const removeVideoFromPlaylist = asyncHandler(async (req, res) => {
    // TODO: remove video from playlist
    const { playlistId, videoId } = req.params

    // valisate playlistId, videoId
    if (!playlistId || !isValidObjectId(playlistId)) {
        throw new ApiError(400, 'Invalid PlaylistId')
    }
    if (!videoId || !isValidObjectId(videoId)) {
        throw new ApiError(400, 'Invalid VideoId')
    }

    const updatedPlaylist = await Playlist.findByIdAndUpdate(playlistId,
        { $pull: { videos: videoId } },
        { new: true }
    ).populate('videos', 'title description thumbnail')

    return res.status(201)
        .json(
            new ApiResponse(
                201,
                updatedPlaylist,
                'Video removed to playlist successfully'
            )
        )

})

const deletePlaylist = asyncHandler(async (req, res) => {
    // TODO: delete playlist
    const { playlistId } = req.params

    // validate playlistId
    if (!playlistId || !isValidObjectId(playlistId)) {
        throw new ApiError(400, 'Invalid PlaylistId')
    }

    // findig existing playlist
    const existingPlaylist = await Playlist.findById(playlistId)

    // getting existing UserId
    const userId = existingPlaylist.owner?._id
    const playlistName = existingPlaylist.name
    const playlistDescription = existingPlaylist.description

    // check ownership
    if (String(userId) !== req.user?._id.toString()) {
        throw new ApiError(403, "Unauthorized Access: You can't delete the playlist")
    }

    // delete playlist
    await Playlist.findByIdAndDelete(playlistId)

    // find remaing playlist of the current user
    const remainingPlaylists = await Playlist.find({ owner: userId })

    return res.status(200)
        .json(
            new ApiResponse(
                200,
                remainingPlaylists,
                `Playlist \n Name: ${playlistName} \n Description ${playlistDescription} \n Deleted Successfully`
            )
        )

})

const updatePlaylist = asyncHandler(async (req, res) => {
    //TODO: update playlist
    const { playlistId } = req.params
    const { name, description } = req.body

    // validate details
    if (!playlistId || !isValidObjectId(playlistId)) {
        throw new ApiError(400, 'Invalid PlaylistId')
    }

    // front-end dev fetch the data from the database and fills the existing filed
    if (!name || !description) {
        throw new ApiError(400, 'Name and Description is required')
    }

    const updatedPlaylist = await Playlist.findByIdAndUpdate(playlistId,
        { name: name, description: description },
        { new: true }
    )

    if (!updatedPlaylist) {
        throw new ApiError(500, 'Updating playlist detail failed')
    }

    return res.status(200)
        .json(
            new ApiResponse(
                200,
                updatedPlaylist,
                'Playlist Updated SuccessFully'
            )
        )
})

export {
    createPlaylist,
    getUserPlaylists,
    getPlaylistById,
    addVideoToPlaylist,
    removeVideoFromPlaylist,
    deletePlaylist,
    updatePlaylist
}