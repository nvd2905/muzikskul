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
