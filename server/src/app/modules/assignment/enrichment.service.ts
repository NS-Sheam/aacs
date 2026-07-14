import { AssignmentService } from "./assgnment.service";
import { parseRequirement } from "./intentParser";

export interface EnrichmentResult {
  assignmentId: string;
  totalRequirements: number;
  enriched: number;
  needsClarification: number;
  tier1: number;
  tier2: number;
  tier3: number;
}

// Enrich all requirements recursively — handles sub_req too
async function enrichSection(
  requirements: Record<string, any>,
): Promise<Record<string, any>> {
  const enriched: Record<string, any> = {};

  for (const [reqKey, req] of Object.entries(requirements)) {
    const r = req as any;
    const enrichedReq: Record<string, any> = { ...r };

    // Parse the main requirement description
    if (r.description) {
      console.log(`    [${reqKey}] "${r.description}"`);
      const rule = await parseRequirement(r.description);

      enrichedReq.checkType = rule.checkType;
      enrichedReq.automationTier = rule.automationTier;
      enrichedReq.selectors = rule.selectors;
      enrichedReq.requiredState = rule.requiredState;
      enrichedReq.confidence = rule.confidence;
      enrichedReq.needsClarification = rule.needsClarification;
    }

    // Handle sub_req keys recursively
    for (const [subKey, subReq] of Object.entries(r)) {
      if (subKey.startsWith("sub_req") && typeof subReq === "object") {
        const sub = subReq as any;
        if (sub.description) {
          console.log(`      [${subKey}] "${sub.description}"`);
          const subRule = await parseRequirement(sub.description);
          enrichedReq[subKey] = {
            ...sub,
            checkType: subRule.checkType,
            automationTier: subRule.automationTier,
            selectors: subRule.selectors,
            requiredState: subRule.requiredState,
            confidence: subRule.confidence,
            needsClarification: subRule.needsClarification,
          };
        }
      }
    }

    enriched[reqKey] = enrichedReq;
  }

  return enriched;
}

export async function enrichAssignment(
  assignmentId: string,
): Promise<EnrichmentResult> {
  const assignment = await AssignmentService.getById(assignmentId);

  if (!assignment) {
    throw new Error(`Assignment not found: ${assignmentId}`);
  }

  console.log(
    `\nGemini enrichment started — Assignment ${assignment.assignmentNo} · Batch ${assignment.batch}`,
  );

  const enrichedRequirements: Record<string, any> = {};

  // Process section by section
  for (const [section, reqs] of Object.entries(
    assignment.originalRequirements,
  )) {
    console.log(`  Section: ${section}`);
    enrichedRequirements[section] = await enrichSection(
      reqs as Record<string, any>,
    );
  }

  // Count stats
  let totalRequirements = 0;
  let enrichedCount = 0;
  let needsClarification = 0;
  let tier1 = 0;
  let tier2 = 0;
  let tier3 = 0;

  for (const section of Object.values(enrichedRequirements)) {
    for (const [reqKey, req] of Object.entries(
      section as Record<string, any>,
    )) {
      if (reqKey.startsWith("sub_req")) continue;
      totalRequirements++;
      if ((req as any).checkType) enrichedCount++;
      if ((req as any).needsClarification) needsClarification++;
      const tier = (req as any).automationTier;
      if (tier === 1) tier1++;
      else if (tier === 2) tier2++;
      else if (tier === 3) tier3++;
    }
  }

  // Save to MongoDB
  await AssignmentService.saveEnriched(assignmentId, enrichedRequirements);

  console.log(`\nEnrichment complete:`);
  console.log(
    `  Total: ${totalRequirements} | T1: ${tier1} | T2: ${tier2} | T3: ${tier3} | Clarify: ${needsClarification}`,
  );

  return {
    assignmentId,
    totalRequirements,
    enriched: enrichedCount,
    needsClarification,
    tier1,
    tier2,
    tier3,
  };
}
