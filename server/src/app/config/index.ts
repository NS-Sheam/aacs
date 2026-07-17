import dotenv from "dotenv";

dotenv.config();

interface Config {
  port: number;
  nodeEnv: string;
  redisHost: string;
  redisPort: number;
  githubToken: string;
  db_uri: string;
  geminiApiKey: string;
}

const config: Config = {
  port: Number(process.env.PORT) || 7777,
  nodeEnv: process.env.NODE_ENV || "development",
  db_uri: process.env.MONGODB_URI!,
  redisHost: process.env.REDIS_HOST || "127.0.0.1",
  redisPort: Number(process.env.REDIS_PORT) || 6379,
  githubToken: process.env.GITHUB_TOKEN!,
  // geminiApiKey: process.env.GEMINI_API_KEY || process.env.ANTHROPIC_API_KEY || "",
  geminiApiKey:  "",
};

export default config;
