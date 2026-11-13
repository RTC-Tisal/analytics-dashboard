import SampleDataBadge from "@/components/SampleDataBadge";
import type { DataSource } from "@/lib/dataSource";

interface PageHeaderProps {
  title: string; // e.g. "Website"
  description: string; // one line about what the page shows
  dataSource: DataSource; // from the page's data module; "sample" shows the badge
  children?: React.ReactNode; // optional extra line under the description, e.g. a link
}

// The header at the top of every dashboard page: title, "Sample data" badge
// (only while the numbers aren't real), a one-line description, and an optional extra line.
export default function PageHeader({ title, description, dataSource, children }: PageHeaderProps) {
  return (
    <header>
      <div className="flex flex-wrap items-center gap-3">
        <h2 className="text-2xl font-bold">{title}</h2>
        {dataSource === "sample" && <SampleDataBadge />}
      </div>
      <p className="mt-1 text-gray-500">{description}</p>
      {children}
    </header>
  );
}
