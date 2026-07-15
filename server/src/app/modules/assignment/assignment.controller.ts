import { Request, Response } from "express";
import { StatusCodes } from "http-status-codes";

import catchAsync from "../../helpers/catchAsync";
import sendResponse from "../../helpers/sendResponse";
import { AssignmentService } from "./assgnment.service";
import { enrichAssignment } from "./enrichment.service";

// POST /api/assignments
const createAssignment = catchAsync(async (req: Request, res: Response) => {
  const assignment = await AssignmentService.create(req.body);

  sendResponse(res, {
    status: StatusCodes.CREATED,
    success: true,
    message: "Assignment created successfully",
    data: {
      assignmentId: assignment._id,
      assignment,
    },
  });
});

// GET /api/assignments
const getAllAssignments = catchAsync(async (req: Request, res: Response) => {
  const filters = {
    batch: req.query.batch ? Number(req.query.batch) : undefined,
    assignmentNo: req.query.assignmentNo
      ? Number(req.query.assignmentNo)
      : undefined,
    status: req.query.status as string | undefined,
  };

  const assignments = await AssignmentService.getAll(filters);

  sendResponse(res, {
    status: StatusCodes.OK,
    success: true,
    message: "Assignments retrieved successfully",
    data: assignments,
  });
});

// GET /api/assignments/batch/:batch/no/:assignmentNo
const getByBatchAndNo = catchAsync(async (req: Request, res: Response) => {
  const batch = Number(req.params.batch);
  const assignmentNo = Number(req.params.assignmentNo);

  const assignment = await AssignmentService.getByBatchAndNo(
    batch,
    assignmentNo,
  );

  sendResponse(res, {
    status: StatusCodes.OK,
    success: true,
    message: "Assignment retrieved successfully",
    data: assignment,
  });
});

// GET /api/assignments/:id
const getById = catchAsync(async (req: Request, res: Response) => {
  const assignment = await AssignmentService.getById(req.params.id as string);

  sendResponse(res, {
    status: StatusCodes.OK,
    success: true,
    message: "Assignment retrieved successfully",
    data: assignment,
  });
});

// PATCH /api/assignments/:id
const update = catchAsync(async (req: Request, res: Response) => {
  const assignment = await AssignmentService.update(
    req.params.id as string,
    req.body,
  );

  sendResponse(res, {
    status: StatusCodes.OK,
    success: true,
    message:
      "Assignment updated. Enrichment will re-run automatically on Day 3.",
    data: assignment,
  });
});

// PATCH /api/assignments/:id/activate
const activate = catchAsync(async (req: Request, res: Response) => {
  const assignment = await AssignmentService.activate(req.params.id as string);

  sendResponse(res, {
    status: StatusCodes.OK,
    success: true,
    message: "Assignment activated",
    data: assignment,
  });
});

// PATCH /api/assignments/:id/archive
const archive = catchAsync(async (req: Request, res: Response) => {
  const assignment = await AssignmentService.archive(req.params.id as string);

  sendResponse(res, {
    status: StatusCodes.OK,
    success: true,
    message: "Assignment archived",
    data: assignment,
  });
});

// GET /api/assignments/:id/enriched
const getEnriched = catchAsync(async (req: Request, res: Response) => {
  const result = await enrichAssignment(req.params.id as string);

  sendResponse(res, {
    status: StatusCodes.OK,
    success: true,
    message: "Enriched requirements retrieved successfully",
    data: result,
  });
});
// GET /api/assignments/:id/enrichment-status
const getEnrichmentStatus = catchAsync(async (req: Request, res: Response) => {
  const status = await AssignmentService.getEnrichmentStatus(
    req.params.id as string,
  );

  if (!status) {
    sendResponse(res, {
      status: StatusCodes.NOT_FOUND,
      success: false,
      message: "Assignment not found",
      data: null,
    });
    return;
  }

  sendResponse(res, {
    status: StatusCodes.OK,
    success: true,
    message: "Enrichment status retrieved successfully",
    data: status,
  });
});
export const AssignmentController = {
  create: createAssignment,
  getAll: getAllAssignments,
  getByBatchAndNo: getByBatchAndNo,
  getById: getById,
  update: update,
  activate: activate,
  archive: archive,
  getEnriched: getEnriched,
  getEnrichmentStatus: getEnrichmentStatus,
};
