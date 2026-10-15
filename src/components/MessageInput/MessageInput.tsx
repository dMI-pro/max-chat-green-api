import { useState } from 'react'
import type { FormEvent, KeyboardEvent } from 'react'
import { useChatStore } from '../../store/useChatStore'
import styles from './MessageInput.module.scss'

export function MessageInput() {
  const sendChatMessage = useChatStore((state) => state.sendChatMessage)
  const [text, setText] = useState('')
  const [error, setError] = useState<string | null>(null)
  const [isSending, setIsSending] = useState(false)

  const submit = async () => {
    if (!text.trim() || isSending) return

    setIsSending(true)
    setError(null)
    const value = text
    setText('')

    try {
      await sendChatMessage(value)
    } catch (err) {
      setText(value)
      setError(err instanceof Error ? err.message : 'Ошибка отправки')
    } finally {
      setIsSending(false)
    }
  }

  const handleSubmit = async (event: FormEvent) => {
    event.preventDefault()
    await submit()
  }

  const handleKeyDown = async (event: KeyboardEvent<HTMLTextAreaElement>) => {
    if (event.key === 'Enter' && !event.shiftKey) {
      event.preventDefault()
      await submit()
    }
  }

  return (
    <form className={styles.wrap} onSubmit={handleSubmit}>
      {error ? <div className={styles.error}>{error}</div> : null}
      <div className={styles.bar}>
        <textarea
          value={text}
          onChange={(event) => setText(event.target.value)}
          onKeyDown={handleKeyDown}
          placeholder="Сообщение"
          rows={1}
          maxLength={4000}
        />
        <button type="submit" disabled={!text.trim() || isSending} aria-label="Отправить">
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" aria-hidden>
            <path
              d="M4.5 12.5L19 5l-4.8 14.2-2.9-5.5L4.5 12.5z"
              fill="currentColor"
            />
          </svg>
        </button>
      </div>
    </form>
  )
}
