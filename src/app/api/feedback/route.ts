import { NextResponse } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { requireTenantContext, UnauthorizedError } from "@/lib/tenant";
import { classifyFeedback } from "@/lib/claude";

const createSchema = z.object({
  channel: z.enum(["EMAIL", "SURVEY", "APP_REVIEW", "SUPPORT_TICKET", "SOCIAL", "OTHER"]),
  customerName: z.string().max(100).optional(),
  rawText: z.string().min(1).max(5000),
});

// GET /api/feedback?channel=&sentiment=&page=
export async function GET(req: Request) {
  try {
    const ctx = await requireTenantContext();
    const { searchParams } = new URL(req.url);
    const channel = searchParams.get("channel") ?? undefined;
    const sentiment = searchParams.get("sentiment") ?? undefined;
    const page = Number(searchParams.get("page") ?? "1");
    const pageSize = 25;

    const items = await prisma.feedback.findMany({
      where: {
        tenantId: ctx.tenantId, // <-- tenant scoping happens here, always
        ...(channel ? { channel: channel as any } : {}),
        ...(sentiment ? { sentiment: sentiment as any } : {}),
      },
      include: { theme: true },
      orderBy: { createdAt: "desc" },
      skip: (page - 1) * pageSize,
      take: pageSize,
    });

    const total = await prisma.feedback.count({ where: { tenantId: ctx.tenantId } });

    return NextResponse.json({ items, total, page, pageSize });
  } catch (e) {
    if (e instanceof UnauthorizedError) return NextResponse.json({ error: e.message }, { status: 401 });
    console.error(e);
    return NextResponse.json({ error: "Failed to load feedback" }, { status: 500 });
  }
}

// POST /api/feedback — ingest one item (from a form, CSV row, or future
// channel integration) and classify it immediately.
export async function POST(req: Request) {
  try {
    const ctx = await requireTenantContext();
    const body = await req.json();
    const parsed = createSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json({ error: parsed.error.flatten() }, { status: 400 });
    }
    const { channel, customerName, rawText } = parsed.data;

    const classification = await classifyFeedback(rawText);

    const theme = await prisma.theme.upsert({
      where: { tenantId_name: { tenantId: ctx.tenantId, name: classification.theme } },
      create: { tenantId: ctx.tenantId, name: classification.theme },
      update: {},
    });

    const feedback = await prisma.feedback.create({
      data: {
        tenantId: ctx.tenantId,
        channel,
        customerName,
        rawText,
        sentiment: classification.sentiment,
        summary: classification.summary,
        themeId: theme.id,
        classifiedAt: new Date(),
      },
      include: { theme: true },
    });

    return NextResponse.json({ item: feedback }, { status: 201 });
  } catch (e) {
    if (e instanceof UnauthorizedError) return NextResponse.json({ error: e.message }, { status: 401 });
    console.error(e);
    return NextResponse.json({ error: "Failed to submit feedback" }, { status: 500 });
  }
}
