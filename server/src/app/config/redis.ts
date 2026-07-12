import { Redis } from "ioredis";
import config from ".";

export const connection = new Redis({
  host: config.redisHost || "127.0.0.1",
  port: Number(config.redisPort) || 6379,
  maxRetriesPerRequest: null,
});

connection.on("connect", () => console.log("Redis connected"));
connection.on("error", (err) => console.error("Redis error:", err));
