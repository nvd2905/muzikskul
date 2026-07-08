import { createClient } from '@/supabase/server'
import { decryptField, encryptField } from './crypto'
import type { CategoryBreakdown, PersonalTransaction, TransactionCategory, TransactionType, WalletSummary } from './types'

export * from './types'

export async function getPersonalTransactions(userId: string): Promise<PersonalTransaction[]> {
  const supabase = await createClient()
  const { data, error } = await supabase
    .from('personal_transactions')
    .select('id, amount, type, category, description, created_at')
    .eq('user_id', userId)
    .order('created_at', { ascending: false })
  if (error) throw error
  return (data ?? []).map(row => ({
    id: row.id,
    amount: Number(decryptField(row.amount)),
    type: row.type as TransactionType,
    category: decryptField(row.category) as TransactionCategory,
    description: row.description ? decryptField(row.description) : null,
    createdAt: row.created_at,
  }))
}

export async function getWalletSummary(userId: string): Promise<WalletSummary> {
  const supabase = await createClient()
  const { data, error } = await supabase
    .from('personal_transactions')
    .select('amount, type')
    .eq('user_id', userId)
  if (error) throw error

  const totals = (data ?? []).reduce(
    (acc, row) => {
      const amount = Number(decryptField(row.amount))
      if (row.type === 'income') acc.totalIncome += amount
      else acc.totalExpense += amount
      return acc
    },
    { totalIncome: 0, totalExpense: 0 },
  )

  return {
    totalIncome: totals.totalIncome,
    totalExpense: totals.totalExpense,
    balance: totals.totalIncome - totals.totalExpense,
  }
}

export async function getCategoryBreakdown(userId: string): Promise<CategoryBreakdown[]> {
  const supabase = await createClient()
  const { data, error } = await supabase
    .from('personal_transactions')
    .select('amount, category')
    .eq('user_id', userId)
    .eq('type', 'expense')
  if (error) throw error

  const totals = new Map<TransactionCategory, number>()
  let grandTotal = 0
  for (const row of data ?? []) {
    const amount = Number(decryptField(row.amount))
    const category = decryptField(row.category) as TransactionCategory
    totals.set(category, (totals.get(category) ?? 0) + amount)
    grandTotal += amount
  }

  return [...totals.entries()]
    .map(([category, total]) => ({
      category,
      total,
      percentage: grandTotal > 0 ? (total / grandTotal) * 100 : 0,
    }))
    .sort((a, b) => b.total - a.total)
}

export async function getUserCategories(userId: string): Promise<string[]> {
  const supabase = await createClient()
  const { data, error } = await supabase
    .from('personal_categories')
    .select('name')
    .eq('user_id', userId)
    .order('created_at', { ascending: true })
  if (error) throw error
  return (data ?? []).map(row => decryptField(row.name))
}

export async function addUserCategory(userId: string, name: string, existing: string[]): Promise<void> {
  const isDuplicate = existing.some(c => c.toLowerCase() === name.toLowerCase())
  if (isDuplicate) return

  const supabase = await createClient()
  const { error } = await supabase.from('personal_categories').insert({
    user_id: userId,
    name: encryptField(name),
  })
  if (error) throw error
}

export async function addPersonalTransaction(
  userId: string,
  amount: number,
  type: TransactionType,
  category: TransactionCategory,
  description: string | null,
): Promise<void> {
  const supabase = await createClient()
  const { error } = await supabase.from('personal_transactions').insert({
    user_id: userId,
    amount: encryptField(String(amount)),
    type,
    category: encryptField(category),
    description: description ? encryptField(description) : null,
  })
  if (error) throw error
}
