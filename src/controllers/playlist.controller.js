import mongoose, { isValidObjectId } from "mongoose";
import { Playlist } from "../models/playlist.model.js";
import { Video } from "../models/video.model.js";
import { ApiError } from "../utils/ApiError.js";
import { ApiResponse } from "../utils/ApiResponse.js";
import { asyncHandler } from "../utils/AsyncHandler.js";

const createPlaylist = asyncHandler(async (req, res) => {
    const { name, description } = req.body;

    if (!name || !description) {
        throw new ApiError(400, "Name and description are required");
    }

    const playlist = await Playlist.create({
        name: name.trim(),
        description: description.trim(),
        owner: req.user._id,
    });

    const createdPlaylist = await Playlist.findById(playlist._id).populate(
        "owner",
        "username avatar fullName"
    );

    res.status(201).json(
        new ApiResponse(201, createdPlaylist, "Playlist created successfully")
    );
});

const getUserPlaylists = asyncHandler(async (req, res) => {
    const { userId } = req.params;

    if (!isValidObjectId(userId)) {
        throw new ApiError(400, "Invalid user ID");
    }

    const playlists = await Playlist.find({ owner: userId })
        .populate("owner", "username avatar fullName")
        .sort({ createdAt: -1 });

    res.status(200).json(
        new ApiResponse(200, playlists, "User playlists fetched successfully")
    );
});

const getPlaylistById = asyncHandler(async (req, res) => {
    const { playlistId } = req.params;

    if (!isValidObjectId(playlistId)) {
        throw new ApiError(400, "Invalid playlist ID");
    }

    const playlist = await Playlist.findById(playlistId)
        .populate("owner", "username avatar fullName")
        .populate({
            path: "videos",
            populate: {
                path: "owner",
                select: "username avatar fullName",
            },
        });

    if (!playlist) {
        throw new ApiError(404, "Playlist not found");
    }

    res.status(200).json(
        new ApiResponse(200, playlist, "Playlist fetched successfully")
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

    if (playlist.owner.toString() !== req.user._id.toString()) {
        throw new ApiError(
            403,
            "You are not authorized to add videos to this playlist"
        );
    }

    // Check if video exists
    const video = await Video.findById(videoId);
    if (!video) {
        throw new ApiError(404, "Video not found");
    }

    if (playlist.videos.includes(videoId)) {
        throw new ApiError(400, "Video already exists in the playlist");
    }

    playlist.videos.push(videoId);
    await playlist.save();

    const updatedPlaylist = await Playlist.findById(playlistId)
        .populate("owner", "username avatar fullName")
        .populate({
            path: "videos",
            populate: {
                path: "owner",
                select: "username avatar fullName",
            },
        });

    res.status(200).json(
        new ApiResponse(
            200,
            updatedPlaylist,
            "Video added to playlist successfully"
        )
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

    if (playlist.owner.toString() !== req.user._id.toString()) {
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

    const updatedPlaylist = await Playlist.findById(playlistId)
        .populate("owner", "username avatar fullName")
        .populate({
            path: "videos",
            populate: {
                path: "owner",
                select: "username avatar fullName",
            },
        });

    res.status(200).json(
        new ApiResponse(
            200,
            updatedPlaylist,
            "Video removed from playlist successfully"
        )
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

    if (playlist.owner.toString() !== req.user._id.toString()) {
        throw new ApiError(
            403,
            "You are not authorized to delete this playlist"
        );
    }

    await Playlist.findByIdAndDelete(playlistId);

    res.status(200).json(
        new ApiResponse(200, {}, "Playlist deleted successfully")
    );
});

const updatePlaylist = asyncHandler(async (req, res) => {
    const { playlistId } = req.params;
    const { name, description } = req.body;

    if (!isValidObjectId(playlistId)) {
        throw new ApiError(400, "Invalid playlist ID");
    }

    if (!name && !description) {
        throw new ApiError(
            400,
            "At least one field (name or description) is required"
        );
    }

    const playlist = await Playlist.findById(playlistId);

    if (!playlist) {
        throw new ApiError(404, "Playlist not found");
    }

    if (playlist.owner.toString() !== req.user._id.toString()) {
        throw new ApiError(
            403,
            "You are not authorized to update this playlist"
        );
    }

    const updatedPlaylist = await Playlist.findByIdAndUpdate(
        playlistId,
        {
            $set: {
                name: name?.trim() || playlist.name,
                description: description?.trim() || playlist.description,
            },
        },
        { new: true }
    ).populate("owner", "username avatar fullName");

    res.status(200).json(
        new ApiResponse(200, updatedPlaylist, "Playlist updated successfully")
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
