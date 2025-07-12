import { asyncHandler } from "../utils/AsyncHandler.js";
import { ApiError } from "../utils/ApiError.js";
import jwt from "jsonwebtoken";
import { User } from "../models/user.model.js";

export const verifyJWT = asyncHandler(async (req, res, next) => {
    const token =
        req.cookies.accessToken ||
        req.header("Authorization")?.replace("Bearer ", "");
    if (!token) {
        throw new ApiError("Access token is required", 401);
    }
    try {
        const decoded = jwt.verify(token, process.env.ACCESS_TOKEN_SECRET);
        if (!decoded || !decoded._id) {
            throw new ApiError("Invalid access token", 401);
        }
        const user = await User.findById(decoded._id).select(
            "-password -refreshToken"
        );
        if (!user) {
            throw new ApiError("User not found", 404);
        }
        req.user = user; // Attach user to request object
        next();
    } catch (error) {
        // console.error("JWT verification error:", error);
        throw new ApiError("Invalid access token", 401);
    }
});
