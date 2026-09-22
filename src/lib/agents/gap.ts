import type { CapabilityGap } from "@/lib/types";

// Capability-gap detection (spec §10). Heuristics first — the LLM can
// refine the wording, but the loop must work deterministically.

interface Rule {
  keywords: RegExp;
  gap: Omit<CapabilityGap, "description">;
}

// NOTE: every pattern is word-bounded. Unanchored fragments silently
// misfire (e.g. /ui/ matches "acq-ui-sition", which once routed a research
// task to a UI vendor). Keep \b wrappers on every alternation.
const RULES: Rule[] = [
  {
    keywords:
      /\b(?:competitor|competitive|market research|market analysis|market siz|user research|user interview|user studies|survey|interview|research|validate messaging)\b/i,
    gap: {
      requiredCapability: "deep competitor & market research",
      keywords: ["research", "competitors", "analysis", "market"],
      suggestedBudgetCents: 50,
    },
  },
  {
    keywords: /\b(?:content|blog|copy|copywriting|newsletter|social post|thread|launch assets)\b/i,
    gap: {
      requiredCapability: "launch content production",
      keywords: ["content", "writing", "marketing", "social"],
      suggestedBudgetCents: 40,
    },
  },
  {
    keywords: /\b(?:landing page|website|web app|front[- ]end|ui|ux|design)\b/i,
    gap: {
      requiredCapability: "landing page design & build",
      keywords: ["development", "design", "landing-page", "frontend"],
      suggestedBudgetCents: 80,
    },
  },
  {
    keywords: /\b(?:video|demo reel|motion|storyboard)\b/i,
    gap: {
      requiredCapability: "product demo video production",
      keywords: ["design", "video", "demo"],
      suggestedBudgetCents: 70,
    },
  },
  {
    keywords: /\b(?:translation|translate|localiz|localis)\b/i,
    gap: {
      requiredCapability: "translation & localization",
      keywords: ["operations", "translation", "localization"],
      suggestedBudgetCents: 10,
    },
  },
  {
    keywords: /\b(?:onchain|on-chain|smart money|x layer|token analytics)\b/i,
    gap: {
      requiredCapability: "on-chain analytics on X Layer",
      keywords: ["research", "onchain", "xlayer", "analytics"],
      suggestedBudgetCents: 30,
    },
  },
  {
    keywords: /\b(?:campaign|go-to-market|gtm|positioning|growth)\b/i,
    gap: {
      requiredCapability: "go-to-market campaign planning",
      keywords: ["marketing", "growth", "campaigns", "gtm"],
      suggestedBudgetCents: 60,
    },
  },
  {
    keywords: /\b(?:funnel|metrics|analytics|dashboard|reporting)\b/i,
    gap: {
      requiredCapability: "metrics & funnel analysis",
      keywords: ["operations", "analytics", "funnel", "reporting"],
      suggestedBudgetCents: 20,
    },
  },
];

export function detectGap(objective: string): CapabilityGap | null {
  for (const rule of RULES) {
    if (rule.keywords.test(objective)) {
      return {
        description: `Requires ${rule.gap.requiredCapability} — beyond internal agent capabilities.`,
        ...rule.gap,
      };
    }
  }
  return null;
}
