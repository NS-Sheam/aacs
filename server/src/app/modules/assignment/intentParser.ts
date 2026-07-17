import { GoogleGenerativeAI, GenerationConfig } from "@google/generative-ai";
import dotenv from "dotenv";
dotenv.config();

let genAI: any;
try {
  if (process.env.GEMINI_API_KEY && !process.env.GEMINI_API_KEY.startsWith("your_")) {
    genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);
  }
} catch (e: any) {
  console.warn("Could not initialize GoogleGenerativeAI:", e.message);
}

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

export async function parseRequirementWithDeepSeek(description: string): Promise<ParsedRule> {
  const prompt = `${SYSTEM_PROMPT}
  
Requirement: "${description}"

Return JSON with exactly these fields (strictly in valid JSON format, without markdown block or trailing commas):
{
  "checkType": "ui-element" | "ui-count" | "ui-position" | "functional-auth" | "functional-crud" | "conditional-logic" | "visual-figma" | "needsClarification",
  "automationTier": 1 | 2 | 3,
  "selectors": ["selector1", "selector2"],
  "requiredState": null or { "key": "value" },
  "confidence": 0.0 to 1.0,
  "needsClarification": true | false
}`;

  const response = await fetch("http://localhost:11434/api/generate", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      model: "deepseek-r1:latest",
      prompt,
      stream: false,
      options: {
        temperature: 0.1
      }
    })
  });

  if (!response.ok) {
    throw new Error(`Ollama HTTP error! status: ${response.status}`);
  }

  const data = await response.json();
  const rawText = data.response || "";

  let cleaned = rawText.trim();
  if (cleaned.includes("</thought>")) {
    cleaned = cleaned.substring(cleaned.indexOf("</thought>") + "</thought>".length).trim();
  }
  if (cleaned.startsWith("```")) {
    cleaned = cleaned.replace(/^```(json)?/, "").replace(/```$/, "").trim();
  }
  const start = cleaned.indexOf("{");
  const end = cleaned.lastIndexOf("}");
  if (start !== -1 && end !== -1 && end > start) {
    cleaned = cleaned.substring(start, end + 1);
  }

  return JSON.parse(cleaned) as ParsedRule;
}

export async function parseRequirement(
  description: string,
): Promise<ParsedRule> {
  // Check if Gemini is configured
  const isGeminiConfigured = process.env.GEMINI_API_KEY && !process.env.GEMINI_API_KEY.startsWith("your_");

  if (!isGeminiConfigured || !genAI) {
    console.log(`[IntentParser] Gemini API key not found. Using local DeepSeek R1...`);
    try {
      return await parseRequirementWithDeepSeek(description);
    } catch (e: any) {
      console.warn(`[IntentParser] DeepSeek fallback failed: ${e.message}. Using safe defaults.`);
      return getFallbackDefault();
    }
  }

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
    console.warn(
      `[IntentParser] Gemini Intent Parser error for "${description}": ${err.message}. Trying local DeepSeek R1...`
    );
    try {
      return await parseRequirementWithDeepSeek(description);
    } catch (deepseekErr: any) {
      console.error(`[IntentParser] DeepSeek R1 fallback failed: ${deepseekErr.message}`);
      return getFallbackDefault();
    }
  }
}

function getFallbackDefault(): ParsedRule {
  return {
    checkType: "needsClarification",
    automationTier: 3,
    selectors: [],
    requiredState: null,
    confidence: 0,
    needsClarification: true,
  };
}
