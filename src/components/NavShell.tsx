"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { signOut } from "next-auth/react";

const links = [
  { href: "/dashboard", label: "Dashboard" },
  { href: "/feedback", label: "Feedback" },
  { href: "/reports", label: "VoC Reports" },
  { href: "/team", label: "Team", minRole: "ADMIN" },
];

export default function NavShell({
  name,
  role,
  children,
}: {
  name: string;
  role: string;
  children: React.ReactNode;
}) {
  const pathname = usePathname();

  return (
    <div className="min-h-screen flex">
      <aside className="w-60 shrink-0 border-r bg-white flex flex-col">
        <div className="px-5 py-5 border-b">
          <span className="font-bold text-brand-600">LOOP</span>
        </div>
        <nav className="flex-1 px-3 py-4 space-y-1">
          {links
            .filter((l) => !l.minRole || role === l.minRole)
            .map((l) => (
              <Link
                key={l.href}
                href={l.href}
                className={`block px-3 py-2 rounded-lg text-sm font-medium transition ${
                  pathname === l.href
                    ? "bg-brand-50 text-brand-700"
                    : "text-gray-600 hover:bg-gray-100"
                }`}
              >
                {l.label}
              </Link>
            ))}
        </nav>
        <div className="px-4 py-4 border-t">
          <p className="text-sm font-medium">{name}</p>
          <p className="text-xs text-gray-500 mb-3">{role}</p>
          <button
            onClick={() => signOut({ callbackUrl: "/" })}
            className="text-sm text-gray-500 hover:text-gray-800"
          >
            Log out
          </button>
        </div>
      </aside>
      <main className="flex-1 p-8 overflow-y-auto">{children}</main>
    </div>
  );
}
