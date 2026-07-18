import { requireSession } from "@/lib/auth";
import { subscribe, type RelayEvent } from "@/lib/events";
import { handleApiError } from "@/lib/api";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

export async function GET(req: Request) {
  try {
    const session = await requireSession();
    const { searchParams } = new URL(req.url);
    const topics = (searchParams.get("topics") ?? "user")
      .split(",")
      .map((t) => t.trim())
      .filter(Boolean);

    const channels = new Set<string>();
    for (const topic of topics) {
      if (topic === "user") channels.add(`user:${session.id}`);
      if (topic === "jobs" && session.role === "DRIVER") {
        channels.add("drivers:jobs");
        channels.add("jobs:refresh");
      }
      if (topic.startsWith("delivery:")) channels.add(topic);
    }

    const stream = new ReadableStream({
      start(controller) {
        const encoder = new TextEncoder();
        const send = (event: string, data: unknown) => {
          controller.enqueue(
            encoder.encode(`event: ${event}\ndata: ${JSON.stringify(data)}\n\n`),
          );
        };

        send("connected", {
          userId: session.id,
          role: session.role,
          channels: [...channels],
        });

        const unsubs = [...channels].map((channel) =>
          subscribe(channel, (payload: RelayEvent) => {
            send("relay", payload);
          }),
        );

        const heartbeat = setInterval(() => {
          controller.enqueue(encoder.encode(`: ping\n\n`));
        }, 15000);

        const close = () => {
          clearInterval(heartbeat);
          unsubs.forEach((u) => u());
          try {
            controller.close();
          } catch {
            /* already closed */
          }
        };

        req.signal.addEventListener("abort", close);
      },
    });

    return new Response(stream, {
      headers: {
        "Content-Type": "text/event-stream",
        "Cache-Control": "no-cache, no-transform",
        Connection: "keep-alive",
      },
    });
  } catch (err) {
    return handleApiError(err);
  }
}
