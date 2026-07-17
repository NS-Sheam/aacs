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

// POST /api/submissions/bulk
const createBulkSubmissions = catchAsync(
  async (req: Request, res: Response) => {
    const result = await SubmissionServices.createBulk(req.body.submissions);

    sendResponse(res, {
      status: StatusCodes.CREATED,
      success: true,
      message: `${result.success.length} queued · ${result.failed.length} failed`,
      data: result,
    });
  },
);

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

// GET /api/submissions/assignment/:assignmentId/paginated
const getSubmissionByAssignmentPaginated = catchAsync(
  async (req: Request, res: Response) => {
    const page = Number(req.query.page) || 1;
    const limit = Number(req.query.limit) || 20;

    const result = await SubmissionServices.getByAssignmentPaginated(
      req.params.assignmentId as string,
      page,
      limit,
    );

    sendResponse(res, {
      status: StatusCodes.OK,
      success: true,
      message: "Assignment submissions retrieved successfully",
      meta: {
        page: result.page,
        limit,
        total: result.total,
        totalPages: result.totalPages,
      },
      data: result.submissions,
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

// PATCH /api/submissions/:id
const updateSubmission = catchAsync(async (req: Request, res: Response) => {
  const result = await SubmissionServices.update(
    req.params.id as string,
    req.body,
  );

  sendResponse(res, {
    status: StatusCodes.OK,
    success: true,
    message: "Submission updated successfully",
    data: result,
  });
});

// POST /api/submissions/:id/recheck
const recheckSubmission = catchAsync(async (req: Request, res: Response) => {
  const result = await SubmissionServices.recheck(req.params.id as string);

  sendResponse(res, {
    status: StatusCodes.OK,
    success: true,
    message: "Recheck started successfully",
    data: result,
  });
});

// GET /api/submissions
const getAllSubmissions = catchAsync(async (req: Request, res: Response) => {
  const result = await SubmissionServices.getAll();

  sendResponse(res, {
    status: StatusCodes.OK,
    success: true,
    message: "All submissions retrieved successfully",
    data: result,
  });
});

export const SubmissionController = {
  create: createSubmission,
  createBulk: createBulkSubmissions,
  getStatus: getSubmissionStatus,
  getByAssignment: getSubmissionByAssignment,
  getByAssignmentPaginated: getSubmissionByAssignmentPaginated,
  getById: getSubmissionById,
  update: updateSubmission,
  recheck: recheckSubmission,
  getAll: getAllSubmissions,
};
