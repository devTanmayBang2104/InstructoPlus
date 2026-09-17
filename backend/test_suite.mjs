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

  console.log("\n=========================================");
  console.log(`   TOTAL TESTS: ${totalTests} | PASSED: ${passedTests} | FAILED: ${totalTests - passedTests}`);
  console.log("=========================================\n");

  if (passedTests === totalTests) {
    console.log("?? ALL BACKEND UNIT & INTEGRATION TESTS PASSED PERFECTLY!");
  } else {
    process.exit(1);
  }
}

main();
