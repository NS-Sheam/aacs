import { Request, Response } from "express";
import { StatusCodes } from "http-status-codes";

import catchAsync from "../../helpers/catchAsync";
import sendResponse from "../../helpers/sendResponse";
import { ResultServices } from "./result.service";

// GET /api/v1/results/:submissionId
const getBySubmission = catchAsync(async (req: Request, res: Response) => {
  const results = await ResultServices.getBySubmission(
    req.params.submissionId as string,
  );

  sendResponse(res, {
    status: StatusCodes.OK,
    success: true,
    message: "Results retrieved successfully",
    data: results,
  });
});

// GET /api/v1/results/:submissionId/summary
const getSummary = catchAsync(async (req: Request, res: Response) => {
  const summary = await ResultServices.getSummary(
    req.params.submissionId as string,
  );

  sendResponse(res, {
    status: StatusCodes.OK,
    success: true,
    message: "Result summary retrieved successfully",
    data: summary,
  });
});

// POST /api/v1/results/export/:submissionId
const exportJSON = catchAsync(async (req: Request, res: Response) => {
  const json = await ResultServices.exportAsInstructorJSON(
    req.params.submissionId as string,
  );

  sendResponse(res, {
    status: StatusCodes.OK,
    success: true,
    message: "Results exported successfully",
    data: json,
  });
});

export const ResultController = {
  getBySubmission,
  getSummary,
  exportJSON,
};
