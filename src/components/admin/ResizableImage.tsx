"use client"

import { Image } from "@tiptap/extension-image"
import { ReactNodeViewRenderer, NodeViewWrapper, type NodeViewProps } from "@tiptap/react"
import { useState, useRef, useEffect } from "react"
import { AlignLeft, AlignCenter, AlignRight, GripVertical } from "lucide-react"

const PRESETS = [
  { label: "25%", value: "25%" },
  { label: "50%", value: "50%" },
  { label: "75%", value: "75%" },
  { label: "100%", value: "100%" },
]

type Align = "left" | "center" | "right"

const ALIGN_STYLES: Record<Align, React.CSSProperties> = {
  left:   { marginRight: "auto", marginLeft: 0, float: "left", marginBottom: "0.75rem" },
  center: { marginLeft: "auto", marginRight: "auto", float: "none", clear: "both" },
  right:  { marginLeft: "auto", marginRight: 0, float: "right", marginBottom: "0.75rem" },
}

function ResizableImageView({ node, updateAttributes, selected }: NodeViewProps) {
  const [hovered, setHovered] = useState(false)
  const [resizing, setResizing] = useState(false)
  const startXRef = useRef(0)
  const startWidthRef = useRef(0)
  const containerRef = useRef<HTMLDivElement>(null)
  const imgRef = useRef<HTMLImageElement>(null)

  const width: string = node.attrs.width ?? "100%"
  const align: Align = node.attrs.align ?? "center"
  const showControls = selected || hovered || resizing

  function onResizeStart(e: React.MouseEvent) {
    e.preventDefault()
    e.stopPropagation()
    startXRef.current = e.clientX
    startWidthRef.current = imgRef.current?.offsetWidth ?? 400
    setResizing(true)
  }

  useEffect(() => {
    if (!resizing) return
    function onMouseMove(e: MouseEvent) {
      const parentWidth = containerRef.current?.closest(".ProseMirror")?.clientWidth ?? 800
      const dx = e.clientX - startXRef.current
      const newPx = Math.max(80, startWidthRef.current + dx)
      const pct = Math.min(100, Math.round((newPx / parentWidth) * 100))
      updateAttributes({ width: `${pct}%` })
    }
    function onMouseUp() { setResizing(false) }
    window.addEventListener("mousemove", onMouseMove)
    window.addEventListener("mouseup", onMouseUp)
    return () => {
      window.removeEventListener("mousemove", onMouseMove)
      window.removeEventListener("mouseup", onMouseUp)
    }
  }, [resizing, updateAttributes])

  const containerStyle: React.CSSProperties = {
    position: "relative",
    display: "block",
    width,
    marginTop: "1rem",
    marginBottom: align === "center" ? "1rem" : "0",
    ...ALIGN_STYLES[align],
  }

  return (
    <NodeViewWrapper
      ref={containerRef}
      style={containerStyle}
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
      data-drag-handle
    >
      {/* Image */}
      <img
        ref={imgRef}
        src={node.attrs.src}
        alt={node.attrs.alt ?? ""}
        style={{
          display: "block",
          width: "100%",
          borderRadius: 8,
          outline: showControls ? "2px solid #e63946" : "none",
          outlineOffset: 2,
          userSelect: "none",
        }}
        draggable={false}
      />

      {/* Controls toolbar */}
      {showControls && (
        <div
          className="absolute flex items-center gap-0.5 rounded-lg px-1.5 py-1 shadow-lg"
          style={{
            top: 8,
            left: "50%",
            transform: "translateX(-50%)",
            backgroundColor: "rgba(15,15,15,0.85)",
            backdropFilter: "blur(6px)",
            zIndex: 10,
            whiteSpace: "nowrap",
          }}
        >
          {/* Drag handle */}
          <div
            className="flex items-center px-1 cursor-grab active:cursor-grabbing"
            title="Drag to move"
            style={{ color: "rgba(255,255,255,0.4)" }}
          >
            <GripVertical size={12} />
          </div>

          <div style={{ width: 1, height: 14, backgroundColor: "rgba(255,255,255,0.15)", margin: "0 4px" }} />

          {/* Alignment */}
          {(["left", "center", "right"] as Align[]).map((a) => {
            const Icon = a === "left" ? AlignLeft : a === "center" ? AlignCenter : AlignRight
            return (
              <button
                key={a}
                type="button"
                onMouseDown={(e) => { e.preventDefault(); updateAttributes({ align: a }) }}
                className="p-1 rounded transition-colors"
                style={{
                  backgroundColor: align === a ? "#e63946" : "transparent",
                  color: align === a ? "#fff" : "rgba(255,255,255,0.6)",
                }}
                title={`Align ${a}`}
              >
                <Icon size={11} />
              </button>
            )
          })}

          <div style={{ width: 1, height: 14, backgroundColor: "rgba(255,255,255,0.15)", margin: "0 4px" }} />

          {/* Size presets */}
          {PRESETS.map((p) => (
            <button
              key={p.value}
              type="button"
              onMouseDown={(e) => { e.preventDefault(); updateAttributes({ width: p.value }) }}
              className="px-1.5 py-0.5 rounded text-[10px] font-semibold transition-colors"
              style={{
                backgroundColor: width === p.value ? "#e63946" : "transparent",
                color: width === p.value ? "#fff" : "rgba(255,255,255,0.6)",
              }}
            >
              {p.label}
            </button>
          ))}

          <span className="ml-1 text-[10px] font-mono" style={{ color: "rgba(255,255,255,0.3)" }}>
            {width}
          </span>
        </div>
      )}

      {/* Right-edge resize handle */}
      {showControls && (
        <div
          onMouseDown={onResizeStart}
          title="Drag to resize"
          className="absolute top-0 bottom-0 flex items-center justify-center"
          style={{ right: -6, width: 12, cursor: "ew-resize", zIndex: 10 }}
        >
          <div
            className="rounded-full transition-colors"
            style={{
              width: 8,
              height: 32,
              backgroundColor: resizing ? "#e63946" : "rgba(0,0,0,0.65)",
              border: "1.5px solid rgba(255,255,255,0.35)",
            }}
          />
        </div>
      )}
    </NodeViewWrapper>
  )
}

export const ResizableImageExtension = Image.extend({
  draggable: true,

  addAttributes() {
    return {
      ...this.parent?.(),
      width: {
        default: "100%",
        parseHTML: (el) => el.getAttribute("width") ?? el.style.width ?? "100%",
        renderHTML: (attrs) => ({
          width: attrs.width,
          style: `width:${attrs.width}`,
        }),
      },
      align: {
        default: "center",
        parseHTML: (el) => {
          if (el.style.float === "left") return "left"
          if (el.style.float === "right") return "right"
          return "center"
        },
        renderHTML: (attrs) => {
          const a: Align = attrs.align ?? "center"
          const floatStyle = a === "center" ? "display:block;margin:1rem auto" : `float:${a};margin-bottom:0.75rem`
          return { style: `width:${attrs.width};${floatStyle}` }
        },
      },
    }
  },

  addNodeView() {
    return ReactNodeViewRenderer(ResizableImageView)
  },
}).configure({ inline: false })
