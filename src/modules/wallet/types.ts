export type TransactionType = 'income' | 'expense'
export type TransactionCategory = 'Food' | 'Study' | 'Transport' | 'Entertainment' | 'Others'

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
