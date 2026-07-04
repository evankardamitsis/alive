"use client"

import { Image as TiptapImage } from "@tiptap/extension-image"
import { ReactNodeViewRenderer, NodeViewWrapper, type NodeViewProps } from "@tiptap/react"
import NextImage from "next/image"

const IMAGE_STYLE = "display:block;width:100%;height:auto;margin:1rem 0;clear:both;float:none"

function FullWidthImageView({ node, selected }: NodeViewProps) {
  const src = node.attrs.src as string
  const alt = (node.attrs.alt as string | undefined) ?? ""

  return (
    <NodeViewWrapper
      style={{
        display: "block",
        width: "100%",
        clear: "both",
        float: "none",
        margin: "1rem 0",
      }}
      data-drag-handle
    >
      <NextImage
        src={src}
        alt={alt}
        width={0}
        height={0}
        sizes="100vw"
        unoptimized
        draggable={false}
        style={{
          display: "block",
          width: "100%",
          height: "auto",
          borderRadius: 8,
          outline: selected ? "2px solid #e63946" : "none",
          outlineOffset: 2,
          userSelect: "none",
        }}
      />
    </NodeViewWrapper>
  )
}

export const ResizableImageExtension = TiptapImage.extend({
  addAttributes() {
    return {
      ...this.parent?.(),
      width: {
        default: null,
        parseHTML: () => null,
        renderHTML: () => ({}),
      },
      align: {
        default: null,
        parseHTML: () => null,
        renderHTML: () => ({}),
      },
    }
  },

  renderHTML({ HTMLAttributes }) {
    return ["img", { ...HTMLAttributes, style: IMAGE_STYLE }]
  },

  addNodeView() {
    return ReactNodeViewRenderer(FullWidthImageView)
  },
}).configure({ inline: false })
