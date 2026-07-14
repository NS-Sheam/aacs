import { GoogleGenerativeAI, GenerationConfig } from "@google/generative-ai";
import dotenv from "dotenv";
dotenv.config();

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY!);

const generationConfig: GenerationConfig = {
  temperature: 0.1, // low temperature = deterministic output
  maxOutputTokens: 400,
  responseMimeType: "application/json", // force JSON output
};

export interface ParsedRule {
  checkType:
    | "ui-element"
    | "ui-count"
    | "ui-position"
    | "functional-auth"
    | "functional-crud"
    | "conditional-logic"
    | "visual-figma"
    | "needsClarification";
  automationTier: 1 | 2 | 3;
  selectors: string[];
  requiredState: Record<string, any> | null;
  confidence: number;
  needsClarification: boolean;
}

const SYSTEM_PROMPT = `You are a DOM check rule generator for an automated web assignment checker used by a coding bootcamp.
  
  Given a UI requirement description from a student assignment, generate a structured JSON rule.
  
  CheckType definitions:
  - "ui-element": element must exist in DOM → tier 1
  - "ui-count": specific number of elements required → tier 1
  - "ui-position": element must be at left/center/right position → tier 1
  - "functional-auth": requires a logged-in browser session to verify → tier 2
  - "functional-crud": requires database interaction or API call → tier 2
  - "conditional-logic": element visible only under specific application state → tier 3
  - "visual-figma": visual comparison to Figma design required → tier 3
  - "needsClarification": cannot determine automated rule with confidence → tier 3
  
  Rules for selectors array:
  - Provide 4 to 6 CSS selectors ordered from most specific to least specific
  - Use class names, tag names, attributes, and combinations
  - Include both semantic and common class-based selectors
  
  Rules for requiredState:
  - For ui-position: { "position": "left" | "center" | "right" }
  - For functional-auth: { "authRole": "student" | "moderator" | "admin" }
  - For functional-crud: { "action": "...", "expectedCount": number }
  - For conditional-logic: full condition object like { "applicationStatus": "pending", "paymentStatus": "unpaid" }
  - For others: null
  
  Rules for confidence:
  - 0.9+ : very clear requirement, obvious selectors
  - 0.7-0.9 : clear requirement, reasonable selectors
  - 0.5-0.7 : some ambiguity, best-guess selectors
  - below 0.6: set needsClarification to true
  
  Always return valid JSON only. No explanation. No markdown. No backticks.`;

export async function parseRequirement(
  description: string,
): Promise<ParsedRule> {
  try {
    const model = genAI.getGenerativeModel({
      model: "gemini-1.5-flash",
      systemInstruction: SYSTEM_PROMPT,
      generationConfig,
    });

    const prompt = `Requirement: "${description}"
  
  Return JSON with exactly these fields:
  {
    "checkType": "ui-element" | "ui-count" | "ui-position" | "functional-auth" | "functional-crud" | "conditional-logic" | "visual-figma" | "needsClarification",
    "automationTier": 1 | 2 | 3,
    "selectors": ["selector1", "selector2", "selector3", "selector4"],
    "requiredState": null or { key: value },
    "confidence": 0.0 to 1.0,
    "needsClarification": true | false
  }`;

    const result = await model.generateContent(prompt);
    const text = result.response.text();

    const parsed = JSON.parse(text) as ParsedRule;

    // Safety defaults
    if (!parsed.checkType) parsed.checkType = "needsClarification";
    if (!parsed.automationTier) parsed.automationTier = 3;
    if (!Array.isArray(parsed.selectors)) parsed.selectors = [];
    if (parsed.confidence === undefined) parsed.confidence = 0.5;
    if (parsed.needsClarification === undefined) {
      parsed.needsClarification = parsed.confidence < 0.6;
    }

    return parsed;
  } catch (err: any) {
    console.error(
      `Gemini Intent Parser error for "${description}":`,
      err.message,
    );
    // Safe fallback — never crash the enrichment pipeline
    return {
      checkType: "needsClarification",
      automationTier: 3,
      selectors: [],
      requiredState: null,
      confidence: 0,
      needsClarification: true,
    };
  }
}
