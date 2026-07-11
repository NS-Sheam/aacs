import path from "path";

import { createLogger, format, transports } from "winston";
const { combine, timestamp, label, printf, colorize } = format;
import DailyRotateFile from "winston-daily-rotate-file";
import config from "./index";

// Custom Log Format
const myFormat = printf(({ level, message, label }) => {
  const date = new Date(Date.now());
  const hour = date.getHours();
  const minutes = date.getMinutes();
  const seconds = date.getSeconds();
  return `${date.toDateString()} ${hour}:${minutes}:${seconds} || [${level}] ${label}: ${message}`;
});

const coloredFormat = combine(
  colorize(),
  label({ label: "[CS]" }),
  timestamp(),
  myFormat,
);

const isDevelopment = config.nodeEnv === "development";

// Create the logger
const logger = createLogger({
  level: "info",
  format: coloredFormat,
  transports: [
    // Add Console transport only in development
    ...(isDevelopment ? [new transports.Console()] : []),
    // Always add DailyRotateFile transport
    new DailyRotateFile({
      filename: path.join(
        process.cwd(),
        "logs",
        "winston",
        "successes",
        "dp-%DATE%-success.log",
      ),
      datePattern: "YYYY-DD-MM-HH",
      zippedArchive: true,
      maxSize: "20m",
      maxFiles: "14d",
    }),
  ],
});

const errorlogger = createLogger({
  level: "error",
  format: coloredFormat,
  transports: [
    new transports.Console(),
    new DailyRotateFile({
      filename: path.join(
        process.cwd(),
        "logs",
        "winston",
        "errors",
        "dp-%DATE%-error.log",
      ),
      datePattern: "YYYY-DD-MM-HH",
      zippedArchive: true,
      maxSize: "20m",
      maxFiles: "14d",
    }),
  ],
});

export { logger, errorlogger };
