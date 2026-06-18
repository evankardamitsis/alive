export default function MediaLoading() {
  return (
    <div className="space-y-5 animate-pulse">
      <div className="h-8 w-24 rounded-lg mb-8" style={{ backgroundColor: "var(--bg-3)" }} />
      <div className="rounded-xl h-32" style={{ backgroundColor: "var(--bg-2)", border: "1px solid var(--border)" }} />
      <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-3">
        {Array.from({ length: 24 }).map((_, i) => (
          <div key={i} className="rounded-xl overflow-hidden" style={{ border: "1px solid var(--border)" }}>
            <div className="aspect-square" style={{ backgroundColor: "var(--bg-3)" }} />
            <div className="px-2 py-1.5 space-y-1" style={{ backgroundColor: "var(--bg-2)" }}>
              <div className="h-2.5 w-3/4 rounded" style={{ backgroundColor: "var(--bg-3)" }} />
              <div className="h-2 w-1/2 rounded" style={{ backgroundColor: "var(--bg-3)" }} />
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}
