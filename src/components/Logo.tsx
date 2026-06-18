interface LogoProps {
  showTag?: boolean
  size?: "sm" | "md" | "lg"
}

const sizes = {
  sm: { wordmark: "text-2xl",  tag: "text-[7px] tracking-[4px] mt-1" },
  md: { wordmark: "text-3xl",  tag: "text-[8px] tracking-[5px] mt-1.5" },
  lg: { wordmark: "text-6xl",  tag: "text-[9px] tracking-[6px] mt-2" },
}

export function Logo({ showTag = true, size = "md" }: LogoProps) {
  const s = sizes[size]
  return (
    <span className="inline-flex flex-col leading-none select-none">
      <span
        className={`${s.wordmark} font-black tracking-[-0.06em] leading-none`}
        style={{ fontFamily: "var(--font-urbanist)", color: "var(--fg)" }}
      >
        alive
      </span>
      {showTag && (
        <span
          className={`${s.tag} font-medium uppercase`}
          style={{ fontFamily: "var(--font-inter)", color: "var(--fg-3)", letterSpacing: "0.35em" }}
        >
          magazine
        </span>
      )}
    </span>
  )
}
