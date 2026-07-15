import { Router } from "express";
import { ResultController } from "./result.controller";

const router = Router();

// Order matters — specific routes before parameterized ones
router.post("/export/:submissionId", ResultController.exportJSON);
router.get("/:submissionId/summary", ResultController.getSummary);
router.get("/:submissionId", ResultController.getBySubmission);

export const resultsRoutes = router;
