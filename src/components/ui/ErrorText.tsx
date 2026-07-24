export default function ErrorText({ children }: { children: React.ReactNode }) {
  return (
    <p className="rounded-lg border border-danger/30 bg-danger-bg px-3 py-2 text-sm text-danger">{children}</p>
  )
}
