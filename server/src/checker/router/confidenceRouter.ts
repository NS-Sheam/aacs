export interface RouterDecision {
  autoCommit: boolean;
  reason: string;
}

export function confidenceRouter(
  confidence: number,
  threshold: number = 0.75,
): RouterDecision {
  // needsClarification or zero confidence — always flag
  if (confidence === 0) {
    return {
      autoCommit: false,
      reason: "Confidence is 0 — needs clarification",
    };
  }

  // Above threshold — auto commit
  if (confidence >= threshold) {
    return {
      autoCommit: true,
      reason: `Confidence ${confidence} ≥ threshold ${threshold}`,
    };
  }

  // Below threshold — flag for review
  return {
    autoCommit: false,
    reason: `Confidence ${confidence} < threshold ${threshold}`,
  };
}
