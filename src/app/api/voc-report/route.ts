import { NextResponse } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { requireTenantContext, requireRole, UnauthorizedError, ForbiddenError } from "@/lib/tenant";
import { generateVocReport } from "@/lib/claude";

const genSchema = z.object({
  title: z.string().min(1).max(150),
  periodStart: z.string().datetime(),
  periodEnd: z.string().datetime(),
});

// GET /api/voc-report — list previously generated reports for this tenant
export async function GET() {
  try {
    const ctx = await requireTenantContext();
    const reports = await prisma.report.findMany({
      where: { tenantId: ctx.tenantId },
      orderBy: { createdAt: "desc" },
    });
    return NextResponse.json({ items: reports });
  } catch (e) {
    if (e instanceof UnauthorizedError) return NextResponse.json({ error: e.message }, { status: 401 });
    return NextResponse.json({ error: "Failed to load reports" }, { status: 500 });
  }
}

// POST /api/voc-report — generate a new Voice-of-Customer report for a
// date range. Restricted to MANAGER+ so viewers can read but not spend
// API budget generating reports.
export async function POST(req: Request) {
  try {
    const ctx = await requireTenantContext();
    requireRole(ctx, "MANAGER");

    const body = await req.json();
    const parsed = genSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json({ error: parsed.error.flatten() }, { status: 400 });
    }
    const { title, periodStart, periodEnd } = parsed.data;

    const rows = await prisma.feedback.findMany({
      where: {
        tenantId: ctx.tenantId,
        createdAt: { gte: new Date(periodStart), lte: new Date(periodEnd) },
      },
      include: { theme: true },
    });

    const content = await generateVocReport(
      `${periodStart.slice(0, 10)} to ${periodEnd.slice(0, 10)}`,
      rows.map((r) => ({ rawText: r.rawText, sentiment: r.sentiment, theme: r.theme?.name ?? null }))
    );

    const report = await prisma.report.create({
      data: {
        tenantId: ctx.tenantId,
        title,
        periodStart: new Date(periodStart),
        periodEnd: new Date(periodEnd),
        content,
      },
    });

    return NextResponse.json({ item: report }, { status: 201 });
  } catch (e) {
    if (e instanceof UnauthorizedError) return NextResponse.json({ error: e.message }, { status: 401 });
    if (e instanceof ForbiddenError) return NextResponse.json({ error: e.message }, { status: 403 });
    console.error(e);
    return NextResponse.json({ error: "Failed to generate report" }, { status: 500 });
  }
}
