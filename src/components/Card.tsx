interface CardProps {
  title: string; // e.g. "Sessions" for a KPI tile, "Traffic by channel" for a chart
  children: React.ReactNode; // what goes in the card, below the title
  className?: string; // optional extra classes, e.g. a top margin
}

// The one card frame used across the dashboard: KPI tiles, charts and tables.
// Change the look here and every card changes with it.
export default function Card({ title, children, className = "" }: CardProps) {
  return (
    <section
      className={`flex flex-col gap-3 rounded-lg border border-gray-200 bg-white p-5 shadow-sm ${className}`}
    >
      <h3 className="text-sm font-medium text-gray-600">{title}</h3>
      {children}
    </section>
  );
}
