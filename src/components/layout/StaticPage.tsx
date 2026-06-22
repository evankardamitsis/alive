interface StaticPageProps {
  title: string
  children: React.ReactNode
}

export function StaticPage({ title, children }: StaticPageProps) {
  return (
    <div className="max-w-[1600px] mx-auto px-4 sm:px-6 xl:px-12 py-10 sm:py-12">
      <h1
        className="text-3xl sm:text-4xl font-black tracking-tight mb-8 sm:mb-10"
        style={{ fontFamily: "var(--font-display)", color: "var(--fg)" }}
      >
        {title}
      </h1>
      <div className="max-w-2xl space-y-6 text-base leading-relaxed" style={{ color: "var(--fg-2)" }}>
        {children}
      </div>
    </div>
  )
}

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <section>
      <h2 className="text-lg font-bold mb-3" style={{ color: "var(--fg)" }}>
        {title}
      </h2>
      {children}
    </section>
  )
}

StaticPage.Section = Section
