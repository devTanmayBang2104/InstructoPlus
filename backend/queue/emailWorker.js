import { Worker } from "bullmq";
import { redisConnection, EMAIL_QUEUE_NAME } from "./emailQueue.js";
import { sendDirectMail } from "../config/Mail.js";

let workerInstance = null;

try {
  workerInstance = new Worker(
    EMAIL_QUEUE_NAME,
    async (job) => {
      const { type, payload } = job.data;
      console.log(`[BullMQ Worker] Processing email job #${job.id} (type: ${type}) to: ${payload?.to}`);

      const result = await sendDirectMail(type, payload);
      return result;
    },
    {
      connection: redisConnection,
      concurrency: 5, // Process up to 5 emails in parallel
    }
  );

  workerInstance.on("completed", (job) => {
    console.log(`[BullMQ Worker] Successfully sent email job #${job.id}`);
  });

  workerInstance.on("failed", (job, err) => {
    console.error(`[BullMQ Worker] Email job #${job?.id} failed on attempt ${job?.attemptsMade}: ${err.message}`);
  });

  workerInstance.on("error", (err) => {
    if (err.code !== "ECONNREFUSED") {
      console.warn(`[BullMQ Worker Warning] ${err.message}`);
    }
  });
} catch (err) {
  console.warn("[BullMQ Worker Init Error]", err.message);
}

export const emailWorker = workerInstance;
export default emailWorker;
