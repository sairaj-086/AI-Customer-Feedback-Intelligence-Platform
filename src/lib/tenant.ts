import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { Role } from "@prisma/client";

export class UnauthorizedError extends Error {
  constructor(msg = "Not authenticated") {
    super(msg);
    this.name = "UnauthorizedError";
  }
}

export class ForbiddenError extends Error {
  constructor(msg = "Not permitted") {
    super(msg);
    this.name = "ForbiddenError";
  }
}

export interface RequestContext {
  userId: string;
  tenantId: string;
  role: Role;
}

/**
 * Every API route that touches tenant data calls this first.
 * It is the ONLY place tenantId should ever come from — never from
 * request.body.tenantId or a query param. That's what makes this a
 * multi-tenant app instead of a data leak waiting to happen.
 */
export async function requireTenantContext(): Promise<RequestContext> {
  const session = await getServerSession(authOptions);
  if (!session?.user) throw new UnauthorizedError();

  const user = session.user as any;
  return { userId: user.id, tenantId: user.tenantId, role: user.role };
}

const roleRank: Record<Role, number> = {
  VIEWER: 0,
  MANAGER: 1,
  ADMIN: 2,
};

/** Throws if the current user's role is below the minimum required role. */
export function requireRole(ctx: RequestContext, minRole: Role) {
  if (roleRank[ctx.role] < roleRank[minRole]) {
    throw new ForbiddenError(`Requires ${minRole} role or higher`);
  }
}
