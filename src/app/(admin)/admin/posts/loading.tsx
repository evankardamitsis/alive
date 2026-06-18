export default function PostsLoading() {
  return (
    <div className="space-y-4 animate-pulse">
      <div className="flex items-center justify-between mb-6">
        <div className="h-8 w-24 rounded-lg" style={{ backgroundColor: "var(--bg-3)" }} />
        <div className="h-9 w-28 rounded-lg" style={{ backgroundColor: "var(--bg-3)" }} />
      </div>
      <div className="h-10 rounded-lg" style={{ backgroundColor: "var(--bg-2)" }} />
      <div className="rounded-xl overflow-hidden" style={{ border: "1px solid var(--border)" }}>
        <div className="h-11" style={{ backgroundColor: "var(--bg-2)" }} />
        {Array.from({ length: 8 }).map((_, i) => (
          <div key={i} className="flex items-center gap-4 px-5 py-4" style={{ borderTop: "1px solid var(--border)" }}>
            <div className="flex-1 space-y-2">
              <div className="h-4 w-2/3 rounded" style={{ backgroundColor: "var(--bg-3)" }} />
              <div className="h-3 w-1/3 rounded" style={{ backgroundColor: "var(--bg-3)" }} />
            </div>
            <div className="h-5 w-16 rounded-full" style={{ backgroundColor: "var(--bg-3)" }} />
            <div className="h-5 w-20 rounded-full hidden md:block" style={{ backgroundColor: "var(--bg-3)" }} />
            <div className="h-5 w-24 rounded hidden lg:block" style={{ backgroundColor: "var(--bg-3)" }} />
          </div>
        ))}
      </div>
    </div>
  )
}
