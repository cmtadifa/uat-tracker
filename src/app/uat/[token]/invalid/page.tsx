import Container from '@/components/ui/Container'
import Card from '@/components/ui/Card'

export default function InvalidLinkPage() {
  return (
    <Container size="sm" className="flex flex-1 flex-col items-center justify-center">
      <Card className="w-full text-center">
        <h1 className="mb-2 text-xl font-semibold">Link No Longer Active</h1>
        <p className="text-muted-foreground">
          This UAT link has already been used, been revoked, or doesn&apos;t exist. Each invite link works for one
          tester only — contact the person who shared it with you for a new one.
        </p>
      </Card>
    </Container>
  )
}
