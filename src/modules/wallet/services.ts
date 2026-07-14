import { createClient } from '@/supabase/server'
import { decryptField, encryptField } from './crypto'
import type {
  AccessibleWallet,
  AnalyticsSummary,
  BudgetLimit,
  CategoryBreakdown,
  MonthlyTotals,
  PaymentAccount,
  PaymentAccountType,
  PersonalAccount,
  PersonalTransaction,
  SharePermission,
  TransactionCategory,
  TransactionType,
  WalletMember,
  WalletSummary,
} from './types'

export * from './types'

function mapAccount(row: { id: string; name: string; owner_id: string }): PersonalAccount {
  return { id: row.id, name: row.name, ownerId: row.owner_id }
}

async function getUsernameMap(supabase: Awaited<ReturnType<typeof createClient>>): Promise<Map<string, string | null>> {
  const { data, error } = await supabase.rpc('get_all_usernames')
  if (error) throw error
  return new Map(((data ?? []) as { id: string; username: string | null }[]).map(row => [row.id, row.username]))
}

export async function ensureDefaultAccount(): Promise<PersonalAccount> {
  const supabase = await createClient()
  const { data, error } = await supabase.rpc('ensure_default_account')
  if (error) throw error
  return mapAccount(data)
}

export async function getAccessibleWallets(userId: string): Promise<AccessibleWallet[]> {
  const supabase = await createClient()
  const [{ data: owned, error: ownedError }, { data: shared, error: sharedError }] = await Promise.all([
    supabase.from('personal_accounts').select('id, name, owner_id').eq('owner_id', userId),
    supabase
      .from('wallet_shares')
      .select('permission_level, personal_accounts(id, name, owner_id)')
      .eq('shared_with_user_id', userId),
  ])
  if (ownedError) throw ownedError
  if (sharedError) throw sharedError

  const ownedWallets: AccessibleWallet[] = (owned ?? []).map(row => ({
    account: mapAccount(row),
    role: 'owner',
    permission: 'edit',
  }))

  type SharedRow = {
    permission_level: string
    personal_accounts: { id: string; name: string; owner_id: string } | null
  }
  function hasAccount(row: SharedRow): row is SharedRow & { personal_accounts: NonNullable<SharedRow['personal_accounts']> } {
    return row.personal_accounts !== null
  }

  const sharedWallets: AccessibleWallet[] = ((shared ?? []) as unknown as SharedRow[])
    .filter(hasAccount)
    .map(row => ({
      account: mapAccount(row.personal_accounts),
      role: 'partner',
      permission: row.permission_level as SharePermission,
    }))

  return [...ownedWallets, ...sharedWallets]
}

export async function getSharedWallets(userId: string): Promise<AccessibleWallet[]> {
  const wallets = await getAccessibleWallets(userId)
  return wallets.filter(wallet => wallet.role === 'partner')
}

export async function getWalletAccess(accountId: string, userId: string): Promise<AccessibleWallet | null> {
  const wallets = await getAccessibleWallets(userId)
  return wallets.find(wallet => wallet.account.id === accountId) ?? null
}

export async function getWalletMembers(accountId: string): Promise<WalletMember[]> {
  const supabase = await createClient()
  const [{ data: account, error: accountError }, { data: shares, error: sharesError }, usernameById] =
    await Promise.all([
      supabase.from('personal_accounts').select('owner_id').eq('id', accountId).single(),
      supabase.from('wallet_shares').select('shared_with_user_id, permission_level').eq('account_id', accountId),
      getUsernameMap(supabase),
    ])
  if (accountError) throw accountError
  if (sharesError) throw sharesError

  const members: WalletMember[] = [
    {
      userId: account.owner_id,
      username: usernameById.get(account.owner_id) ?? null,
      role: 'owner',
      permission: null,
    },
  ]
  for (const share of shares ?? []) {
    members.push({
      userId: share.shared_with_user_id,
      username: usernameById.get(share.shared_with_user_id) ?? null,
      role: 'partner',
      permission: share.permission_level as SharePermission,
    })
  }
  return members
}

export async function inviteUserToWallet(
  accountId: string,
  email: string,
  permission: SharePermission,
): Promise<{ error?: string }> {
  const supabase = await createClient()

  const { data: account, error: accountError } = await supabase
    .from('personal_accounts')
    .select('owner_id')
    .eq('id', accountId)
    .single()
  if (accountError) throw accountError

  const { data: matches, error: lookupError } = await supabase.rpc('find_user_by_email', {
    p_email: email.trim(),
  })
  if (lookupError) throw lookupError
  const match = (matches as { id: string; username: string | null }[] | null)?.[0]
  if (!match) return { error: 'Không tìm thấy người dùng với email này.' }
  if (match.id === account.owner_id) return { error: 'Đây đã là chủ sở hữu ví này.' }

  const { data: existingShare, error: existingError } = await supabase
    .from('wallet_shares')
    .select('id')
    .eq('account_id', accountId)
    .eq('shared_with_user_id', match.id)
    .maybeSingle()
  if (existingError) throw existingError
  if (existingShare) return { error: 'Người dùng này đã có quyền truy cập ví.' }

  const { error: insertError } = await supabase.from('wallet_shares').insert({
    account_id: accountId,
    shared_with_user_id: match.id,
    permission_level: permission,
  })
  if (insertError) return { error: 'Đã có lỗi xảy ra, vui lòng thử lại.' }

  return {}
}

