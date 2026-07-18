import { IResult, Result } from "./result.model";

export interface ResultSummary {
  totalScore: number;
  maxScore: number;
  passed: number;
  failed: number;
  flagged: number;
  autoCommitted: number;
}

// Get all results for a submission grouped by section
const getBySubmission = async (
  submissionId: string,
): Promise<Record<string, IResult[]>> => {
  const results = await Result.find({ submissionId }).sort({
    section: 1,
    reqKey: 1,
  });

  return results.reduce(
    (acc, result) => {
      const section = result.section;
      if (!acc[section]) acc[section] = [];
      acc[section].push(result);
      return acc;
    },
    {} as Record<string, IResult[]>,
  );
};

// Get summary stats for a submission
const getSummary = async (submissionId: string): Promise<ResultSummary> => {
  const results = await Result.find({ submissionId });

  let totalScore = 0;
  let maxScore = 0;
  let passed = 0;
  let failed = 0;
  let flagged = 0;
  let autoCommitted = 0;

  for (const r of results) {
    const marks = r.marks || 0;
    maxScore += marks;
    const obtained = r.obtainedMarks !== undefined ? r.obtainedMarks : (r.correct ? marks : 0);
    totalScore += obtained;
    if (r.correct) {
      passed++;
    } else {
      failed++;
    }
    if (r.status === "needsReview") flagged++;
    if (r.autoCommitted) autoCommitted++;
  }

  return { totalScore, maxScore, passed, failed, flagged, autoCommitted };
};

// Export results in original instructor JSON format
const exportAsInstructorJSON = async (
  submissionId: string,
): Promise<Record<string, any>> => {
  const results = await Result.find({ submissionId });
  const output: Record<string, any> = {};

  for (const result of results) {
    if (result.section === "GitHub") continue; // skip GitHub meta
    if (!output[result.section]) output[result.section] = {};
    output[result.section][result.reqKey] = {
      description: result.description,
      number: String(result.marks || 0),
      correct: result.correct,
      message: result.message,
    };
  }

  return output;
};

export const ResultServices = {
  getBySubmission,
  getSummary,
  exportAsInstructorJSON,
};
