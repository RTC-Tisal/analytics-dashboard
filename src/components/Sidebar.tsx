"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

// The four sections of the dashboard, in build order.
const links = [
  { href: "/website", label: "Website" },
  { href: "/prospecting", label: "Prospecting" },
  { href: "/pipeline", label: "Pipeline" },
  { href: "/social", label: "Social" },
];

export default function Sidebar() {
  // The current URL path, e.g. "/website". Used to highlight the active link.
  const pathname = usePathname();

  return (
    <aside className="w-56 shrink-0 border-r border-gray-200 bg-gray-50 p-4">
      <h1 className="mb-6 px-3 text-lg font-bold">Rootcode Dashboard</h1>
      <nav className="flex flex-col gap-1">
        {links.map((link) => {
          const isActive = pathname === link.href;
          return (
            <Link
              key={link.href}
              href={link.href}
              className={
                isActive
                  ? "rounded-md bg-gray-900 px-3 py-2 text-sm font-medium text-white"
                  : "rounded-md px-3 py-2 text-sm font-medium text-gray-700 hover:bg-gray-200"
              }
            >
              {link.label}
            </Link>
          );
        })}
      </nav>
    </aside>
  );
}
