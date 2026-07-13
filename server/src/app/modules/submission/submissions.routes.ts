import { Request, Response, Router } from "express";
const router = Router();

router.post("/", async (req: Request, res: Response) => {
  res.json({ message: "POST /api/submissions — coming Day 2" });
});

router.get("/:id/status", async (req: Request, res: Response) => {
  res.json({ message: `GET status for ${req.params.id} — coming Day 2` });
});

router.get("/:id/results", async (req: Request, res: Response) => {
  res.json({ message: `GET results for ${req.params.id} — coming Day 3` });
});

export const submissionsRoutes = router;
