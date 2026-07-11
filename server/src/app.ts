import express, { Application } from "express";
import cors from "cors";

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
    origin: ["http://localhost:5555"],
    methods: ["GET", "POST", "PATCH", "PUT", "DELETE"],
    // allowedHeaders: ["Content-Type", "Authorization"],
    credentials: true,
  }),
);

//Run the cron task

app.use(express.urlencoded({ extended: true }));
app.use((req, res, next) => {
  logger.info(`Requested URL: ${req.originalUrl}`);
  next();
});

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

app.use(globalErrorHandler);
app.use(notFound);

export default app;
