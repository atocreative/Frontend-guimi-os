"use client"

import { useEffect, useRef, useCallback } from "react"

type SyncCallback = () => void | Promise<void>

interface UseRealtimeSyncOptions {
  /** Polling interval in ms. Default: 30000 (30s) */
  interval?: number
  /** Pause polling when tab is hidden. Default: true */
  pauseWhenHidden?: boolean
  /** Run immediately on mount. Default: true */
  immediate?: boolean
}

/**
 * Smart polling hook for realtime-like sync.
 * - Pauses when the browser tab is hidden (saves requests)
 * - Resumes and triggers immediately when tab becomes visible again
 * - Exposes `triggerSync()` for on-demand refresh after mutations
 *
 * Usage:
 *   const { triggerSync } = useRealtimeSync(fetchData, { interval: 30_000 })
 *   // After creating/completing a task:
 *   await api.createTask(...)
 *   triggerSync()
 */
export function useRealtimeSync(
  callback: SyncCallback,
  options: UseRealtimeSyncOptions = {}
) {
  const { interval = 30_000, pauseWhenHidden = true, immediate = true } = options

  const callbackRef = useRef<SyncCallback>(callback)
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null)
  const mountedRef = useRef(false)

  // Keep callback ref up to date without restarting the interval
  useEffect(() => {
    callbackRef.current = callback
  }, [callback])

  const runCallback = useCallback(async () => {
    try {
      await callbackRef.current()
    } catch {
      // Silently ignore polling errors — UI handles errors on mount/manual fetches
    }
  }, [])

  const startPolling = useCallback(() => {
    if (timerRef.current) clearInterval(timerRef.current)
    timerRef.current = setInterval(() => {
      if (!pauseWhenHidden || document.visibilityState === "visible") {
        runCallback()
      }
    }, interval)
  }, [interval, pauseWhenHidden, runCallback])

  const stopPolling = useCallback(() => {
    if (timerRef.current) {
      clearInterval(timerRef.current)
      timerRef.current = null
    }
  }, [])

  // Trigger an immediate sync from outside (after mutations)
  const triggerSync = useCallback(() => {
    runCallback()
  }, [runCallback])

  useEffect(() => {
    mountedRef.current = true

    if (immediate) {
      runCallback()
    }

    startPolling()

    const handleVisibilityChange = () => {
      if (document.visibilityState === "visible") {
        // Tab became visible — sync immediately then restart interval
        runCallback()
        startPolling()
      } else {
        stopPolling()
      }
    }

    if (pauseWhenHidden) {
      document.addEventListener("visibilitychange", handleVisibilityChange)
    }

    return () => {
      mountedRef.current = false
      stopPolling()
      if (pauseWhenHidden) {
        document.removeEventListener("visibilitychange", handleVisibilityChange)
      }
    }
  }, [immediate, pauseWhenHidden, runCallback, startPolling, stopPolling])

  return { triggerSync }
}
