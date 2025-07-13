import mongoose, { isValidObjectId } from "mongoose";
import { User } from "../models/user.model.js";
import { Subscription } from "../models/subscription.model.js";
import { ApiError } from "../utils/ApiError.js";
import { ApiResponse } from "../utils/ApiResponse.js";
import { asyncHandler } from "../utils/AsyncHandler.js";

const toggleSubscription = asyncHandler(async (req, res) => {
    const { channelId } = req.params;

    if (!isValidObjectId(channelId)) {
        throw new ApiError(400, "Invalid channel ID");
    }

    if (channelId === req.user._id.toString()) {
        throw new ApiError(400, "You cannot subscribe to yourself");
    }

    const existingSubscription = await Subscription.findOne({
        channel: channelId,
        subscriber: req.user._id,
    });

    if (existingSubscription) {
        await Subscription.findByIdAndDelete(existingSubscription._id);
        res.status(200).json(
            new ApiResponse(200, null, "Unsubscribed successfully")
        );
    } else {
        const newSubscription = await Subscription.create({
            channel: channelId,
            subscriber: req.user._id,
        });
        res.status(201).json(
            new ApiResponse(201, newSubscription, "Subscribed successfully")
        );
    }
});

// controller to return subscribers list of a channel
const getUserChannelSubscribers = asyncHandler(async (req, res) => {
    const { subscriberId } = req.params;

    if (!isValidObjectId(subscriberId)) {
        throw new ApiError(400, "Invalid subscriber ID");
    }

    const subscribers = await Subscription.find({
        channel: subscriberId,
    }).populate("subscriber", "username avatar fullName");

    res.status(200).json(
        new ApiResponse(
            200,
            subscribers,
            "Channel subscribers fetched successfully"
        )
    );
});

// controller to return channel list to which user has subscribed
const getSubscribedChannels = asyncHandler(async (req, res) => {
    const { channelId } = req.params;

    if (!isValidObjectId(channelId)) {
        throw new ApiError(400, "Invalid channel ID");
    }

    const subscriptions = await Subscription.find({
        subscriber: channelId,
    }).populate("channel", "username avatar fullName");

    res.status(200).json(
        new ApiResponse(
            200,
            subscriptions,
            "User subscribed channels fetched successfully"
        )
    );
});

export { toggleSubscription, getUserChannelSubscribers, getSubscribedChannels };
