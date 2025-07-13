#!/usr/bin/env node

/**
 * Debug test script to identify specific issues
 */

import axios from "axios";
import FormData from "form-data";
import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const BASE_URL = "http://localhost:8000/api/v1";

const client = axios.create({
    baseURL: BASE_URL,
    timeout: 10000,
    validateStatus: () => true,
});

// Test data
const testUser = {
    username: `testuser_${Date.now()}`,
    email: `test_${Date.now()}@example.com`,
    fullName: "Debug Test User",
    password: "TestPassword123!",
};

let userId = null;
let accessToken = null;

async function debugTest() {
    console.log("🔍 Starting debug tests...");
    console.log(`Base URL: ${BASE_URL}`);

    try {
        // 1. Health check
        console.log("\n1. Testing Health Check...");
        const healthRes = await client.get("/healthcheck");
        console.log(`Status: ${healthRes.status}`);
        console.log(`Response:`, healthRes.data);

        // 2. User Registration
        console.log("\n2. Testing User Registration...");

        // Create test files
        const testDir = path.join(__dirname, "debug-test-files");
        if (!fs.existsSync(testDir)) {
            fs.mkdirSync(testDir);
        }

        // Create 1x1 pixel PNG
        const pngBuffer = Buffer.from([
            0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a, 0x00, 0x00, 0x00,
            0x0d, 0x49, 0x48, 0x44, 0x52, 0x00, 0x00, 0x00, 0x01, 0x00, 0x00,
            0x00, 0x01, 0x08, 0x02, 0x00, 0x00, 0x00, 0x90, 0x77, 0x53, 0xde,
            0x00, 0x00, 0x00, 0x0c, 0x49, 0x44, 0x41, 0x54, 0x08, 0xd7, 0x63,
            0xf8, 0x0f, 0x00, 0x00, 0x01, 0x00, 0x01, 0x5c, 0xc5, 0x0b, 0x8b,
            0x00, 0x00, 0x00, 0x00, 0x49, 0x45, 0x4e, 0x44, 0xae, 0x42, 0x60,
            0x82,
        ]);

        fs.writeFileSync(path.join(testDir, "avatar.png"), pngBuffer);
        fs.writeFileSync(path.join(testDir, "cover.png"), pngBuffer);

        const form = new FormData();
        form.append("username", testUser.username);
        form.append("email", testUser.email);
        form.append("fullName", testUser.fullName);
        form.append("password", testUser.password);
        form.append(
            "avatar",
            fs.createReadStream(path.join(testDir, "avatar.png"))
        );
        form.append(
            "coverImage",
            fs.createReadStream(path.join(testDir, "cover.png"))
        );

        const registerRes = await client.post("/users/register", form, {
            headers: form.getHeaders(),
        });

        console.log(`Registration Status: ${registerRes.status}`);
        console.log(`Registration Response:`, registerRes.data);

        if (registerRes.status === 201 && registerRes.data.data) {
            userId = registerRes.data.data._id;
            console.log(`✅ User created with ID: ${userId}`);
        } else {
            console.log("❌ Registration failed");
            return;
        }

        // 3. User Login
        console.log("\n3. Testing User Login...");
        const loginData = {
            email: testUser.email,
            password: testUser.password,
        };

        console.log("Login data:", loginData);

        const loginRes = await client.post("/users/login", loginData, {
            headers: { "Content-Type": "application/json" },
        });

        console.log(`Login Status: ${loginRes.status}`);
        console.log(`Login Response:`, loginRes.data);

        if (loginRes.status === 200 && loginRes.data.data) {
            accessToken = loginRes.data.data.accessToken;
            console.log(
                `✅ Login successful, token: ${accessToken ? "received" : "missing"}`
            );
        } else {
            console.log("❌ Login failed");
            return;
        }

        // 4. Test authenticated endpoint
        console.log("\n4. Testing Get User Profile...");
        const profileRes = await client.get("/users/get-user-profile", {
            headers: { Authorization: `Bearer ${accessToken}` },
        });

        console.log(`Profile Status: ${profileRes.status}`);
        console.log(`Profile Response:`, profileRes.data);

        // 5. Test tweet creation
        console.log("\n5. Testing Create Tweet...");
        const tweetRes = await client.post(
            "/tweets",
            { content: "Debug test tweet" },
            {
                headers: {
                    Authorization: `Bearer ${accessToken}`,
                    "Content-Type": "application/json",
                },
            }
        );

        console.log(`Tweet Status: ${tweetRes.status}`);
        console.log(`Tweet Response:`, tweetRes.data);

        // Cleanup
        if (fs.existsSync(testDir)) {
            fs.rmSync(testDir, { recursive: true, force: true });
        }
    } catch (error) {
        console.error("❌ Error during debug test:", error.message);
        if (error.response) {
            console.error("Response status:", error.response.status);
            console.error("Response data:", error.response.data);
        }
    }
}

debugTest();
