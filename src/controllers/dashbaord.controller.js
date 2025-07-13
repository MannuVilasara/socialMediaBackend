import mongoose from "mongoose";
import { Video } from "../models/video.model.js";
import { Subscription } from "../models/subscription.model.js";
import { Like } from "../models/like.model.js";
import { User } from "../models/user.model.js";
import { ApiError } from "../utils/ApiError.js";
import { ApiResponse } from "../utils/ApiResponse.js";
import { asyncHandler } from "../utils/AsyncHandler.js";

const getChannelStats = asyncHandler(async (req, res) => {
    const channelId = req.user?._id; // Get stats for the current user's channel

    if (!mongoose.isValidObjectId(channelId)) {
        throw new ApiError(400, "Invalid channel ID");
    }

    const channelStats = await User.aggregate([
        {
            $match: {
                _id: new mongoose.Types.ObjectId(channelId),
            },
        },
        {
            $lookup: {
                from: "videos",
                localField: "_id",
                foreignField: "owner",
                as: "videos",
            },
        },
        {
            $lookup: {
                from: "subscriptions",
                localField: "_id",
                foreignField: "channel",
                as: "subscribers",
            },
        },
        {
            $lookup: {
                from: "likes",
                localField: "videos._id",
                foreignField: "video",
                as: "likes",
            },
        },
        {
            $addFields: {
                totalSubscribers: {
                    $size: "$subscribers",
                },
                totalVideos: {
                    $size: "$videos",
                },
                totalLikes: {
                    $size: "$likes",
                },
                totalViews: {
                    $sum: "$videos.views",
                },
            },
        },
        {
            $project: {
                username: 1,
                fullName: 1,
                avatar: 1,
                totalSubscribers: 1,
                totalVideos: 1,
                totalLikes: 1,
                totalViews: 1,
            },
        },
    ]);

    if (!channelStats.length) {
        throw new ApiError(404, "Channel not found");
    }

    res.status(200).json(
        new ApiResponse(
            200,
            channelStats[0],
            "Channel stats retrieved successfully"
        )
    );
});

const getChannelVideos = asyncHandler(async (req, res) => {
    const channelId = req.user?._id; // Get videos for the current user's channel

    if (!mongoose.isValidObjectId(channelId)) {
        throw new ApiError(400, "Invalid channel ID");
    }

    const videos = await Video.find({ owner: channelId })
        .populate("owner", "username avatar fullName")
        .sort({ createdAt: -1 });

    res.status(200).json(
        new ApiResponse(200, videos, "Channel videos retrieved successfully")
    );
});

export { getChannelStats, getChannelVideos };
