import { NextRequest } from "next/server";
import { db } from "@/lib/db";
import { taskEvents } from "@/lib/db/schema";
import { eq, desc } from "drizzle-orm";
import { subscribe } from "@/lib/events/bus";
import { bootstrap } from "../../../bootstrap";

export const dynamic = "force-dynamic";

// GET /api/companies/:id/events (spec §15) — SSE live stream, replaying
// recent history first so the UI hydrates from real state.
export async function GET(req: NextRequest, ctx: { params: Promise<{ id: string }> }) {
  await bootstrap();
  const { id } = await ctx.params;
  const encoder = new TextEncoder();

  const stream = new ReadableStream({
    start(controller) {
      const send = (data: unknown) => {
        try {
          controller.enqueue(encoder.encode(`data: ${JSON.stringify(data)}\n\n`));
        } catch {
          // client gone
        }
      };

      // Hydrate: recent history.
      const history = db
        .select()
        .from(taskEvents)
        .where(eq(taskEvents.companyId, id))
        .orderBy(desc(taskEvents.createdAt))
        .limit(60)
        .all()
        .reverse();
      send({ kind: "history", events: history });

      // Live events.
      const unsub = subscribe((e) => {
        if (e.companyId === id) send({ kind: "live", event: e });
      });

      // Heartbeat keeps intermediaries from closing the stream.
      const hb = setInterval(() => {
        try {
          controller.enqueue(encoder.encode(`: hb\n\n`));
        } catch {
          /* noop */
        }
      }, 15_000);

      req.signal.addEventListener("abort", () => {
        clearInterval(hb);
        unsub();
        try {
          controller.close();
        } catch {
          /* noop */
        }
      });
    },
  });

  return new Response(stream, {
    headers: {
      "Content-Type": "text/event-stream",
      "Cache-Control": "no-cache, no-transform",
      Connection: "keep-alive",
    },
  });
}
