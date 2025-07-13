import mongoose, { isValidObjectId } from "mongoose";
import { Playlist } from "../models/playlist.model.js";
import { ApiError } from "../utils/ApiError.js";
import { ApiResponse } from "../utils/ApiResponse.js";
import { asyncHandler } from "../utils/asyncHandler.js";

const createPlaylist = asyncHandler(async (req, res) => {
    const { name, description } = req.body;
    if (!name || !description) {
        throw new ApiError(400, "Name and description are required");
    }
    const playlist = await Playlist.create({
        name,
        description,
        userId: req.user._id,
    });

    res.status(201).json(
        new ApiResponse("Playlist created successfully", playlist)
    );
});

const getUserPlaylists = asyncHandler(async (req, res) => {
    const { userId } = req.params;
    if (!isValidObjectId(userId)) {
        throw new ApiError(400, "Invalid user ID");
    }
    const playlists = await Playlist.find({ userId })
        .populate("userId", "username profilePicture")
        .sort({ createdAt: -1 });
    res.status(200).json(
        new ApiResponse("User playlists fetched successfully", playlists)
    );
});

const getPlaylistById = asyncHandler(async (req, res) => {
    const { playlistId } = req.params;
    if (!isValidObjectId(playlistId)) {
        throw new ApiError(400, "Invalid playlist ID");
    }
    const playlist = await Playlist.findById(playlistId).populate(
        "userId",
        "username profilePicture"
    );
    if (!playlist) {
        throw new ApiError(404, "Playlist not found");
    }
    res.status(200).json(
        new ApiResponse("Playlist fetched successfully", playlist)
    );
});

const addVideoToPlaylist = asyncHandler(async (req, res) => {
    const { playlistId, videoId } = req.params;
    if (!isValidObjectId(playlistId) || !isValidObjectId(videoId)) {
        throw new ApiError(400, "Invalid playlist or video ID");
    }
    const playlist = await Playlist.findById(playlistId);
    if (!playlist) {
        throw new ApiError(404, "Playlist not found");
    }
    if (!playlist.userId.equals(req.user._id)) {
        throw new ApiError(
            403,
            "You are not authorized to add videos to this playlist"
        );
    }
    if (playlist.videos.includes(videoId)) {
        throw new ApiError(400, "Video already exists in the playlist");
    }
    playlist.videos.push(videoId);
    await playlist.save();
    res.status(200).json(
        new ApiResponse("Video added to playlist successfully", playlist)
    );
});

const removeVideoFromPlaylist = asyncHandler(async (req, res) => {
    const { playlistId, videoId } = req.params;
    if (!isValidObjectId(playlistId) || !isValidObjectId(videoId)) {
        throw new ApiError(400, "Invalid playlist or video ID");
    }
    const playlist = await Playlist.findById(playlistId);
    if (!playlist) {
        throw new ApiError(404, "Playlist not found");
    }
    if (!playlist.userId.equals(req.user._id)) {
        throw new ApiError(
            403,
            "You are not authorized to remove videos from this playlist"
        );
    }
    if (!playlist.videos.includes(videoId)) {
        throw new ApiError(400, "Video does not exist in the playlist");
    }
    playlist.videos.pull(videoId);
    await playlist.save();
    res.status(200).json(
        new ApiResponse("Video removed from playlist successfully", playlist)
    );
});

const deletePlaylist = asyncHandler(async (req, res) => {
    const { playlistId } = req.params;
    if (!isValidObjectId(playlistId)) {
        throw new ApiError(400, "Invalid playlist ID");
    }
    const playlist = await Playlist.findById(playlistId);
    if (!playlist) {
        throw new ApiError(404, "Playlist not found");
    }
    await playlist.remove();
    res.status(200).json(
        new ApiResponse("Playlist deleted successfully", playlist)
    );
});

const updatePlaylist = asyncHandler(async (req, res) => {
    const { playlistId } = req.params;
    const { name, description } = req.body;
    if (!isValidObjectId(playlistId)) {
        throw new ApiError(400, "Invalid playlist ID");
    }
    if (!name || !description) {
        throw new ApiError(400, "Name and description are required");
    }
    const playlist = await Playlist.findByIdAndUpdate(
        playlistId,
        { name, description },
        { new: true }
    );
    if (!playlist) {
        throw new ApiError(404, "Playlist not found");
    }
    res.status(200).json(
        new ApiResponse("Playlist updated successfully", playlist)
    );
});

export {
    createPlaylist,
    getUserPlaylists,
    getPlaylistById,
    addVideoToPlaylist,
    removeVideoFromPlaylist,
    deletePlaylist,
    updatePlaylist,
};
