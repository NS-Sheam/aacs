/* eslint-disable no-unused-vars */
import { NextFunction, Request, Response } from "express";
import { TErrorSources } from "../interfaces/error";
import config from "../config";

const globalErrorHandler = (
  err: any,
  req: Request,
  res: Response,
  next: NextFunction,
) => {
  let status = err.status || 500;
  let message = err.message || "Something went wrong";
  // console.log("Global Error Handler:", err);

  let errorSources: TErrorSources = [
    {
      path: "",
      message,
    },
  ];

  return res.status(status).json({
    success: false,
    message,
    errorSources,
    stack: config.nodeEnv === "development" ? err.stack : undefined,
  });
};

export default globalErrorHandler;
