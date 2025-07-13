# Postman Collection Usage Guide

## Overview

The updated Postman collection now includes comprehensive testing for all Social Media Backend API endpoints with automatic variable extraction and proper HTTP methods.

## Collection Features

### 🔧 **Automatic Variable Management**

- **Login Request**: Automatically extracts and sets `accessToken`, `refreshToken`, and `userId`
- **Create Tweet**: Automatically sets `tweetId` for subsequent requests
- **Create Playlist**: Automatically sets `playlistId` for subsequent requests

### 📋 **Complete Endpoint Coverage**

#### **User Management**

- ✅ Register User (with file uploads)
- ✅ Login User (with auto token extraction)
- ✅ Get User Profile
- ✅ Update User Profile
- ✅ Change Password
- ✅ Refresh Token (GET method with cookie)
- ✅ Logout User (GET method)

#### **Videos**

- ✅ Publish Video (with file uploads)
- ✅ Get Video by ID
- ✅ Update Video
- ✅ Delete Video
- ✅ Toggle Publish Status
- ✅ Get All Videos (with pagination)

#### **Tweets**

- ✅ Create Tweet (with auto ID extraction)
- ✅ Get User Tweets
- ✅ Update Tweet
- ✅ Delete Tweet

#### **Comments**

- ✅ Add Comment to Video
- ✅ Get Video Comments (with pagination)
- ✅ Update Comment
- ✅ Delete Comment

#### **Playlists**

- ✅ Create Playlist (with auto ID extraction)
- ✅ Get User Playlists
- ✅ Get Playlist by ID
- ✅ Update Playlist
- ✅ Add Video to Playlist
- ✅ Remove Video from Playlist
- ✅ Delete Playlist

#### **Subscriptions**

- ✅ Toggle Subscription (uses dummy channel ID to avoid self-subscription)
- ✅ Get Channel Subscribers
- ✅ Get Subscribed Channels

#### **Likes**

- ✅ Toggle Video Like
- ✅ Toggle Tweet Like
- ✅ Toggle Comment Like
- ✅ Get Liked Videos

#### **Dashboard**

- ✅ Get Channel Stats
- ✅ Get Channel Videos

#### **Health Check**

- ✅ Health Check endpoint

## Usage Instructions

### 1. **Setup**

1. Import the `postman_collection.json` file into Postman
2. Ensure your server is running on `http://localhost:8000`
3. Update the `baseUrl` variable if using a different port/host

### 2. **Testing Workflow**

#### **Basic Authentication Flow:**

1. Run **"Register User"** first (upload sample avatar/cover image files)
2. Run **"Login User"** - this will automatically set all authentication tokens
3. Now you can run any authenticated endpoint

#### **Content Creation Flow:**

1. **"Create Tweet"** - automatically sets `tweetId`
2. **"Create Playlist"** - automatically sets `playlistId`
3. **"Publish Video"** - manually set `videoId` from response for subsequent video operations

#### **Social Features Testing:**

1. **"Toggle Tweet Like"** - likes/unlikes the created tweet
2. **"Toggle Subscription"** - subscribes to a dummy channel (safe for testing)
3. **"Add Comment"** - requires a `videoId` to be set manually

### 3. **Variables Available**

- `baseUrl`: API base URL
- `accessToken`: JWT access token (auto-set on login)
- `refreshToken`: JWT refresh token (auto-set on login)
- `userId`: Current user ID (auto-set on login)
- `tweetId`: Latest created tweet ID (auto-set on tweet creation)
- `playlistId`: Latest created playlist ID (auto-set on playlist creation)
- `videoId`: Video ID (set manually from video creation response)
- `commentId`: Comment ID (set manually from comment creation response)

### 4. **Manual Variable Updates**

For some endpoints, you may need to manually update variables:

- Copy `videoId` from "Publish Video" response
- Copy `commentId` from "Add Comment" response
- Update any other IDs as needed for cross-referencing

### 5. **File Upload Tests**

For file upload endpoints (Register User, Publish Video):

1. Select the file field in the request body
2. Choose appropriate test files (images for avatar/cover, video file for video upload)
3. Ensure files are properly selected before sending the request

## Key Fixes Made

### ✅ **HTTP Method Corrections**

- **Refresh Token**: Changed from POST to GET
- **Logout**: Changed from POST to GET

### ✅ **Endpoint Additions**

- Complete Video management endpoints
- Comment CRUD operations
- Playlist video management (add/remove)
- All Like toggle operations
- Missing user management endpoints

### ✅ **Smart Variable Management**

- Auto-extraction of tokens and IDs
- Proper cookie handling for refresh token
- Dynamic variable setting with JavaScript tests

### ✅ **Safe Testing**

- Subscription toggle uses dummy channel ID to prevent self-subscription errors
- Proper error handling examples
- Pagination parameters included where applicable

## Testing Notes

- **File Uploads**: Use small test files to avoid timeout issues
- **Pagination**: Default parameters provided, adjust as needed
- **Authentication**: All protected endpoints automatically use the stored access token
- **Error Handling**: Check response status codes and error messages for debugging

This collection provides complete coverage of your Social Media Backend API and should handle all standard testing scenarios!
