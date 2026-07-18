import dotenv from "dotenv";

dotenv.config();

interface Config {
  port: number;
  nodeEnv: string;
  redisHost: string;
  redisPort: number;
  redisPassword: string;
  githubToken: string;
  db_uri: string;
  geminiApiKey: string;
  clientUrl: string;
}

const config: Config = {
  port: Number(process.env.PORT) || 7777,
  nodeEnv: process.env.NODE_ENV || "development",
  db_uri: process.env.MONGODB_URI!,
  redisHost: process.env.REDIS_HOST || "127.0.0.1",
  redisPort: Number(process.env.REDIS_PORT) || 6379,
  redisPassword: process.env.REDIS_PASSWORD || "",
  githubToken: process.env.GITHUB_TOKEN!,
  geminiApiKey: process.env.GEMINI_API_KEY || "",
  clientUrl: process.env.CLIENT_URL || "http://localhost:5555",
};

export default config;
