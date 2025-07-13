import mongoose from "mongoose";
import { Comment } from "../models/comment.model.js";
import { ApiError } from "../utils/ApiError.js";
import { ApiResponse } from "../utils/ApiResponse.js";
import { asyncHandler } from "../utils/asyncHandler.js";

const getVideoComments = asyncHandler(async (req, res) => {
    const { videoId } = req.params;
    const { page = 1, limit = 10 } = req.query;
    if (!mongoose.isValidObjectId(videoId)) {
        throw new ApiError(400, "Invalid video ID");
    }
    const comments = await Comment.find({ videoId })
        .skip((page - 1) * limit)
        .limit(Number(limit))
        .populate("userId", "username profilePicture")
        .sort({ createdAt: -1 });
    res.status(200).json(
        new ApiResponse(200, "Comments fetched successfully", comments)
    );
});

const addComment = asyncHandler(async (req, res) => {
    const { videoId } = req.params;
    const { content } = req.body;
    if (!mongoose.isValidObjectId(videoId)) {
        throw new ApiError(400, "Invalid video ID");
    }
    if (!content || content.trim() === "") {
        throw new ApiError(400, "Comment content cannot be empty");
    }
    const comment = await Comment.create({
        videoId,
        userId: req.user._id, // Assuming user ID is available in req.user
        content,
    });
    res.status(201).json(
        new ApiResponse(201, "Comment added successfully", comment)
    );
});

const updateComment = asyncHandler(async (req, res) => {
    const { videoId, commentId } = req.params;
    const { content } = req.body;
    if (!mongoose.isValidObjectId(videoId)) {
        throw new ApiError(400, "Invalid video ID");
    }
    if (!mongoose.isValidObjectId(commentId)) {
        throw new ApiError(400, "Invalid comment ID");
    }
    if (!content || content.trim() === "") {
        throw new ApiError(400, "Comment content cannot be empty");
    }
    const comment = await Comment.findOne({ _id: commentId, videoId });
    if (!comment) {
        throw new ApiError(404, "Comment not found");
    }
    if (!comment.userId.equals(req.user._id)) {
        throw new ApiError(
            403,
            "You are not authorized to update this comment"
        );
    }
    comment.content = content;
    await comment.save();
    res.status(200).json(
        new ApiResponse(200, "Comment updated successfully", comment)
    );
});

const deleteComment = asyncHandler(async (req, res) => {
    const { videoId, commentId } = req.params;
    if (!mongoose.isValidObjectId(videoId)) {
        throw new ApiError(400, "Invalid video ID");
    }
    if (!mongoose.isValidObjectId(commentId)) {
        throw new ApiError(400, "Invalid comment ID");
    }
    const comment = await Comment.findOne({ _id: commentId, videoId });
    if (!comment) {
        throw new ApiError(404, "Comment not found");
    }
    if (!comment.userId.equals(req.user._id)) {
        throw new ApiError(
            403,
            "You are not authorized to delete this comment"
        );
    }
    await comment.remove();
    res.status(200).json(
        new ApiResponse(200, "Comment deleted successfully", comment)
    );
});

export { getVideoComments, addComment, updateComment, deleteComment };
