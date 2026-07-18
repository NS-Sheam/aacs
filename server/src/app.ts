import express, { Application } from "express";
import cors from "cors";
import config from "./app/config";

import globalErrorHandler from "./app/middlewares/globalErrorHandler";
import { StatusCodes } from "http-status-codes";

import cookieParser from "cookie-parser";
import { logger } from "./app/config/logger";
import notFound from "./app/middlewares/notFound";
import router from "./app/routes";
const app: Application = express();
app.use(express.json());
app.use(cookieParser());
app.use(
  cors({
    origin: (origin, callback) => {
      // Allow requests with no origin (mobile apps, curl, Postman)
      if (!origin) return callback(null, true);
      const allowed = [
        "http://localhost:5555",
        "http://localhost:3000",
        config.clientUrl,
      ];
      // Allow any *.vercel.app subdomain (covers all Vercel preview/prod URLs)
      if (allowed.includes(origin) || origin.endsWith(".vercel.app")) {
        return callback(null, true);
      }
      return callback(new Error(`CORS: origin ${origin} not allowed`));
    },
    methods: ["GET", "POST", "PATCH", "PUT", "DELETE"],
    credentials: true,
  }),
);

//Run the cron task

app.use(express.urlencoded({ extended: true }));
app.use((req, res, next) => {
  logger.info(`Requested URL: ${req.originalUrl}`);
  next();
});

app.use("/screenshots", express.static("logs/screenshots"));
app.use("/api/v1", router);

app.get("/", (req, res) => {
  res.status(StatusCodes.OK).json({
    success: true,
    status: StatusCodes.OK,
    message: "Welcome to the API",
    data: {
      message: "Welcome to the API",
    },
  });
});
app.get("/health", (req, res) => {
  res.json({ status: "ok", timestamp: new Date().toISOString() });
});
app.use(globalErrorHandler);
app.use(notFound);

export default app;
