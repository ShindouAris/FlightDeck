import { useContext } from "react"
import { MapContext } from "./map"

export const useMap = () => {
  const context = useContext(MapContext)
  if (!context) {
    console.warn("useMap must be used within a MapProvider. Returning fallback values.")
    return { map: null, isLoaded: false, library: "mapbox" as const }
  }
  return context
}
