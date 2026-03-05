import { useCallback, useEffect, useRef, useState } from "react"
import { useMap } from "./ui/map/hooks"
import { MapMarker, MarkerContent } from "./ui/map/marker"
import { LuPlane } from "react-icons/lu";

interface Airport {
  name: string
  ident: string
  iata_code: string
  id: number
  lat: number
  long: number
}

interface AirportMarkersProps {
  airports: Airport[]
  /** Minimum zoom level to show individual markers (default: 6) */
  minZoom?: number
  /** Maximum number of markers to render at once (safety cap, default: 500) */
  maxMarkers?: number
  onClick?: (airport: Airport) => void
}

/**
 * Renders airport markers that are currently visible in the map viewport.
 * Must be placed as a child of <Map>.
 *
 * - Loads all airports in memory
 * - Listens to moveend/zoomend events
 * - Filters airports within the current bounding box
 * - Only renders when zoom >= minZoom
 */
export function AirportMarkers({
  airports,
  minZoom = 6,
  maxMarkers = 300,
  onClick,
}: AirportMarkersProps) {
  const { map, isLoaded } = useMap()
  const [visibleAirports, setVisibleAirports] = useState<Airport[]>([])
  const [_, setCurrentZoom] = useState(0)
  // Keep a ref to airports so the event handler always sees the latest list
  const airportsRef = useRef(airports)
  airportsRef.current = airports

  const updateVisibleAirports = useCallback(() => {
    if (!map) return

    const zoom = map.getZoom()
    setCurrentZoom(zoom)

    // Don't render individual markers below minZoom
    if (zoom < minZoom) {
      setVisibleAirports([])
      return
    }

    const bounds = map.getBounds()
    if (!bounds) return

    const south = bounds.getSouth()
    const north = bounds.getNorth()
    const west = bounds.getWest()
    const east = bounds.getEast()

    const filtered = airportsRef.current.filter(
      (a) =>
        a.lat >= south &&
        a.lat <= north &&
        a.long >= west &&
        a.long <= east
    )

    // Safety cap — if still too many, take the first N
    setVisibleAirports(
      filtered.length > maxMarkers ? filtered.slice(0, maxMarkers) : filtered
    )
  }, [map, minZoom, maxMarkers])

  useEffect(() => {
    if (!map || !isLoaded) return

    // Initial filter
    updateVisibleAirports()

    // Listen to map movement events
    map.on("moveend", updateVisibleAirports)
    map.on("zoomend", updateVisibleAirports)

    return () => {
      map.off("moveend", updateVisibleAirports)
      map.off("zoomend", updateVisibleAirports)
    }
  }, [map, isLoaded, updateVisibleAirports])

  // Re-filter when airports data changes (e.g. after fetch completes)
  useEffect(() => {
    if (airports.length > 0 && map && isLoaded) {
      updateVisibleAirports()
    }
  }, [airports, map, isLoaded, updateVisibleAirports])

  return (
    <>
      {visibleAirports.map((airport) => (
        <MapMarker
          key={airport.id}
          coordinates={[airport.long, airport.lat]}
        >
          <MarkerContent>
            <div className="bg-black/80 text-yellow-400 text-xs px-2 py-1 rounded shadow-lg whitespace-nowrap backdrop-blur-sm" onClick={() => onClick?.(airport)}>
              <LuPlane className="inline-block mr-1" />
              <span className="font-semibold">{airport.iata_code !== "" ? airport.iata_code : airport.ident}</span>
            </div>
          </MarkerContent>
        </MapMarker>
      ))}
    </>
  )
}
