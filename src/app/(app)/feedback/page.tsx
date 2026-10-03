import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import FeedbackForm from "@/components/FeedbackForm";

const sentimentStyle: Record<string, string> = {
  POSITIVE: "bg-green-50 text-green-700 border-green-200",
  NEUTRAL: "bg-gray-50 text-gray-600 border-gray-200",
  NEGATIVE: "bg-red-50 text-red-700 border-red-200",
};

export default async function FeedbackPage({
  searchParams,
}: {
  searchParams: { channel?: string; sentiment?: string; page?: string };
}) {
  const session = await getServerSession(authOptions);
  const tenantId = (session!.user as any).tenantId;

  const page = Number(searchParams.page ?? "1");
  const pageSize = 25;

  const where = {
    tenantId,
    ...(searchParams.channel ? { channel: searchParams.channel as any } : {}),
    ...(searchParams.sentiment ? { sentiment: searchParams.sentiment as any } : {}),
  };

  const [items, total] = await Promise.all([
    prisma.feedback.findMany({
      where,
      include: { theme: true },
      orderBy: { createdAt: "desc" },
      skip: (page - 1) * pageSize,
      take: pageSize,
    }),
    prisma.feedback.count({ where }),
  ]);

  const channels = ["EMAIL", "SURVEY", "APP_REVIEW", "SUPPORT_TICKET", "SOCIAL", "OTHER"];
  const sentiments = ["POSITIVE", "NEUTRAL", "NEGATIVE"];
  const totalPages = Math.max(1, Math.ceil(total / pageSize));

  function withParam(key: string, value: string | null) {
    const params = new URLSearchParams();
    if (searchParams.channel) params.set("channel", searchParams.channel);
    if (searchParams.sentiment) params.set("sentiment", searchParams.sentiment);
    if (value) params.set(key, value);
    else params.delete(key);
    params.delete("page");
    const qs = params.toString();
    return `/feedback${qs ? `?${qs}` : ""}`;
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold">Feedback</h1>
        <p className="text-gray-500 text-sm">
          All customer feedback collected across channels, automatically classified by AI.
        </p>
      </div>

      <FeedbackForm />

      <div className="bg-white border rounded-xl overflow-hidden">
        <div className="p-4 border-b flex flex-wrap gap-2 items-center">
          <span className="text-sm text-gray-500 mr-1">Filter:</span>
          <a
            href={withParam("channel", null)}
            className={`text-xs px-3 py-1.5 rounded-full border ${
              !searchParams.channel ? "bg-brand-50 border-brand-200 text-brand-700" : "border-gray-200 text-gray-600"
            }`}
          >
            All channels
          </a>
          {channels.map((c) => (
            <a
              key={c}
              href={withParam("channel", c)}
              className={`text-xs px-3 py-1.5 rounded-full border ${
                searchParams.channel === c
                  ? "bg-brand-50 border-brand-200 text-brand-700"
                  : "border-gray-200 text-gray-600"
              }`}
            >
              {c.replace("_", " ")}
            </a>
          ))}
          <span className="w-px h-4 bg-gray-200 mx-1" />
          {sentiments.map((s) => (
            <a
              key={s}
              href={withParam("sentiment", searchParams.sentiment === s ? null : s)}
              className={`text-xs px-3 py-1.5 rounded-full border ${
                searchParams.sentiment === s
                  ? "bg-brand-50 border-brand-200 text-brand-700"
                  : "border-gray-200 text-gray-600"
              }`}
            >
              {s}
            </a>
          ))}
        </div>

        <table className="w-full text-sm">
          <thead className="bg-gray-50 text-gray-500 text-left">
            <tr>
              <th className="px-4 py-2 font-medium">Feedback</th>
              <th className="px-4 py-2 font-medium">Channel</th>
              <th className="px-4 py-2 font-medium">Theme</th>
              <th className="px-4 py-2 font-medium">Sentiment</th>
              <th className="px-4 py-2 font-medium">Date</th>
            </tr>
          </thead>
          <tbody>
            {items.map((item) => (
              <tr key={item.id} className="border-t">
                <td className="px-4 py-3 max-w-md">
                  <p className="text-gray-900">{item.rawText}</p>
                  {item.customerName && <p className="text-xs text-gray-400 mt-0.5">— {item.customerName}</p>}
                </td>
                <td className="px-4 py-3 text-gray-600">{item.channel.replace("_", " ")}</td>
                <td className="px-4 py-3 text-gray-600">{item.theme?.name ?? "—"}</td>
                <td className="px-4 py-3">
                  {item.sentiment ? (
                    <span
                      className={`text-xs px-2 py-1 rounded-full border ${sentimentStyle[item.sentiment]}`}
                    >
                      {item.sentiment}
                    </span>
                  ) : (
                    <span className="text-xs text-gray-400">unclassified</span>
                  )}
                </td>
                <td className="px-4 py-3 text-gray-500 whitespace-nowrap">
                  {item.createdAt.toISOString().slice(0, 10)}
                </td>
              </tr>
            ))}
            {items.length === 0 && (
              <tr>
                <td colSpan={5} className="px-4 py-10 text-center text-gray-400">
                  No feedback yet — add some above to see it classified here.
                </td>
              </tr>
            )}
          </tbody>
        </table>

        {totalPages > 1 && (
          <div className="p-4 border-t flex items-center justify-between text-sm text-gray-500">
            <span>
              Page {page} of {totalPages} · {total} total
            </span>
            <div className="flex gap-2">
              {page > 1 && (
                <a
                  href={`/feedback?${new URLSearchParams({
                    ...(searchParams.channel ? { channel: searchParams.channel } : {}),
                    ...(searchParams.sentiment ? { sentiment: searchParams.sentiment } : {}),
                    page: String(page - 1),
                  }).toString()}`}
                  className="px-3 py-1.5 border rounded-lg hover:bg-gray-50"
                >
                  Previous
                </a>
              )}
              {page < totalPages && (
                <a
                  href={`/feedback?${new URLSearchParams({
                    ...(searchParams.channel ? { channel: searchParams.channel } : {}),
                    ...(searchParams.sentiment ? { sentiment: searchParams.sentiment } : {}),
                    page: String(page + 1),
                  }).toString()}`}
                  className="px-3 py-1.5 border rounded-lg hover:bg-gray-50"
                >
                  Next
                </a>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
