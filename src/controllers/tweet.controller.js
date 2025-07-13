import mongoose, { isValidObjectId } from "mongoose";
import { Tweet } from "../models/tweet.model.js";
import { User } from "../models/user.model.js";
import { ApiError } from "../utils/ApiError.js";
import { ApiResponse } from "../utils/ApiResponse.js";
import { asyncHandler } from "../utils/asyncHandler.js";

const createTweet = asyncHandler(async (req, res) => {
    const { content } = req.body;
    if (!content) {
        throw new ApiError(400, "Content is required");
    }
    const tweet = await Tweet.create({
        content,
        userId: req.user._id,
    });

    res.status(201).json(new ApiResponse("Tweet created successfully", tweet));
});

const getUserTweets = asyncHandler(async (req, res) => {
    const { userId } = req.params;
    if (!isValidObjectId(userId)) {
        throw new ApiError(400, "Invalid user ID");
    }
    const tweets = await Tweet.find({ userId })
        .populate("userId", "username profilePicture")
        .sort({ createdAt: -1 });
    res.status(200).json(
        new ApiResponse("User tweets fetched successfully", tweets)
    );
});

const updateTweet = asyncHandler(async (req, res) => {
    const { tweetId } = req.params;
    const { content } = req.body;
    if (!isValidObjectId(tweetId)) {
        throw new ApiError(400, "Invalid tweet ID");
    }
    if (!content) {
        throw new ApiError(400, "Content is required");
    }
    const tweet = await Tweet.findById(tweetId);
    if (!tweet) {
        throw new ApiError(404, "Tweet not found");
    }
    if (!tweet.userId.equals(req.user._id)) {
        throw new ApiError(403, "You are not authorized to update this tweet");
    }
    tweet.content = content || tweet.content;
    await tweet.save();
    res.status(200).json(new ApiResponse("Tweet updated successfully", tweet));
});

const deleteTweet = asyncHandler(async (req, res) => {
    const { tweetId } = req.params;
    if (!isValidObjectId(tweetId)) {
        throw new ApiError(400, "Invalid tweet ID");
    }
    const tweet = await Tweet.findById(tweetId);
    if (!tweet) {
        throw new ApiError(404, "Tweet not found");
    }
    if (!tweet.userId.equals(req.user._id)) {
        throw new ApiError(403, "You are not authorized to delete this tweet");
    }
    await tweet.remove();
    res.status(200).json(new ApiResponse("Tweet deleted successfully", tweet));
});

export { createTweet, getUserTweets, updateTweet, deleteTweet };
