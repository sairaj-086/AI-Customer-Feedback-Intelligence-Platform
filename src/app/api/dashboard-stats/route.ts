import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireTenantContext, UnauthorizedError } from "@/lib/tenant";

// GET /api/dashboard-stats — aggregate numbers the dashboard charts need.
// Kept as plain groupBy queries (no raw SQL) so it stays easy to read.
export async function GET() {
  try {
    const ctx = await requireTenantContext();

    const [sentimentCounts, themeCounts, totalCount, channelCounts] = await Promise.all([
      prisma.feedback.groupBy({
        by: ["sentiment"],
        where: { tenantId: ctx.tenantId },
        _count: true,
      }),
      prisma.feedback.groupBy({
        by: ["themeId"],
        where: { tenantId: ctx.tenantId, themeId: { not: null } },
        _count: true,
        orderBy: { _count: { themeId: "desc" } },
        take: 8,
      }),
      prisma.feedback.count({ where: { tenantId: ctx.tenantId } }),
      prisma.feedback.groupBy({
        by: ["channel"],
        where: { tenantId: ctx.tenantId },
        _count: true,
      }),
    ]);

    const themeIds = themeCounts.map((t) => t.themeId).filter(Boolean) as string[];
    const themes = await prisma.theme.findMany({ where: { id: { in: themeIds } } });
    const themeNameById = Object.fromEntries(themes.map((t) => [t.id, t.name]));

    // Last 14 days trend, bucketed by day
    const since = new Date();
    since.setDate(since.getDate() - 14);
    const recent = await prisma.feedback.findMany({
      where: { tenantId: ctx.tenantId, createdAt: { gte: since } },
      select: { createdAt: true, sentiment: true },
    });
    const byDay: Record<string, { positive: number; neutral: number; negative: number }> = {};
    for (const r of recent) {
      const day = r.createdAt.toISOString().slice(0, 10);
      byDay[day] ??= { positive: 0, neutral: 0, negative: 0 };
      if (r.sentiment === "POSITIVE") byDay[day].positive++;
      else if (r.sentiment === "NEGATIVE") byDay[day].negative++;
      else byDay[day].neutral++;
    }

    return NextResponse.json({
      total: totalCount,
      bySentiment: sentimentCounts.map((s) => ({ sentiment: s.sentiment ?? "UNCLASSIFIED", count: s._count })),
      byTheme: themeCounts.map((t) => ({
        theme: t.themeId ? themeNameById[t.themeId] ?? "Unknown" : "Unknown",
        count: t._count,
      })),
      byChannel: channelCounts.map((c) => ({ channel: c.channel, count: c._count })),
      trend: Object.entries(byDay)
        .sort(([a], [b]) => a.localeCompare(b))
        .map(([day, v]) => ({ day, ...v })),
    });
  } catch (e) {
    if (e instanceof UnauthorizedError) return NextResponse.json({ error: e.message }, { status: 401 });
    console.error(e);
    return NextResponse.json({ error: "Failed to load stats" }, { status: 500 });
  }
}
