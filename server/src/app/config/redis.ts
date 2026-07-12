import { Redis } from "ioredis";
import config from ".";

export const Connection = new Redis({
  host: config.redisHost || "127.0.0.1",
  port: Number(config.redisPort) || 6379,
  maxRetriesPerRequest: null,
});

Connection.on("connect", () => console.log("Redis connected"));
Connection.on("error", (err) => console.error("Redis error:", err));
