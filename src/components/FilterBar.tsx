// The one row of filters at the top of every dashboard page, directly under the
// page header. Date range first, then any page-specific filters. On narrow
// screens the filters wrap onto a second line rather than squashing.
export default function FilterBar({ children }: { children: React.ReactNode }) {
  return (
    <div role="group" aria-label="Filters" className="mt-6 flex flex-wrap items-center gap-3">
      {children}
    </div>
  );
}
