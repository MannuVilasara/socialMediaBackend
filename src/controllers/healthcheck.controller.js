import { ApiError } from "../utils/ApiError.js";
import { ApiResponse } from "../utils/ApiResponse.js";
import { asyncHandler } from "../utils/asyncHandler.js";

const healthcheck = asyncHandler(async (req, res) => {
    try {
        // Simulate a health check by returning a simple response
        res.status(200).json(new ApiResponse("Service is healthy", true));
    } catch (error) {
        // If an error occurs, return an error response
        throw new ApiError(500, "Health check failed", error);
    }
});

export { healthcheck };
