import http from "node:http";
import { performance } from "node:perf_hooks";
import Redis from "ioredis";

const redis = new Redis({ host: "127.0.0.1", port: 6379 });

function makeRequest() {
  return new Promise((resolve, reject) => {
    const start = performance.now();
    const req = http.get("http://localhost:8000/api/course/getpublished", (res) => {
      let data = "";
      res.on("data", (chunk) => { data += chunk; });
      res.on("end", () => {
        const duration = performance.now() - start;
        const cacheHeader = res.headers["x-cache"] || "NONE";
        resolve({ duration, cacheHeader, status: res.statusCode, bytes: data.length });
      });
    });
    req.on("error", reject);
  });
}

function stats(durations) {
  durations.sort((a, b) => a - b);
  const sum = durations.reduce((acc, v) => acc + v, 0);
  const avg = sum / durations.length;
  const p50 = durations[Math.floor(durations.length * 0.5)];
  const p95 = durations[Math.floor(durations.length * 0.95)];
  const min = durations[0];
  const max = durations[durations.length - 1];
  return { avg: avg.toFixed(2), p50: p50.toFixed(2), p95: p95.toFixed(2), min: min.toFixed(2), max: max.toFixed(2) };
}

async function runBenchmark() {
  console.log("=============================================================");
  console.log("   INSTRUCTOPLUS REDIS CACHING SCIENTIFIC BENCHMARK          ");
  console.log("=============================================================\n");

  const ITERATIONS = 25;

  // STEP 1: Cold Cache (Purge Redis completely to force MongoDB disk reads)
  console.log("[1/3] Flushing Redis cache to force MongoDB database reads...");
  await redis.flushdb();
  console.log("      Redis cache flushed clean.\n");

  console.log(`[2/3] Executing ${ITERATIONS} requests with NO CACHE (Every request hits MongoDB)...`);
  const uncachedDurations = [];
  for (let i = 0; i < ITERATIONS; i++) {
    // Delete cache before each request to guarantee pure MongoDB execution
    await redis.flushdb();
    const result = await makeRequest();
    uncachedDurations.push(result.duration);
    process.stdout.write(".");
  }
  console.log(" Done!");
  const uncachedStats = stats(uncachedDurations);

  // STEP 2: Prime Cache once
  console.log(`\n[3/3] Priming Redis cache once and executing ${ITERATIONS} requests from REDIS RAM...`);
  // First request primes cache
  await makeRequest();

  const cachedDurations = [];
  for (let i = 0; i < ITERATIONS; i++) {
    const result = await makeRequest();
    cachedDurations.push(result.duration);
    process.stdout.write(".");
  }
  console.log(" Done!\n");
  const cachedStats = stats(cachedDurations);

  const speedupAvg = (parseFloat(uncachedStats.avg) / parseFloat(cachedStats.avg)).toFixed(1);
  const speedupP95 = (parseFloat(uncachedStats.p95) / parseFloat(cachedStats.p95)).toFixed(1);
  const latencyReduction = (((parseFloat(uncachedStats.avg) - parseFloat(cachedStats.avg)) / parseFloat(uncachedStats.avg)) * 100).toFixed(1);

  console.log("=============================================================");
  console.log("                     BENCHMARK RESULTS                       ");
  console.log("=============================================================");
  console.log(` Metric                 | Pure MongoDB (No Cache) | Redis Cached (RAM)  `);
  console.log(`------------------------+-------------------------+---------------------`);
  console.log(` Average Latency (Avg)  | ${uncachedStats.avg.padStart(15)} ms | ${cachedStats.avg.padStart(13)} ms `);
  console.log(` Median Latency (p50)   | ${uncachedStats.p50.padStart(15)} ms | ${cachedStats.p50.padStart(13)} ms `);
  console.log(` 95th Percentile (p95)  | ${uncachedStats.p95.padStart(15)} ms | ${cachedStats.p95.padStart(13)} ms `);
  console.log(` Minimum Latency (Min)  | ${uncachedStats.min.padStart(15)} ms | ${cachedStats.min.padStart(13)} ms `);
  console.log(` Maximum Latency (Max)  | ${uncachedStats.max.padStart(15)} ms | ${cachedStats.max.padStart(13)} ms `);
  console.log("=============================================================");
  console.log(` 🚀 LATENCY REDUCTION   : ${latencyReduction}% faster`);
  console.log(` ⚡ OVERALL SPEEDUP     : ${speedupAvg}x speedup on average (up to ${speedupP95}x at p95)`);
  console.log(` 🛡️ DATABASE WORKLOAD   : MongoDB CPU & Disk IO bypassed 100% on cache hits`);
  console.log("=============================================================\n");

  await redis.quit();
  process.exit(0);
}

runBenchmark().catch(console.error);
