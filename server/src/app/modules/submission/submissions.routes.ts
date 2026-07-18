import { Router } from "express";
import { SubmissionController } from "./submission.controller";
const router = Router();

router.post("/", SubmissionController.create);
router.get("/stats", SubmissionController.getStats);
router.get("/", SubmissionController.getAll);
router.get("/assignment/:assignmentId", SubmissionController.getByAssignment);
router.post("/:id/recheck", SubmissionController.recheck);
router.get("/:id/status", SubmissionController.getStatus);
router.get("/:id", SubmissionController.getById);
export const SubmissionsRoutes = router;
