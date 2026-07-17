import { Request, Response, Router } from "express";
import { Result } from "./result.model";
const router = Router();

router.get("/submission/:submissionId", async (req: Request, res: Response) => {
  try {
    const results = await Result.find({ submissionId: req.params.submissionId });
    res.json({
      success: true,
      data: results,
    });
  } catch (error: any) {
    res.status(500).json({
      success: false,
      message: error.message,
    });
  }
});

router.post("/export/:submissionId", async (req: Request, res: Response) => {
  res.json({ message: `Export for ${req.params.submissionId} — coming Day 4` });
});

export const resultsRoutes = router;
