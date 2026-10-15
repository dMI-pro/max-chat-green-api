import { useEffect, useRef } from 'react'
import type { ChatMessage } from '../../store/types'
import { MessageBubble } from '../MessageBubble/MessageBubble'
import styles from './MessageList.module.scss'

interface MessageListProps {
  messages: ChatMessage[]
}

export function MessageList({ messages }: MessageListProps) {
  const bottomRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [messages])

  if (messages.length === 0) {
    return (
      <div className={styles.empty}>
        <div className={styles.emptyCard}>
          <h3>Начните переписку</h3>
          <p>Отправьте текстовое сообщение — ответ появится здесь через HTTP API polling.</p>
        </div>
      </div>
    )
  }

  return (
    <div className={styles.list}>
      {messages.map((message) => (
        <MessageBubble key={message.id} message={message} />
      ))}
      <div ref={bottomRef} />
    </div>
  )
}
