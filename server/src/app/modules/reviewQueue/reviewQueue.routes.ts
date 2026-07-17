import { Request, Response, Router } from "express";
import { ReviewQueue } from "./reviewQueue.model";
import { Result } from "../result/result.model";
import { Submission } from "../submission/submission.model";
import { Assignment } from "../assignment/assignment.model";

const router = Router();

router.get("/", async (req: Request, res: Response) => {
  try {
    const items = await ReviewQueue.find({ status: "pending" })
      .populate({
        path: "submissionId",
        model: Submission,
        select: "studentName studentEmail githubUrl liveUrl assignmentId",
        populate: {
          path: "assignmentId",
          model: Assignment,
          select: "title batch",
        },
      })
      .populate({
        path: "resultId",
        model: Result,
      })
      .lean();

    res.json({
      success: true,
      data: items,
    });
  } catch (error: any) {
    res.status(500).json({
      success: false,
      message: error.message,
    });
  }
});

router.patch("/:itemId", async (req: Request, res: Response) => {
  try {
    const { status, notes } = req.body; // 'approved' or 'rejected'

    if (!["approved", "rejected"].includes(status)) {
      return res.status(400).json({
        success: false,
        message: "Status must be approved or rejected",
      });
    }

    const reviewItem = await ReviewQueue.findById(req.params.itemId);
    if (!reviewItem) {
      return res.status(404).json({
        success: false,
        message: "Review item not found",
      });
    }

    // 1. Update review item status
    reviewItem.status = "resolved";
    reviewItem.decision = status === "approved" ? "pass" : "fail";
    reviewItem.resolvedAt = new Date();
    await reviewItem.save();

    // 2. Update the corresponding Result record
    const resultDoc = await Result.findById(reviewItem.resultId);
    if (resultDoc) {
      resultDoc.correct = status === "approved";
      resultDoc.status = status === "approved" ? "pass" : "fail";
      resultDoc.message = `Instructor review: Manual override to ${status.toUpperCase()}. Notes: ${notes || "None"}`;
      await resultDoc.save();

      // 3. Recalculate submission score
      const allResults = await Result.find({ submissionId: reviewItem.submissionId });
      const totalScore = allResults.reduce((acc, curr) => {
        return curr.correct ? acc + (curr.marks || 0) : acc;
      }, 0);

      await Submission.findByIdAndUpdate(reviewItem.submissionId, {
        totalScore,
      });
    }

    res.json({
      success: true,
      message: `Review item successfully resolved as ${status}`,
      data: reviewItem,
    });
  } catch (error: any) {
    res.status(500).json({
      success: false,
      message: error.message,
    });
  }
});

export const reviewQueueRoutes = router;
