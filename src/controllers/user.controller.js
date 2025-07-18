import { asyncHandler } from "../utils/AsyncHandler.js";
import { ApiError } from "../utils/ApiError.js";
import { ApiResponse } from "../utils/ApiResponse.js";
import { User } from "../models/user.model.js";
import jwt from "jsonwebtoken";
import mongoose from "mongoose";
import {
    uploadOnCloudinary,
    deleteFromCloudinary,
} from "../utils/cloudinary.js";

const generateAccessAndRefreshTokens = async (userID) => {
    try {
        const user = await User.findById(userID);

        if (!user) throw new Error("User not found");

        const accessToken = user.generateAccessToken();
        const refreshToken = user.generateRefreshToken();

        user.refreshToken = refreshToken;

        user.save({ validateBeforeSave: false });

        return { accessToken, refreshToken };
    } catch (error) {
        throw new ApiError("Failed to generate tokens", 500);
    }
};

const registerUser = asyncHandler(async (req, res) => {
    //get user data from request body
    const { fullName, username, email, password } = req.body;

    if (
        [fullName, username, email, password].some(
            (field) => field === undefined || field === null || field === ""
        )
    ) {
        throw new ApiError("All fields are required", 400);
    }

    const existingUser = await User.findOne({
        $or: [{ email }, { username }],
    });
    if (existingUser) {
        throw new ApiError(
            "User with this email or username already exists",
            400
        );
    }

    const avatarLocalPath = req.files?.avatar ? req.files.avatar[0].path : null;
    const coverImageLocalPath = req.files?.coverImage
        ? req.files.coverImage[0].path
        : null;

    if (!avatarLocalPath) {
        throw new ApiError("avatar is required", 400);
    }

    const avatar = await uploadOnCloudinary(avatarLocalPath);
    const coverImage = coverImageLocalPath
        ? await uploadOnCloudinary(coverImageLocalPath)
        : "";

    if (!avatar || !avatar.secure_url) {
        throw new ApiError("Avatar upload failed", 500);
    }
    const newUser = await User.create({
        fullName,
        username: username.toLowerCase(),
        email,
        password,
        avatar: avatar.secure_url,
        coverImage: coverImage.secure_url || "",
    });
    if (!newUser) {
        throw new ApiError("User registration failed", 500);
    }
    const userResponse = {
        _id: newUser._id,
        fullName: newUser.fullName,
        username: newUser.username,
        email: newUser.email,
        avatar: newUser.avatar,
        coverImage: newUser.coverImage,
    };
    res.status(201).json(
        new ApiResponse(201, userResponse, "User registered successfully")
    );
});

const loginUser = asyncHandler(async (req, res) => {
    const { email, username, password } = req.body;
    if (!email && !username) {
        throw new ApiError("Email or username is required", 400);
    }
    if (!password) {
        throw new ApiError("Password is required", 400);
    }
    const user = await User.findOne({
        $or: [{ email }, { username }],
    });
    if (!user) {
        throw new ApiError("Invalid user credentials", 401);
    }
    const isPasswordCorrect = await user.isPasswordCorrect(password);
    if (!isPasswordCorrect) {
        throw new ApiError("Invalid user credentials", 401);
    }
    const { accessToken, refreshToken } = await generateAccessAndRefreshTokens(
        user._id
    );

    const userResponse = {
        _id: user._id,
        fullName: user.fullName,
        username: user.username,
        email: user.email,
        avatar: user.avatar,
        coverImage: user.coverImage,
    };

    const options = {
        httpOnly: true,
        secure: process.env.NODE_ENV === "production",
    };
    res.status(200)
        .cookie("refreshToken", refreshToken, options)
        .cookie("accessToken", accessToken, options)
        .json(
            new ApiResponse(
                200,
                { user: userResponse, accessToken, refreshToken },
                "Login successful"
            )
        );
});

