import mongoose, { isValidObjectId } from "mongoose";
import { User } from "../models/user.model.js";
import { Subscription } from "../models/subscription.model.js";
import { ApiError } from "../utils/ApiError.js";
import { ApiResponse } from "../utils/ApiResponse.js";
import { asyncHandler } from "../utils/asyncHandler.js";

const toggleSubscription = asyncHandler(async (req, res) => {
    const { channelId } = req.params;
    if (!isValidObjectId(channelId)) {
        throw new ApiError(400, "Invalid channel ID");
    }
    const existingSubscription = await Subscription.findOne({
        channelId,
        subscriberId: req.user._id,
    });
    if (existingSubscription) {
        await existingSubscription.remove();
        res.status(200).json(
            new ApiResponse("Unsubscribed from channel successfully")
        );
    } else {
        await Subscription.create({
            channelId,
            subscriberId: req.user._id,
        });
        res.status(201).json(
            new ApiResponse("Subscribed to channel successfully")
        );
    }
});

// controller to return subscriber list of a channel
const getUserChannelSubscribers = asyncHandler(async (req, res) => {
    const { channelId } = req.params;
    if (!isValidObjectId(channelId)) {
        throw new ApiError(400, "Invalid channel ID");
    }
    const subscribers = await Subscription.find({ channelId }).populate(
        "subscriberId",
        "username profilePicture"
    );
    res.status(200).json(
        new ApiResponse("Channel subscribers fetched successfully", subscribers)
    );
});

// controller to return channel list to which user has subscribed
const getSubscribedChannels = asyncHandler(async (req, res) => {
    const { subscriberId } = req.params;
    if (!isValidObjectId(subscriberId)) {
        throw new ApiError(400, "Invalid subscriber ID");
    }
    const subscriptions = await Subscription.find({ subscriberId }).populate(
        "channelId",
        "name description"
    );
    res.status(200).json(
        new ApiResponse(
            "User subscribed channels fetched successfully",
            subscriptions
        )
    );
});

export { toggleSubscription, getUserChannelSubscribers, getSubscribedChannels };
