import { Router } from "express";
import { jwtVerify } from "../middlewares/auth.middleware.js";
import {
    addVideoToPlaylist,
    createPlaylist,
    deletePlaylist,
    getPlaylistById,
    getUserPlaylists,
    removeVideoFromPlaylist,
    updatePlaylist
} from "../controllers/playlist.controller.js";

const router = Router();

router.route('/create-playlist').post(
    jwtVerify,
    createPlaylist
)

router
    .route('/:userId')
    .get(jwtVerify, getUserPlaylists)
router.
    route('/get-playlist-by-id/:playlistId').
    get(jwtVerify, getPlaylistById)

router
    .route('/playlist/:playlistId/video/:videoId')
    .patch(jwtVerify, addVideoToPlaylist)
    .delete(jwtVerify, removeVideoFromPlaylist);

router
    .route('/playlist/:playlistId')
    .delete(jwtVerify, deletePlaylist)
    .patch(jwtVerify, updatePlaylist)

export default router;