const logoutUser = asyncHandler(async (req, res) => {
    const user = req.user;
    if (!user) {
        throw new ApiError("User not authenticated", 401);
    }
    await User.findByIdAndUpdate(user._id, {
        $unset: { refreshToken: 1 },
    });

    const options = {
        httpOnly: true,
        secure: process.env.NODE_ENV === "production",
    };
    res.clearCookie("refreshToken", options)
        .clearCookie("accessToken", options)
        .json(new ApiResponse(200, {}, "Logout successful"));
});

const refreshAccessToken = asyncHandler(async (req, res) => {
    const refreshToken =
        req.cookies.refreshToken ||
        req.header("Authorization")?.replace("Bearer ", "");
    if (!refreshToken) {
        throw new ApiError("Refresh token is required", 401);
    }
    try {
        const decoded = jwt.verify(
            refreshToken,
            process.env.REFRESH_TOKEN_SECRET
        );
        if (!decoded || !decoded._id) {
            throw new ApiError("Invalid refresh token", 401);
        }
        const user = await User.findById(decoded._id).select();
        if (!user) {
            throw new ApiError("User not found", 404);
        }
        if (user.refreshToken !== refreshToken) {
            throw new ApiError("refresh token is expired or used", 401);
        }
        const { accessToken, refreshToken: newRefreshToken } =
            await generateAccessAndRefreshTokens(user._id);
        const options = {
            httpOnly: true,
            secure: process.env.NODE_ENV === "production",
        };
        res.status(200)
            .cookie("refreshToken", newRefreshToken, options)
            .cookie("accessToken", accessToken, options);
        res.json(
            new ApiResponse(
                200,
                { accessToken, refreshToken: newRefreshToken },
                "Access token refreshed successfully"
            )
        );
    } catch (error) {
        throw new ApiError("Invalid refresh token", 401);
    }
});

const changePassword = asyncHandler(async (req, res) => {
    const { currentPassword, newPassword } = req.body;
    if (!currentPassword || !newPassword) {
        throw new ApiError("Current and new passwords are required", 400);
    }

    // Fetch user with password to validate current password
    const user = await User.findById(req.user._id);
    if (!user) {
        throw new ApiError("User not found", 404);
    }

    const isPasswordCorrect = await user.isPasswordCorrect(currentPassword);
    if (!isPasswordCorrect) {
        throw new ApiError("Current password is incorrect", 401);
    }

    user.password = newPassword;
    await user.save({ validateBeforeSave: false });

    res.json(new ApiResponse(200, {}, "Password changed successfully"));
});

const getUserProfile = asyncHandler(async (req, res) => {
    const userId = req.params.id || req.user._id;
    const user = await User.findById(userId).select("-password -refreshToken");
    if (!user) {
        throw new ApiError("User not found", 404);
    }
    res.json(
        new ApiResponse(200, {
            _id: user._id,
            fullName: user.fullName,
            username: user.username,
            email: user.email,
            avatar: user.avatar,
            coverImage: user.coverImage,
        })
    );
});

const updateUserProfile = asyncHandler(async (req, res) => {
    const userId = req.user._id;
    const { fullName, username, email } = req.body;
    if (!fullName || !username || !email) {
        throw new ApiError("Full name, username, and email are required", 400);
    }
    const user = await User.findByIdAndUpdate(
        userId,
        {
            fullName,
            username,
            email,
        },
        { new: true }
    );
    if (!user) {
        throw new ApiError("User not found", 404);
    }
    res.json(
        new ApiResponse(200, {
            _id: user._id,
            fullName: user.fullName,
            username: user.username,
            email: user.email,
            avatar: user.avatar,
            coverImage: user.coverImage,
        })
    );
});

const updateAvatar = asyncHandler(async (req, res) => {
    const userId = req.user._id;
    const avatarLocalPath = req.file ? req.file.path : null;
    if (!avatarLocalPath) {
        throw new ApiError("Avatar is required", 400);
    }
    const avatar = await uploadOnCloudinary(avatarLocalPath);
    if (!avatar || !avatar.secure_url) {
        throw new ApiError("Avatar upload failed", 500);
    }
    const user = await User.findById(userId).select("-password -refreshToken");
    if (!user) {
        throw new ApiError("User not found", 404);
    }
    // Delete old avatar from Cloudinary
    if (user.avatar) {
        await deleteFromCloudinary(user.avatar);
    }
    user.avatar = avatar.secure_url;
    await user.save({ validateBeforeSave: false });
    res.json(
        new ApiResponse(200, {
            _id: user._id,
            fullName: user.fullName,
            username: user.username,
            email: user.email,
            avatar: user.avatar,
            coverImage: user.coverImage,
        })
    );
});

