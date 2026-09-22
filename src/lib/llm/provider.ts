import "server-only";

// LLM adapter (spec §12 "LLM adapter"). Any OpenAI-compatible provider
// works: set OPENAI_BASE_URL + OPENAI_API_KEY + OPENAI_MODEL.
// The engine never hard-depends on this: generateJson falls back to null
// and callers use deterministic templates (spec §23: "If credentials block
// a live integration, build the adapter and DEMO_MODE instead of stopping").

export interface LlmStatus {
  configured: boolean;
  baseUrl: string;
  model: string;
}

export function llmStatus(): LlmStatus {
  return {
    configured: Boolean(process.env.OPENAI_API_KEY),
    baseUrl: process.env.OPENAI_BASE_URL ?? "https://api.openai.com/v1",
    model: process.env.OPENAI_MODEL ?? "gpt-4o-mini",
  };
}

interface JsonOptions {
  system: string;
  user: string;
  maxTokens?: number;
  temperature?: number;
}

/** Ask the LLM for a JSON object; returns null on any failure.
 *
 * Free-model friendly:
 *  - No response_format requirement (many free tiers ignore/reject it)
 *  - Tolerates markdown fences / surrounding prose in the reply
 *  - Retries and fails over across free models when a provider is
 *    overloaded (free tiers return 503 intermittently)
 * Callers must treat null as "use deterministic fallback".
 */

// Known-good free fallbacks on OpenRouter (verified 2026-09-22; free
// tier rotates, so keep this list current). The env-configured model is
// always tried first.
const FALLBACK_MODELS = [
  "thinkingmachines/inkling-small:free",
  "qwen/qwen3.8-27b:free",
  "nex-agi/nex-n2.5-pro:free",
  "nvidia/nemotron-3.5-lightning:free",
];

let preferredModel: string | null = null; // sticky winner within this process

export async function generateJson<T>(opts: JsonOptions): Promise<T | null> {
  if (!process.env.OPENAI_API_KEY) return null;

  const candidates = [preferredModel, llmStatus().model, ...FALLBACK_MODELS].filter(
    (m, i, arr): m is string => Boolean(m) && arr.indexOf(m) === i
  );

  for (const model of candidates) {
    // Two attempts per model: free providers flap under load.
    for (let attempt = 0; attempt < 2; attempt++) {
      const result = await attemptJson<T>(model, opts);
      if (result !== null) {
        preferredModel = model;
        return result;
      }
      await new Promise((r) => setTimeout(r, 700));
    }
  }
  return null;
}

async function attemptJson<T>(model: string, opts: JsonOptions): Promise<T | null> {
  try {
    const res = await fetch(`${llmStatus().baseUrl}/chat/completions`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${process.env.OPENAI_API_KEY}`,
      },
      body: JSON.stringify({
        model,
        messages: [
          { role: "system", content: opts.system },
          { role: "user", content: opts.user },
        ],
        max_tokens: opts.maxTokens ?? 700,
        temperature: opts.temperature ?? 0.4,
      }),
      signal: AbortSignal.timeout(20_000),
    });
    if (!res.ok) return null;
    const data = (await res.json()) as {
      choices?: { message?: { content?: string } }[];
      error?: { message?: string };
    };
    if (data.error || !data.choices?.[0]?.message?.content) return null;
    const text = data.choices[0].message!.content!;
    return extractJson<T>(text);
  } catch {
    return null;
  }
}

/** Tolerant JSON extraction: strips code fences and surrounding prose. */
export function extractJson<T>(text: string): T | null {
  // Direct parse.
  try {
    return JSON.parse(text) as T;
  } catch {
    /* keep trying */
  }
  // Strip markdown fences.
  const fenced = text.match(/```(?:json)?\s*([\s\S]*?)```/i);
  if (fenced?.[1]) {
    try {
      return JSON.parse(fenced[1].trim()) as T;
    } catch {
      /* keep trying */
    }
  }
  // First {...} or [...] block in the text.
  const start = text.search(/[{\[]/);
  if (start >= 0) {
    const open = text[start];
    const close = open === "{" ? "}" : "]";
    const end = text.lastIndexOf(close);
    if (end > start) {
      try {
        return JSON.parse(text.slice(start, end + 1)) as T;
      } catch {
        /* give up */
      }
    }
  }
  return null;
}
