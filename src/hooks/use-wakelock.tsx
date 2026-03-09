import { useEffect } from "react"

export const useWakeLock = (enabled: boolean) => {
  useEffect(() => {
    if (!enabled || !("wakeLock" in navigator)) {
      return
    }

    let wakeLock: WakeLockSentinel | null = null
    let isDisposed = false
    let requestPromise: Promise<void> | null = null
    let requestGeneration = 0

    const requestLock = async () => {
      if (isDisposed || document.visibilityState !== "visible" || wakeLock) {
        return
      }

      if (requestPromise) {
        await requestPromise
        return
      }

      const generation = ++requestGeneration

      requestPromise = (async () => {
        try {
          const nextWakeLock = await navigator.wakeLock.request("screen")

          if (
            isDisposed ||
            document.visibilityState !== "visible" ||
            generation !== requestGeneration
          ) {
            try {
              await nextWakeLock.release()
            } catch {
              /* ignore release failures */
            }
            return
          }

          wakeLock = nextWakeLock
        } catch {
          wakeLock = null
        } finally {
          requestPromise = null
        }
      })()

      await requestPromise
    }

    const releaseLock = async () => {
      requestGeneration += 1

      const currentWakeLock = wakeLock
      wakeLock = null

      if (!currentWakeLock) {
        return
      }

      try {
        await currentWakeLock.release()
      } catch {
        /* ignore release failures */
      }
    }

    void requestLock()

    const handleVisibility = () => {
      if (document.visibilityState === "visible") {
        void requestLock()
        return
      }

      void releaseLock()
    }

    document.addEventListener("visibilitychange", handleVisibility)

    return () => {
      isDisposed = true
      document.removeEventListener("visibilitychange", handleVisibility)
      void releaseLock()
    }
  }, [enabled])
}
