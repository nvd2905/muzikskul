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
  status: 'pending' | 'approved'
  invoice_url: string | null
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
    .select('id, amount, payer_name, status, invoice_url')
    .eq('fund_id', fundId)
    .order('created_at', { ascending: false })
  if (error) throw error
  return (data ?? []).map(row => ({
    id: row.id,
    amount: row.amount,
    payerName: row.payer_name,
    status: row.status as Transaction['status'],
    invoice_url: row.invoice_url,
  }))
}

export async function updateTransactionStatus(
  transactionId: string,
  status: 'pending' | 'approved',
): Promise<void> {
  const supabase = await createClient()
  const { error } = await supabase
    .from('class_transactions')
    .update({ status })
    .eq('id', transactionId)
  if (error) throw error
}
