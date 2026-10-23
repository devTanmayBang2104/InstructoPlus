import { Queue } from "bullmq";
import dotenv from "dotenv";
import { isRedisAvailable } from "../config/redis.js";
dotenv.config();

const redisHost = process.env.REDIS_HOST || "127.0.0.1";
const redisPort = parseInt(process.env.REDIS_PORT || "6379", 10);
const redisPassword = process.env.REDIS_PASSWORD || undefined;

export const redisConnection = {
  host: redisHost,
  port: redisPort,
  password: redisPassword,
  maxRetriesPerRequest: null,
  enableReadyCheck: false,
  enableOfflineQueue: false, // Prevents hanging operations when Redis is disconnected
};

export const EMAIL_QUEUE_NAME = "email-processing-queue";

let queueInstance = null;

try {
  queueInstance = new Queue(EMAIL_QUEUE_NAME, {
    connection: redisConnection,
    defaultJobOptions: {
      attempts: 3,
      backoff: {
        type: "exponential",
        delay: 2000, // 2s, 4s, 8s backoff
      },
      removeOnComplete: 100, // keep last 100 completed jobs
      removeOnFail: 200,     // keep last 200 failed jobs for audit
    },
  });

  queueInstance.on("error", () => {
    // Suppress offline connection errors in dev
  });
} catch (err) {
  console.warn("[BullMQ Queue Init Error]", err.message);
}

export const emailQueue = queueInstance;

/**
 * Enqueue an asynchronous email processing job with automatic retry & exponential backoff.
 * Falls back to direct sending function if Redis is offline.
 */
export const enqueueEmailJob = async (jobName, payload, fallbackSender = null) => {
  if (emailQueue && isRedisAvailable()) {
    try {
      const job = await emailQueue.add(jobName, payload);
      return {
        queued: true,
        jobId: job.id,
      };
    } catch (queueError) {
      console.warn(`[BullMQ Enqueue Fallback] Redis unavailable (${queueError.message}). Executing direct sender.`);
    }
  }

  // Fallback: If Redis is offline or queue failed, execute directly
  if (typeof fallbackSender === "function") {
    const directResult = await fallbackSender();
    return {
      queued: false,
      direct: true,
      result: directResult,
    };
  }

  return { queued: false, error: "No queue or fallback sender available" };
};
