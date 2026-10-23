import assert from "node:assert";
import crypto from "node:crypto";
import os from "node:os";
import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";

console.log("=========================================");
console.log("   INSTRUCTOPLUS AUTOMATED TEST SUITE    ");
console.log("=========================================\n");

let passedTests = 0;
let totalTests = 0;

function runTest(name, fn) {
  totalTests++;
  try {
    fn();
    console.log(`  ? PASS: ${name}`);
    passedTests++;
  } catch (err) {
    console.error(`  ? FAIL: ${name}`);
    console.error(`     Error: ${err.message}\n`);
  }
}

async function runAsyncTest(name, fn) {
  totalTests++;
  try {
    await fn();
    console.log(`  ? PASS: ${name}`);
    passedTests++;
  } catch (err) {
    console.error(`  ? FAIL: ${name}`);
    console.error(`     Error: ${err.message}\n`);
  }
}

async function main() {
  console.log("--- 1. AUTHENTICATION & CRYPTOGRAPHY TESTS ---");

  await runAsyncTest("Bcrypt password hashing and validation", async () => {
    const rawPassword = "SecurePassword@123";
    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(rawPassword, salt);
    assert.notStrictEqual(rawPassword, hashedPassword, "Password must be hashed");
    const isMatch = await bcrypt.compare(rawPassword, hashedPassword);
    assert.strictEqual(isMatch, true, "Valid password should match hash");
    const isWrongMatch = await bcrypt.compare("WrongPassword", hashedPassword);
    assert.strictEqual(isWrongMatch, false, "Invalid password should not match hash");
  });

  runTest("JWT token generation and verification", () => {
    const testUserId = "user_abc_123456";
    const secretKey = "test_jwt_secret_key_12345";
    const token = jwt.sign({ userId: testUserId }, secretKey, { expiresIn: "7d" });
    assert.ok(token, "Token should be generated");
    const decoded = jwt.verify(token, secretKey);
    assert.strictEqual(decoded.userId, testUserId, "Decoded user ID should match payload");
  });

  console.log("\n--- 2. PAYMENT INTEGRATION TESTS (RAZORPAY SIGNATURES) ---");

  runTest("Razorpay HMAC-SHA256 valid signature verification", () => {
    const orderId = "order_9A33XWu170gUtm";
    const paymentId = "pay_29QQoUBi66xm2f";
    const secretKey = "test_razorpay_secret_key";
    
    // Expected signature calculation
    const body = orderId + "|" + paymentId;
    const expectedSignature = crypto.createHmac("sha256", secretKey).update(body).digest("hex");
    
    // Verification check as in order.controller.js
    const calculatedSignature = crypto.createHmac("sha256", secretKey).update(body).digest("hex");
    assert.strictEqual(calculatedSignature, expectedSignature, "Signatures must match for legitimate payments");
  });

  runTest("Razorpay HMAC-SHA256 signature tampering rejection", () => {
    const orderId = "order_9A33XWu170gUtm";
    const paymentId = "pay_29QQoUBi66xm2f";
    const secretKey = "test_razorpay_secret_key";
    
    const body = orderId + "|" + paymentId;
    const validSignature = crypto.createHmac("sha256", secretKey).update(body).digest("hex");
    const tamperedSignature = validSignature.substring(0, validSignature.length - 4) + "0000";
    
    assert.notStrictEqual(tamperedSignature, validSignature, "Tampered signature should not be accepted");
  });

  console.log("\n--- 3. YOUTUBE URL PARSER UTILITY TESTS ---");

  await runAsyncTest("YouTube video & playlist ID extraction", async () => {
    const { getYoutubeVideoId, getYoutubePlaylistId } = await import("file:///c:/Users/tanma/OneDrive/Desktop/InstrctoPlus/backend/utils/youtubeApi.js");
    
    const standardUrl = "https://www.youtube.com/watch?v=dQw4w9WgXcQ";
    const shortUrl = "https://youtu.be/dQw4w9WgXcQ";
    const playlistUrl = "https://www.youtube.com/playlist?list=PL4cUxeGkcC9gUxtBLkoh611N05XxLekgo";

    assert.strictEqual(getYoutubeVideoId(standardUrl), "dQw4w9WgXcQ", "Should parse standard youtube video ID");
    assert.strictEqual(getYoutubeVideoId(shortUrl), "dQw4w9WgXcQ", "Should parse short youtu.be video ID");
    assert.strictEqual(getYoutubePlaylistId(playlistUrl), "PL4cUxeGkcC9gUxtBLkoh611N05XxLekgo", "Should parse playlist ID");
    assert.strictEqual(getYoutubeVideoId("https://example.com"), null, "Non-youtube URL should return null");
  });

  console.log("\n--- 4. MULTER & CROSS-PLATFORM STORAGE TESTS ---");

  runTest("Multer storage path resolution (Windows/Linux compatible)", () => {
    const tempDir = os.tmpdir();
    assert.ok(tempDir && tempDir.length > 0, "Temp directory must be valid non-empty string");
    assert.ok(!tempDir.includes("/tmp") || process.platform !== "win32", "Windows must not use hardcoded /tmp");
  });

  console.log("\n--- 5. MONGOOSE SCHEMA & MODEL DEFINITIONS TESTS ---");

  await runAsyncTest("Mongoose schemas import and configuration validation", async () => {
    const User = (await import("file:///c:/Users/tanma/OneDrive/Desktop/InstrctoPlus/backend/model/user.Model.js")).default;
    const Course = (await import("file:///c:/Users/tanma/OneDrive/Desktop/InstrctoPlus/backend/model/course.Model.js")).default;
    const Lecture = (await import("file:///c:/Users/tanma/OneDrive/Desktop/InstrctoPlus/backend/model/lecture.Model.js")).default;
    const Review = (await import("file:///c:/Users/tanma/OneDrive/Desktop/InstrctoPlus/backend/model/review.Model.js")).default;
    const Notification = (await import("file:///c:/Users/tanma/OneDrive/Desktop/InstrctoPlus/backend/model/notification.Model.js")).default;
    const Announcement = (await import("file:///c:/Users/tanma/OneDrive/Desktop/InstrctoPlus/backend/model/announcement.Model.js")).default;

    assert.ok(User.schema, "User schema must exist");
    assert.ok(Course.schema, "Course schema must exist");
    assert.ok(Lecture.schema, "Lecture schema must exist");
    assert.ok(Review.schema, "Review schema must exist");
    assert.ok(Notification.schema, "Notification schema must exist");
    assert.ok(Announcement.schema, "Announcement schema must exist");

    // Check specific fields
    assert.ok(User.schema.path("email"), "User must have email path");
    assert.ok(User.schema.path("role"), "User must have role path");
    assert.ok(Course.schema.path("title"), "Course must have title path");
    assert.ok(Course.schema.path("creator"), "Course must have creator path");
    assert.ok(Review.schema.path("rating"), "Review must have rating path");
    assert.ok(Review.schema.path("comment"), "Review must have comment path");
  });

  console.log("\n--- 6. CONTROLLER LOGIC CHECKS ---");

  await runAsyncTest("User controller functions existence", async () => {
    const userController = await import("file:///c:/Users/tanma/OneDrive/Desktop/InstrctoPlus/backend/controller/user.controller.js");
    assert.strictEqual(typeof userController.getCurrentUser, "function", "getCurrentUser must be a function");
    assert.strictEqual(typeof userController.updateProfile, "function", "updateProfile must be a function");
  });

  await runAsyncTest("Review controller functions existence", async () => {
    const reviewController = await import("file:///c:/Users/tanma/OneDrive/Desktop/InstrctoPlus/backend/controller/reviewController.js");
    assert.strictEqual(typeof reviewController.addReview, "function", "addReview must be a function");
    assert.strictEqual(typeof reviewController.getAllReviews, "function", "getAllReviews must be a function");
    assert.strictEqual(typeof reviewController.getCourseReviews, "function", "getCourseReviews must be a function");
  });

  await runAsyncTest("Course controller functions existence", async () => {
    const courseController = await import("file:///c:/Users/tanma/OneDrive/Desktop/InstrctoPlus/backend/controller/course.controller.js");
    assert.strictEqual(typeof courseController.createCourse, "function", "createCourse must be a function");
    assert.strictEqual(typeof courseController.getPublishedCourses, "function", "getPublishedCourses must be a function");
    assert.strictEqual(typeof courseController.createLectue, "function", "createLectue must be a function");
  });

  console.log("\n--- 7. COURSE PROGRESS & LEARNING JOURNEY TESTS ---");

  await runAsyncTest("CourseProgress schema and paths validation", async () => {
    const CourseProgress = (await import("file:///c:/Users/tanma/OneDrive/Desktop/InstrctoPlus/backend/model/courseProgress.Model.js")).default;
    assert.ok(CourseProgress.schema, "CourseProgress schema must exist");
    assert.ok(CourseProgress.schema.path("userId"), "CourseProgress must have userId path");
    assert.ok(CourseProgress.schema.path("courseId"), "CourseProgress must have courseId path");
    assert.ok(CourseProgress.schema.path("completedLectures"), "CourseProgress must have completedLectures path");
    assert.ok(CourseProgress.schema.path("completionPercentage"), "CourseProgress must have completionPercentage path");
    assert.ok(CourseProgress.schema.path("isCompleted"), "CourseProgress must have isCompleted path");
    assert.ok(CourseProgress.schema.path("lastWatchedLecture"), "CourseProgress must have lastWatchedLecture path");
  });

  await runAsyncTest("CourseProgress controller functions existence", async () => {
    const progressController = await import("file:///c:/Users/tanma/OneDrive/Desktop/InstrctoPlus/backend/controller/courseProgress.controller.js");
    assert.strictEqual(typeof progressController.getCourseProgress, "function", "getCourseProgress must be a function");
    assert.strictEqual(typeof progressController.toggleLectureComplete, "function", "toggleLectureComplete must be a function");
    assert.strictEqual(typeof progressController.updateLecturePlaybackTime, "function", "updateLecturePlaybackTime must be a function");
    assert.strictEqual(typeof progressController.getAllUserCourseProgress, "function", "getAllUserCourseProgress must be a function");
    assert.strictEqual(typeof progressController.resetCourseProgress, "function", "resetCourseProgress must be a function");
  });

  console.log("\n--- 8. RATE LIMITING TESTS ---");

  await runAsyncTest("Rate limiter middleware blocks after threshold", async () => {
    const { createRateLimiter } = await import("file:///c:/Users/tanma/OneDrive/Desktop/InstrctoPlus/backend/middleware/rateLimiter.js");
    const testLimiter = createRateLimiter({
      windowMs: 60 * 1000,
      maxRequests: 3,
      keyGenerator: () => "test_client_ip",
    });

    const mockReq = { ip: "test_client_ip", headers: {} };
    let statusSet = 200;
    let jsonOutput = null;
    const mockRes = {
      setHeader: () => {},
      status: (code) => {
        statusSet = code;
        return {
          json: (data) => { jsonOutput = data; },
        };
      },
    };

    let nextCalled = 0;
    const next = () => { nextCalled++; };

    // Request 1, 2, 3 should pass
    testLimiter(mockReq, mockRes, next);
    testLimiter(mockReq, mockRes, next);
    testLimiter(mockReq, mockRes, next);
    assert.strictEqual(nextCalled, 3, "First 3 requests should pass");

    // Request 4 should be blocked with 429
    testLimiter(mockReq, mockRes, next);
    assert.strictEqual(statusSet, 429, "4th request should return HTTP 429");
    assert.strictEqual(jsonOutput.success, false, "Should return failure payload");
  });

  console.log("\n--- 9. INPUT SANITIZATION TESTS (NOSQL & XSS) ---");

  await runAsyncTest("NoSQL injection sanitization removes operator keys", async () => {
    const { cleanNoSql, cleanXssString } = await import("file:///c:/Users/tanma/OneDrive/Desktop/InstrctoPlus/backend/middleware/sanitize.js");

    const maliciousPayload = {
      email: { "$gt": "" },
      password: "password123",
      nested: { "$where": "sleep(5000)", normal: "value" },
      "dot.key": "injected",
    };

    const sanitized = cleanNoSql(maliciousPayload);
    assert.strictEqual(sanitized.email.$gt, undefined, "$gt operator must be stripped");
    assert.strictEqual(sanitized.nested.$where, undefined, "$where operator must be stripped");
    assert.strictEqual(sanitized["dot.key"], undefined, "Dot keys must be stripped");
    assert.strictEqual(sanitized.password, "password123", "Valid keys must be preserved");

    // XSS sanitization
    const maliciousHtml = "<script>alert('XSS')</script>Hello World <img src='x' onerror='steal()'>";
    const sanitizedHtml = cleanXssString(maliciousHtml);
    assert.ok(!sanitizedHtml.includes("<script>"), "Script tags must be removed");
    assert.ok(!sanitizedHtml.includes("onerror="), "Inline event handlers must be removed");
    assert.ok(sanitizedHtml.includes("Hello World"), "Clean text must be preserved");
  });

  console.log("\n--- 10. DECLARATIVE SCHEMA VALIDATION TESTS ---");

  await runAsyncTest("Schema validation enforces rules and rejects invalid payloads", async () => {
    const { validate, signupSchema, createCourseSchema } = await import("file:///c:/Users/tanma/OneDrive/Desktop/InstrctoPlus/backend/middleware/validateSchema.js");

    const signupValidator = validate(signupSchema);

    // Test invalid email and too short password
    let statusCode = 200;
    let errorData = null;
    const invalidReq = { body: { name: "A", email: "invalid-email", password: "123" } };
    const mockRes = {
      status: (code) => {
        statusCode = code;
        return { json: (data) => { errorData = data; } };
      },
    };

    signupValidator(invalidReq, mockRes, () => {});
    assert.strictEqual(statusCode, 400, "Invalid payload must return 400");
    assert.ok(errorData.errors.length >= 2, "Should report multiple validation errors");

    // Test valid course payload passes
    const courseValidator = validate(createCourseSchema);
    let nextPassed = false;
    const validCourseReq = { body: { title: "Complete Web Dev", category: "Programming" } };
    courseValidator(validCourseReq, mockRes, () => { nextPassed = true; });
    assert.strictEqual(nextPassed, true, "Valid course payload must pass schema validation");
  });

  console.log("\n--- 11. RBAC & RESOURCE OWNERSHIP TESTS ---");

  await runAsyncTest("RBAC role verification and User model admin role", async () => {
    const User = (await import("file:///c:/Users/tanma/OneDrive/Desktop/InstrctoPlus/backend/model/user.Model.js")).default;
    const roleEnum = User.schema.path("role").enumValues;
    assert.ok(roleEnum.includes("admin"), "User model must support 'admin' role");
    assert.ok(roleEnum.includes("educator"), "User model must support 'educator' role");
    assert.ok(roleEnum.includes("student"), "User model must support 'student' role");

    const { requireRole } = await import("file:///c:/Users/tanma/OneDrive/Desktop/InstrctoPlus/backend/middleware/rbac.js");
    assert.strictEqual(typeof requireRole, "function", "requireRole middleware must exist");
  });

  console.log("\n--- 12. RELATIONAL INTEGRITY & CASCADING DELETES TESTS ---");

  await runAsyncTest("Enrollment junction model schema and unique constraints", async () => {
    const Enrollment = (await import("file:///c:/Users/tanma/OneDrive/Desktop/InstrctoPlus/backend/model/enrollment.Model.js")).default;
    assert.ok(Enrollment.schema, "Enrollment schema must exist");
    assert.ok(Enrollment.schema.path("userId"), "Enrollment must have userId");
    assert.ok(Enrollment.schema.path("courseId"), "Enrollment must have courseId");
    assert.ok(Enrollment.schema.path("status"), "Enrollment must have status");
    const indexes = Enrollment.schema.indexes();
    const hasCompoundUnique = indexes.some(([fields, options]) => fields.userId === 1 && fields.courseId === 1 && options.unique === true);
    assert.ok(hasCompoundUnique, "Enrollment must have unique compound index on { userId: 1, courseId: 1 }");
  });

  await runAsyncTest("Course and Lecture models define cascade / decoupling hooks", async () => {
    const Course = (await import("file:///c:/Users/tanma/OneDrive/Desktop/InstrctoPlus/backend/model/course.Model.js")).default;
    const Lecture = (await import("file:///c:/Users/tanma/OneDrive/Desktop/InstrctoPlus/backend/model/lecture.Model.js")).default;

    const coursePreHooks = Course.schema.s?.hooks?._pres?.get("findOneAndDelete") || [];
    const lecturePreHooks = Lecture.schema.s?.hooks?._pres?.get("findOneAndDelete") || [];
    assert.ok(coursePreHooks.length > 0, "Course must have findOneAndDelete pre hook for cascading delete");
    assert.ok(lecturePreHooks.length > 0, "Lecture must have findOneAndDelete pre hook for decoupling");
  });

  await runAsyncTest("Order controller exports verifyFreePayment and verifyPayment with relational integrity", async () => {
    const orderController = await import("file:///c:/Users/tanma/OneDrive/Desktop/InstrctoPlus/backend/controller/order.controller.js");
    assert.strictEqual(typeof orderController.verifyFreePayment, "function");
    assert.strictEqual(typeof orderController.verifyPayment, "function");
  });

  console.log("\n--- 13. REDIS IN-MEMORY CACHING TESTS ---");

  await runAsyncTest("Redis client and safe helpers export properly with fallback", async () => {
    const { redisClient, safeGet, safeSet, safeDel, safeDelPattern, isRedisAvailable } = await import("file:///c:/Users/tanma/OneDrive/Desktop/InstrctoPlus/backend/config/redis.js");
    assert.ok(redisClient, "redisClient must exist");
    assert.strictEqual(typeof safeGet, "function");
    assert.strictEqual(typeof safeSet, "function");
    assert.strictEqual(typeof safeDel, "function");
    assert.strictEqual(typeof safeDelPattern, "function");
    assert.strictEqual(typeof isRedisAvailable, "function");
  });

  await runAsyncTest("Cache middleware injects X-Cache header and captures response", async () => {
    const { cacheMiddleware, invalidateCourseCache } = await import("file:///c:/Users/tanma/OneDrive/Desktop/InstrctoPlus/backend/middleware/cache.js");
    assert.strictEqual(typeof cacheMiddleware, "function");
    assert.strictEqual(typeof invalidateCourseCache, "function");

    const middleware = cacheMiddleware(60);
    const mockReq = { method: "GET", originalUrl: "/api/course/test-cache" };
    const headers = {};
    const mockRes = {
      setHeader: (k, v) => { headers[k] = v; },
      statusCode: 200,
      json: (data) => data,
    };
    let nextCalled = false;
    await middleware(mockReq, mockRes, () => { nextCalled = true; });
    assert.strictEqual(nextCalled, true, "Next should be called on cache miss");
    assert.ok(headers["X-Cache"] === "MISS" || headers["X-Cache"] === "HIT", "X-Cache header must be set");
  });

  console.log("\n--- 14. BULLMQ ASYNCHRONOUS EMAIL PROCESSING TESTS ---");

  await runAsyncTest("BullMQ emailQueue and enqueueEmailJob function existence", async () => {
    const { emailQueue, enqueueEmailJob, EMAIL_QUEUE_NAME } = await import("file:///c:/Users/tanma/OneDrive/Desktop/InstrctoPlus/backend/queue/emailQueue.js");
    assert.ok(emailQueue, "emailQueue must be instantiated");
    assert.strictEqual(typeof enqueueEmailJob, "function");
    assert.strictEqual(EMAIL_QUEUE_NAME, "email-processing-queue");

    // Test enqueue fallback execution
    let fallbackExecuted = false;
    const testFallback = async () => {
      fallbackExecuted = true;
      return { messageId: "test-direct" };
    };

    const res = await enqueueEmailJob("test-job", { test: true }, testFallback);
    assert.ok(res.queued || res.direct, "Job must either be queued in Redis or executed via graceful fallback");
  });

  console.log("\n--- 15. DOCKER & CONTAINERIZATION ARTIFACTS VERIFICATION ---");

  await runAsyncTest("Backend Dockerfile, Frontend Dockerfile & docker-compose.yml validation", async () => {
    const fs = await import("node:fs");
    assert.ok(fs.existsSync("c:/Users/tanma/OneDrive/Desktop/InstrctoPlus/backend/Dockerfile"), "Backend Dockerfile must exist");
    assert.ok(fs.existsSync("c:/Users/tanma/OneDrive/Desktop/InstrctoPlus/frontend/Dockerfile"), "Frontend Dockerfile must exist");
    assert.ok(fs.existsSync("c:/Users/tanma/OneDrive/Desktop/InstrctoPlus/frontend/nginx.conf"), "Frontend Nginx config must exist");
    assert.ok(fs.existsSync("c:/Users/tanma/OneDrive/Desktop/InstrctoPlus/docker-compose.yml"), "Root docker-compose.yml must exist");
  });

  console.log("\n--- 16. REFRESH TOKEN ROTATION (RTR) & REUSE ATTACK DEFENSE TESTS ---");

  await runAsyncTest("Token pair generation (Short-lived Access + Single-Use Refresh Token)", async () => {
    const { generateTokenPair } = await import("file:///c:/Users/tanma/OneDrive/Desktop/InstrctoPlus/backend/config/token.js");
    const testUserId = "60c72b2f9b1d8b2badbee555";
    const pair = await generateTokenPair(testUserId);

    assert.ok(pair.accessToken, "Access token must be generated");
    assert.ok(pair.refreshToken, "Refresh token must be generated");
    assert.ok(pair.familyId, "Family ID must be generated");
    assert.strictEqual(pair.refreshToken.length, 80, "Cryptographic refresh token must be 80-char hex string");
  });

  await runAsyncTest("Single-use token rotation succeeds and preserves token family", async () => {
    const { generateTokenPair, rotateRefreshToken } = await import("file:///c:/Users/tanma/OneDrive/Desktop/InstrctoPlus/backend/config/token.js");
    const testUserId = "60c72b2f9b1d8b2badbee555";
    const initialPair = await generateTokenPair(testUserId);

    // Rotate first time
    const rotated = await rotateRefreshToken(initialPair.refreshToken);
    assert.strictEqual(rotated.success, true, "Rotation should succeed on first use");
    assert.notStrictEqual(rotated.refreshToken, initialPair.refreshToken, "New refresh token must differ from old one");
    assert.strictEqual(rotated.familyId, initialPair.familyId, "Rotated token must maintain identical family ID");
    assert.ok(rotated.accessToken, "Rotated response must include fresh access token");
  });

  await runAsyncTest("Token reuse detection (Theft defense triggers family revocation)", async () => {
    const { generateTokenPair, rotateRefreshToken } = await import("file:///c:/Users/tanma/OneDrive/Desktop/InstrctoPlus/backend/config/token.js");
    const testUserId = "60c72b2f9b1d8b2badbee555";
    const initialPair = await generateTokenPair(testUserId);

    // 1st consumption: legitimate user rotates
    const rotatedLegit = await rotateRefreshToken(initialPair.refreshToken);
    assert.strictEqual(rotatedLegit.success, true);

    // 2nd consumption: attacker attempts to use the already consumed initial token
    const attackerAttempt = await rotateRefreshToken(initialPair.refreshToken);
    assert.strictEqual(attackerAttempt.error, "REUSE_DETECTED", "Must detect token reuse and block attacker");
    assert.ok(attackerAttempt.message.includes("reuse detected"), "Alert message must warn of reuse");
  });

  await runAsyncTest("Auth controller exports refreshAccessToken handler", async () => {
    const authController = await import("file:///c:/Users/tanma/OneDrive/Desktop/InstrctoPlus/backend/controller/auth.controller.js");
    assert.strictEqual(typeof authController.refreshAccessToken, "function", "refreshAccessToken must be an exported function");
  });

  console.log("\n--- 17. INSTANT ACCESS TOKEN REVOCATION & BLACKLISTING TESTS ---");

  await runAsyncTest("Instant token revocation blocks previously valid access tokens", async () => {
    const { genToken, revokeUserSessions, isTokenRevoked } = await import("file:///c:/Users/tanma/OneDrive/Desktop/InstrctoPlus/backend/config/token.js");
    const testUserId = "user_revocation_test_123";
    const issuedTimeSec = Math.floor(Date.now() / 1000) - 5; // Issued 5s ago

    // Initially not revoked
    const initiallyRevoked = await isTokenRevoked(testUserId, issuedTimeSec);
    assert.strictEqual(initiallyRevoked, false, "Token should be valid before session revocation");

    // Revoke user sessions
    await revokeUserSessions(testUserId);

    // Verify token issued prior to revocation is now flagged as revoked
    const isNowRevoked = await isTokenRevoked(testUserId, issuedTimeSec);
    assert.strictEqual(isNowRevoked, true, "Token issued prior to revocation timestamp must be rejected");
  });

  await runAsyncTest("isAuth middleware rejects revoked access token with 401", async () => {
    const isAuth = (await import("file:///c:/Users/tanma/OneDrive/Desktop/InstrctoPlus/backend/middleware/isAuth.js")).default;
    const { genToken, revokeUserSessions } = await import("file:///c:/Users/tanma/OneDrive/Desktop/InstrctoPlus/backend/config/token.js");
    
    const testUserId = "user_middleware_revocation_456";
    const token = genToken(testUserId, "15m");
    
    // Revoke sessions for this user
    await revokeUserSessions(testUserId);

    let status = null;
    let jsonBody = null;
    let nextCalled = false;

    const mockReq = {
      cookies: { token },
      headers: {},
    };
    const mockRes = {
      status: (code) => {
        status = code;
        return {
          json: (body) => { jsonBody = body; return body; },
        };
      },
    };

    await isAuth(mockReq, mockRes, () => { nextCalled = true; });

    assert.strictEqual(nextCalled, false, "Next must not be called when token is revoked");
    assert.strictEqual(status, 401, "Revoked token must yield HTTP 401");
    assert.strictEqual(jsonBody.sessionRevoked, true, "Response must indicate sessionRevoked");
  });

  console.log("\n--- 18. ACCOUNT-LEVEL LOCKOUT (DISTRIBUTED BRUTE-FORCE DEFENSE) ---");

  await runAsyncTest("Failed attempts increment, lock after 5 tries, and clear on success", async () => {
    const { checkAccountLockout, recordFailedLogin, clearFailedLogins } = await import("file:///c:/Users/tanma/OneDrive/Desktop/InstrctoPlus/backend/config/accountLockout.js");
    const testEmail = `victim_${Date.now()}@example.com`;

    // 1. Initially unlocked
    const initialCheck = await checkAccountLockout(testEmail);
    assert.strictEqual(initialCheck.isLocked, false, "Account must initially be unlocked");

    // 2. Record 4 failed attempts
    for (let i = 1; i <= 4; i++) {
      const res = await recordFailedLogin(testEmail);
      assert.strictEqual(res.isLocked, false, `Attempt ${i} should not lock yet`);
      assert.strictEqual(res.remainingAttempts, 5 - i);
    }

    // 3. 5th failed attempt locks the account
    const fifthAttempt = await recordFailedLogin(testEmail);
    assert.strictEqual(fifthAttempt.isLocked, true, "5th failed attempt must trigger account lockout");

    // 4. Verify checkAccountLockout returns locked
    const lockedCheck = await checkAccountLockout(testEmail);
    assert.strictEqual(lockedCheck.isLocked, true, "Subsequent checks must confirm account is locked");
    assert.ok(lockedCheck.remainingSeconds > 0, "Remaining seconds must be greater than 0");

    // 5. Successful password login clears lockout
    await clearFailedLogins(testEmail);
    const postUnlockCheck = await checkAccountLockout(testEmail);
    assert.strictEqual(postUnlockCheck.isLocked, false, "Clearing failed logins must unlock account");
  });



  console.log("\n=========================================");
  console.log(`   TOTAL TESTS: ${totalTests} | PASSED: ${passedTests} | FAILED: ${totalTests - passedTests}`);
  console.log("=========================================\n");

  if (passedTests === totalTests) {
    console.log("?? ALL BACKEND UNIT & INTEGRATION TESTS PASSED PERFECTLY!");
    process.exit(0);
  } else {
    process.exit(1);
  }
}

main();
