import { createClient } from '@/supabase/server'

export type FundStatus = {
  balance: number
  className: string
  targetBudget: number
}

export type Transaction = {
  id: string
  amount: number
  payerName: string
  status: 'pending' | 'approved' | 'rejected'
  invoice_url: string | null
  note: string | null
  createdAt: string
  userId: string | null
}

export type TopDonor = {
  payerName: string
  total: number
}

export async function getClassFundStatus(fundId: string): Promise<FundStatus> {
  const supabase = await createClient()
  const { data, error } = await supabase
    .from('class_funds')
    .select('balance, class_name, target_budget')
    .eq('id', fundId)
    .single()
  if (error) throw error
  return {
    balance: data.balance,
    className: data.class_name,
    targetBudget: data.target_budget,
  }
}

export async function getClassTransactions(fundId: string): Promise<Transaction[]> {
  const supabase = await createClient()
  const { data, error } = await supabase
    .from('class_transactions')
    .select('id, amount, payer_name, status, invoice_url, note, created_at, user_id')
    .eq('fund_id', fundId)
    .order('created_at', { ascending: false })
  if (error) throw error
  return (data ?? []).map(row => ({
    id: row.id,
    amount: row.amount,
    payerName: row.payer_name,
    status: row.status as Transaction['status'],
    invoice_url: row.invoice_url,
    note: row.note ?? null,
    createdAt: row.created_at,
    userId: row.user_id,
  }))
}

export async function getTopDonors(fundId: string, limit = 3): Promise<TopDonor[]> {
  const supabase = await createClient()

  const [{ data: rows, error: txError }, { data: profiles, error: profilesError }] = await Promise.all([
    supabase
      .from('class_transactions')
      .select('payer_name, amount, user_id')
      .eq('fund_id', fundId)
      .eq('status', 'approved')
      .gt('amount', 0),
    supabase.rpc('get_all_usernames'),
  ])
  if (txError) throw txError
  if (profilesError) throw profilesError

  const usernameById = new Map<string, string | null>(
    ((profiles ?? []) as { id: string; username: string | null }[]).map(p => [p.id, p.username]),
  )

  // Group by user_id when present so the same person's payments merge into one
  // total regardless of how they typed their name across submissions; rows with
  // no linked profile (e.g. admin-entered adjustments) fall back to payer_name.
  const totals = new Map<string, { payerName: string; total: number }>()
  for (const row of rows ?? []) {
    const key = row.user_id ?? `name:${row.payer_name}`
    const displayName = (row.user_id && usernameById.get(row.user_id)) || row.payer_name
    const existing = totals.get(key)
    if (existing) {
      existing.total += row.amount
    } else {
      totals.set(key, { payerName: displayName, total: row.amount })
    }
  }

  return [...totals.values()]
    .sort((a, b) => b.total - a.total)
    .slice(0, limit)
}

export async function adjustFundBalance(
  fundId: string,
  delta: number,
  name: string,
  reason: string,
): Promise<void> {
  const supabase = await createClient()

  const { error: txError } = await supabase
    .from('class_transactions')
    .insert({
      fund_id: fundId,
      amount: delta,
      payer_name: name,
      note: reason,
      status: 'approved',
    })
  if (txError) throw txError

  const { data, error: fetchError } = await supabase
    .from('class_funds')
    .select('balance')
    .eq('id', fundId)
    .single()
  if (fetchError) throw fetchError

  const { error } = await supabase
    .from('class_funds')
    .update({ balance: data.balance + delta })
    .eq('id', fundId)
  if (error) throw error
}

export async function reportPayment(
  fundId: string,
  amount: number,
  payerName: string,
  note: string,
  userId: string | null,
): Promise<void> {
  const supabase = await createClient()
  const { error } = await supabase
    .from('class_transactions')
    .insert({
      fund_id: fundId,
      amount,
      payer_name: payerName,
      note,
      status: 'pending',
      user_id: userId,
    })
  if (error) throw error
}

export async function rejectTransaction(transactionId: string): Promise<void> {
  const supabase = await createClient()

  const { data: transaction, error: fetchError } = await supabase
    .from('class_transactions')
    .select('status')
    .eq('id', transactionId)
    .single()
  if (fetchError) throw fetchError
  if (transaction.status !== 'pending') return

  const { error } = await supabase
    .from('class_transactions')
    .update({ status: 'rejected' })
    .eq('id', transactionId)
  if (error) throw error
}

export async function approveTransaction(fundId: string, transactionId: string): Promise<void> {
  const supabase = await createClient()

  const { data: transaction, error: fetchError } = await supabase
    .from('class_transactions')
    .select('amount, status')
    .eq('id', transactionId)
    .single()
  if (fetchError) throw fetchError
  if (transaction.status === 'approved') return

  const { error: updateError } = await supabase
    .from('class_transactions')
    .update({ status: 'approved' })
    .eq('id', transactionId)
  if (updateError) throw updateError

  const { data: fund, error: fundFetchError } = await supabase
    .from('class_funds')
    .select('balance')
    .eq('id', fundId)
    .single()
  if (fundFetchError) throw fundFetchError

  const { error: balanceError } = await supabase
    .from('class_funds')
    .update({ balance: fund.balance + transaction.amount })
    .eq('id', fundId)
  if (balanceError) throw balanceError
}
