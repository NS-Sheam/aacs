import { Router } from "express";
import { resultController } from "./result.controller";

const router = Router();

// Order matters — specific routes before parameterized ones
router.get("/:submissionId/summary", resultController.getSummary);
router.get("/:submissionId/export", resultController.exportJSON);
router.get("/:submissionId", resultController.getBySubmission);

export const resultsRoutes = router;
