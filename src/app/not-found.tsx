import Link from "next/link"

export default function NotFound() {
  return (
    <div className="min-h-screen flex flex-col items-center justify-center px-4 text-center">
      <p className="text-[8rem] font-black leading-none" style={{ fontFamily: "var(--font-display)", color: "var(--border)" }}>
        404
      </p>
      <h1 className="mt-2 text-2xl font-bold" style={{ color: "var(--fg)" }}>
        Η σελίδα δεν βρέθηκε
      </h1>
      <p className="mt-3 text-sm max-w-xs" style={{ color: "var(--fg-3)" }}>
        Το άρθρο που ψάχνεις μπορεί να έχει μετακινηθεί ή να μην υπάρχει πλέον.
      </p>
      <Link
        href="/"
        className="mt-8 inline-block rounded-full bg-[#e63946] px-6 py-2.5 text-sm font-semibold text-white hover:bg-[#c9303d] transition-colors"
      >
        Επιστροφή στην αρχική
      </Link>
    </div>
  )
}
