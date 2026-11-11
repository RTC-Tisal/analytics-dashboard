import Sidebar from "@/components/Sidebar";

// Shared layout for every page inside (dashboard): sidebar on the left, page on the right.
// The "(dashboard)" folder name is in brackets, so it is not part of the URL.
export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="flex min-h-full flex-1">
      <Sidebar />
      <main className="flex-1 p-8">{children}</main>
    </div>
  );
}
