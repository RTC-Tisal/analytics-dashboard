import { FlaskConical } from "lucide-react";

// A small amber pill that says "Sample data", so screenshots of a page with
// made-up numbers are never mistaken for real ones. PageHeader shows it
// automatically when a page's data source is "sample".
export default function SampleDataBadge() {
  return (
    <span
      title="These numbers are made up for layout. Real data isn't connected yet."
      className="inline-flex items-center gap-1.5 rounded-full border border-sample-border bg-sample-soft px-2.5 py-0.5 text-xs font-medium text-sample"
    >
      <FlaskConical aria-hidden="true" className="h-3.5 w-3.5" strokeWidth={2} />
      Sample data
    </span>
  );
}
