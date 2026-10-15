import { create } from 'zustand'
import { persist } from 'zustand/middleware'
import {
  checkAccount,
  getStateInstance,
  GreenApiError,
  resolveApiUrlFromInstance,
  sendMessage,
  setSettingsForHttpApi,
} from '../api/greenApi'
import type { Credentials, WebhookBody } from '../api/types'
import { extractTextFromWebhook } from '../utils/messageText'
import { formatPhoneDisplay, isValidPhone, normalizePhone } from '../utils/phone'
import type { Chat, ChatMessage } from './types'

interface ChatState {
  credentials: Credentials | null
  lastIdInstance: string | null
  chats: Chat[]
  messagesByChat: Record<string, ChatMessage[]>
  activeChatId: string | null
  isAuthenticating: boolean
  isCreatingChat: boolean
  authError: string | null
  connectionLabel: 'online' | 'connecting' | 'offline'
  sidebarOpen: boolean

  login: (idInstance: string, apiTokenInstance: string) => Promise<void>
  logout: () => void
  createChat: (phoneInput: string) => Promise<void>
  selectChat: (chatId: string) => void
  sendChatMessage: (text: string) => Promise<void>
  applyWebhook: (body: WebhookBody) => void
  setConnectionLabel: (label: ChatState['connectionLabel']) => void
  setSidebarOpen: (open: boolean) => void
}

function upsertChat(chats: Chat[], next: Chat): Chat[] {
  const index = chats.findIndex((chat) => chat.chatId === next.chatId)
  if (index === -1) {
    return [next, ...chats]
  }

  const updated = [...chats]
  updated[index] = { ...updated[index], ...next }
  return updated
}

function sortChats(chats: Chat[]): Chat[] {
  return [...chats].sort((a, b) => (b.lastTimestamp ?? 0) - (a.lastTimestamp ?? 0))
}

function appendMessage(
  messagesByChat: Record<string, ChatMessage[]>,
  message: ChatMessage,
): Record<string, ChatMessage[]> {
  const current = messagesByChat[message.chatId] ?? []
  if (current.some((item) => item.id === message.id)) {
    return messagesByChat
  }

  return {
    ...messagesByChat,
    [message.chatId]: [...current, message],
  }
}

