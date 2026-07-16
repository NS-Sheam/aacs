import { Server } from "http";
import app from "./app";
import { errorlogger, logger } from "./app/config/logger";
import { connectDB } from "./app/config/db";
import "./app/worker/checkWorker";
import config from "./app/config";

let server: Server | null = null;

async function main() {
  try {
    await connectDB();
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
