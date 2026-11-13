import Sidebar from "@/components/Sidebar";

// Shared layout for every page inside (dashboard): sidebar on the left, page on the right.
// The "(dashboard)" folder name is in brackets, so it is not part of the URL.
export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    // Phones: the nav bar on top of the page (flex-col). From 768px (md:): sidebar beside it.
    <div className="flex min-h-full flex-1 flex-col md:flex-row">
      <Sidebar />
      {/* min-w-0: let the page area shrink to the space beside the sidebar. Without it,
          one wide child (a chart or table) pushes the whole page wider than the screen,
          instead of scrolling inside its own card. Less padding on phones (16px vs 32px). */}
      <main className="min-w-0 flex-1 p-4 md:p-8">{children}</main>
    </div>
  );
}