export const useChatStore = create<ChatState>()(
  persist(
    (set, get) => ({
      credentials: null,
      lastIdInstance: null,
      chats: [],
      messagesByChat: {},
      activeChatId: null,
      isAuthenticating: false,
      isCreatingChat: false,
      authError: null,
      connectionLabel: 'offline',
      sidebarOpen: true,

      login: async (idInstance, apiTokenInstance) => {
        const trimmedId = idInstance.trim()
        const trimmedToken = apiTokenInstance.trim()

        if (!trimmedId || !trimmedToken) {
          set({ authError: 'Заполните idInstance и apiTokenInstance' })
          return
        }

        const credentials: Credentials = {
          idInstance: trimmedId,
          apiTokenInstance: trimmedToken,
          apiUrl: resolveApiUrlFromInstance(trimmedId),
        }

        set({ isAuthenticating: true, authError: null })

        try {
          const { stateInstance } = await getStateInstance(credentials)

          if (stateInstance !== 'authorized' && stateInstance !== 'suspended') {
            const hints: Record<string, string> = {
              notAuthorized: 'Инстанс не авторизован. Отсканируйте QR в личном кабинете GREEN-API.',
              blocked: 'Аккаунт MAX заблокирован.',
              starting: 'Инстанс запускается. Подождите пару минут и попробуйте снова.',
              pendingPassword: 'Требуется пароль 2FA для завершения авторизации инстанса.',
            }
            throw new Error(hints[stateInstance] ?? `Статус инстанса: ${stateInstance}`)
          }

          try {
            await setSettingsForHttpApi(credentials)
          } catch {
            // Не блокируем вход: пользователь мог уже настроить HTTP API вручную.
          }

          const previousId = get().lastIdInstance
          const switchedInstance = Boolean(previousId && previousId !== credentials.idInstance)

          set({
            credentials,
            lastIdInstance: credentials.idInstance,
            isAuthenticating: false,
            authError: null,
            connectionLabel: 'connecting',
            ...(switchedInstance
              ? {
                  chats: [],
                  messagesByChat: {},
                  activeChatId: null,
                }
              : {}),
          })
        } catch (error) {
          const message =
            error instanceof GreenApiError
              ? error.message
              : error instanceof Error
                ? error.message
                : 'Не удалось войти'

          set({
            credentials: null,
            isAuthenticating: false,
            authError: message,
            connectionLabel: 'offline',
          })
        }
      },

      logout: () => {
        set({
          credentials: null,
          activeChatId: null,
          authError: null,
          connectionLabel: 'offline',
          isAuthenticating: false,
        })
      },

      createChat: async (phoneInput) => {
        const { credentials } = get()
        if (!credentials) return

        const phone = normalizePhone(phoneInput)
        if (!isValidPhone(phone)) {
          throw new Error('Введите номер РФ (+7) или РБ (+375) в международном формате')
        }

        set({ isCreatingChat: true })

        try {
          const result = await checkAccount(credentials, Number(phone))

          if (result.status === false) {
            throw new Error(result.reason || 'Не удалось проверить номер')
          }

          if (!result.exist || !result.chatId) {
            throw new Error('Аккаунт MAX на этом номере не найден')
          }

          const chat: Chat = {
            chatId: result.chatId,
            phone,
            name: formatPhoneDisplay(phone),
            unreadCount: 0,
          }

          set((state) => ({
            chats: sortChats(upsertChat(state.chats, chat)),
            activeChatId: result.chatId!,
            isCreatingChat: false,
            sidebarOpen: false,
          }))
        } catch (error) {
          set({ isCreatingChat: false })
          throw error
        }
      },

      selectChat: (chatId) => {
        set((state) => ({
          activeChatId: chatId,
          sidebarOpen: false,
          chats: state.chats.map((chat) =>
            chat.chatId === chatId ? { ...chat, unreadCount: 0 } : chat,
          ),
        }))
      },

      sendChatMessage: async (text) => {
        const { credentials, activeChatId } = get()
        if (!credentials || !activeChatId) return

        const trimmed = text.trim()
        if (!trimmed) return

        const tempId = `local-${Date.now()}`
        const timestamp = Math.floor(Date.now() / 1000)
        const optimistic: ChatMessage = {
          id: tempId,
          chatId: activeChatId,
          text: trimmed,
          timestamp,
          direction: 'outgoing',
          status: 'sending',
        }

        set((state) => ({
          messagesByChat: appendMessage(state.messagesByChat, optimistic),
          chats: sortChats(
            state.chats.map((chat) =>
              chat.chatId === activeChatId
                ? {
                    ...chat,
                    lastMessage: trimmed,
                    lastTimestamp: timestamp,
                  }
                : chat,
            ),
          ),
        }))

        try {
          const { idMessage } = await sendMessage(credentials, activeChatId, trimmed)

          set((state) => {
            const list = state.messagesByChat[activeChatId] ?? []
            return {
              messagesByChat: {
                ...state.messagesByChat,
                [activeChatId]: list.map((message) =>
                  message.id === tempId
                    ? { ...message, id: idMessage, status: 'sent' as const }
                    : message,
                ),
              },
            }
          })
        } catch {
          set((state) => {
            const list = state.messagesByChat[activeChatId] ?? []
            return {
              messagesByChat: {
                ...state.messagesByChat,
                [activeChatId]: list.map((message) =>
                  message.id === tempId ? { ...message, status: 'failed' as const } : message,
                ),
              },
            }
          })
          throw new Error('Не удалось отправить сообщение')
        }
      },

      applyWebhook: (body) => {
        const text = extractTextFromWebhook(body)
        const chatId = body.senderData?.chatId
        const idMessage = body.idMessage

        if (!chatId || !idMessage || !text) {
          return
        }

        const isIncoming = body.typeWebhook === 'incomingMessageReceived'
        const isOutgoing =
          body.typeWebhook === 'outgoingMessageReceived' ||
          body.typeWebhook === 'outgoingAPIMessageReceived'

        if (!isIncoming && !isOutgoing) {
          return
        }

        const direction = isIncoming ? 'incoming' : 'outgoing'
        const senderName =
          body.senderData?.senderContactName ||
          body.senderData?.senderName ||
          body.senderData?.chatName ||
          undefined

        const phoneFromWebhook = body.senderData?.senderPhoneNumber
          ? String(body.senderData.senderPhoneNumber)
          : ''

        set((state) => {
          const existingMessages = state.messagesByChat[chatId] ?? []
          if (existingMessages.some((message) => message.id === idMessage)) {
            return state
          }

          // Игнорируем дубль исходящего API-сообщения, если уже есть локальная копия
          if (isOutgoing) {
            const hasLocalTwin = existingMessages.some(
              (message) =>
                message.direction === 'outgoing' &&
                message.text === text &&
                Math.abs(message.timestamp - body.timestamp) < 120,
            )
            if (hasLocalTwin) {
              return state
            }
          }

          const message: ChatMessage = {
            id: idMessage,
            chatId,
            text,
            timestamp: body.timestamp,
            direction,
            status: 'sent',
            senderName,
          }

          const existingChat = state.chats.find((chat) => chat.chatId === chatId)
          const chat: Chat = existingChat
            ? {
                ...existingChat,
                name: senderName || existingChat.name,
                lastMessage: text,
                lastTimestamp: body.timestamp,
                unreadCount:
                  isIncoming && state.activeChatId !== chatId
                    ? existingChat.unreadCount + 1
                    : existingChat.unreadCount,
              }
            : {
                chatId,
                phone: phoneFromWebhook,
                name: senderName || formatPhoneDisplay(phoneFromWebhook) || chatId,
                lastMessage: text,
                lastTimestamp: body.timestamp,
                unreadCount: isIncoming && state.activeChatId !== chatId ? 1 : 0,
              }

          return {
            messagesByChat: appendMessage(state.messagesByChat, message),
            chats: sortChats(upsertChat(state.chats, chat)),
          }
        })
      },

      setConnectionLabel: (label) => set({ connectionLabel: label }),
      setSidebarOpen: (open) => set({ sidebarOpen: open }),
    }),
    {
      name: 'max-chat-green-api',
      partialize: (state) => ({
        credentials: state.credentials,
        lastIdInstance: state.lastIdInstance,
        chats: state.chats,
        messagesByChat: state.messagesByChat,
        activeChatId: state.activeChatId,
      }),
    },
  ),
)
