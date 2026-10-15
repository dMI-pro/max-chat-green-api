import clsx from 'clsx'
import type { ChatMessage } from '../../store/types'
import { formatMessageTime } from '../../utils/format'
import styles from './MessageBubble.module.scss'

interface MessageBubbleProps {
  message: ChatMessage
}

export function MessageBubble({ message }: MessageBubbleProps) {
  const isOutgoing = message.direction === 'outgoing'

  return (
    <div className={clsx(styles.row, isOutgoing ? styles.out : styles.in)}>
      <div
        className={clsx(
          styles.bubble,
          isOutgoing ? styles.outgoing : styles.incoming,
          message.status === 'failed' && styles.failed,
        )}
      >
        <div className={styles.text}>{message.text}</div>
        <div className={styles.meta}>
          <span>{formatMessageTime(message.timestamp)}</span>
          {isOutgoing ? (
            <span className={styles.status}>
              {message.status === 'sending' ? '…' : message.status === 'failed' ? '!' : '✓'}
            </span>
          ) : null}
        </div>
      </div>
    </div>
  )
}
