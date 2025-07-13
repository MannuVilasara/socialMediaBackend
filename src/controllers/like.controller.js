import mongoose, { isValidObjectId } from "mongoose";
import { Like } from "../models/like.model.js";
import { ApiError } from "../utils/ApiError.js";
import { ApiResponse } from "../utils/ApiResponse.js";
import { asyncHandler } from "../utils/AsyncHandler.js";

const toggleVideoLike = asyncHandler(async (req, res) => {
    const { videoId } = req.params;

    if (!isValidObjectId(videoId)) {
        throw new ApiError(400, "Invalid video ID");
    }

    const existingLike = await Like.findOne({
        video: videoId,
        likedBy: req.user._id,
    });

    if (existingLike) {
        // User has already liked the video, remove the like
        await Like.findByIdAndDelete(existingLike._id);
        return res.status(200).json(
            new ApiResponse(
                200,
                {
                    videoId,
                    liked: false,
                },
                "Like removed successfully"
            )
        );
    }

    // User has not liked the video, add the like
    const newLike = await Like.create({
        video: videoId,
        likedBy: req.user._id,
    });

    return res
        .status(201)
        .json(
            new ApiResponse(
                201,
                { videoId, liked: true },
                "Like added successfully"
            )
        );
});

const toggleCommentLike = asyncHandler(async (req, res) => {
    const { commentId } = req.params;

    if (!isValidObjectId(commentId)) {
        throw new ApiError(400, "Invalid comment ID");
    }

    const existingLike = await Like.findOne({
        comment: commentId,
        likedBy: req.user._id,
    });

    if (existingLike) {
        // User has already liked the comment, remove the like
        await Like.findByIdAndDelete(existingLike._id);
        return res.status(200).json(
            new ApiResponse(
                200,
                {
                    commentId,
                    liked: false,
                },
                "Like removed successfully"
            )
        );
    }

    // User has not liked the comment, add the like
    const newLike = await Like.create({
        comment: commentId,
        likedBy: req.user._id,
    });

    return res.status(201).json(
        new ApiResponse(
            201,
            {
                commentId,
                liked: true,
            },
            "Like added successfully"
        )
    );
});

const toggleTweetLike = asyncHandler(async (req, res) => {
    const { tweetId } = req.params;

    if (!isValidObjectId(tweetId)) {
        throw new ApiError(400, "Invalid tweet ID");
    }

    const existingLike = await Like.findOne({
        tweet: tweetId,
        likedBy: req.user._id,
    });

    if (existingLike) {
        // User has already liked the tweet, remove the like
        await Like.findByIdAndDelete(existingLike._id);
        return res.status(200).json(
            new ApiResponse(
                200,
                {
                    tweetId,
                    liked: false,
                },
                "Like removed successfully"
            )
        );
    }

    // User has not liked the tweet, add the like
    const newLike = await Like.create({
        tweet: tweetId,
        likedBy: req.user._id,
    });

    return res
        .status(201)
        .json(
            new ApiResponse(
                201,
                { tweetId, liked: true },
                "Like added successfully"
            )
        );
});

const getLikedVideos = asyncHandler(async (req, res) => {
    const userId = req.user._id;

    const likedVideos = await Like.aggregate([
        {
            $match: {
                likedBy: new mongoose.Types.ObjectId(userId),
                video: { $exists: true },
            },
        },
        {
            $lookup: {
                from: "videos",
                localField: "video",
                foreignField: "_id",
                as: "videoDetails",
                pipeline: [
                    {
                        $lookup: {
                            from: "users",
                            localField: "owner",
                            foreignField: "_id",
                            as: "owner",
                            pipeline: [
                                {
                                    $project: {
                                        username: 1,
                                        avatar: 1,
                                        fullName: 1,
                                    },
                                },
                            ],
                        },
                    },
                    {
                        $addFields: {
                            owner: { $arrayElemAt: ["$owner", 0] },
                        },
                    },
                ],
            },
        },
        {
            $addFields: {
                videoDetails: { $arrayElemAt: ["$videoDetails", 0] },
            },
        },
        {
            $match: {
                videoDetails: { $ne: null },
            },
        },
        {
            $project: {
                _id: 0,
                video: "$videoDetails",
            },
        },
    ]);

    res.status(200).json(
        new ApiResponse(200, likedVideos, "Liked videos retrieved successfully")
    );
});

export { toggleCommentLike, toggleTweetLike, toggleVideoLike, getLikedVideos };
