import { asyncHandler } from "../utils/AsyncHandler.js";
import { ApiError } from "../utils/ApiError.js";
import { ApiResponse } from "../utils/ApiResponse.js";
import { User } from "../models/user.model.js";
import { uploadImage } from "../utils/cloudinary.js";

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
    const coverPhotoLocalPath = req.files?.coverPhoto
        ? req.files.coverPhoto[0].path
        : null;

    if (!avatarLocalPath) {
        throw new ApiError("avatar is required", 400);
    }

    const avatar = await uploadImage(avatarLocalPath);
    const coverPhoto = coverPhotoLocalPath
        ? await uploadImage(coverPhotoLocalPath)
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
        coverImage: coverPhoto.secure_url || "",
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

export { registerUser };
