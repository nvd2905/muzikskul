# Skill: Add a page with data fetching and mutations

Use this when adding a new route to an existing module.

## Pattern

```
src/app/<route>/page.tsx     ← async Server Component (data + actions)
src/modules/<module>/
  services.ts                ← add new query/mutation functions here
  components/<Component>.tsx ← 'use client' component receives data + action refs as props
```

## Step-by-step

### 1. Add service functions to `services.ts`

Read queries and write mutations both live in `services.ts`:

```ts
// Read
export async function getItems(id: string): Promise<Item[]> {
  const supabase = await createClient()
  const { data, error } = await supabase
    .from('items')
    .select('id, name, status')
    .eq('parent_id', id)
    .order('created_at', { ascending: false })
  if (error) throw error
  return (data ?? []).map(row => ({ id: row.id, name: row.name, status: row.status }))
}

// Write
export async function createItem(parentId: string, name: string): Promise<void> {
  const supabase = await createClient()
  const { error } = await supabase.from('items').insert({ parent_id: parentId, name })
  if (error) throw error
}
```

### 2. Create the page

```tsx
import { revalidatePath } from 'next/cache'
import { getItems, createItem } from '@/modules/<module>/services'
import ItemList from '@/modules/<module>/components/ItemList'

export default async function ItemsPage() {
  const items = await getItems('parent-id')

  async function handleCreate(name: string) {
    'use server'
    await createItem('parent-id', name)
    revalidatePath('/items')
  }

  return (
    <main className="min-h-screen bg-gray-50">
      <ItemList items={items} onCreate={handleCreate} />
    </main>
  )
}
```

Key rules:
- `page.tsx` is always an async Server Component — no `'use client'` on the page itself.
- Server Actions are defined inline in `page.tsx` with `'use server'` + `revalidatePath`.
- Pass data **and** action refs as props — never import services from a Client Component.

### 3. Create the Client Component

```tsx
'use client'

import { useTransition } from 'react'
import type { Item } from '../services'

interface Props {
  items: Item[]
  onCreate: (name: string) => Promise<void>
}

export default function ItemList({ items, onCreate }: Props) {
  const [isPending, startTransition] = useTransition()

  function handleSubmit(name: string) {
    startTransition(() => onCreate(name))
  }

  return (
    // ...
  )
}
```

Key rules:
- Always type `props` — import types from `../services`, not re-defined here.
- Use `useTransition` for async Server Action calls — shows pending state without blocking the UI.
- Never call Supabase directly from a Client Component.

## What NOT to do

- No `fetch('/api/...')` — Server Components call services directly.
- No API route handlers for data fetching — only for OAuth callbacks and webhooks.
- No `useState` to store server data — Server Components re-render on `revalidatePath`.
