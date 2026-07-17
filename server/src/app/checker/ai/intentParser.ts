import { generateJSONContent } from "../../helpers/gemini";

export interface EnrichedRequirement {
  description: string;
  number: string;
  correct: boolean;
  message: string;
  checkType: string;
  automationTier: number;
  selectors: string[];
  requiredState: Record<string, any> | null;
  confidence: number;
  rules?: Array<{
    kind: "exists" | "count" | "position" | "text" | "style";
    target?: string;
    selectorHint?: string;
    expected?: any;
    position?: "left" | "center" | "right" | "top" | "bottom";
  }>;
}

// AI Intent Parser to enrich a single requirement description
export async function enrichRequirement(
  description: string
): Promise<Partial<EnrichedRequirement>> {
  const prompt = `
You are an expert AI Intent Parser for an Automated Assignment Checker System.
Your job is to analyze the following natural language requirement description for a programming assignment and convert it into structured automation parameters.

Requirement Description: "${description}"

Generate a JSON object with the following fields:
1. "checkType": Choose one of the following:
   - "ui-element" (element must exist in DOM)
   - "ui-count" (specific number of elements expected)
   - "ui-position" (element position like left, center, right, top, bottom)
   - "functional-auth" (requires authentication to check)
   - "functional-crud" (requires DB data / CRUD operations)
   - "conditional-logic" (logic-based visibility or behavior)
   - "visual-figma" (visual matching)
   - "needsClarification" (if too ambiguous or impossible to map)
2. "automationTier": 1, 2, or 3 (Tier 1 for static UI, Tier 2 for functional/auth, Tier 3 for logic/AI)
3. "selectors": An array of standard CSS selectors that are likely to target this element (ordered by priority, e.g. ["nav .logo", "nav img", ".logo"]). If no specific selectors can be inferred, provide sensible default fallbacks.
4. "requiredState": An object or null specifying any state required (e.g. {"authRole": "student"} or null).
5. "confidence": A float from 0.0 to 1.0 representing your confidence in this parsing.
6. "rules": (Optional) An array of rules for checking, where each rule has:
   - "kind": "exists", "count", "position", "text", or "style"
   - "target": description of target
   - "selectorHint": space or comma separated selector suggestion
   - "expected": expected value (true/false/number)
   - "position": (optional) "left", "center", "right", "top", "bottom"

Ensure the response is strictly JSON.
Example output for "logo/website name on the left":
{
  "checkType": "ui-position",
  "automationTier": 1,
  "selectors": ["nav img", "nav svg", "nav .logo", "nav a:first-child", "header .logo", ".navbar-brand"],
  "requiredState": null,
  "confidence": 0.95,
  "rules": [
    {
      "kind": "position",
      "target": "logo",
      "selectorHint": "nav img, .logo",
      "expected": true,
      "position": "left"
    }
  ]
}
`;

  try {
    const enrichment = await generateJSONContent(prompt);
    return enrichment;
  } catch (error) {
    console.error("Error in enrichRequirement AI call:", error);
    // Return safe fallback
    return {
      checkType: "needsClarification",
      automationTier: 3,
      selectors: [],
      requiredState: null,
      confidence: 0.1,
    };
  }
}

// Enrich all requirements of an assignment
export async function enrichAssignmentRequirements(
  requirements: Record<string, any>
): Promise<Record<string, any>> {
  const enriched: Record<string, any> = {};

  for (const [section, sectionReqs] of Object.entries(requirements)) {
    enriched[section] = {};
    for (const [reqKey, req] of Object.entries(sectionReqs as Record<string, any>)) {
      const typedReq = req as Record<string, any>;
      const enrichment = await enrichRequirement(typedReq.description || "");
      enriched[section][reqKey] = {
        ...typedReq,
        ...enrichment,
      };
    }
  }

  return enriched;
}
