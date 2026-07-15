import { Router } from "express";
import { AssignmentController } from "./assignment.controller";
const router = Router();

// Order matters — specific routes before parameterized ones

router.post("/", AssignmentController.create);
router.get("/", AssignmentController.getAll);

// batch/no route MUST come before /:id
router.get(
  "/batch/:batch/no/:assignmentNo",
  AssignmentController.getByBatchAndNo,
);

router.get("/:id", AssignmentController.getById);
router.get("/:id/enriched", AssignmentController.getEnriched);
router.get("/:id/enrichment-status", AssignmentController.getEnrichmentStatus);

router.patch("/:id/activate", AssignmentController.activate);
router.patch("/:id/archive", AssignmentController.archive);
router.patch("/:id", AssignmentController.update);

export const assignmentsRoutes = router;
