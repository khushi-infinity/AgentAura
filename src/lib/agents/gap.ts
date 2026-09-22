import type { CapabilityGap } from "@/lib/types";

// Capability-gap detection (spec §10). Heuristics first — the LLM can
// refine the wording, but the loop must work deterministically.

interface Rule {
  keywords: RegExp;
  gap: Omit<CapabilityGap, "description">;
}

const RULES: Rule[] = [
  {
    keywords: /competitor|market research|market analysis|market siz|competitive/i,
    gap: {
      requiredCapability: "deep competitor & market research",
      keywords: ["research", "competitors", "analysis", "market"],
      suggestedBudgetCents: 50,
    },
  },
  {
    keywords: /content|blog|copy|newsletter|social post|thread/i,
    gap: {
      requiredCapability: "launch content production",
      keywords: ["content", "writing", "marketing", "social"],
      suggestedBudgetCents: 40,
    },
  },
  {
    keywords: /landing page|website|frontend|ui|design/i,
    gap: {
      requiredCapability: "landing page design & build",
      keywords: ["development", "design", "landing-page", "frontend"],
      suggestedBudgetCents: 80,
    },
  },
  {
    keywords: /video|demo reel|motion/i,
    gap: {
      requiredCapability: "product demo video production",
      keywords: ["design", "video", "demo"],
      suggestedBudgetCents: 70,
    },
  },
  {
    keywords: /translation|localiz|localis/i,
    gap: {
      requiredCapability: "translation & localization",
      keywords: ["operations", "translation", "localization"],
      suggestedBudgetCents: 10,
    },
  },
  {
    keywords: /onchain|on-chain|smart money|x layer|token analytics/i,
    gap: {
      requiredCapability: "on-chain analytics on X Layer",
      keywords: ["research", "onchain", "xlayer", "analytics"],
      suggestedBudgetCents: 30,
    },
  },
  {
    keywords: /campaign|go-to-market|gtm|positioning|growth/i,
    gap: {
      requiredCapability: "go-to-market campaign planning",
      keywords: ["marketing", "growth", "campaigns", "gtm"],
      suggestedBudgetCents: 60,
    },
  },
  {
    keywords: /funnel|metrics|analytics dashboard|reporting/i,
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
