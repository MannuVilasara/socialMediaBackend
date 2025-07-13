import { Router } from "express";
import {
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
} from "../controllers/user.controller.js";
import { upload } from "../middlewares/multer.middleware.js";
import { verifyJWT } from "../middlewares/auth.middleware.js";

const router = Router();
router.post(
    "/register",
    upload.fields([
        {
            name: "avatar",
            maxCount: 1,
        },
        {
            name: "coverImage",
            maxCount: 1,
        },
    ]),
    registerUser
);
router.route("/login").post(loginUser);
router.route("/refresh-token").get(refreshAccessToken);

//secure
router.route("/logout").get(verifyJWT, logoutUser);
router.route("/change-password").post(verifyJWT, changePassword);
router
    .route("/get-user-profile")
    .get(verifyJWT, getUserProfile)
    .post(verifyJWT, getUserProfile);

router.route("/update-account").patch(verifyJWT, updateUserProfile);
router
    .route("/updateAvatar")
    .patch(verifyJWT, upload.single("avatar"), updateAvatar);
router
    .route("/update-cover-image")
    .patch(verifyJWT, upload.single("coverImage"), updateCoverImage);

router.route("/channel/:username").get(getUserChannelProfile);
router.route("/watch-history").get(verifyJWT, getWatchHistory);

export default router;
