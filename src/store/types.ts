export type MessageDirection = 'incoming' | 'outgoing'
export type MessageStatus = 'sending' | 'sent' | 'failed'

export interface ChatMessage {
  id: string
  chatId: string
  text: string
  timestamp: number
  direction: MessageDirection
  status: MessageStatus
  senderName?: string
}

export interface Chat {
  chatId: string
  phone: string
  name: string
  lastMessage?: string
  lastTimestamp?: number
  unreadCount: number
}
