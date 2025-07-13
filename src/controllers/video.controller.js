import mongoose, { isValidObjectId } from "mongoose";
import { Video } from "../models/video.model.js";
import { User } from "../models/user.model.js";
import { ApiError } from "../utils/ApiError.js";
import { ApiResponse } from "../utils/ApiResponse.js";
import { asyncHandler } from "../utils/asyncHandler.js";
import { uploadOnCloudinary } from "../utils/cloudinary.js";

const getAllVideos = asyncHandler(async (req, res) => {
    const { page = 1, limit = 10, query, sortBy, sortType, userId } = req.query;
    const filter = {};
    if (query) {
        filter.title = { $regex: query, $options: "i" };
    }
    if (userId && isValidObjectId(userId)) {
        filter.userId = userId;
    }
    const sort = {};
    if (sortBy && sortType) {
        sort[sortBy] = sortType === "asc" ? 1 : -1;
    }
    const videos = await Video.find(filter)
        .populate("userId", "username profilePicture")
        .sort(sort)
        .skip((page - 1) * limit)
        .limit(Number(limit));
    res.status(200).json(
        new ApiResponse("Videos fetched successfully", videos)
    );
});

const publishAVideo = asyncHandler(async (req, res) => {
    const { title, description } = req.body;
    if (!title || !description) {
        throw new ApiError(400, "Title and description are required");
    }
    if (!req.file) {
        throw new ApiError(400, "Video file is required");
    }
    const videoUrl = await uploadOnCloudinary(req.file.path, "videos");
    const video = await Video.create({
        title,
        description,
        videoUrl,
        userId: req.user._id,
        duration: req.file.duration,
    });
    res.status(201).json(
        new ApiResponse("Video published successfully", video)
    );
});

const getVideoById = asyncHandler(async (req, res) => {
    const { videoId } = req.params;
    const video = await Video.findById(videoId).populate(
        "userId",
        "username profilePicture"
    );
    if (!video) {
        throw new ApiError(404, "Video not found");
    }
    res.status(200).json(new ApiResponse("Video fetched successfully", video));
});

const updateVideo = asyncHandler(async (req, res) => {
    const { videoId } = req.params;
    const { title, description } = req.body;
    const video = await Video.findById(videoId);
    if (!video) {
        throw new ApiError(404, "Video not found");
    }
    if (!video.userId.equals(req.user._id)) {
        throw new ApiError(403, "You are not authorized to update this video");
    }
    video.title = title || video.title;
    video.description = description || video.description;
    await video.save();
    res.status(200).json(new ApiResponse("Video updated successfully", video));
});

const deleteVideo = asyncHandler(async (req, res) => {
    const { videoId } = req.params;
    const video = await Video.findById(videoId);
    if (!video) {
        throw new ApiError(404, "Video not found");
    }
    if (!video.userId.equals(req.user._id)) {
        throw new ApiError(403, "You are not authorized to delete this video");
    }
    await video.remove();
    res.status(200).json(new ApiResponse("Video deleted successfully"));
});

const togglePublishStatus = asyncHandler(async (req, res) => {
    const { videoId } = req.params;
    const video = await Video.findById(videoId);
    if (!video) {
        throw new ApiError(404, "Video not found");
    }
    video.isPublished = !video.isPublished;
    await video.save();
    res.status(200).json(
        new ApiResponse("Video publish status updated successfully", video)
    );
});

export {
    getAllVideos,
    publishAVideo,
    getVideoById,
    updateVideo,
    deleteVideo,
    togglePublishStatus,
};
