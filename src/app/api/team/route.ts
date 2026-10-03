import { NextResponse } from "next/server";
import bcrypt from "bcryptjs";
import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { requireTenantContext, requireRole, UnauthorizedError, ForbiddenError } from "@/lib/tenant";

const inviteSchema = z.object({
  name: z.string().min(1).max(100),
  email: z.string().email(),
  password: z.string().min(8),
  role: z.enum(["ADMIN", "MANAGER", "VIEWER"]),
});

// GET /api/team — list this tenant's users (any authenticated member)
export async function GET() {
  try {
    const ctx = await requireTenantContext();
    const users = await prisma.user.findMany({
      where: { tenantId: ctx.tenantId },
      select: { id: true, name: true, email: true, role: true, createdAt: true },
      orderBy: { createdAt: "asc" },
    });
    return NextResponse.json({ items: users });
  } catch (e) {
    if (e instanceof UnauthorizedError) return NextResponse.json({ error: e.message }, { status: 401 });
    return NextResponse.json({ error: "Failed to load team" }, { status: 500 });
  }
}

// POST /api/team — add a teammate to THIS tenant. ADMIN only — this is
// the clearest example of role-based access control in the app.
export async function POST(req: Request) {
  try {
    const ctx = await requireTenantContext();
    requireRole(ctx, "ADMIN");

    const body = await req.json();
    const parsed = inviteSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json({ error: parsed.error.flatten() }, { status: 400 });
    }
    const { name, email, password, role } = parsed.data;

    const existing = await prisma.user.findUnique({ where: { email } });
    if (existing) return NextResponse.json({ error: "Email already in use" }, { status: 409 });

    const hashed = await bcrypt.hash(password, 12);
    const user = await prisma.user.create({
      data: { name, email, password: hashed, role, tenantId: ctx.tenantId },
      select: { id: true, name: true, email: true, role: true },
    });

    return NextResponse.json({ item: user }, { status: 201 });
  } catch (e) {
    if (e instanceof UnauthorizedError) return NextResponse.json({ error: e.message }, { status: 401 });
    if (e instanceof ForbiddenError) return NextResponse.json({ error: e.message }, { status: 403 });
    console.error(e);
    return NextResponse.json({ error: "Failed to add teammate" }, { status: 500 });
  }
}
