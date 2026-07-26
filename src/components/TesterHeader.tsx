export default function TesterHeader({
  projectName,
  testerName,
}: {
  projectName: string
  testerName?: string
}) {
  return (
    <div className="mb-6 flex flex-wrap items-baseline justify-between gap-x-4 gap-y-1">
      <h1 className="text-xl font-semibold">{projectName}</h1>
      {testerName && <p className="text-sm text-muted-foreground">Testing as {testerName}</p>}
    </div>
  )
}
