"use client";

import { useEffect, useMemo, useState } from "react";
import { Card, Badge, EmptyState } from "@/components/ui";
import { Hero, PixelScenery } from "@/components/AppShell";

// Company Memory (spec §8/§11): overview stats, folders, search, detail
// with source agent/task provenance, confidence and verification status.

interface MemoryRow {
  id: string;
  type: string;
  folder: string;
  title: string;
  content: string;
  sourceAgentName: string | null;
  sourceTaskId: string | null;
  externalProviderId: string | null;
  confidence: number;
  verificationStatus: string;
  tags: string;
  createdAt: string;
}

const FOLDERS = ["all", "research", "marketing", "product", "operations", "decisions"];
const TYPE_ICON: Record<string, string> = {
  RESEARCH: "🔬",
  INSIGHT: "💡",
  DECISION: "📌",
  LEARNING: "🧠",
  DOCUMENT: "📄",
};

export default function MemoryPage() {
  const [items, setItems] = useState<MemoryRow[]>([]);
  const [folder, setFolder] = useState("all");
  const [q, setQ] = useState("");
  const [sel, setSel] = useState<MemoryRow | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch("/api/memory")
      .then((r) => r.json())
      .then((d) => {
        setItems(d.items ?? []);
        setSel((d.items ?? [])[0] ?? null);
      })
      .finally(() => setLoading(false));
  }, []);

  const filtered = useMemo(() => {
    let rows = folder === "all" ? items : items.filter((i) => i.folder === folder);
    if (q.trim()) {
      const n = q.toLowerCase();
      rows = rows.filter((r) => r.title.toLowerCase().includes(n) || r.content.toLowerCase().includes(n));
    }
    return rows;
  }, [items, folder, q]);

  return (
    <div>
      <Hero
        title="Company Memory"
        subtitle="All learnings, context and knowledge in one place"
        art={<PixelScenery variant="lake" />}
      />
      <div className="p-6">
        {/* Stats */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-5">
          {[
            { icon: "🧠", v: items.length, l: "Memories" },
            { icon: "🔬", v: items.filter((i) => i.type === "RESEARCH").length, l: "Research" },
            { icon: "💡", v: items.filter((i) => i.type === "INSIGHT" || i.type === "LEARNING").length, l: "Insights" },
            { icon: "✔️", v: items.filter((i) => i.verificationStatus === "VERIFIED").length, l: "Verified" },
          ].map((s) => (
            <Card key={s.l} className="p-3 flex items-center gap-3">
              <span className="text-xl" aria-hidden>{s.icon}</span>
              <div>
                <div className="font-pixel text-sm">{s.v}</div>
                <div className="pixel-label text-ink-soft mt-0.5">{s.l}</div>
              </div>
            </Card>
          ))}
        </div>

        <div className="flex items-center gap-2 mb-5 flex-wrap">
          {FOLDERS.map((f) => (
            <button
              key={f}
              onClick={() => setFolder(f)}
              className={`pixel-btn !text-[9px] !py-2 !px-3 capitalize ${folder === f ? "pixel-btn-primary" : "pixel-btn-ghost"}`}
            >
              {f === "all" ? "All folders" : f}
            </button>
          ))}
          <input
            value={q}
            onChange={(e) => setQ(e.target.value)}
            placeholder="Search memory…"
            className="ml-auto border-2 border-[#143329] bg-cream rounded-sm px-3 py-2 text-sm focus:outline-none focus:border-leaf min-w-[180px]"
          />
        </div>

        <div className="grid xl:grid-cols-[1.4fr_1fr] gap-5 items-start">
          <div className="space-y-3 min-w-0">
            {loading ? (
              <div className="text-ink-soft text-sm">Loading memory…</div>
            ) : filtered.length === 0 ? (
              <EmptyState icon="🧠" title="No memories found" hint="Agents write verified insights here automatically." />
            ) : (
              filtered.map((m) => (
                <button key={m.id} className="block w-full text-left" onClick={() => setSel(m)}>
                  <Card className={`p-3.5 transition-shadow hover:shadow-pixel ${sel?.id === m.id ? "ring-2 ring-leaf" : ""}`}>
                    <div className="flex items-start gap-3">
                      <span className="text-lg" aria-hidden>{TYPE_ICON[m.type] ?? "📄"}</span>
                      <div className="min-w-0 flex-1">
                        <div className="text-sm font-medium">{m.title}</div>
                        <div className="text-xs text-ink-soft mt-0.5 line-clamp-2">{m.content}</div>
                      </div>
                      <div className="flex flex-col items-end gap-1.5 shrink-0">
                        <Badge color="muted">{m.folder}</Badge>
                        <Badge color={m.verificationStatus === "VERIFIED" ? "leaf" : "gold"}>
                          {m.verificationStatus.toLowerCase()}
                        </Badge>
                      </div>
                    </div>
                  </Card>
                </button>
              ))
            )}
          </div>

          {sel ? (
            <Card className="p-4 xl:sticky xl:top-4">
              <div className="flex items-center gap-2 mb-2 flex-wrap">
                <span className="text-lg" aria-hidden>{TYPE_ICON[sel.type] ?? "📄"}</span>
                <Badge color="teal">{sel.type.toLowerCase()}</Badge>
                {sel.externalProviderId ? <Badge color="gold">external source</Badge> : null}
              </div>
              <div className="font-semibold text-sm mb-2">{sel.title}</div>
              <p className="text-sm leading-relaxed whitespace-pre-line text-ink">{sel.content}</p>
              <div className="pixel-rule my-3" />
              <div className="space-y-1.5 text-xs text-ink-soft">
                <div>Source agent: {sel.sourceAgentName ?? "—"}</div>
                <div>Source task: {sel.sourceTaskId ?? "—"}</div>
                <div>Confidence: {sel.confidence}/100 · {sel.verificationStatus.toLowerCase()}</div>
                <div>Stored: {new Date(sel.createdAt).toLocaleString()}</div>
                <div className="flex gap-1.5 flex-wrap pt-1">
                  {(JSON.parse(sel.tags || "[]") as string[]).map((t) => (
                    <Badge key={t} color="muted">#{t}</Badge>
                  ))}
                </div>
              </div>
              {sel.externalProviderId ? (
                <p className="text-[10px] text-ink-soft mt-3">
                  External-agent output — stored as untrusted input, promoted to trusted memory only after verification (spec §11).
                </p>
              ) : null}
            </Card>
          ) : null}
        </div>
      </div>
    </div>
  );
}
