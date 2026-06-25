# Skill: Scaffold a new module

Use this skill whenever a new feature module needs to be added to the project.

## When to use

- Adding a feature that doesn't belong to an existing module (`class-wallet`, `auth`, `muzik`, `wallet`).
- Any new feature with its own Supabase table(s) and UI.

## Checklist

### 1. Create the module directory

```
src/modules/<module-name>/
├── services.ts
└── components/
```

- `<module-name>` is lowercase hyphenated (e.g. `student-roster`, `grade-book`).
- `services.ts` is the **only** file that touches Supabase.
- `components/` holds all `'use client'` components for this module.

### 2. Write `services.ts`

```ts
import { createClient } from '@/supabase/server'

// Export types here — components import types from services.ts, not from elsewhere
export type MyEntity = {
  id: string
  // ... camelCase fields mapped from DB snake_case
}

export async function getMyEntities(): Promise<MyEntity[]> {
  const supabase = await createClient()
  const { data, error } = await supabase
    .from('my_table')
    .select('id, some_field')
    .order('created_at', { ascending: false })
  if (error) throw error
  return (data ?? []).map(row => ({
    id: row.id,
    someField: row.some_field,
  }))
}
```

Rules:
- Always `import { createClient } from '@/supabase/server'` — never the browser client.
- Always destructure `{ data, error }` and `throw error` before using `data`.
- Map snake_case → camelCase in the return shape.

### 3. Create the page

Create `src/app/<module-name>/page.tsx` as an async Server Component:

```tsx
import { revalidatePath } from 'next/cache'
import { getMyEntities, updateMyEntity } from '@/modules/<module-name>/services'
import MyComponent from '@/modules/<module-name>/components/MyComponent'

export default async function MyPage() {
  const items = await getMyEntities()

  async function handleAction(id: string) {
    'use server'
    await updateMyEntity(id)
    revalidatePath('/<module-name>')
  }

  return (
    <main className="min-h-screen bg-gray-50">
      <MyComponent items={items} onAction={handleAction} />
    </main>
  )
}
```

### 4. Protect the route (if auth-required)

Add the route pattern to `src/middleware.ts` in the `protectedPaths` check:

```ts
if (pathname.startsWith('/<module-name>') && !user) {
  return NextResponse.redirect(new URL('/login', request.url))
}
```

### 5. Add a Supabase migration

Create `supabase/migrations/<NNN>_<slug>.sql`. See skill `new-migration.md` for the template.

## Constraints

- **No cross-module imports.** `src/modules/class-wallet/` must never import from `src/modules/<your-module>/` or vice versa.
- Shared helpers go in `src/shared/` (utilities in `utils/`, hooks in `hooks/`, UI primitives in `components/`).
- Client components (`'use client'`) only when event handlers, browser APIs, or hooks are needed.
