import mongoose from "mongoose";
import { Video } from "../models/video.model.js";
import { Subscription } from "../models/subscription.model.js";
import { Like } from "../models/like.model.js";
import { ApiError } from "../utils/ApiError.js";
import { ApiResponse } from "../utils/ApiResponse.js";
import { asyncHandler } from "../utils/asyncHandler.js";

const getChannelStats = asyncHandler(async (req, res) => {
    const { channelId } = req.params;

    if (!mongoose.isValidObjectId(channelId)) {
        throw new ApiError(400, "Invalid channel ID");
    }

    const channelStats = await Subscription.aggregate([
        { $match: { channelId: mongoose.Types.ObjectId(channelId) } },
        {
            $group: {
                _id: "$channelId",
                subscriberCount: { $sum: 1 },
                videoCount: { $sum: 1 }, // Assuming each subscription corresponds to a video
            },
        },
    ]);

    if (channelStats.length === 0) {
        throw new ApiError(404, "Channel not found or no stats available");
    }

    res.status(200).json(
        new ApiResponse("Channel stats retrieved successfully", channelStats[0])
    );
});

const getChannelVideos = asyncHandler(async (req, res) => {
    const { channelId } = req.params;

    if (!mongoose.isValidObjectId(channelId)) {
        throw new ApiError(400, "Invalid channel ID");
    }

    const videos = await Video.find({ channelId })
        .populate("userId", "username profilePicture")
        .sort({ createdAt: -1 });

    if (videos.length === 0) {
        throw new ApiError(404, "No videos found for this channel");
    }

    res.status(200).json(
        new ApiResponse("Channel videos retrieved successfully", videos)
    );
});

export { getChannelStats, getChannelVideos };