export async function revokeWalletShare(accountId: string, sharedWithUserId: string): Promise<void> {
  const supabase = await createClient()
  const { error } = await supabase
    .from('wallet_shares')
    .delete()
    .eq('account_id', accountId)
    .eq('shared_with_user_id', sharedWithUserId)
  if (error) throw error
}

export async function getPersonalTransactions(accountId: string): Promise<PersonalTransaction[]> {
  const supabase = await createClient()
  const [{ data, error }, usernameById] = await Promise.all([
    supabase
      .from('personal_transactions')
      .select('id, amount, type, category, description, created_at, user_id, payment_account_id')
      .eq('account_id', accountId)
      .order('created_at', { ascending: false }),
    getUsernameMap(supabase),
  ])
  if (error) throw error
  return (data ?? []).map(row => ({
    id: row.id,
    amount: Number(decryptField(row.amount)),
    type: row.type as TransactionType,
    category: decryptField(row.category) as TransactionCategory,
    description: row.description ? decryptField(row.description) : null,
    createdAt: row.created_at,
    createdBy: row.user_id,
    creatorName: row.user_id ? (usernameById.get(row.user_id) ?? null) : null,
    paymentAccountId: row.payment_account_id,
  }))
}

export async function getWalletSummary(accountId: string): Promise<WalletSummary> {
  const supabase = await createClient()
  const { data, error } = await supabase
    .from('personal_transactions')
    .select('amount, type')
    .eq('account_id', accountId)
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

export async function getCategoryBreakdown(accountId: string): Promise<CategoryBreakdown[]> {
  const supabase = await createClient()
  const { data, error } = await supabase
    .from('personal_transactions')
    .select('amount, category')
    .eq('account_id', accountId)
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

export async function getUserCategories(accountId: string): Promise<string[]> {
  const supabase = await createClient()
  const { data, error } = await supabase
    .from('personal_categories')
    .select('name')
    .eq('account_id', accountId)
    .order('created_at', { ascending: true })
  if (error) throw error
  return (data ?? []).map(row => decryptField(row.name))
}

export async function addUserCategory(
  accountId: string,
  userId: string,
  name: string,
  existing: string[],
): Promise<void> {
  const isDuplicate = existing.some(c => c.toLowerCase() === name.toLowerCase())
  if (isDuplicate) return

  const supabase = await createClient()
  const { error } = await supabase.from('personal_categories').insert({
    account_id: accountId,
    user_id: userId,
    name: encryptField(name),
  })
  if (error) throw error
}

export async function addPersonalTransaction(
  accountId: string,
  createdBy: string,
  amount: number,
  type: TransactionType,
  category: TransactionCategory,
  description: string | null,
  paymentAccountId: string | null,
): Promise<void> {
  const supabase = await createClient()
  const { error } = await supabase.from('personal_transactions').insert({
    account_id: accountId,
    user_id: createdBy,
    amount: encryptField(String(amount)),
    type,
    category: encryptField(category),
    description: description ? encryptField(description) : null,
    payment_account_id: paymentAccountId,
  })
  if (error) throw error
}

export async function updatePersonalTransaction(
  transactionId: string,
  amount: number,
  type: TransactionType,
  category: TransactionCategory,
  description: string | null,
  paymentAccountId: string | null,
): Promise<void> {
  const supabase = await createClient()
  const { error } = await supabase
    .from('personal_transactions')
    .update({
      amount: encryptField(String(amount)),
      type,
      category: encryptField(category),
      description: description ? encryptField(description) : null,
      payment_account_id: paymentAccountId,
    })
    .eq('id', transactionId)
  if (error) throw error
}

export async function deletePersonalTransaction(transactionId: string): Promise<void> {
  const supabase = await createClient()
  const { error } = await supabase.from('personal_transactions').delete().eq('id', transactionId)
  if (error) throw error
}

export async function renameAccount(accountId: string, name: string): Promise<void> {
  const supabase = await createClient()
  const { error } = await supabase.from('personal_accounts').update({ name }).eq('id', accountId)
  if (error) throw error
}

export async function getPaymentAccounts(accountId: string): Promise<PaymentAccount[]> {
  const supabase = await createClient()
  const [{ data: accounts, error: accountsError }, { data: txns, error: txnsError }] = await Promise.all([
    supabase
      .from('personal_payment_accounts')
      .select('id, name, type')
      .eq('account_id', accountId)
      .order('created_at', { ascending: true }),
    supabase
      .from('personal_transactions')
      .select('amount, type, payment_account_id')
      .eq('account_id', accountId)
      .not('payment_account_id', 'is', null),
  ])
  if (accountsError) throw accountsError
  if (txnsError) throw txnsError

  const balanceById = new Map<string, number>()
  for (const row of txns ?? []) {
    if (!row.payment_account_id) continue
    const amount = Number(decryptField(row.amount))
    const delta = row.type === 'income' ? amount : -amount
    balanceById.set(row.payment_account_id, (balanceById.get(row.payment_account_id) ?? 0) + delta)
  }

  return (accounts ?? []).map(row => ({
    id: row.id,
    name: row.name,
    type: row.type as PaymentAccountType,
    balance: balanceById.get(row.id) ?? 0,
  }))
}

export async function createPaymentAccount(
  accountId: string,
  createdBy: string,
  name: string,
  type: PaymentAccountType,
): Promise<void> {
  const supabase = await createClient()
  const { error } = await supabase.from('personal_payment_accounts').insert({
    account_id: accountId,
    created_by: createdBy,
    name,
    type,
  })
  if (error) throw error
}

export async function getBudgetLimits(accountId: string): Promise<BudgetLimit[]> {
  const supabase = await createClient()
  const [{ data, error }, breakdown] = await Promise.all([
    supabase.from('budget_limits').select('id, category, limit_amount').eq('account_id', accountId),
    getCategoryBreakdown(accountId),
  ])
  if (error) throw error

  const spentByCategory = new Map(breakdown.map(item => [item.category, item.total]))

  return (data ?? []).map(row => {
    const category = decryptField(row.category) as TransactionCategory
    const limitAmount = Number(decryptField(row.limit_amount))
    const spent = spentByCategory.get(category) ?? 0
    return {
      id: row.id,
      category,
      limitAmount,
      spent,
      percentage: limitAmount > 0 ? (spent / limitAmount) * 100 : 0,
    }
  })
}

export async function setBudgetLimit(
  accountId: string,
  createdBy: string,
  category: TransactionCategory,
  limitAmount: number,
): Promise<void> {
  const supabase = await createClient()
  const { data: existing, error: existingError } = await supabase
    .from('budget_limits')
    .select('id, category')
    .eq('account_id', accountId)
  if (existingError) throw existingError

  const match = (existing ?? []).find(row => decryptField(row.category) === category)

  if (match) {
    const { error } = await supabase
      .from('budget_limits')
      .update({ limit_amount: encryptField(String(limitAmount)), updated_at: new Date().toISOString() })
      .eq('id', match.id)
    if (error) throw error
    return
  }

  const { error } = await supabase.from('budget_limits').insert({
    account_id: accountId,
    created_by: createdBy,
    category: encryptField(category),
    limit_amount: encryptField(String(limitAmount)),
  })
  if (error) throw error
}

function monthRange(date: Date) {
  const start = new Date(date.getFullYear(), date.getMonth(), 1)
  const end = new Date(date.getFullYear(), date.getMonth() + 1, 1)
  return { start, end }
}

function monthLabel(date: Date) {
  return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`
}

function monthlyChangePercentage(current: number, previous: number): number | null {
  if (previous === 0) return current === 0 ? 0 : null
  return ((current - previous) / previous) * 100
}

export async function getMonthlyAnalytics(accountId: string): Promise<AnalyticsSummary> {
  const supabase = await createClient()
  const now = new Date()
  const currentRange = monthRange(now)
  const previousMonthDate = new Date(now.getFullYear(), now.getMonth() - 1, 1)

  const { data, error } = await supabase
    .from('personal_transactions')
    .select('amount, type, created_at')
    .eq('account_id', accountId)
    .gte('created_at', monthRange(previousMonthDate).start.toISOString())
    .lt('created_at', currentRange.end.toISOString())
  if (error) throw error

  const current: MonthlyTotals = { month: monthLabel(now), income: 0, expense: 0 }
  const previous: MonthlyTotals = { month: monthLabel(previousMonthDate), income: 0, expense: 0 }

  for (const row of data ?? []) {
    const amount = Number(decryptField(row.amount))
    const bucket = new Date(row.created_at) >= currentRange.start ? current : previous
    if (row.type === 'income') bucket.income += amount
    else bucket.expense += amount
  }

  return {
    current,
    previous,
    incomeChangePercentage: monthlyChangePercentage(current.income, previous.income),
    expenseChangePercentage: monthlyChangePercentage(current.expense, previous.expense),
  }
}
