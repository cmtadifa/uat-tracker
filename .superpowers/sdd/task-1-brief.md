### Task 1: Scaffold Next.js project + tooling

**Files:**
- Create: `uat-tracker/package.json`, `uat-tracker/tsconfig.json`, `uat-tracker/next.config.ts`, `uat-tracker/vitest.config.ts`, `uat-tracker/.env.local.example`, `uat-tracker/netlify.toml`, `uat-tracker/src/app/layout.tsx`, `uat-tracker/src/app/page.tsx`, `uat-tracker/src/app/globals.css`
- Test: `uat-tracker/tests/lib/smoke.test.ts`

**Interfaces:**
- Produces: an `npm test` command any later task's unit tests run under; a dev server on `npm run dev`.

- [ ] **Step 1: Create the Next.js app**

Run:
```bash
npx create-next-app@latest uat-tracker --typescript --tailwind --app --eslint --src-dir --import-alias "@/*" --no-turbopack --use-npm
```
Expected: `uat-tracker/` created with `package.json`, `src/app/layout.tsx`, `src/app/page.tsx`, `tsconfig.json` present.

- [ ] **Step 2: Install runtime + dev dependencies**

Run (from `uat-tracker/`):
```bash
npm install @supabase/supabase-js @supabase/ssr
npm install -D vitest @vitejs/plugin-react vite-tsconfig-paths @vitest/coverage-v8
```

- [ ] **Step 3: Add Vitest config**

Create `uat-tracker/vitest.config.ts`:
```typescript
import { defineConfig } from 'vitest/config'
import tsconfigPaths from 'vite-tsconfig-paths'

export default defineConfig({
  plugins: [tsconfigPaths()],
  test: {
    environment: 'node',
    include: ['tests/**/*.test.ts'],
  },
})
```

- [ ] **Step 4: Add the `test` script**

Modify `uat-tracker/package.json` — add to `"scripts"`:
```json
"test": "vitest run"
```

- [ ] **Step 5: Write a smoke test**

Create `uat-tracker/tests/lib/smoke.test.ts`:
```typescript
import { describe, it, expect } from 'vitest'

describe('project scaffold', () => {
  it('runs a basic assertion', () => {
    expect(1 + 1).toBe(2)
  })
})
```

- [ ] **Step 6: Run the test suite**

Run: `npm test` (from `uat-tracker/`)
Expected: `1 passed` (the smoke test).

- [ ] **Step 7: Add environment variable template**

Create `uat-tracker/.env.local.example`:
```
NEXT_PUBLIC_SUPABASE_URL=
NEXT_PUBLIC_SUPABASE_ANON_KEY=
SUPABASE_SERVICE_ROLE_KEY=
TESTER_COOKIE_SECRET=
```

- [ ] **Step 8: Add Netlify config**

Create `uat-tracker/netlify.toml`:
```toml
[build]
  command = "npm run build"
  publish = ".next"

[[plugins]]
  package = "@netlify/plugin-nextjs"
```

Run: `npm install -D @netlify/plugin-nextjs` (from `uat-tracker/`)

- [ ] **Step 9: Verify the dev server boots**

Run: `npm run dev` (from `uat-tracker/`), then request `http://localhost:3000` (e.g. `curl -s -o /dev/null -w "%{http_code}" http://localhost:3000`).
Expected: `200`. Stop the dev server after confirming.

- [ ] **Step 10: Commit**

```bash
cd uat-tracker
git init
git add -A
git commit -m "chore: scaffold Next.js + Vitest + Netlify config"
```

---

