#!/usr/bin/env node

/**
 * Simple API Endpoint Testing Script
 * Uses axios for better compatibility
 */

import axios from "axios";
import FormData from "form-data";
import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Configuration
const BASE_URL = process.env.BASE_URL || "http://localhost:8000/api/v1";

// Colors for console output
const colors = {
    reset: "\x1b[0m",
    red: "\x1b[31m",
    green: "\x1b[32m",
    yellow: "\x1b[33m",
    blue: "\x1b[34m",
    cyan: "\x1b[36m",
};

// Test tracking
const results = { passed: 0, failed: 0, total: 0 };
let tokens = { accessToken: null, refreshToken: null };
let testIds = {
    userId: null,
    videoId: null,
    tweetId: null,
    commentId: null,
    playlistId: null,
};

// Utility functions
const log = (msg, color = colors.reset) =>
    console.log(`${color}${msg}${colors.reset}`);
const success = (msg) => log(`✅ ${msg}`, colors.green);
const error = (msg) => log(`❌ ${msg}`, colors.red);
const info = (msg) => log(`ℹ️  ${msg}`, colors.blue);

// HTTP client setup
const client = axios.create({
    baseURL: BASE_URL,
    timeout: 10000,
    validateStatus: () => true, // Don't throw on HTTP errors
});

// Add auth interceptor
client.interceptors.request.use((config) => {
    if (tokens.accessToken && !config.skipAuth) {
        config.headers.Authorization = `Bearer ${tokens.accessToken}`;
    }
    return config;
});

// Test wrapper
async function test(name, fn) {
    results.total++;
    try {
        info(`Testing: ${name}`);
        await fn();
        success(`${name} - PASSED`);
        results.passed++;
    } catch (err) {
        error(`${name} - FAILED: ${err.message}`);
        results.failed++;
    }
}

// Generate test data
const generateData = () => {
    const timestamp = Date.now();
    return {
        username: `testuser_${timestamp}`,
        email: `test_${timestamp}@example.com`,
        fullName: `Test User ${timestamp}`,
        password: "TestPassword123!",
        tweetContent: `Test tweet ${timestamp}`,
        playlistName: `Test Playlist ${timestamp}`,
        playlistDesc: `Test description ${timestamp}`,
    };
};

// Create dummy files
function createTestFiles() {
    const testDir = path.join(__dirname, "temp-test-files");
    if (!fs.existsSync(testDir)) {
        fs.mkdirSync(testDir);
    }

    // Create 1x1 pixel PNG
    const pngBuffer = Buffer.from([
        0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a, 0x00, 0x00, 0x00, 0x0d,
        0x49, 0x48, 0x44, 0x52, 0x00, 0x00, 0x00, 0x01, 0x00, 0x00, 0x00, 0x01,
        0x08, 0x02, 0x00, 0x00, 0x00, 0x90, 0x77, 0x53, 0xde, 0x00, 0x00, 0x00,
        0x0c, 0x49, 0x44, 0x41, 0x54, 0x08, 0xd7, 0x63, 0xf8, 0x0f, 0x00, 0x00,
        0x01, 0x00, 0x01, 0x5c, 0xc5, 0x0b, 0x8b, 0x00, 0x00, 0x00, 0x00, 0x49,
        0x45, 0x4e, 0x44, 0xae, 0x42, 0x60, 0x82,
    ]);

    fs.writeFileSync(path.join(testDir, "avatar.png"), pngBuffer);
    fs.writeFileSync(path.join(testDir, "cover.png"), pngBuffer);
    fs.writeFileSync(path.join(testDir, "thumbnail.png"), pngBuffer);
    fs.writeFileSync(path.join(testDir, "video.mp4"), "fake video content");

    return testDir;
}

// Test functions
async function testHealthCheck() {
    const res = await client.get("/healthcheck", { skipAuth: true });
    if (res.status !== 200) throw new Error(`Status: ${res.status}`);
}

