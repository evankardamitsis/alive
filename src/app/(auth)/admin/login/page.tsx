import { LoginForm } from "@/components/admin/LoginForm"
import { Logo } from "@/components/Logo"

export default async function LoginPage({
  searchParams,
}: {
  searchParams: Promise<{ error?: string }>
}) {
  const { error } = await searchParams

  return (
    <div data-theme="light" className="min-h-screen flex items-center justify-center px-4" style={{ backgroundColor: "var(--bg)" }}>
      <div className="w-full max-w-sm space-y-8">
        <div className="flex justify-center">
          <Logo size="md" showTag={false} />
        </div>
        <div className="rounded-2xl p-8 space-y-6" style={{ backgroundColor: "var(--bg-2)", border: "1px solid var(--border)" }}>
          <div>
            <h1 className="text-xl font-bold" style={{ color: "var(--fg)" }}>Admin Login</h1>
            <p className="text-sm mt-1" style={{ color: "var(--fg-3)" }}>Sign in to manage Alive.</p>
          </div>
          {error === "unauthorized" && (
            <p className="text-xs text-red-500 bg-red-500/10 rounded-lg px-3 py-2">
              Your account does not have admin access.
            </p>
          )}
          <LoginForm />
        </div>
      </div>
    </div>
  )
}
