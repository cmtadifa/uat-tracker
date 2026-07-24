import { signInAction } from './actions'
import Container from '@/components/ui/Container'
import Card from '@/components/ui/Card'
import Button from '@/components/ui/Button'
import { Input } from '@/components/ui/Input'
import ErrorText from '@/components/ui/ErrorText'

export default async function LoginPage({
  searchParams,
}: {
  searchParams: Promise<{ error?: string }>
}) {
  const { error } = await searchParams
  return (
    <Container size="sm" className="flex flex-1 flex-col items-center justify-center">
      <Card className="w-full">
        <h1 className="mb-1 text-xl font-semibold">Admin Login</h1>
        <p className="mb-5 text-sm text-muted-foreground">Sign in to manage UAT projects.</p>
        <form action={signInAction} className="flex flex-col gap-3">
          <Input name="password" type="password" placeholder="Password" required autoFocus />
          <Button type="submit">Log in</Button>
        </form>
        {error && (
          <div className="mt-4">
            <ErrorText>{error}</ErrorText>
          </div>
        )}
      </Card>
    </Container>
  )
}
