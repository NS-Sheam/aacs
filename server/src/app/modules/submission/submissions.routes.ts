import { Router } from "express";
import { SubmissionController } from "./submission.controller";
const router = Router();

router.post("/", SubmissionController.create);
router.post("/bulk", SubmissionController.createBulk);
router.get(
  "/assignment/:assignmentId/paginated",
  SubmissionController.getByAssignmentPaginated,
);
router.get("/assignment/:assignmentId", SubmissionController.getByAssignment);
router.get("/:id/status", SubmissionController.getStatus);
router.get("/:id", SubmissionController.getById);
export const SubmissionsRoutes = router;
