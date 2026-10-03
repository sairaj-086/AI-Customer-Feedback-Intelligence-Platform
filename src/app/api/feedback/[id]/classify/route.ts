import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireTenantContext, UnauthorizedError } from "@/lib/tenant";
import { classifyFeedback } from "@/lib/claude";

// POST /api/feedback/:id/classify — (re)classify one item. Useful for
// bulk-imported rows or re-running classification after a prompt tweak.
export async function POST(_req: Request, { params }: { params: { id: string } }) {
  try {
    const ctx = await requireTenantContext();

    const existing = await prisma.feedback.findFirst({
      where: { id: params.id, tenantId: ctx.tenantId }, // tenant-scoped lookup
    });
    if (!existing) return NextResponse.json({ error: "Not found" }, { status: 404 });

    const classification = await classifyFeedback(existing.rawText);

    const theme = await prisma.theme.upsert({
      where: { tenantId_name: { tenantId: ctx.tenantId, name: classification.theme } },
      create: { tenantId: ctx.tenantId, name: classification.theme },
      update: {},
    });

    const updated = await prisma.feedback.update({
      where: { id: existing.id },
      data: {
        sentiment: classification.sentiment,
        summary: classification.summary,
        themeId: theme.id,
        classifiedAt: new Date(),
      },
      include: { theme: true },
    });

    return NextResponse.json({ item: updated });
  } catch (e) {
    if (e instanceof UnauthorizedError) return NextResponse.json({ error: e.message }, { status: 401 });
    console.error(e);
    return NextResponse.json({ error: "Failed to classify" }, { status: 500 });
  }
}
