import { NextResponse } from "next/server";
import bcrypt from "bcryptjs";
import { z } from "zod";
import { prisma } from "@/lib/prisma";

const signupSchema = z.object({
  companyName: z.string().min(2).max(100),
  name: z.string().min(1).max(100),
  email: z.string().email(),
  password: z.string().min(8),
});

/**
 * Public route. Creates a brand-new Tenant plus the first user for it,
 * who becomes ADMIN. Anyone signing up later joins an existing tenant
 * via an invite flow (out of scope for this build) — this route only
 * ever creates NEW tenants, so it can't be used to join someone else's.
 */
export async function POST(req: Request) {
  const body = await req.json();
  const parsed = signupSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.flatten() }, { status: 400 });
  }
  const { companyName, name, email, password } = parsed.data;

  const existing = await prisma.user.findUnique({ where: { email } });
  if (existing) {
    return NextResponse.json({ error: "Email already in use" }, { status: 409 });
  }

  const hashed = await bcrypt.hash(password, 12);

  const tenant = await prisma.tenant.create({
    data: {
      name: companyName,
      users: {
        create: { email, name, password: hashed, role: "ADMIN" },
      },
    },
  });

  return NextResponse.json({ ok: true, tenantId: tenant.id }, { status: 201 });
}
