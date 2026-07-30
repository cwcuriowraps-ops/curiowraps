import dotenv from "dotenv";
import { Redis } from "ioredis";

dotenv.config();

const redisUrl = process.env.REDIS_URL;
if (!redisUrl) {
  console.log("No REDIS_URL found in environment");
  process.exit(0);
}

const client = new Redis(redisUrl);

async function main() {
  console.log("Flushing Upstash Redis keys...");
  await client.flushall();
  console.log("Upstash Redis successfully flushed!");
}

main().finally(() => client.disconnect());
