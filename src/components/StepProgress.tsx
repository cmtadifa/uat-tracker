export default function StepProgress({ step, total }: { step: number; total: number }) {
  const percent = total > 0 ? Math.round((step / total) * 100) : 0
  return (
    <div className="mx-auto w-full max-w-5xl px-6 pt-4 sm:px-8">
      <div className="mb-1 flex items-center justify-between text-xs text-muted-foreground">
        <span>
          Step {step} of {total}
        </span>
        <span>{percent}%</span>
      </div>
      <div className="h-1.5 w-full overflow-hidden rounded-full bg-muted">
        <div className="h-full rounded-full bg-accent transition-all" style={{ width: `${percent}%` }} />
      </div>
    </div>
  )
}
