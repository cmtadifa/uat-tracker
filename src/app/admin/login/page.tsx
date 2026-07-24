import { signInAction } from './actions'

export default async function LoginPage({
  searchParams,
}: {
  searchParams: Promise<{ error?: string }>
}) {
  const { error } = await searchParams
  return (
    <main className="mx-auto max-w-sm p-8">
      <h1 className="text-xl font-semibold mb-4">Admin Login</h1>
      {error && <p className="text-red-600 mb-4">{error}</p>}
      <form action={signInAction} className="flex flex-col gap-3">
        <input name="password" type="password" placeholder="Password" required className="border rounded p-2" autoFocus />
        <button type="submit" className="bg-black text-white rounded p-2">Log in</button>
      </form>
    </main>
  )
}
