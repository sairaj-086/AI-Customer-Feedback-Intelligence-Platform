import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import SentimentTrendChart from "@/components/SentimentTrendChart";
import ThemeBarChart from "@/components/ThemeBarChart";
import AskLoop from "@/components/AskLoop";

async function getStats(tenantId: string) {
  const [total, sentimentCounts] = await Promise.all([
    prisma.feedback.count({ where: { tenantId } }),
    prisma.feedback.groupBy({ by: ["sentiment"], where: { tenantId }, _count: true }),
  ]);

  const themeCounts = await prisma.feedback.groupBy({
    by: ["themeId"],
    where: { tenantId, themeId: { not: null } },
    _count: true,
    orderBy: { _count: { themeId: "desc" } },
    take: 8,
  });
  const themes = await prisma.theme.findMany({
    where: { id: { in: themeCounts.map((t) => t.themeId!).filter(Boolean) } },
  });
  const themeNameById = Object.fromEntries(themes.map((t) => [t.id, t.name]));

  const since = new Date();
  since.setDate(since.getDate() - 14);
  const recent = await prisma.feedback.findMany({
    where: { tenantId, createdAt: { gte: since } },
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

  return {
    total,
    positive: sentimentCounts.find((s) => s.sentiment === "POSITIVE")?._count ?? 0,
    neutral: sentimentCounts.find((s) => s.sentiment === "NEUTRAL")?._count ?? 0,
    negative: sentimentCounts.find((s) => s.sentiment === "NEGATIVE")?._count ?? 0,
    byTheme: themeCounts.map((t) => ({ theme: themeNameById[t.themeId!] ?? "Unknown", count: t._count })),
    trend: Object.entries(byDay)
      .sort(([a], [b]) => a.localeCompare(b))
      .map(([day, v]) => ({ day, ...v })),
  };
}

export default async function DashboardPage() {
  const session = await getServerSession(authOptions);
  const tenantId = (session!.user as any).tenantId;
  const stats = await getStats(tenantId);

  const cards = [
    { label: "Total feedback", value: stats.total, color: "text-gray-900" },
    { label: "Positive", value: stats.positive, color: "text-green-600" },
    { label: "Neutral", value: stats.neutral, color: "text-gray-500" },
    { label: "Negative", value: stats.negative, color: "text-red-600" },
  ];

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold">Dashboard</h1>
        <p className="text-gray-500 text-sm">Live view of your customer feedback intelligence</p>
      </div>

      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {cards.map((c) => (
          <div key={c.label} className="bg-white border rounded-xl p-5">
            <p className="text-sm text-gray-500">{c.label}</p>
            <p className={`text-3xl font-bold mt-1 ${c.color}`}>{c.value}</p>
          </div>
        ))}
      </div>

      <div className="grid md:grid-cols-2 gap-6">
        <div className="bg-white border rounded-xl p-5">
          <h2 className="font-semibold mb-2">Sentiment trend (14 days)</h2>
          <SentimentTrendChart data={stats.trend} />
        </div>
        <div className="bg-white border rounded-xl p-5">
          <h2 className="font-semibold mb-2">Top themes</h2>
          <ThemeBarChart data={stats.byTheme} />
        </div>
      </div>

      <AskLoop />
    </div>
  );
}
