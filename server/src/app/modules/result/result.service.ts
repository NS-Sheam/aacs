import { Result } from "./result.model";

export const resultService = {
  // Get all results for a submission grouped by section
  async getBySubmission(submissionId: string) {
    const results = await Result.find({ submissionId }).sort({
      section: 1,
      reqKey: 1,
    });

    const grouped: Record<string, any[]> = {};
    for (const result of results) {
      if (!grouped[result.section]) grouped[result.section] = [];
      grouped[result.section].push(result);
    }
    return grouped;
  },

  // Score summary — totals for dashboard display
  async getSummary(submissionId: string) {
    const results = await Result.find({ submissionId });

    let totalScore = 0;
    let maxScore = 0;
    let passed = 0;
    let failed = 0;
    let flagged = 0;
    let autoCommitted = 0;

    for (const r of results) {
      const marks = r.marks ?? 0;
      maxScore += marks;
      if (r.correct) {
        totalScore += marks;
        passed++;
      } else {
        failed++;
      }
      if (r.status === "needsReview") flagged++;
      if (r.autoCommitted) autoCommitted++;
    }

    return { totalScore, maxScore, passed, failed, flagged, autoCommitted };
  },

  // Export in original instructor JSON format — skips GitHub meta result
  async exportAsInstructorJSON(submissionId: string) {
    const results = await Result.find({ submissionId });
    const output: Record<string, any> = {};

    for (const result of results) {
      if (result.section === "GitHub") continue;
      if (!output[result.section]) output[result.section] = {};
      output[result.section][result.reqKey] = {
        description: result.description,
        number: String(result.marks ?? 0),
        correct: result.correct,
        message: result.message,
      };
    }

    return output;
  },
};
