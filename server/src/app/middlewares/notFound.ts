import { NextFunction, Request, Response } from "express";
import { StatusCodes } from "http-status-codes";
const notFound = (req: Request, res: Response) => {
  const success = false;
  const status = StatusCodes.NOT_FOUND;
  const message = `Requested path ${req.originalUrl} Not Found`;
  res.status(status).json({
    status,
    success,
    message,
  });
};

export default notFound;
