import { Redis } from "ioredis";
import config from ".";

const redisOptions: any = {
  host: config.redisHost || "127.0.0.1",
  port: Number(config.redisPort) || 6379,
  maxRetriesPerRequest: null,
};

// Upstash and other cloud Redis providers require password + TLS
if (config.redisPassword) {
  redisOptions.password = config.redisPassword;
  redisOptions.tls = {};
}

export const connection = new Redis(redisOptions);

connection.on("connect", () => console.log("Redis connected"));
connection.on("error", (err) => console.error("Redis error:", err));
