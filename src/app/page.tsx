import Link from 'next/link'
import Container from '@/components/ui/Container'
import Button from '@/components/ui/Button'

export default function Home() {
  return (
    <Container size="sm" className="flex flex-1 flex-col items-center justify-center text-center">
      <h1 className="text-2xl font-semibold">UAT Tracker</h1>
      <p className="mt-2 text-muted-foreground">
        Shared UAT checklists with pass/fail tracking and screenshot evidence.
      </p>
      <Link href="/admin/login" className="mt-6">
        <Button>Go to Admin Login</Button>
      </Link>
    </Container>
  )
}
