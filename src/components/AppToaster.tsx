"use client"

import { Toaster } from "sonner"

export function AppToaster() {
  return (
    <Toaster
      position="bottom-right"
      closeButton
      richColors
      toastOptions={{
        className: "font-sans text-sm",
        duration: 4000,
      }}
    />
  )
}
