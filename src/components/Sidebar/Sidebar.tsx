import clsx from 'clsx'
import { useMemo, useState } from 'react'
import { useChatStore } from '../../store/useChatStore'
import { formatChatTime } from '../../utils/format'
import { formatPhoneDisplay } from '../../utils/phone'
import { Avatar } from '../Avatar/Avatar'
import { NewChatModal } from '../NewChatModal/NewChatModal'
import styles from './Sidebar.module.scss'

export function Sidebar() {
  const chats = useChatStore((state) => state.chats)
  const activeChatId = useChatStore((state) => state.activeChatId)
  const selectChat = useChatStore((state) => state.selectChat)
  const logout = useChatStore((state) => state.logout)
  const credentials = useChatStore((state) => state.credentials)
  const connectionLabel = useChatStore((state) => state.connectionLabel)
  const sidebarOpen = useChatStore((state) => state.sidebarOpen)

  const [query, setQuery] = useState('')
  const [isModalOpen, setIsModalOpen] = useState(false)

  const filteredChats = useMemo(() => {
    const normalized = query.trim().toLowerCase()
    if (!normalized) return chats
    return chats.filter(
      (chat) =>
        chat.name.toLowerCase().includes(normalized) ||
        chat.phone.includes(normalized) ||
        chat.chatId.includes(normalized),
    )
  }, [chats, query])

  const statusText =
    connectionLabel === 'online'
      ? 'Подключено'
      : connectionLabel === 'connecting'
        ? 'Подключение…'
        : 'Офлайн'

  return (
    <>
      <aside className={clsx(styles.sidebar, sidebarOpen && styles.open)}>
        <div className={styles.top}>
          <div className={styles.profile}>
            <div className={styles.brandMark}>M</div>
            <div>
              <div className={styles.title}>Чаты</div>
              <div className={styles.meta}>
                <span
                  className={clsx(
                    styles.dot,
                    connectionLabel === 'online' && styles.online,
                    connectionLabel === 'connecting' && styles.connecting,
                  )}
                />
                {statusText}
                {credentials ? ` · ${credentials.idInstance}` : null}
              </div>
            </div>
          </div>

          <div className={styles.actions}>
            <button type="button" className={styles.iconButton} onClick={() => setIsModalOpen(true)}>
              Новый чат
            </button>
            <button type="button" className={styles.ghostButton} onClick={logout}>
              Выйти
            </button>
          </div>
        </div>

        <div className={styles.search}>
          <input
            value={query}
            onChange={(event) => setQuery(event.target.value)}
            placeholder="Поиск"
            aria-label="Поиск по чатам"
          />
        </div>

        <div className={styles.list}>
          {filteredChats.length === 0 ? (
            <div className={styles.empty}>
              <p>Пока нет диалогов</p>
              <button type="button" onClick={() => setIsModalOpen(true)}>
                Создать чат
              </button>
            </div>
          ) : (
            filteredChats.map((chat) => (
              <button
                key={chat.chatId}
                type="button"
                className={clsx(styles.chatItem, activeChatId === chat.chatId && styles.active)}
                onClick={() => selectChat(chat.chatId)}
              >
                <Avatar name={chat.name} />
                <div className={styles.chatBody}>
                  <div className={styles.chatRow}>
                    <span className={styles.chatName}>{chat.name}</span>
                    <span className={styles.chatTime}>{formatChatTime(chat.lastTimestamp)}</span>
                  </div>
                  <div className={styles.chatRow}>
                    <span className={styles.preview}>
                      {chat.lastMessage || formatPhoneDisplay(chat.phone) || chat.chatId}
                    </span>
                    {chat.unreadCount > 0 ? (
                      <span className={styles.badge}>{chat.unreadCount}</span>
                    ) : null}
                  </div>
                </div>
              </button>
            ))
          )}
        </div>
      </aside>

      <NewChatModal open={isModalOpen} onClose={() => setIsModalOpen(false)} />
    </>
  )
}
