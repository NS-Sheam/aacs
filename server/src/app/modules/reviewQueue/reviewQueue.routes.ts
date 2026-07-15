import { Request, Response, Router } from "express";
import { reviewQueueService } from "./reviewQueue.service";

const router = Router();

router.get("/", async (req: Request, res: Response): Promise<void> => {
  try {
    const items = await reviewQueueService.getPending(
      req.query.submissionId as string | undefined,
    );
    res.status(200).json({ success: true, count: items.length, data: items });
  } catch (err: any) {
    res.status(500).json({ success: false, message: err.message });
  }
});

router.patch("/:itemId", async (req: Request, res: Response): Promise<void> => {
  try {
    const { decision, resolvedBy } = req.body;
    if (!decision || !["pass", "fail"].includes(decision)) {
      res.status(400).json({
        success: false,
        message: "decision must be 'pass' or 'fail'",
      });
      return;
    }
    const item = await reviewQueueService.resolve(
      req.params.itemId as string,
      decision,
      resolvedBy || "instructor",
    );
    if (!item) {
      res.status(404).json({
        success: false,
        message: "Review queue item not found",
      });
      return;
    }
    res
      .status(200)
      .json({ success: true, message: "Decision recorded", data: item });
  } catch (err: any) {
    res.status(500).json({ success: false, message: err.message });
  }
});

export const reviewQueueRoutes = router;
