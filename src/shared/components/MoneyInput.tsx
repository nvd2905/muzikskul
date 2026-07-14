'use client'

import type { ChangeEvent } from 'react'

export function formatMoneyInput(raw: string): string {
  const digits = raw.replace(/\D/g, '')
  if (!digits) return ''
  return parseInt(digits, 10).toLocaleString('vi-VN')
}

export function parseMoneyInput(formatted: string): number {
  const digits = formatted.replace(/\D/g, '')
  return digits ? parseInt(digits, 10) : 0
}

type MoneyInputProps = {
  value: string
  onChange: (formatted: string) => void
  placeholder?: string
  className?: string
  autoFocus?: boolean
  id?: string
}

export default function MoneyInput({ value, onChange, placeholder, className, autoFocus, id }: MoneyInputProps) {
  function handleChange(e: ChangeEvent<HTMLInputElement>) {
    onChange(formatMoneyInput(e.target.value))
  }

  return (
    <input
      id={id}
      type="text"
      inputMode="numeric"
      value={value}
      onChange={handleChange}
      placeholder={placeholder}
      autoFocus={autoFocus}
      className={className}
    />
  )
}
