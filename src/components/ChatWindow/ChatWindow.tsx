import { useChatStore } from '../../store/useChatStore'
import { formatPhoneDisplay } from '../../utils/phone'
import { Avatar } from '../Avatar/Avatar'
import { MessageInput } from '../MessageInput/MessageInput'
import { MessageList } from '../MessageList/MessageList'
import styles from './ChatWindow.module.scss'

export function ChatWindow() {
  const activeChatId = useChatStore((state) => state.activeChatId)
  const chats = useChatStore((state) => state.chats)
  const messagesByChat = useChatStore((state) => state.messagesByChat)
  const setSidebarOpen = useChatStore((state) => state.setSidebarOpen)

  const activeChat = chats.find((chat) => chat.chatId === activeChatId) ?? null
  const messages = activeChatId ? (messagesByChat[activeChatId] ?? []) : []

  if (!activeChat) {
    return (
      <section className={styles.emptyState}>
        <button
          type="button"
          className={styles.mobileOpen}
          onClick={() => setSidebarOpen(true)}
        >
          Открыть чаты
        </button>
        <div className={styles.hero}>
          <div className={styles.heroMark}>MAX</div>
          <h2>Выберите чат или создайте новый</h2>
          <p>
            Минимальный прототип веб-чата: вход по GREEN-API, создание диалога по номеру и обмен
            текстовыми сообщениями с MAX.
          </p>
        </div>
      </section>
    )
  }

  return (
    <section className={styles.window}>
      <header className={styles.header}>
        <button
          type="button"
          className={styles.back}
          onClick={() => setSidebarOpen(true)}
          aria-label="К списку чатов"
        >
          ←
        </button>
        <Avatar name={activeChat.name} size="sm" />
        <div className={styles.headerText}>
          <div className={styles.name}>{activeChat.name}</div>
          <div className={styles.sub}>
            {formatPhoneDisplay(activeChat.phone) || `chatId: ${activeChat.chatId}`}
          </div>
        </div>
      </header>

      <div className={styles.messages}>
        <MessageList messages={messages} />
      </div>

      <MessageInput />
    </section>
  )
}
