// seed-route-counts.js — chạy 1 lần: node seed-route-counts.js
require("dotenv").config();
const { Redis } = require("@upstash/redis");
const redis = new Redis({
  url: process.env.UPSTASH_REDIS_REST_URL,
  token: process.env.UPSTASH_REDIS_REST_TOKEN,
});

async function main() {
  const REDIS_KEY = "ipn:logs";
  const REDIS_ROUTE_COUNTS = "ipn:route_counts";

  // Xóa hash cũ trước
  await redis.del(REDIS_ROUTE_COUNTS);

  const counts = {};
  const batchSize = 500;
  let cursor = 0;

  while (true) {
    const batch = await redis.lrange(REDIS_KEY, cursor, cursor + batchSize - 1);
    if (!batch || batch.length === 0) break;

    for (const raw of batch) {
      const entry = typeof raw === "string" ? JSON.parse(raw) : raw;
      if (entry.route) {
        counts[entry.route] = (counts[entry.route] || 0) + 1;
      }
    }

    console.log(`Scanned ${cursor + batch.length} entries...`);
    if (batch.length < batchSize) break;
    cursor += batchSize;
  }

  // Ghi tất cả vào Redis hash một lần
  if (Object.keys(counts).length > 0) {
    for (const [route, count] of Object.entries(counts)) {
      await redis.hset(REDIS_ROUTE_COUNTS, { [route]: count });
    }
  }

  console.log("Done! Route counts:", counts);
  process.exit(0);
}

main().catch(console.error);