/** Нормализует ввод телефона к международному формату (только цифры). */
export function normalizePhone(input: string): string {
  let digits = input.replace(/\D/g, '')

  if (digits.length === 11 && digits.startsWith('8')) {
    digits = `7${digits.slice(1)}`
  }

  return digits
}

export function isValidPhone(digits: string): boolean {
  // РФ: 11 цифр (7...), РБ: 12 цифр (375...)
  if (digits.startsWith('375')) {
    return digits.length === 12
  }
  if (digits.startsWith('7')) {
    return digits.length === 11
  }
  return false
}

export function formatPhoneDisplay(digits: string): string {
  if (digits.startsWith('7') && digits.length === 11) {
    return `+7 (${digits.slice(1, 4)}) ${digits.slice(4, 7)}-${digits.slice(7, 9)}-${digits.slice(9)}`
  }
  if (digits.startsWith('375') && digits.length === 12) {
    return `+375 (${digits.slice(3, 5)}) ${digits.slice(5, 8)}-${digits.slice(8, 10)}-${digits.slice(10)}`
  }
  return digits ? `+${digits}` : ''
}
