import { useNotificationPolling } from '../../hooks/useNotificationPolling'
import { ChatWindow } from '../ChatWindow/ChatWindow'
import { Sidebar } from '../Sidebar/Sidebar'
import styles from './ChatLayout.module.scss'

export function ChatLayout() {
  useNotificationPolling()

  return (
    <div className={styles.layout}>
      <div className={styles.shell}>
        <Sidebar />
        <ChatWindow />
      </div>
    </div>
  )
}
