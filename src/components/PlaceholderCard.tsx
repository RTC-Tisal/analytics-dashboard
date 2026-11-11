interface PlaceholderCardProps {
  title: string; // e.g. "Sessions over time"
  note: string; // e.g. "Coming in module 2"
  className?: string; // optional extra classes, e.g. to span two grid columns
}

// An empty card marking where a future chart or table will go.
// The dashed border shows it's intentionally empty, not broken.
export default function PlaceholderCard({ title, note, className = "" }: PlaceholderCardProps) {
  return (
    <section
      className={`flex h-64 flex-col rounded-lg border border-dashed border-gray-300 bg-white p-5 ${className}`}
    >
      <h3 className="text-sm font-medium text-gray-900">{title}</h3>
      <div className="flex flex-1 items-center justify-center">
        <p className="text-sm text-gray-400">{note}</p>
      </div>
    </section>
  );
}
