import mongoose, { isValidObjectId } from "mongoose";
import { Like } from "../models/like.model.js";
import { ApiError } from "../utils/ApiError.js";
import { ApiResponse } from "../utils/ApiResponse.js";
import { asyncHandler } from "../utils/asyncHandler.js";

const toggleVideoLike = asyncHandler(async (req, res) => {
    const { videoId } = req.params;
    if (!isValidObjectId(videoId)) {
        throw new ApiError(400, "Invalid video ID");
    }
    const existingLike = await Like.findOne({ videoId, userId: req.user._id });
    if (existingLike) {
        // User has already liked the video, remove the like
        await Like.deleteOne({ _id: existingLike._id });
        return res.status(200).json(
            new ApiResponse("Like removed successfully", {
                videoId,
                liked: false,
            })
        );
    }
    // User has not liked the video, add the like
    const newLike = await Like.create({
        videoId,
        userId: req.user._id,
    });
    return res
        .status(201)
        .json(
            new ApiResponse("Like added successfully", { videoId, liked: true })
        );
});

const toggleCommentLike = asyncHandler(async (req, res) => {
    const { commentId } = req.params;

    if (!isValidObjectId(commentId)) {
        throw new ApiError(400, "Invalid comment ID");
    }

    const existingLike = await Like.findOne({
        commentId,
        userId: req.user._id,
    });
    if (existingLike) {
        // User has already liked the comment, remove the like
        await Like.deleteOne({ _id: existingLike._id });
        return res.status(200).json(
            new ApiResponse("Like removed successfully", {
                commentId,
                liked: false,
            })
        );
    }

    // User has not liked the comment, add the like
    const newLike = await Like.create({
        commentId,
        userId: req.user._id,
    });
    return res.status(201).json(
        new ApiResponse("Like added successfully", {
            commentId,
            liked: true,
        })
    );
});

const toggleTweetLike = asyncHandler(async (req, res) => {
    const { tweetId } = req.params;
    //TODO: toggle like on tweet
    if (!isValidObjectId(tweetId)) {
        throw new ApiError(400, "Invalid tweet ID");
    }
    const existingLike = await Like.findOne({ tweetId, userId: req.user._id });
    if (existingLike) {
        // User has already liked the tweet, remove the like
        await Like.deleteOne({ _id: existingLike._id });
        return res.status(200).json(
            new ApiResponse("Like removed successfully", {
                tweetId,
                liked: false,
            })
        );
    }
    // User has not liked the tweet, add the like
    const newLike = await Like.create({
        tweetId,
        userId: req.user._id,
    });
    return res
        .status(201)
        .json(
            new ApiResponse("Like added successfully", { tweetId, liked: true })
        );
});

const getLikedVideos = asyncHandler(async (req, res) => {
    const userId = req.user._id;
    const likedVideos = await Like.find({ userId }).populate("videoId");
    res.status(200).json(
        new ApiResponse("Liked videos retrieved successfully", likedVideos)
    );
});

export { toggleCommentLike, toggleTweetLike, toggleVideoLike, getLikedVideos };
