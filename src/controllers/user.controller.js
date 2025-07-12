import { asyncHandler } from "../utils/AsyncHandler.js";
import { ApiError } from "../utils/ApiError.js";
import { ApiResponse } from "../utils/ApiResponse.js";
import { User } from "../models/user.model.js";
import { uploadImage, deleteImage } from "../utils/cloudinary.js";

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

    const avatar = await uploadImage(avatarLocalPath);
    const coverImage = coverImageLocalPath
        ? await uploadImage(coverImageLocalPath)
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
        $set: { refreshToken: undefined },
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
    const user = req.user;
    if (!user) {
        throw new ApiError("User not authenticated", 401);
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
    const avatar = await uploadImage(avatarLocalPath);
    if (!avatar || !avatar.secure_url) {
        throw new ApiError("Avatar upload failed", 500);
    }
    const user = await User.findById(userId).select("-password -refreshToken");
    if (!user) {
        throw new ApiError("User not found", 404);
    }
    // Delete old avatar from Cloudinary
    if (user.avatar) {
        await deleteImage(user.avatar);
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
    const coverImage = await uploadImage(coverImageLocalPath);
    if (!coverImage || !coverImage.secure_url) {
        throw new ApiError("Cover image upload failed", 500);
    }
    const user = await User.findById(userId).select("-password -refreshToken");
    if (!user) {
        throw new ApiError("User not found", 404);
    }
    // Delete old cover image from Cloudinary
    if (user.coverImage) {
        await deleteImage(user.coverImage);
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
};
