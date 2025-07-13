import mongoose, { isValidObjectId } from "mongoose";
import { Video } from "../models/video.model.js";
import { User } from "../models/user.model.js";
import { ApiError } from "../utils/ApiError.js";
import { ApiResponse } from "../utils/ApiResponse.js";
import { asyncHandler } from "../utils/AsyncHandler.js";
import {
    uploadOnCloudinary,
    deleteFromCloudinary,
} from "../utils/cloudinary.js";

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
        .populate("owner", "username avatar fullName")
        .sort(sort)
        .skip((page - 1) * limit)
        .limit(Number(limit));
    res.status(200).json(
        new ApiResponse(200, videos, "Videos fetched successfully")
    );
});

const publishAVideo = asyncHandler(async (req, res) => {
    const { title, description } = req.body;
    if (!title || !description) {
        throw new ApiError(400, "Title and description are required");
    }
    if (!req.files || !req.files.videoFile || !req.files.thumbnail) {
        throw new ApiError(400, "Video file and thumbnail are required");
    }

    const videoLocalPath = req.files.videoFile[0].path;
    const thumbnailLocalPath = req.files.thumbnail[0].path;

    const videoFile = await uploadOnCloudinary(videoLocalPath);
    const thumbnail = await uploadOnCloudinary(thumbnailLocalPath);

    if (!videoFile) {
        throw new ApiError(400, "Video file upload failed");
    }
    if (!thumbnail) {
        throw new ApiError(400, "Thumbnail upload failed");
    }

    const video = await Video.create({
        title,
        description,
        videoFile: videoFile.secure_url,
        thumbnail: thumbnail.secure_url,
        duration: videoFile.duration || 0,
        owner: req.user._id,
    });

    const createdVideo = await Video.findById(video._id).populate(
        "owner",
        "username avatar fullName"
    );

    if (!createdVideo) {
        throw new ApiError(500, "Video upload failed");
    }

    res.status(201).json(
        new ApiResponse(201, createdVideo, "Video published successfully")
    );
});

const getVideoById = asyncHandler(async (req, res) => {
    const { videoId } = req.params;

    if (!isValidObjectId(videoId)) {
        throw new ApiError(400, "Invalid video ID");
    }

    const video = await Video.findById(videoId).populate(
        "owner",
        "username avatar fullName"
    );

    if (!video) {
        throw new ApiError(404, "Video not found");
    }

    res.status(200).json(
        new ApiResponse(200, video, "Video fetched successfully")
    );
});

const updateVideo = asyncHandler(async (req, res) => {
    const { videoId } = req.params;
    const { title, description } = req.body;

    if (!isValidObjectId(videoId)) {
        throw new ApiError(400, "Invalid video ID");
    }

    if (!title && !description) {
        throw new ApiError(
            400,
            "At least one field (title or description) is required"
        );
    }

    const video = await Video.findById(videoId);

    if (!video) {
        throw new ApiError(404, "Video not found");
    }

    if (video.owner.toString() !== req.user._id.toString()) {
        throw new ApiError(403, "You are not authorized to update this video");
    }

    const updatedVideo = await Video.findByIdAndUpdate(
        videoId,
        {
            $set: {
                title: title || video.title,
                description: description || video.description,
            },
        },
        { new: true }
    ).populate("owner", "username avatar fullName");

    res.status(200).json(
        new ApiResponse(200, updatedVideo, "Video updated successfully")
    );
});

const deleteVideo = asyncHandler(async (req, res) => {
    const { videoId } = req.params;

    if (!isValidObjectId(videoId)) {
        throw new ApiError(400, "Invalid video ID");
    }

    const video = await Video.findById(videoId);

    if (!video) {
        throw new ApiError(404, "Video not found");
    }

    if (video.owner.toString() !== req.user._id.toString()) {
        throw new ApiError(403, "You are not authorized to delete this video");
    }

    // Delete video file from cloudinary
    if (video.videoFile) {
        await deleteFromCloudinary(video.videoFile);
    }

    // Delete thumbnail from cloudinary
    if (video.thumbnail) {
        await deleteFromCloudinary(video.thumbnail);
    }

    await Video.findByIdAndDelete(videoId);

    res.status(200).json(
        new ApiResponse(200, {}, "Video deleted successfully")
    );
});

const togglePublishStatus = asyncHandler(async (req, res) => {
    const { videoId } = req.params;

    if (!isValidObjectId(videoId)) {
        throw new ApiError(400, "Invalid video ID");
    }

    const video = await Video.findById(videoId);

    if (!video) {
        throw new ApiError(404, "Video not found");
    }

    if (video.owner.toString() !== req.user._id.toString()) {
        throw new ApiError(403, "You are not authorized to update this video");
    }

    video.isPublished = !video.isPublished;
    await video.save({ validateBeforeSave: false });

    res.status(200).json(
        new ApiResponse(200, video, "Video publish status updated successfully")
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
