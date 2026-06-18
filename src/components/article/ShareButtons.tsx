"use client"

import { useState } from "react"

interface Props {
  title: string
  url: string
  onDark?: boolean
}

export function ShareButtons({ title, url, onDark }: Props) {
  const [copied, setCopied] = useState(false)

  const tweet = () =>
    window.open(
      `https://twitter.com/intent/tweet?text=${encodeURIComponent(title)}&url=${encodeURIComponent(url)}`,
      "_blank",
      "noopener,noreferrer"
    )

  const fbShare = () =>
    window.open(
      `https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(url)}`,
      "_blank",
      "noopener,noreferrer"
    )

  const copy = async () => {
    await navigator.clipboard.writeText(url)
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }

  const btnClass =
    "flex items-center gap-1.5 rounded-full px-3 py-1.5 text-xs font-medium transition-opacity hover:opacity-60"
  const btnStyle = onDark
    ? { border: "1px solid rgba(255,255,255,0.25)", color: "rgba(255,255,255,0.8)" }
    : { border: "1px solid var(--border)", color: "var(--fg-2)" }

  return (
    <div className="flex flex-wrap gap-2">
      <button onClick={tweet} className={btnClass} style={btnStyle}>
        <XIcon />
        <span className="hidden sm:inline">Share</span>
      </button>
      <button onClick={fbShare} className={btnClass} style={btnStyle}>
        <FbIcon />
        <span className="hidden sm:inline">Share</span>
      </button>
      <button onClick={copy} className={btnClass} style={btnStyle}>
        <LinkIcon />
        {copied ? "Copied!" : <span className="hidden sm:inline">Copy link</span>}
      </button>
    </div>
  )
}

function XIcon() {
  return (
    <svg width="13" height="13" viewBox="0 0 24 24" fill="currentColor">
      <path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-4.714-6.231-5.401 6.231H2.746l7.73-8.835L1.254 2.25H8.08l4.253 5.622zm-1.161 17.52h1.833L7.084 4.126H5.117z" />
    </svg>
  )
}

function FbIcon() {
  return (
    <svg width="13" height="13" viewBox="0 0 24 24" fill="currentColor">
      <path d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z" />
    </svg>
  )
}

function LinkIcon() {
  return (
    <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
      <path d="M10 13a5 5 0 0 0 7.54.54l3-3a5 5 0 0 0-7.07-7.07l-1.72 1.71" />
      <path d="M14 11a5 5 0 0 0-7.54-.54l-3 3a5 5 0 0 0 7.07 7.07l1.71-1.71" />
    </svg>
  )
}
