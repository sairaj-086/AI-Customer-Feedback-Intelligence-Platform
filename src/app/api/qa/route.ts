import { NextResponse } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { requireTenantContext, UnauthorizedError } from "@/lib/tenant";
import { answerQuestion } from "@/lib/claude";

const qaSchema = z.object({ question: z.string().min(3).max(500) });

// POST /api/qa — "ask a question about your feedback" chat feature.
// RAG-lite: pull the most recent N tenant-scoped rows as context rather
// than a full vector search, which is plenty for a demo-scale dataset.
export async function POST(req: Request) {
  try {
    const ctx = await requireTenantContext();
    const body = await req.json();
    const parsed = qaSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json({ error: parsed.error.flatten() }, { status: 400 });
    }

    const rows = await prisma.feedback.findMany({
      where: { tenantId: ctx.tenantId },
      include: { theme: true },
      orderBy: { createdAt: "desc" },
      take: 100,
    });

    if (rows.length === 0) {
      return NextResponse.json({
        answer: "There's no feedback in your workspace yet — add some first so I have something to analyze.",
      });
    }

    const contextRows = rows.map(
      (r) => `(${r.channel}, ${r.sentiment ?? "unclassified"}, theme: ${r.theme?.name ?? "n/a"}) ${r.rawText}`
    );

    const answer = await answerQuestion(parsed.data.question, contextRows);
    return NextResponse.json({ answer });
  } catch (e) {
    if (e instanceof UnauthorizedError) return NextResponse.json({ error: e.message }, { status: 401 });
    console.error(e);
    return NextResponse.json({ error: "Failed to answer question" }, { status: 500 });
  }
}
