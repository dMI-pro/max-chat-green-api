export type InstanceState =
  | 'authorized'
  | 'notAuthorized'
  | 'blocked'
  | 'starting'
  | 'suspended'
  | 'pendingPassword'

export interface Credentials {
  idInstance: string
  apiTokenInstance: string
  apiUrl: string
}

export interface SendMessageResponse {
  idMessage: string
}

export interface CheckAccountResponse {
  exist?: boolean
  chatId?: string
  fromCache?: boolean
  status?: boolean
  reason?: string
}

export interface GetStateInstanceResponse {
  stateInstance: InstanceState
}

export interface ReceiveNotificationResponse {
  receiptId: number
  body: WebhookBody
}

export type WebhookType =
  | 'incomingMessageReceived'
  | 'outgoingMessageReceived'
  | 'outgoingAPIMessageReceived'
  | 'outgoingMessageStatus'
  | 'stateInstanceChanged'
  | string

export interface WebhookBody {
  typeWebhook: WebhookType
  timestamp: number
  idMessage?: string
  senderData?: {
    chatId: string
    chatName?: string
    sender?: string
    senderName?: string
    senderContactName?: string
    senderPhoneNumber?: number | string
  }
  messageData?: {
    typeMessage?: string
    textMessageData?: {
      textMessage?: string
    }
    extendedTextMessageData?: {
      text?: string
    }
  }
  statusData?: {
    status?: string
  }
  stateInstance?: InstanceState
}

export interface GreenApiErrorPayload {
  message?: string
  reason?: string
}
