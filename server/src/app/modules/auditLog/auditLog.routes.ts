import { Request, Response, Router } from "express";
import { auditLogService } from "./auditLog.service";

const router = Router();

// GET /api/v1/audit/:submissionId — full audit trail for a submission
router.get("/:submissionId", async (req: Request, res: Response) => {
  try {
    const logs = await auditLogService.getBySubmission(req.params.submissionId as string);
    res.json(logs);
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

export const auditLogRoutes = router;
