type ReconnectingSocketHandlers = {
  onOpen?: () => void
  onMessage: (data: string) => void
  onError: (error: Error) => void
}

const BASE_RETRY_DELAY_MS = 1_000
const MAX_RETRY_DELAY_MS = 30_000

export function subscribeWithReconnect(url: URL, handlers: ReconnectingSocketHandlers): () => void {
  let stopped = false
  let socket: WebSocket | undefined
  let retryTimer: ReturnType<typeof setTimeout> | undefined
  let retryAttempt = 0

  const scheduleReconnect = () => {
    if (stopped || retryTimer !== undefined) return

    const delay = Math.min(BASE_RETRY_DELAY_MS * 2 ** retryAttempt, MAX_RETRY_DELAY_MS)
    retryAttempt += 1

    retryTimer = setTimeout(
      () => {
        retryTimer = undefined
        connect()
      },
      delay + Math.random() * 500,
    )
  }

  const connect = () => {
    if (stopped) return

    let current: WebSocket

    try {
      current = new WebSocket(url)
    } catch (cause) {
      handlers.onError(
        cause instanceof Error ? cause : new Error('Could not create Binance WebSocket'),
      )
      scheduleReconnect()
      return
    }

    socket = current
    let errorReported = false

    const reportError = (error: Error) => {
      if (errorReported) return
      errorReported = true
      handlers.onError(error)
    }

    current.addEventListener('open', () => {
      if (stopped || socket !== current) return
      retryAttempt = 0
      handlers.onOpen?.()
    })

    current.addEventListener('message', (event: MessageEvent<string>) => {
      if (!stopped && socket === current) handlers.onMessage(event.data)
    })

    current.addEventListener(
      'error',
      () => {
        if (stopped || socket !== current) return
        reportError(new Error('Binance WebSocket connection failed; retrying'))
        scheduleReconnect()
        current.close()
      },
      { once: true },
    )

    current.addEventListener('close', (event) => {
      if (stopped || socket !== current) return

      const reason = event.reason ? `: ${event.reason}` : ''
      reportError(new Error(`Binance WebSocket closed (${event.code})${reason}`))
      scheduleReconnect()
    })
  }

  const reconnectWhenOnline = () => {
    if (
      stopped ||
      socket?.readyState === WebSocket.CONNECTING ||
      socket?.readyState === WebSocket.OPEN
    ) {
      return
    }

    if (retryTimer !== undefined) {
      clearTimeout(retryTimer)
      retryTimer = undefined
    }

    connect()
  }

  window.addEventListener('online', reconnectWhenOnline)
  connect()

  return () => {
    stopped = true
    window.removeEventListener('online', reconnectWhenOnline)

    if (retryTimer !== undefined) clearTimeout(retryTimer)
    if (socket && socket.readyState < WebSocket.CLOSING) {
      socket.close(1000, 'Subscription stopped')
    }
  }
}
