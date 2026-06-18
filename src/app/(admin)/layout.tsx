import { AdminSidebar } from "@/components/admin/AdminSidebar"

export default function AdminLayout({ children }: { children: React.ReactNode }) {
  return (
    <div data-theme="light" className="flex h-screen overflow-hidden" style={{ backgroundColor: "var(--bg)" }}>
      <AdminSidebar />

      {/* Main content — offset on mobile for the fixed top bar */}
      <div className="flex flex-1 flex-col overflow-hidden lg:ml-0">
        <main className="flex-1 overflow-y-auto p-4 sm:p-6 lg:p-8 pt-[72px] lg:pt-8">
          {children}
        </main>
      </div>
    </div>
  )
}
