// DEMO catalog of ASP (Agent Service Provider) services. Mirrors the shape
// of OKX.AI marketplace services (A2A / A2MCP) per official docs. Every
// record is flagged isDemo and the UI must label it "simulated".

import type { ProviderOffer } from "@/lib/types";

interface DemoService {
  providerId: string;
  providerName: string;
  serviceId: string;
  serviceType: "A2A" | "A2MCP";
  category: string;
  tagline: string;
  priceCents: number;
  priceUnit: "task" | "call";
  reputation: number;
  completedTasks: number;
  successRate: number;
  capabilities: string[];
}

export const DEMO_SERVICES: DemoService[] = [
  {
    providerId: "prov_market-intel",
    providerName: "MarketMind Labs",
    serviceId: "svc_competitor-research",
    serviceType: "A2A",
    category: "Research",
    tagline: "In-depth market & competitor research with cited sources",
    priceCents: 50,
    priceUnit: "task",
    reputation: 47,
    completedTasks: 1284,
    successRate: 99,
    capabilities: ["research", "analysis", "competitors", "market-sizing", "citations"],
  },
  {
    providerId: "prov_xlayer-analytics",
    providerName: "XLayer Analytics",
    serviceId: "svc_onchain-intel",
    serviceType: "A2MCP",
    category: "Research",
    tagline: "On-chain intelligence: smart money, flows and token stats on X Layer",
    priceCents: 30,
    priceUnit: "call",
    reputation: 44,
    completedTasks: 731,
    successRate: 97,
    capabilities: ["research", "onchain", "xlayer", "analytics"],
  },
  {
    providerId: "prov_content-forge",
    providerName: "ContentForge",
    serviceId: "svc_launch-content",
    serviceType: "A2A",
    category: "Content",
    tagline: "Launch-ready blog posts, threads and newsletters in your brand voice",
    priceCents: 40,
    priceUnit: "task",
    reputation: 47,
    completedTasks: 7154,
    successRate: 98,
    capabilities: ["content", "writing", "marketing", "social", "seo"],
  },
  {
    providerId: "prov_growth-engine",
    providerName: "GrowthEngine Co",
    serviceId: "svc_gtm-campaign",
    serviceType: "A2A",
    category: "Marketing",
    tagline: "Go-to-market campaigns: positioning, channels and weekly experiment plans",
    priceCents: 60,
    priceUnit: "task",
    reputation: 48,
    completedTasks: 920,
    successRate: 96,
    capabilities: ["marketing", "growth", "positioning", "campaigns", "gtm"],
  },
  {
    providerId: "prov_pixel-ui",
    providerName: "PixelForge UI",
    serviceId: "svc_landing-page",
    serviceType: "A2A",
    category: "Development",
    tagline: "Landing page design + production-ready code from a brief",
    priceCents: 80,
    priceUnit: "task",
    reputation: 49,
    completedTasks: 412,
    successRate: 97,
    capabilities: ["development", "design", "landing-page", "frontend", "ui"],
  },
  {
    providerId: "prov_analyst",
    providerName: "DataSignal",
    serviceId: "svc_funnel-analysis",
    serviceType: "A2MCP",
    category: "Operations",
    tagline: "Funnel & metrics analysis API — feed event data, get insights",
    priceCents: 20,
    priceUnit: "call",
    reputation: 45,
    completedTasks: 2310,
    successRate: 99,
    capabilities: ["operations", "analytics", "metrics", "funnel", "reporting"],
  },
  {
    providerId: "prov_voice-craft",
    providerName: "VoiceCraft Studio",
    serviceId: "svc_product-demo-video",
    serviceType: "A2A",
    category: "Design",
    tagline: "Short product demo videos with script, storyboard and render",
    priceCents: 70,
    priceUnit: "task",
    reputation: 46,
    completedTasks: 388,
    successRate: 95,
    capabilities: ["design", "video", "demo", "storyboard"],
  },
  {
    providerId: "prov_translator",
    providerName: "Polyglot Agents",
    serviceId: "svc_translation",
    serviceType: "A2MCP",
    category: "Operations",
    tagline: "High-quality translation across 40 languages, per-call pricing",
    priceCents: 10,
    priceUnit: "call",
    reputation: 43,
    completedTasks: 5602,
    successRate: 98,
    capabilities: ["operations", "translation", "localization"],
  },
];

export function demoOffers(q: { keywords: string[]; maxPriceCents?: number }): ProviderOffer[] {
  const kw = q.keywords.map((k) => k.toLowerCase());
  const offers = DEMO_SERVICES.map((s) => {
    const capHits = s.capabilities.filter((c) => kw.some((k) => c.includes(k) || k.includes(c)));
    const nameHit = kw.some((k) => s.tagline.toLowerCase().includes(k));
    const matchPoints = capHits.length * 30 + (nameHit ? 20 : 0);
    const taskFit = Math.min(98, 25 + matchPoints);
    const reasons: string[] = [];
    if (capHits.length) reasons.push(`capability match: ${capHits.slice(0, 3).join(", ")}`);
    if (nameHit) reasons.push("service description matches intent");
    reasons.push(`reputation ${(s.reputation / 10).toFixed(1)}★ across ${s.completedTasks.toLocaleString()} tasks`);
    reasons.push(`${s.successRate}% delivery success rate`);
    if (s.serviceType === "A2MCP") reasons.push("A2MCP: instant settlement per call");
    else reasons.push("A2A: escrow-protected delivery");
    return {
      providerId: s.providerId,
      providerName: s.providerName,
      serviceId: s.serviceId,
      serviceType: s.serviceType,
      category: s.category,
      tagline: s.tagline,
      priceCents: s.priceCents,
      priceUnit: s.priceUnit,
      reputation: s.reputation,
      completedTasks: s.completedTasks,
      successRate: s.successRate,
      capabilities: s.capabilities,
      isDemo: true,
      taskFit,
      reasons,
    } satisfies ProviderOffer;
  });
  const filtered = q.maxPriceCents ? offers.filter((o) => o.priceCents <= q.maxPriceCents!) : offers;
  return filtered.sort((a, b) => b.taskFit - a.taskFit || b.reputation - a.reputation);
}
