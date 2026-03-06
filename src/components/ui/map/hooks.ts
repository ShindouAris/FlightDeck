import { createContext, useContext, useState } from "react"
import type { MapContextValue } from "./types"

export const MapContext = createContext<MapContextValue | null>(null)

export const useMap = () => {
  const context = useContext(MapContext)
  if (!context) {
    console.warn("useMap must be used within a MapProvider. Returning fallback values.")
    return { map: null, isLoaded: false, library: "mapbox" as const }
  }
  return context
}

export const useCameraFollowControl = () => {
  const [isPlaying, setIsPlaying] = useState(false)

  const start = () => {
    setIsPlaying(true)
  }

  const stop = () => {
    setIsPlaying(false)
  }

  const toggle = () => {
    setIsPlaying((prev) => !prev)
  }

  return { isPlaying, start, stop, toggle }
}

export const useMarkerAnimatedControl = () => {
  const [isPlaying, setIsPlaying] = useState(false)

  const start = () => setIsPlaying(true)
  const stop = () => setIsPlaying(false)
  const toggle = () => setIsPlaying((prev) => !prev)

  return { start, stop, toggle, isPlaying }
}
