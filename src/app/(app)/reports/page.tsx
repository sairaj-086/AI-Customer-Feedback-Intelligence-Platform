import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import GenerateReportForm from "@/components/GenerateReportForm";

export default async function ReportsPage() {
  const session = await getServerSession(authOptions);
  const user = session!.user as any;

  const reports = await prisma.report.findMany({
    where: { tenantId: user.tenantId },
    orderBy: { createdAt: "desc" },
  });

  const canGenerate = user.role === "ADMIN" || user.role === "MANAGER";

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold">Voice-of-Customer Reports</h1>
        <p className="text-gray-500 text-sm">
          AI-generated summaries of customer sentiment and themes for a chosen period.
        </p>
      </div>

      <GenerateReportForm canGenerate={canGenerate} />

      <div className="space-y-4">
        {reports.length === 0 && (
          <div className="bg-white border rounded-xl p-8 text-center text-gray-400 text-sm">
            No reports generated yet.
          </div>
        )}
        {reports.map((r) => (
          <details key={r.id} className="bg-white border rounded-xl p-5 group">
            <summary className="cursor-pointer flex items-center justify-between">
              <div>
                <h2 className="font-semibold">{r.title}</h2>
                <p className="text-xs text-gray-500 mt-0.5">
                  {r.periodStart.toISOString().slice(0, 10)} – {r.periodEnd.toISOString().slice(0, 10)} · generated{" "}
                  {r.createdAt.toISOString().slice(0, 10)}
                </p>
              </div>
              <span className="text-gray-400 text-sm group-open:rotate-180 transition">▾</span>
            </summary>
            <div className="mt-4 pt-4 border-t text-sm text-gray-700 whitespace-pre-wrap">{r.content}</div>
          </details>
        ))}
      </div>
    </div>
  );
}
