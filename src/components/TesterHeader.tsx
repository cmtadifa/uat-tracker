export default function TesterHeader({
  projectName,
  testerName,
}: {
  projectName: string
  testerName?: string
}) {
  return (
    <div className="mb-6 flex flex-wrap items-baseline justify-between gap-x-4 gap-y-1 border-b border-border pb-4">
      <div>
        <p className="text-xs font-semibold uppercase tracking-wider text-accent">UAT Tracker</p>
        <h1 className="text-xl font-semibold">{projectName}</h1>
      </div>
      {testerName && <p className="text-sm text-muted-foreground">Testing as {testerName}</p>}
    </div>
  )
}
