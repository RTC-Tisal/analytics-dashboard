"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

// The four sections of the dashboard, in build order.
const links = [
  { href: "/website", label: "Website" },
  { href: "/linkedin", label: "LinkedIn" },
  { href: "/pipeline", label: "Pipeline" },
  { href: "/social", label: "Social" },
];

export default function Sidebar() {
  // The current URL path, e.g. "/website". Used to highlight the active link.
  const pathname = usePathname();

  return (
    // Phones (below 768px): a navy bar across the top, with the links in a row.
    // md: and up (768px+): a sidebar on the left that stays in view while the page scrolls.
    <aside className="flex w-full shrink-0 flex-col gap-2 bg-sidebar px-4 py-3 text-sidebar-foreground md:sticky md:top-0 md:h-screen md:w-60 md:gap-0 md:py-6">
      {/* Brand: logo mark + name. The h1 reads "Rootcode Sales & Marketing" to screen readers. */}
      <div className="flex items-center gap-3 px-2 md:mb-8">
        <span
          aria-hidden="true"
          className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-linear-to-br from-blue-500 to-primary text-lg font-bold shadow-lg shadow-blue-950/50"
        >
          R
        </span>
        <h1 className="leading-tight">
          <span className="block text-base font-semibold">Rootcode</span>
          <span className="block text-xs text-sidebar-muted">Sales &amp; Marketing</span>
        </h1>
      </div>

      {/* The label only fits in the sidebar; on phones the links speak for themselves. */}
      <p className="mb-2 hidden px-3 text-xs font-medium uppercase tracking-wider text-sidebar-muted md:block">
        Dashboards
      </p>
      {/* A row that can scroll sideways on phones; a column in the sidebar. */}
      <nav aria-label="Dashboards" className="flex gap-1 overflow-x-auto md:flex-col md:overflow-visible">
        {links.map((link) => {
          const isActive = pathname === link.href;
          return (
            <Link
              key={link.href}
              href={link.href}
              aria-current={isActive ? "page" : undefined}
              // min-h-11 = 44px: easy to tap. The light-blue focus ring stands out on navy.
              className={`relative flex min-h-11 shrink-0 items-center whitespace-nowrap rounded-md px-3 text-sm font-medium transition-colors duration-200 focus-visible:outline-blue-300 ${
                isActive
                  ? "bg-sidebar-active text-sidebar-foreground"
                  : "text-sidebar-muted hover:bg-sidebar-hover hover:text-sidebar-foreground"
              }`}
            >
              {/* Amber marker on the left of the current page. */}
              {isActive && (
                <span
                  aria-hidden="true"
                  className="absolute inset-y-1.5 left-0 w-1 rounded-full bg-accent"
                />
              )}
              {link.label}
            </Link>
          );
        })}
      </nav>
    </aside>
  );
}
