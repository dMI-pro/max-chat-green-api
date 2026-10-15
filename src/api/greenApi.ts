import type {
  CheckAccountResponse,
  Credentials,
  GetStateInstanceResponse,
  GreenApiErrorPayload,
  ReceiveNotificationResponse,
  SendMessageResponse,
} from './types'

export class GreenApiError extends Error {
  status: number

  constructor(message: string, status: number) {
    super(message)
    this.name = 'GreenApiError'
    this.status = status
  }
}

function resolveRequestBase(apiUrl: string): string {
  const normalized = apiUrl.replace(/\/$/, '')

  if (import.meta.env.DEV) {
    try {
      const host = new URL(normalized).host
      return `/green-api/${host}`
    } catch {
      return normalized
    }
  }

  return normalized
}

function buildUrl(credentials: Credentials, methodPath: string): string {
  const base = resolveRequestBase(credentials.apiUrl)
  return `${base}/waInstance${credentials.idInstance}/${methodPath}/${credentials.apiTokenInstance}`
}

async function parseError(response: Response): Promise<never> {
  let message = `Ошибка GREEN-API (${response.status})`

  try {
    const data = (await response.json()) as GreenApiErrorPayload | string
    if (typeof data === 'string' && data.trim()) {
      message = data
    } else if (typeof data === 'object' && data) {
      message = data.message || data.reason || message
    }
  } catch {
    // keep default message
  }

  throw new GreenApiError(message, response.status)
}

async function request<T>(
  url: string,
  init?: RequestInit,
  options?: { allowEmpty?: boolean },
): Promise<T | null> {
  const response = await fetch(url, {
    ...init,
    headers: {
      Accept: 'application/json',
      ...(init?.body ? { 'Content-Type': 'application/json' } : {}),
      ...init?.headers,
    },
  })

  if (!response.ok) {
    await parseError(response)
  }

  const text = await response.text()
  if (!text.trim()) {
    if (options?.allowEmpty) return null
    throw new GreenApiError('Пустой ответ от GREEN-API', response.status)
  }

  return JSON.parse(text) as T
}

export function resolveApiUrlFromInstance(idInstance: string): string {
  const digits = idInstance.replace(/\D/g, '')
  const prefix = digits.slice(0, 4) || '3100'
  return `https://${prefix}.api.green-api.com`
}

export async function getStateInstance(
  credentials: Credentials,
): Promise<GetStateInstanceResponse> {
  const data = await request<GetStateInstanceResponse>(
    buildUrl(credentials, 'getStateInstance'),
  )
  return data!
}

export async function setSettingsForHttpApi(credentials: Credentials): Promise<void> {
  await request(buildUrl(credentials, 'setSettings'), {
    method: 'POST',
    body: JSON.stringify({
      webhookUrl: '',
      incomingWebhook: 'yes',
      outgoingWebhook: 'yes',
      outgoingAPIMessageWebhook: 'yes',
      outgoingMessageWebhook: 'yes',
      stateWebhook: 'yes',
    }),
  })
}

export async function checkAccount(
  credentials: Credentials,
  phoneNumber: number,
): Promise<CheckAccountResponse> {
  const data = await request<CheckAccountResponse>(buildUrl(credentials, 'checkAccount'), {
    method: 'POST',
    body: JSON.stringify({ phoneNumber }),
  })
  return data!
}

export async function sendMessage(
  credentials: Credentials,
  chatId: string,
  message: string,
): Promise<SendMessageResponse> {
  const data = await request<SendMessageResponse>(buildUrl(credentials, 'sendMessage'), {
    method: 'POST',
    body: JSON.stringify({ chatId, message }),
  })
  return data!
}

export async function receiveNotification(
  credentials: Credentials,
  receiveTimeout = 20,
  signal?: AbortSignal,
): Promise<ReceiveNotificationResponse | null> {
  const url = `${buildUrl(credentials, 'receiveNotification')}?receiveTimeout=${receiveTimeout}`
  return request<ReceiveNotificationResponse>(url, { signal }, { allowEmpty: true })
}

export async function deleteNotification(
  credentials: Credentials,
  receiptId: number,
): Promise<void> {
  await request(buildUrl(credentials, `deleteNotification/${receiptId}`), {
    method: 'DELETE',
  })
}
