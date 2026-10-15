import { useEffect, useRef, useState } from 'react'
import type { FormEvent } from 'react'
import { useChatStore } from '../../store/useChatStore'
import styles from './NewChatModal.module.scss'

interface NewChatModalProps {
  open: boolean
  onClose: () => void
}

export function NewChatModal({ open, onClose }: NewChatModalProps) {
  const createChat = useChatStore((state) => state.createChat)
  const isCreatingChat = useChatStore((state) => state.isCreatingChat)
  const [phone, setPhone] = useState('')
  const [error, setError] = useState<string | null>(null)
  const inputRef = useRef<HTMLInputElement>(null)

  useEffect(() => {
    if (!open) return
    setPhone('')
    setError(null)
    const timer = window.setTimeout(() => inputRef.current?.focus(), 50)
    return () => window.clearTimeout(timer)
  }, [open])

  if (!open) return null

  const handleSubmit = async (event: FormEvent) => {
    event.preventDefault()
    setError(null)

    try {
      await createChat(phone)
      onClose()
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Не удалось создать чат')
    }
  }

  return (
    <div className={styles.overlay} onClick={onClose} role="presentation">
      <form
        className={styles.modal}
        onClick={(event) => event.stopPropagation()}
        onSubmit={handleSubmit}
      >
        <div className={styles.header}>
          <h2>Новый чат</h2>
          <button type="button" className={styles.close} onClick={onClose} aria-label="Закрыть">
            ×
          </button>
        </div>

        <p className={styles.description}>
          Введите номер телефона получателя в MAX. Мы проверим аккаунт через CheckAccount и создадим
          диалог.
        </p>

        <label className={styles.field}>
          <span>Номер телефона</span>
          <input
            ref={inputRef}
            value={phone}
            onChange={(event) => setPhone(event.target.value)}
            placeholder="+7 999 123-45-67"
            inputMode="tel"
          />
        </label>

        {error ? <div className={styles.error}>{error}</div> : null}

        <div className={styles.actions}>
          <button type="button" className={styles.secondary} onClick={onClose}>
            Отмена
          </button>
          <button type="submit" className={styles.primary} disabled={isCreatingChat}>
            {isCreatingChat ? 'Проверяем…' : 'Создать чат'}
          </button>
        </div>
      </form>
    </div>
  )
}
