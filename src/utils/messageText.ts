import type { WebhookBody } from '../api/types'

export function extractTextFromWebhook(body: WebhookBody): string | null {
  const text =
    body.messageData?.textMessageData?.textMessage ??
    body.messageData?.extendedTextMessageData?.text

  if (typeof text === 'string' && text.trim()) {
    return text
  }

  const type = body.messageData?.typeMessage
  if (!type || type === 'textMessage' || type === 'extendedTextMessage') {
    return null
  }

  return `[${type}]`
}
