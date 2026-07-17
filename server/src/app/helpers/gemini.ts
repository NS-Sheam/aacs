import config from "../config";

/**
 * Call Google Gemini API to generate structured content
 * @param prompt Prompt to send to Gemini
 * @param model Model name, default gemini-2.5-flash
 */
/**
 * Call local Ollama model (DeepSeek R1 / Llama 3.2) as fallback when Gemini is unavailable or rate-limited
 */
let ollamaPromiseChain = Promise.resolve();

async function executeLocalOllamaCall(prompt: string, modelName: string = "deepseek-r1:latest"): Promise<any> {
  console.log(`[LOCAL LLM FALLBACK] Calling Ollama model "${modelName}" on http://localhost:11434 ...`);
  try {
    const res = await fetch("http://localhost:11434/api/generate", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        model: modelName,
        prompt: prompt + "\nRespond STRICTLY with valid JSON. Do not write explanation or wrap in markdown blocks.",
        stream: false,
        format: "json"
      })
    });

    if (!res.ok) {
      throw new Error(`Ollama HTTP Error: ${res.status}`);
    }

    const json = await res.json();
    let text = json.response || "";
    
    // Clean up DeepSeek thinking tags <think>...</think> if present
    if (text.includes("</think>")) {
      text = text.split("</think>")[1];
    }
    
    return JSON.parse(text.trim());
  } catch (err: any) {
    console.error(`[LOCAL LLM FALLBACK FAILED] Error calling local model:`, err.message);
    throw err;
  }
}

async function callLocalOllama(prompt: string, modelName: string = "deepseek-r1:latest"): Promise<any> {
  const result = new Promise((resolve, reject) => {
    ollamaPromiseChain = ollamaPromiseChain.then(async () => {
      try {
        const res = await executeLocalOllamaCall(prompt, modelName);
        resolve(res);
      } catch (err) {
        reject(err);
      }
    });
  });
  return result;
}

export async function generateJSONContent(
  prompt: string,
  model: string = "gemini-2.5-flash"
): Promise<any> {
  const apiKey = config.geminiApiKey;
  if (!apiKey) {
    console.warn("GEMINI_API_KEY is not set. Falling back to local Ollama...");
    return callLocalOllama(prompt);
  }

  const url = `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${apiKey}`;

  try {
    const response = await fetch(url, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        contents: [
          {
            parts: [
              {
                text: prompt,
              },
            ],
          },
        ],
        generationConfig: {
          responseMimeType: "application/json",
        },
      }),
    });

    if (!response.ok) {
      const errorText = await response.text();
      throw new Error(`Gemini API error (${response.status}): ${errorText}`);
    }

    const result = await response.json();
    const textContent = result?.candidates?.[0]?.content?.parts?.[0]?.text;
    if (!textContent) {
      throw new Error("No response content received from Gemini");
    }

    return JSON.parse(textContent.trim());
  } catch (err: any) {
    console.warn(`[GEMINI API ERROR] ${err.message}. Falling back to local DeepSeek-R1...`);
    return callLocalOllama(prompt);
  }
}

/**
 * Call Google Gemini API with an image and text prompt to perform visual verification
 */
export async function generateJSONContentWithImage(
  prompt: string,
  base64Image: string,
  model: string = "gemini-2.5-flash"
): Promise<any> {
  const apiKey = config.geminiApiKey;
  if (!apiKey) {
    console.warn("GEMINI_API_KEY is not set. Falling back to local Ollama...");
    return callLocalOllama(prompt);
  }

  const url = `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${apiKey}`;

  try {
    const response = await fetch(url, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        contents: [
          {
            parts: [
              {
                text: prompt,
              },
              {
                inlineData: {
                  mimeType: "image/png",
                  data: base64Image,
                },
              },
            ],
          },
        ],
        generationConfig: {
          responseMimeType: "application/json",
        },
      }),
    });

    if (!response.ok) {
      const errorText = await response.text();
      throw new Error(`Gemini Vision API error (${response.status}): ${errorText}`);
    }

    const result = await response.json();
    const textContent = result?.candidates?.[0]?.content?.parts?.[0]?.text;
    if (!textContent) {
      throw new Error("No response content received from Gemini Vision");
    }

    return JSON.parse(textContent.trim());
  } catch (err: any) {
    console.warn(`[GEMINI VISION API ERROR] ${err.message}. Falling back to local DeepSeek-R1...`);
    // Local fallback (text description only since R1 doesn't support visual inputs natively)
    return callLocalOllama(prompt + "\n[Visual check skipped because local model is running text-only mode]");
  }
}
