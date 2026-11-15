type ReconnectingSocketHandlers = {
  onOpen?: () => void
  onMessage: (data: string) => void
  onError: (error: Error) => void
}

const BASE_RETRY_DELAY_MS = 1_000
const MAX_RETRY_DELAY_MS = 30_000

/**
 * Maintains a browser WebSocket connection with exponential-backoff retries,
 * reconnects immediately on the `online` event, and cleans up timers and
 * listeners when unsubscribed.
 *
 * @param url The full URL of the Binance WebSocket stream.
 * @param handlers Callbacks for socket open, messages, and connection errors.
 * @param handlers.onOpen Optional callback for a successful socket open.
 * @param handlers.onMessage Callback for a text message received from the socket.
 * @param handlers.onError Callback for errors creating, using, or closing the socket.
 * @returns A function that closes the active socket, cancels the retry timer,
 * and removes the `online` event listener.
 */
export function subscribeWithReconnect(url: URL, handlers: ReconnectingSocketHandlers): () => void {
  let stopped = false
  let socket: WebSocket | undefined
  let retryTimer: ReturnType<typeof setTimeout> | undefined
  let retryAttempt = 0

  /**
   * Schedules the next connection attempt with capped exponential backoff and
   * a small random delay.
   */
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

  /**
   * Creates the socket and connects its events to the supplied callbacks.
   * A constructor error also starts the retry loop.
   */
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

    /**
     * Prevents the same failure from being reported for both the `error` event
     * and the subsequent `close` event on the same socket.
     *
     * @param error The error to pass to the caller.
     */
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

  /**
   * Clears any pending timer and reconnects when network connectivity returns,
   * provided the socket is neither connecting nor open.
   */
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
