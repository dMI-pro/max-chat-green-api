import { useEffect, useRef } from 'react'
import { deleteNotification, receiveNotification } from '../api/greenApi'
import { useChatStore } from '../store/useChatStore'

/**
 * Long-polling по технологии HTTP API:
 * ReceiveNotification → обработка → DeleteNotification → снова ReceiveNotification.
 */
export function useNotificationPolling() {
  const credentials = useChatStore((state) => state.credentials)
  const applyWebhook = useChatStore((state) => state.applyWebhook)
  const setConnectionLabel = useChatStore((state) => state.setConnectionLabel)
  const loopIdRef = useRef(0)

  useEffect(() => {
    if (!credentials) {
      setConnectionLabel('offline')
      return
    }

    const loopId = ++loopIdRef.current
    const controller = new AbortController()
    let cancelled = false

    const sleep = (ms: number) =>
      new Promise<void>((resolve) => {
        const timer = window.setTimeout(resolve, ms)
        controller.signal.addEventListener(
          'abort',
          () => {
            window.clearTimeout(timer)
            resolve()
          },
          { once: true },
        )
      })

    const run = async () => {
      setConnectionLabel('connecting')

      while (!cancelled && loopIdRef.current === loopId) {
        try {
          const notification = await receiveNotification(credentials, 20, controller.signal)

          if (cancelled || loopIdRef.current !== loopId) break

          setConnectionLabel('online')

          if (!notification) {
            continue
          }

          applyWebhook(notification.body)

          try {
            await deleteNotification(credentials, notification.receiptId)
          } catch {
            // Если удаление не удалось, на следующей итерации придёт то же уведомление.
            await sleep(1000)
          }
        } catch (error) {
          if (cancelled || controller.signal.aborted || loopIdRef.current !== loopId) {
            break
          }

          setConnectionLabel('connecting')
          console.error('Polling error:', error)
          await sleep(2000)
        }
      }
    }

    void run()

    return () => {
      cancelled = true
      controller.abort()
    }
  }, [credentials, applyWebhook, setConnectionLabel])
}
