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
const SYSTEM_PROMPT = `You are a DOM check rule generator for a web assignment checker.

Given a UI requirement description, generate structured JSON rules.

EXAMPLES:
"logo/website name on the left" → { "checkType": "ui-position", "automationTier": 1, "selectors": ["nav img", "nav svg", "nav .logo", ".navbar-brand", "header img", "header .logo"], "requiredState": { "position": "left" }, "confidence": 0.92 }

"Signup button on the right" → { "checkType": "ui-position", "automationTier": 1, "selectors": ["nav button", "nav a.btn", "header button", "a[href*='signup']", "a[href*='register']", "button[class*='signup']"], "requiredState": { "position": "right" }, "confidence": 0.88 }

"3 data with subtitle side by side" → { "checkType": "ui-count", "automationTier": 1, "selectors": [".stats-item", ".stat-card", "[class*='stat']", ".counter-item", ".feature-item"], "requiredState": null, "confidence": 0.78 }

"Background Image" → { "checkType": "ui-element", "automationTier": 1, "selectors": [".banner", ".hero", "section:first-of-type", "[class*='banner']", "[class*='hero']", "[style*='background-image']"], "requiredState": null, "confidence": 0.85 }

"Navbar (Logged In): Show Logo, Home, All Scholarships, and User Profile Image with a dropdown." → { "checkType": "functional-auth", "automationTier": 2, "selectors": ["nav img.avatar", ".user-profile", ".user-menu", "nav .dropdown", ".profile-img"], "requiredState": { "authRole": "student" }, "confidence": 0.88 }

"Action 'Pay': Visible only if status is 'pending' AND payment status is 'unpaid'." → { "checkType": "conditional-logic", "automationTier": 3, "selectors": ["button[data-action='pay']", ".pay-btn", "button.pay", "a.pay", "button:has-text('Pay')"], "requiredState": { "applicationStatus": "pending", "paymentStatus": "unpaid" }, "confidence": 0.61 }

"JWT/Firebase Token Verification: Secure APIs with middleware." → { "checkType": "needsClarification", "automationTier": 3, "selectors": [], "requiredState": null, "confidence": 0.2 }

RULES:
- Always return 4-6 selectors from most to least specific
- For "left/right/center" requirements always use "ui-position" checkType
- For "number of items" requirements always use "ui-count" checkType
- Auth requirements always use "functional-auth" with authRole in requiredState
- Cannot be tested by DOM inspection → "needsClarification" with confidence < 0.3
- Return ONLY valid JSON. No explanation. No markdown.`;

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
