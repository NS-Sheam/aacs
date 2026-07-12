import { Request, Response, Router } from "express";
const router = Router();

router.get("/", async (req: Request, res: Response) => {
  res.json({ message: "GET /api/review-queue — coming Day 4" });
});

router.patch("/:itemId", async (req: Request, res: Response) => {
  res.json({
    message: `PATCH review item ${req.params.itemId} — coming Day 4`,
  });
});

export const reviewQueueRoutes = router;
