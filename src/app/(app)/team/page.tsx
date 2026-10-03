import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import InviteTeammateForm from "@/components/InviteTeammateForm";

const roleStyle: Record<string, string> = {
  ADMIN: "bg-brand-50 text-brand-700 border-brand-200",
  MANAGER: "bg-blue-50 text-blue-700 border-blue-200",
  VIEWER: "bg-gray-50 text-gray-600 border-gray-200",
};

export default async function TeamPage() {
  const session = await getServerSession(authOptions);
  const user = session!.user as any;

  // Server-side RBAC gate — mirrors the API route's requireRole(ctx, "ADMIN").
  // The nav also hides this link from non-admins, but a page must never
  // rely on hidden UI alone: someone could type the URL directly.
  if (user.role !== "ADMIN") {
    return (
      <div className="bg-white border rounded-xl p-8 text-center">
        <h1 className="text-xl font-bold mb-1">Team</h1>
        <p className="text-gray-500 text-sm">
          This page is restricted to Admins. You're signed in as {user.role}.
        </p>
      </div>
    );
  }

  const members = await prisma.user.findMany({
    where: { tenantId: user.tenantId },
    select: { id: true, name: true, email: true, role: true, createdAt: true },
    orderBy: { createdAt: "asc" },
  });

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold">Team</h1>
        <p className="text-gray-500 text-sm">Manage who has access to your workspace and what they can do.</p>
      </div>

      <InviteTeammateForm />

      <div className="bg-white border rounded-xl overflow-hidden">
        <table className="w-full text-sm">
          <thead className="bg-gray-50 text-gray-500 text-left">
            <tr>
              <th className="px-4 py-2 font-medium">Name</th>
              <th className="px-4 py-2 font-medium">Email</th>
              <th className="px-4 py-2 font-medium">Role</th>
              <th className="px-4 py-2 font-medium">Joined</th>
            </tr>
          </thead>
          <tbody>
            {members.map((m) => (
              <tr key={m.id} className="border-t">
                <td className="px-4 py-3 font-medium text-gray-900">{m.name}</td>
                <td className="px-4 py-3 text-gray-600">{m.email}</td>
                <td className="px-4 py-3">
                  <span className={`text-xs px-2 py-1 rounded-full border ${roleStyle[m.role]}`}>{m.role}</span>
                </td>
                <td className="px-4 py-3 text-gray-500">{m.createdAt.toISOString().slice(0, 10)}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
