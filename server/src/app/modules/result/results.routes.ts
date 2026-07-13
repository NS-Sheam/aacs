import { Request, Response, Router } from "express";
const router = Router();

router.post("/export/:submissionId", async (req: Request, res: Response) => {
  res.json({ message: `Export for ${req.params.submissionId} — coming Day 4` });
});

export const resultsRoutes = router;
