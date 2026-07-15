import { Router } from "express";
import { ResultController } from "./result.controller";

const router = Router();

// Support both URL patterns and HTTP methods for maximum compatibility
router.post("/export/:submissionId", ResultController.exportJSON);
router.get("/export/:submissionId", ResultController.exportJSON);
router.post("/:submissionId/export", ResultController.exportJSON);
router.get("/:submissionId/export", ResultController.exportJSON);

router.get("/:submissionId/summary", ResultController.getSummary);
router.get("/:submissionId", ResultController.getBySubmission);

export const resultsRoutes = router;
