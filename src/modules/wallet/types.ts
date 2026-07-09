export type TransactionType = 'income' | 'expense'
export type TransactionCategory = string

// Built-in defaults, always available. Users can add their own on top of
// these via personal_categories (see getUserCategories/addUserCategory).
export const TRANSACTION_CATEGORIES: TransactionCategory[] = [
  'Food',
  'Study',
  'Transport',
  'Entertainment',
  'Others',
]

export type PersonalTransaction = {
  id: string
  amount: number
  type: TransactionType
  category: TransactionCategory
  description: string | null
  createdAt: string
  createdBy: string | null
  creatorName: string | null
}

export type WalletSummary = {
  totalIncome: number
  totalExpense: number
  balance: number
}

export type CategoryBreakdown = {
  category: TransactionCategory
  total: number
  percentage: number
}

export type SharePermission = 'view' | 'edit'

export type PersonalAccount = {
  id: string
  name: string
  ownerId: string
}

export type WalletRole = 'owner' | 'partner'

export type WalletMember = {
  userId: string
  username: string | null
  role: WalletRole
  permission: SharePermission | null
}

export type AccessibleWallet = {
  account: PersonalAccount
  role: WalletRole
  permission: SharePermission
}

export type PaymentAccountType = 'cash' | 'bank' | 'other'

export type PaymentAccount = {
  id: string
  name: string
  type: PaymentAccountType
  balance: number
}

export type BudgetLimit = {
  id: string
  category: TransactionCategory
  limitAmount: number
  spent: number
  percentage: number
}

export type MonthlyTotals = {
  month: string
  income: number
  expense: number
}

export type AnalyticsSummary = {
  current: MonthlyTotals
  previous: MonthlyTotals
  incomeChangePercentage: number | null
  expenseChangePercentage: number | null
}
