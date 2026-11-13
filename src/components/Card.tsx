import type { LucideIcon } from "lucide-react";

interface CardProps {
  title: string; // e.g. "Sessions" for a KPI tile, "Traffic by channel" for a chart
  icon?: LucideIcon; // optional icon shown before the title, e.g. Send
  children: React.ReactNode; // what goes in the card, below the title
  className?: string; // optional extra classes, e.g. a top margin
}

// The one card frame used across the dashboard: KPI tiles, charts and tables.
// Change the look here and every card changes with it.
export default function Card({ title, icon: Icon, children, className = "" }: CardProps) {
  return (
    <section
      className={`flex flex-col gap-3 rounded-lg border border-gray-200 bg-white p-5 shadow-sm ${className}`}
    >
      <div className="flex items-center gap-2.5">
        {Icon && (
          // Decorative: the title already says what the card is, so screen readers skip it.
          <span
            aria-hidden="true"
            className="flex h-8 w-8 shrink-0 items-center justify-center rounded-md bg-icon-soft text-primary"
          >
            <Icon className="h-4 w-4" strokeWidth={2} />
          </span>
        )}
        <h3 className="text-sm font-medium text-gray-600">{title}</h3>
      </div>
      {children}
    </section>
  );
}
