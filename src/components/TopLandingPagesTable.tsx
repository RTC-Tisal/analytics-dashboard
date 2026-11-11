import { formatValue } from "@/lib/format";
import type { LandingPage } from "@/lib/website/types";

interface TopLandingPagesTableProps {
  rows: LandingPage[]; // already sorted and limited to the top 10 by getWebsiteData
}

// A plain HTML table. No hover or resizing needed, so it stays a server component:
// it's turned into HTML on the server and sends no JavaScript to the browser.
export default function TopLandingPagesTable({ rows }: TopLandingPagesTableProps) {
  return (
    // On narrow screens the table scrolls sideways inside the card instead of
    // stretching the whole page.
    <div className="overflow-x-auto">
      <table className="w-full text-sm">
        <thead>
          <tr className="border-b border-gray-200 text-xs font-medium text-gray-500">
            <th scope="col" className="py-2 pr-4 text-left font-medium">Page</th>
            {/* Number columns: headings right-aligned to match their numbers. */}
            <th scope="col" className="py-2 pl-4 text-right font-medium">Sessions</th>
            <th scope="col" className="py-2 pl-4 text-right font-medium">Engagement rate</th>
            <th scope="col" className="py-2 pl-4 text-right font-medium">Form submissions</th>
          </tr>
        </thead>
        <tbody>
          {rows.map((row) => (
            // `key` tells React which row is which. The path is unique, so it's a good key.
            <tr key={row.path} className="border-b border-gray-100 last:border-0">
              {/* Long paths are cut off with "…"; hovering shows the full path. */}
              <td className="max-w-64 truncate py-2 pr-4 text-gray-900" title={row.path}>
                {row.path}
              </td>
              {/* tabular-nums gives every digit the same width, so the columns line up. */}
              <td className="py-2 pl-4 text-right tabular-nums text-gray-900">
                {formatValue(row.sessions, "number")}
              </td>
              <td className="py-2 pl-4 text-right tabular-nums text-gray-900">
                {formatValue(row.engagementRate, "percent")}
              </td>
              <td className="py-2 pl-4 text-right tabular-nums text-gray-900">
                {formatValue(row.formSubmissions, "number")}
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
