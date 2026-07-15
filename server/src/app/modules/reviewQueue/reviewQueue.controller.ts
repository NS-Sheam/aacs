import { Request, Response } from "express";
import { StatusCodes } from "http-status-codes";

import catchAsync from "../../helpers/catchAsync";
import sendResponse from "../../helpers/sendResponse";
import { ReviewQueueServices } from "./reviewQueue.service";

// GET /api/v1/review-queue?submissionId=...
const getPending = catchAsync(async (req: Request, res: Response) => {
  const submissionId = req.query.submissionId as string | undefined;
  const items = await ReviewQueueServices.getPending(submissionId);

  sendResponse(res, {
    status: StatusCodes.OK,
    success: true,
    message: "Pending review items retrieved successfully",
    data: items,
  });
});

// PATCH /api/v1/review-queue/:itemId
const resolve = catchAsync(async (req: Request, res: Response) => {
  const { decision, resolvedBy } = req.body;

  if (!decision || !["pass", "fail"].includes(decision)) {
    throw new Error("decision must be pass or fail");
  }

  const item = await ReviewQueueServices.resolve(
    req.params.itemId as string,
    decision,
    resolvedBy || "instructor",
  );

  if (!item) {
    sendResponse(res, {
      status: StatusCodes.NOT_FOUND,
      success: false,
      message: "Review queue item not found",
      data: null,
    });
    return;
  }

  sendResponse(res, {
    status: StatusCodes.OK,
    success: true,
    message: "Decision recorded",
    data: item,
  });
});

export const ReviewQueueController = {
  getPending,
  resolve,
};
