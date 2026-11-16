import { Suspense } from "react";
import DataStatusLine, { DataStatusLoading } from "@/components/DataStatusLine";
import type { DataStatus } from "@/lib/dataSource";

interface PageHeaderProps {
  title: string; // e.g. "Website"
  description: string; // one line about what the page shows
  status: Promise<DataStatus>; // from the page's data module, e.g. getWebsiteStatus()
  children?: React.ReactNode; // optional extra line under the status, e.g. a link
}

// The header at the top of every dashboard page: title, a one-line description,
// the data status line ("Sample data" / "Live, last updated …"), and an optional extra line.
export default function PageHeader({ title, description, status, children }: PageHeaderProps) {
  return (
    <header>
      <h2 className="text-2xl font-bold">{title}</h2>
      <p className="mt-1 text-gray-500">{description}</p>
      <div className="mt-2">
        {/* Its own Suspense: a slow status check never holds up the rest of the page. */}
        <Suspense fallback={<DataStatusLoading />}>
          <DataStatusLine status={status} />
        </Suspense>
      </div>
      {children}
    </header>
  );
}