async function testUserRegistration() {
    const data = generateData();
    const testDir = createTestFiles();

    const form = new FormData();
    form.append("username", data.username);
    form.append("email", data.email);
    form.append("fullName", data.fullName);
    form.append("password", data.password);
    form.append(
        "avatar",
        fs.createReadStream(path.join(testDir, "avatar.png"))
    );
    form.append(
        "coverImage",
        fs.createReadStream(path.join(testDir, "cover.png"))
    );

    const res = await client.post("/users/register", form, {
        headers: form.getHeaders(),
        skipAuth: true,
    });

    if (res.status !== 201)
        throw new Error(
            `Status: ${res.status}, Data: ${JSON.stringify(res.data)}`
        );
    testIds.userId = res.data.data._id;

    // Store credentials for login
    testIds.userCredentials = { email: data.email, password: data.password };
}

async function testUserLogin() {
    const res = await client.post("/users/login", testIds.userCredentials, {
        skipAuth: true,
    });
    if (res.status !== 200) throw new Error(`Status: ${res.status}`);

    tokens.accessToken = res.data.data.accessToken;
    tokens.refreshToken = res.data.data.refreshToken;
    testIds.userId = res.data.data.user._id;
}

async function testGetUserProfile() {
    const res = await client.get("/users/get-user-profile");
    if (res.status !== 200) throw new Error(`Status: ${res.status}`);
}

async function testUpdateUserProfile() {
    const res = await client.patch("/users/update-account", {
        fullName: "Updated Test User",
        username: `updated_${Date.now()}`,
        email: `updated_${Date.now()}@example.com`,
    });
    if (res.status !== 200) throw new Error(`Status: ${res.status}`);
}

async function testChangePassword() {
    const res = await client.post("/users/change-password", {
        currentPassword: testIds.userCredentials.password,
        newPassword: "NewTestPassword123!",
    });
    if (res.status !== 200) throw new Error(`Status: ${res.status}`);

    // Update stored password
    testIds.userCredentials.password = "NewTestPassword123!";
}

async function testRefreshToken() {
    const res = await client.get("/users/refresh-token", {
        headers: { Cookie: `refreshToken=${tokens.refreshToken}` },
        skipAuth: true,
    });
    if (res.status !== 200) throw new Error(`Status: ${res.status}`);

    tokens.accessToken = res.data.data.accessToken;
}

async function testCreateTweet() {
    const data = generateData();
    const res = await client.post("/tweets", { content: data.tweetContent });
    if (res.status !== 201) throw new Error(`Status: ${res.status}`);

    testIds.tweetId = res.data.data._id;
}

async function testGetUserTweets() {
    const res = await client.get(`/tweets/user/${testIds.userId}`);
    if (res.status !== 200) throw new Error(`Status: ${res.status}`);
}

async function testUpdateTweet() {
    const res = await client.patch(`/tweets/${testIds.tweetId}`, {
        content: `Updated tweet content ${Date.now()}`,
    });
    if (res.status !== 200) throw new Error(`Status: ${res.status}`);
}

async function testCreatePlaylist() {
    const data = generateData();
    const res = await client.post("/playlist", {
        name: data.playlistName,
        description: data.playlistDesc,
    });
    if (res.status !== 201) throw new Error(`Status: ${res.status}`);

    testIds.playlistId = res.data.data._id;
}

async function testGetUserPlaylists() {
    const res = await client.get(`/playlist/user/${testIds.userId}`);
    if (res.status !== 200) throw new Error(`Status: ${res.status}`);
}

async function testUpdatePlaylist() {
    const res = await client.patch(`/playlist/${testIds.playlistId}`, {
        name: `Updated Playlist ${Date.now()}`,
        description: `Updated description ${Date.now()}`,
    });
    if (res.status !== 200) throw new Error(`Status: ${res.status}`);
}

async function testToggleSubscription() {
    // Create a dummy channel ID (not ourselves) for testing
    const dummyChannelId = "507f1f77bcf86cd799439011"; // Valid ObjectId format
    const res = await client.post(`/subscriptions/c/${dummyChannelId}`);
    if (![200, 201, 404].includes(res.status))
        throw new Error(`Status: ${res.status}`);
}

async function testGetChannelSubscribers() {
    const res = await client.get(`/subscriptions/u/${testIds.userId}`);
    if (res.status !== 200) throw new Error(`Status: ${res.status}`);
}

