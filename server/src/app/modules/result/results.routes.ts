import { Request, Response, Router } from "express";
import { Result } from "./result.model";
import { Submission } from "../submission/submission.model";
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

router.patch("/:resultId", async (req: Request, res: Response) => {
  try {
    const { obtainedMarks, instructorFeedback } = req.body;
    const { resultId } = req.params;

    const resultDoc = await Result.findById(resultId);
    if (!resultDoc) {
      return res.status(404).json({
        success: false,
        message: "Result not found",
      });
    }

    if (obtainedMarks !== undefined) {
      const marksVal = Number(obtainedMarks);
      if (isNaN(marksVal) || marksVal < 0) {
        return res.status(400).json({
          success: false,
          message: "Obtained marks must be a non-negative number",
        });
      }
      if (marksVal > (resultDoc.marks || 0)) {
        return res.status(400).json({
          success: false,
          message: `Obtained marks cannot exceed the maximum mark of ${resultDoc.marks || 0}`,
        });
      }
      resultDoc.obtainedMarks = marksVal;
      resultDoc.correct = marksVal > 0;
      resultDoc.status = marksVal > 0 ? "pass" : "fail";
    }

    if (instructorFeedback !== undefined) {
      resultDoc.instructorFeedback = instructorFeedback;
    }

    await resultDoc.save();

    // Recalculate submission score
    const allResults = await Result.find({ submissionId: resultDoc.submissionId });
    const totalScore = allResults.reduce((acc, curr) => {
      const obtained = curr.obtainedMarks !== undefined ? curr.obtainedMarks : (curr.correct ? (curr.marks || 0) : 0);
      return acc + obtained;
    }, 0);

    const maxScore = allResults.reduce((acc, curr) => {
      return acc + (curr.marks || 0);
    }, 0);

    await Submission.findByIdAndUpdate(resultDoc.submissionId, {
      totalScore,
      maxScore,
    });

    res.json({
      success: true,
      message: "Result marks updated successfully",
      data: resultDoc,
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
