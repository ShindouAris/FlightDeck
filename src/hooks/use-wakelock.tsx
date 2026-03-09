import { useEffect } from "react"

export const useWakeLock = (enabled: boolean) => {
  useEffect(() => {
    if (!enabled || !("wakeLock" in navigator)) {
      return
    }

    let wakeLock: WakeLockSentinel | null = null
    let isDisposed = false

    const requestLock = async () => {
      if (isDisposed || document.visibilityState !== "visible") {
        return
      }

      try {
        wakeLock = await navigator.wakeLock.request("screen")
      } catch {
        wakeLock = null
      }
    }

    const releaseLock = async () => {
      if (!wakeLock) {
        return
      }

      try {
        await wakeLock.release()
      } catch {
        wakeLock = null
      }

      wakeLock = null
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
