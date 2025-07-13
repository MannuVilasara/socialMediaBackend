# API Endpoint Testing Guide

This repository includes comprehensive testing scripts to verify all API endpoints are working correctly.

## 📋 Test Files

- **`test-endpoints-simple.js`** - Simplified test script using axios (recommended)
- **`test-endpoints.js`** - Advanced test script with detailed logging

## 🚀 Quick Start

### 1. Install Dependencies

```bash
npm install
# or
npm install axios form-data --save-dev
```

### 2. Start Your Server

```bash
npm run dev
# Server should be running on http://localhost:8000
```

### 3. Run Tests

```bash
# Run simple tests (recommended)
npm test

# Run comprehensive tests
npm run test:full

# Or run directly
node test-endpoints-simple.js
```

## 🔧 Configuration

### Environment Variables

Create a `.env` file or set environment variables:

```bash
# Optional - defaults to http://localhost:8000/api/v1
BASE_URL=http://localhost:8000/api/v1

# Make sure your server environment is set
NODE_ENV=development
PORT=8000
```

### Test Configuration

The tests will automatically:

- Generate unique test data (usernames, emails, etc.)
- Create temporary test files (images, videos)
- Clean up after completion

## 📊 Test Coverage

### Authentication & User Management

- ✅ Health Check
- ✅ User Registration (with file upload)
- ✅ User Login
- ✅ Get User Profile
- ✅ Update User Profile
- ✅ Change Password
- ✅ Refresh Access Token
- ✅ User Logout

### Content Management

- ✅ Create Tweet
- ✅ Get User Tweets
- ✅ Update Tweet
- ✅ Delete Tweet

### Playlist Management

- ✅ Create Playlist
- ✅ Get User Playlists
- ✅ Update Playlist
- ✅ Delete Playlist

### Social Features

- ✅ Toggle Subscription
- ✅ Get Channel Subscribers
- ✅ Get Subscribed Channels
- ✅ Toggle Tweet Like
- ✅ Get Liked Videos

### Dashboard & Analytics

- ✅ Get Channel Statistics
- ✅ Get Channel Videos

## 📝 Test Output

### Success Example

```
🚀 Starting API Tests...
ℹ️  Base URL: http://localhost:8000/api/v1
ℹ️  Testing: Health Check
✅ Health Check - PASSED
ℹ️  Testing: User Registration
✅ User Registration - PASSED
...
==================================================
TEST RESULTS
==================================================
Total: 20
Passed: 20
Failed: 0
Success Rate: 100.0%
==================================================
```

### Failure Example

```
ℹ️  Testing: User Login
❌ User Login - FAILED: Status: 401
```

## 🔍 Debugging

### Common Issues

1. **Server Not Running**

    ```
    Error: connect ECONNREFUSED 127.0.0.1:8000
    ```

    Solution: Make sure your server is running with `npm run dev`

2. **Database Connection**

    ```
    Error: MongoServerError
    ```

    Solution: Ensure MongoDB is running and connection string is correct

3. **File Upload Issues**

    ```
    Error: Multer error
    ```

    Solution: Check multer middleware configuration and file permissions

4. **Authentication Errors**
    ```
    Status: 401
    ```
    Solution: Check JWT token generation and middleware

### Verbose Logging

For detailed debugging, modify the test files to add more logging:

```javascript
// Add this for detailed response logging
console.log("Response:", res.status, res.data);
```

## 🧪 Manual Testing

You can also use the endpoints manually with tools like:

- **Postman** - Import the collection (create from the endpoint list below)
- **Thunder Client** (VS Code extension)
- **cURL** commands

### Key Endpoints

```
GET    /api/v1/healthcheck
POST   /api/v1/users/register
POST   /api/v1/users/login
GET    /api/v1/users/get-user-profile
PATCH  /api/v1/users/update-account
POST   /api/v1/users/change-password
POST   /api/v1/users/refresh-token
POST   /api/v1/users/logout

POST   /api/v1/tweets
GET    /api/v1/tweets/user/:userId
PATCH  /api/v1/tweets/:tweetId
DELETE /api/v1/tweets/:tweetId

POST   /api/v1/playlist
GET    /api/v1/playlist/user/:userId
GET    /api/v1/playlist/:playlistId
PATCH  /api/v1/playlist/:playlistId
DELETE /api/v1/playlist/:playlistId

POST   /api/v1/subscriptions/c/:channelId
GET    /api/v1/subscriptions/u/:subscriberId
GET    /api/v1/subscriptions/c/:channelId

POST   /api/v1/likes/toggle/v/:videoId
POST   /api/v1/likes/toggle/c/:commentId
POST   /api/v1/likes/toggle/t/:tweetId
GET    /api/v1/likes/videos

GET    /api/v1/dashboard/stats
GET    /api/v1/dashboard/videos
```

## 🛠 Customizing Tests

### Adding New Tests

To add a new test, follow this pattern:

```javascript
async function testNewFeature() {
    const res = await client.post("/new-endpoint", { data: "test" });
    if (res.status !== 200) throw new Error(`Status: ${res.status}`);
}

// Add to main test runner
await test("New Feature Test", testNewFeature);
```

### Modifying Test Data

Edit the `generateData()` function to customize test data:

```javascript
const generateData = () => {
    const timestamp = Date.now();
    return {
        username: `custom_${timestamp}`,
        email: `custom_${timestamp}@example.com`,
        // ... other fields
    };
};
```

## 📋 Todo / Future Enhancements

### Video Upload Tests

Note: Video upload tests are not included due to complexity of handling large files in tests. To test video endpoints:

1. Manually test with Postman/Thunder Client
2. Use smaller test video files
3. Mock the cloudinary upload service for testing

### Comment Tests

Comment tests require existing video IDs, so they depend on video creation first.

### Advanced Test Features

- [ ] Parallel test execution
- [ ] Test data seeding
- [ ] Performance benchmarking
- [ ] Integration with CI/CD

## 🤝 Contributing

When adding new endpoints:

1. Update the corresponding test file
2. Add the endpoint to this documentation
3. Test both success and error cases
4. Update the test coverage list

## 📞 Support

If tests are failing:

1. Check server logs
2. Verify database connection
3. Ensure all environment variables are set
4. Check network connectivity
5. Review recent code changes

For issues with specific endpoints, check the corresponding controller and route files.
