type Status = 'not_started' | 'passed' | 'failed'

const styles: Record<Status, string> = {
  not_started: 'bg-muted text-muted-foreground',
  passed: 'bg-success-bg text-success',
  failed: 'bg-danger-bg text-danger',
}

const labels: Record<Status, string> = {
  not_started: 'Not Started',
  passed: 'Passed',
  failed: 'Failed',
}

export default function StatusBadge({ status }: { status: string }) {
  const key = (status in styles ? status : 'not_started') as Status
  return (
    <span className={`inline-flex items-center rounded-full px-2.5 py-1 text-xs font-medium ${styles[key]}`}>
      {labels[key]}
    </span>
  )
}
