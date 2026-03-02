import { Map } from "@/components/ui/map/map";
import { Card } from "./ui/card";
import { useEffect, useState } from "react";
import { MapMarker, MarkerContent } from "./ui/map/marker";

const MAPBOX_ACCESS_TOKEN = import.meta.env.VITE_MAPBOX_ACCESS_TOKEN;
const HAS_MAPBOX_TOKEN = Boolean(MAPBOX_ACCESS_TOKEN);

const FALLBACK_STYLES = {
  light: "https://basemaps.cartocdn.com/gl/positron-gl-style/style.json",
  dark: "https://basemaps.cartocdn.com/gl/dark-matter-gl-style/style.json",
};

interface Airport {
    name: string
    ident: string
    id: number
    lat: number
    long: number
}

export function FocusFlight() {

    const [airports, setAirports] = useState<Airport[]>([])

    useEffect(() => {
        const fetchAirports = async () => {
            try {
                const response = await fetch("/airports_small.json")
                if (!response.ok) {
                    throw new Error(`HTTP error! status: ${response.status}`)
                }
                const data = await response.json()
                setAirports(data)
            } catch (error) {
                console.error("Failed to fetch airports:", error)
            }
        }
        // fetchAirports()
    }, [])

  return (
    <Card className="w-full h-screen p-0 gap-0 overflow-hidden">
        <Map
            accessToken={MAPBOX_ACCESS_TOKEN}
            styles={HAS_MAPBOX_TOKEN ? undefined : FALLBACK_STYLES}
            style="mapbox://styles/mapbox/dark-v11"
            center={[106.7009, 10.7769]}
            pitch={80}
            zoom={12} 
            showLoader={false}
        >
            {airports.map((airport) => (
                <MapMarker key={airport.id} coordinates={[airport.long, airport.lat]}>
                    <MarkerContent>
                        
                    </MarkerContent>
                </MapMarker>
            ))}
        </Map>
    </Card>

  );
}