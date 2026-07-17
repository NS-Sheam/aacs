import { Server } from "http";
import app from "./app";
import { errorlogger, logger } from "./app/config/logger";
import { connectDB } from "./app/config/db";
import "./app/worker/checkWorker";
import config from "./app/config";

let server: Server | null = null;

async function validateLLMProviders() {
  const hasGemini = process.env.GEMINI_API_KEY && !process.env.GEMINI_API_KEY.startsWith("your_");
  if (hasGemini) {
    console.log("🟢 Gemini AI configured as primary Intent Parser.");
  } else {
    console.log("🟡 Gemini API key not found. Checking local DeepSeek R1 via Ollama...");
    try {
      const ollamaRes = await fetch("http://localhost:11434/api/tags");
      if (ollamaRes.ok) {
        const data = (await ollamaRes.json()) as any;
        const models = data.models || [];
        const hasDeepSeek = models.some((m: any) => m.name.includes("deepseek-r1"));
        if (hasDeepSeek) {
          console.log("🟢 Local DeepSeek R1 model found and ready for fallback.");
        } else {
          console.log("🔴 Ollama is running but deepseek-r1 model is not pulled. Please run: ollama run deepseek-r1");
        }
      }
    } catch (e: any) {
      console.log("🔴 Local Ollama service is not reachable. DeepSeek R1 fallback will fail.");
    }
  }
}

async function main() {
  try {
    await connectDB();
    await validateLLMProviders();
    server = app.listen(config.port, () => {
      console.log(
        `🚀 Server is running on ${config.nodeEnv} mode at http://localhost:${config.port}`,
      );
      logger.info(
        `🚀 Server is running on ${config.nodeEnv} mode at http://localhost:${config.port}`,
      );
    });
  } catch (error) {
    errorlogger.error(`Error starting the server: ${error}`);
    process.exit(1);
  }
}
main();
process.on("unhandledRejection", (error, promise) => {
  errorlogger.error(
    "❌ Shutting down the server due to unhandled rejection at:",
    promise,
    "with reason:",
    error,
  );
  if (server) {
    server.close(() => {
      process.exit(1);
    });
  }
});

process.on("uncaughtException", (error) => {
  errorlogger.error(
    "❌ Shutting down the server due to uncaught exception with reason:",
    error,
  );
  if (server) {
    server.close(() => {
      process.exit(1);
    });
  }
});
export const ApplicationServer = server;
