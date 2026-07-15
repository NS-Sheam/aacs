import { Request, Response } from "express";
import { resultService } from "./result.service";

export const resultController = {
  // GET /api/v1/results/:submissionId — grouped by section
  async getBySubmission(req: Request, res: Response): Promise<void> {
    try {
      const results = await resultService.getBySubmission(
        req.params.submissionId as string,
      );
      res.status(200).json({ success: true, data: results });
    } catch (err: any) {
      res.status(500).json({ success: false, message: err.message });
    }
  },

  // GET /api/v1/results/:submissionId/summary — score totals
  async getSummary(req: Request, res: Response): Promise<void> {
    try {
      const summary = await resultService.getSummary(
        req.params.submissionId as string,
      );
      res.status(200).json({ success: true, data: summary });
    } catch (err: any) {
      res.status(500).json({ success: false, message: err.message });
    }
  },

  // GET /api/v1/results/:submissionId/export — instructor JSON format
  async exportJSON(req: Request, res: Response): Promise<void> {
    try {
      const json = await resultService.exportAsInstructorJSON(
        req.params.submissionId as string,
      );
      res.status(200).json(json);
    } catch (err: any) {
      res.status(500).json({ success: false, message: err.message });
    }
  },
};