const updateCoverImage = asyncHandler(async (req, res) => {
    const userId = req.user._id;
    const coverImageLocalPath = req.file ? req.file.path : null;
    if (!coverImageLocalPath) {
        throw new ApiError("Cover image is required", 400);
    }
    const coverImage = await uploadOnCloudinary(coverImageLocalPath);
    if (!coverImage || !coverImage.secure_url) {
        throw new ApiError("Cover image upload failed", 500);
    }
    const user = await User.findById(userId).select("-password -refreshToken");
    if (!user) {
        throw new ApiError("User not found", 404);
    }
    // Delete old cover image from Cloudinary
    if (user.coverImage) {
        await deleteFromCloudinary(user.coverImage);
    }
    user.coverImage = coverImage.secure_url;
    await user.save({ validateBeforeSave: false });
    res.json(
        new ApiResponse(200, {
            _id: user._id,
            fullName: user.fullName,
            username: user.username,
            email: user.email,
            avatar: user.avatar,
            coverImage: user.coverImage,
        })
    );
});

const getUserChannelProfile = asyncHandler(async (req, res) => {
    const username = req.params.username;
    if (!username?.trim()) {
        throw new ApiError("Username is required", 400);
    }
    const channel = await User.aggregate([
        { $match: { username: username.toLowerCase() } },
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
                from: "subscriptions",
                localField: "_id",
                foreignField: "subscriber",
                as: "subscribedTo",
            },
        },
        {
            $addFields: {
                subscriberCount: {
                    $size: "$subscribers",
                },
                channelSubscribedToCount: {
                    $size: "$subscribedTo",
                },
                isSubscribed: {
                    $cond: {
                        if: {
                            $in: [req.user?._id, "$subscribers.subscriber"],
                        },
                        then: true,
                        else: false,
                    },
                },
            },
        },
        {
            $project: {
                _id: 1,
                fullName: 1,
                username: 1,
                email: 1,
                avatar: 1,
                coverImage: 1,
                subscriberCount: 1,
                channelSubscribedToCount: 1,
                isSubscribed: 1,
            },
        },
    ]);
    if (!channel || channel.length === 0) {
        throw new ApiError("Channel not found", 404);
    }
    res.status(200).json(
        new ApiResponse(
            200,
            channel[0],
            "Channel profile retrieved successfully"
        )
    );
});

const getWatchHistory = asyncHandler(async (req, res) => {
    const user = await User.aggregate([
        {
            $match: {
                _id: new mongoose.Types.ObjectId(req.user._id),
            },
        },
        {
            $lookup: {
                from: "videos",
                localField: "watchHistory",
                foreignField: "_id",
                as: "watchHistory",
                pipeline: [
                    {
                        $lookup: {
                            from: "users",
                            localField: "user",
                            foreignField: "_id",
                            as: "owner",
                            pipeline: [
                                {
                                    $project: {
                                        _id: 1,
                                        fullName: 1,
                                        username: 1,
                                        avatar: 1,
                                        coverImage: 1,
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
    ]);
    if (!user || user.length === 0) {
        throw new ApiError("User not found", 404);
    }
    res.status(200).json(
        new ApiResponse(
            200,
            user[0].watchHistory,
            "Watch history retrieved successfully"
        )
    );
});

export {
    registerUser,
    loginUser,
    logoutUser,
    refreshAccessToken,
    changePassword,
    getUserProfile,
    updateUserProfile,
    updateAvatar,
    updateCoverImage,
    getUserChannelProfile,
    getWatchHistory,
};
