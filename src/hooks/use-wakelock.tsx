import { useEffect } from "react"

export const useWakeLock = () => {
  useEffect(() => {
    let wakeLock: any

    const requestLock = async () => {
      try {
        wakeLock = await navigator.wakeLock.request("screen")
      } catch {}
    }

    requestLock()

    const handleVisibility = () => {
      if (document.visibilityState === "visible") {
        console.log("Requesting wakelock")
        requestLock()
      }
    }

    document.addEventListener("visibilitychange", handleVisibility)

    return () => {
      console.log("Releasing wakelock")
      wakeLock?.release()
      document.removeEventListener("visibilitychange", handleVisibility)
    }
  }, [])
}