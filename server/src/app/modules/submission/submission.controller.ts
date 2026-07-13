import { Request, Response } from "express";
import { StatusCodes } from "http-status-codes";

import catchAsync from "../../helpers/catchAsync";
import sendResponse from "../../helpers/sendResponse";
import { SubmissionServices } from "./submission.service";

// POST /api/submissions
const createSubmission = catchAsync(async (req: Request, res: Response) => {
  const result = await SubmissionServices.create(req.body);

  sendResponse(res, {
    status: StatusCodes.CREATED,
    success: true,
    message: "Submission created successfully",
    data: result,
  });
});

// GET /api/submissions/:id/status
const getSubmissionStatus = catchAsync(async (req: Request, res: Response) => {
  const result = await SubmissionServices.getStatus(req.params.id as string);

  sendResponse(res, {
    status: StatusCodes.OK,
    success: true,
    message: "Submission status retrieved successfully",
    data: result,
  });
});

// GET /api/submissions/assignment/:assignmentId
const getSubmissionByAssignment = catchAsync(
  async (req: Request, res: Response) => {
    const result = await SubmissionServices.getByAssignment(
      req.params.assignmentId as string,
    );

    sendResponse(res, {
      status: StatusCodes.OK,
      success: true,
      message: "Assignment submissions retrieved successfully",
      data: result,
    });
  },
);

// GET /api/submissions/:id
const getSubmissionById = catchAsync(async (req: Request, res: Response) => {
  const result = await SubmissionServices.getById(req.params.id as string);

  sendResponse(res, {
    status: StatusCodes.OK,
    success: true,
    message: "Submission retrieved successfully",
    data: result,
  });
});

export const SubmissionController = {
  create: createSubmission,
  getStatus: getSubmissionStatus,
  getByAssignment: getSubmissionByAssignment,
  getById: getSubmissionById,
};