async function testGetSubscribedChannels() {
    const res = await client.get(`/subscriptions/c/${testIds.userId}`);
    if (res.status !== 200) throw new Error(`Status: ${res.status}`);
}

async function testLikeToggleTweet() {
    const res = await client.post(`/likes/toggle/t/${testIds.tweetId}`);
    if (![200, 201].includes(res.status))
        throw new Error(`Status: ${res.status}`);
}

async function testGetLikedVideos() {
    const res = await client.get("/likes/videos");
    if (res.status !== 200) throw new Error(`Status: ${res.status}`);
}

async function testGetChannelStats() {
    const res = await client.get("/dashboard/stats");
    if (res.status !== 200) throw new Error(`Status: ${res.status}`);
}

async function testGetChannelVideos() {
    const res = await client.get("/dashboard/videos");
    if (res.status !== 200) throw new Error(`Status: ${res.status}`);
}

async function testDeleteTweet() {
    const res = await client.delete(`/tweets/${testIds.tweetId}`);
    if (res.status !== 200) throw new Error(`Status: ${res.status}`);
}

async function testDeletePlaylist() {
    const res = await client.delete(`/playlist/${testIds.playlistId}`);
    if (res.status !== 200) throw new Error(`Status: ${res.status}`);
}

async function testUserLogout() {
    const res = await client.get("/users/logout");
    if (res.status !== 200) throw new Error(`Status: ${res.status}`);

    tokens.accessToken = null;
    tokens.refreshToken = null;
}

// Cleanup
function cleanup() {
    const testDir = path.join(__dirname, "temp-test-files");
    if (fs.existsSync(testDir)) {
        fs.rmSync(testDir, { recursive: true, force: true });
    }
}

// Print results
function printResults() {
    log("\n" + "=".repeat(50), colors.cyan);
    log("TEST RESULTS", colors.cyan);
    log("=".repeat(50), colors.cyan);
    log(`Total: ${results.total}`);
    log(`Passed: ${results.passed}`, colors.green);
    log(`Failed: ${results.failed}`, colors.red);
    log(
        `Success Rate: ${((results.passed / results.total) * 100).toFixed(1)}%`,
        colors.yellow
    );
    log("=".repeat(50), colors.cyan);
}

// Main runner
async function runTests() {
    log("🚀 Starting API Tests...", colors.cyan);
    log(`Base URL: ${BASE_URL}`, colors.blue);

    try {
        // Core tests
        await test("Health Check", testHealthCheck);

        // Auth flow
        await test("User Registration", testUserRegistration);
        await test("User Login", testUserLogin);
        await test("Get User Profile", testGetUserProfile);
        await test("Update User Profile", testUpdateUserProfile);
        await test("Change Password", testChangePassword);
        await test("Refresh Token", testRefreshToken);

        // Content tests
        await test("Create Tweet", testCreateTweet);
        await test("Get User Tweets", testGetUserTweets);
        await test("Update Tweet", testUpdateTweet);

        // Playlist tests
        await test("Create Playlist", testCreatePlaylist);
        await test("Get User Playlists", testGetUserPlaylists);
        await test("Update Playlist", testUpdatePlaylist);

        // Social features
        await test("Toggle Subscription", testToggleSubscription);
        await test("Get Channel Subscribers", testGetChannelSubscribers);
        await test("Get Subscribed Channels", testGetSubscribedChannels);
        await test("Like Toggle Tweet", testLikeToggleTweet);
        await test("Get Liked Videos", testGetLikedVideos);

        // Dashboard
        await test("Get Channel Stats", testGetChannelStats);
        await test("Get Channel Videos", testGetChannelVideos);

        // Cleanup
        await test("Delete Tweet", testDeleteTweet);
        await test("Delete Playlist", testDeletePlaylist);
        await test("User Logout", testUserLogout);
    } catch (err) {
        error(`Critical error: ${err.message}`);
    } finally {
        cleanup();
        printResults();
    }
}

// Handle interruption
process.on("SIGINT", () => {
    log("\nTests interrupted", colors.yellow);
    cleanup();
    process.exit(0);
});

// Run if called directly
if (import.meta.url === `file://${process.argv[1]}`) {
    runTests();
}

export { runTests };
