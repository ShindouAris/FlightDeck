import { Map  } from "@/components/ui/map/map";
import { Card } from "./ui/card";
import { useEffect, useRef, useState } from "react";
import { AirportMarkers } from "./AirportMarkers";
import { MapLine } from "./ui/map/line";
import { MapCameraFollow, useCameraFollowControl } from "./ui/map/camera-follow";
import * as turf from "@turf/turf";
import Counter from "./ui/Counter";
import { MapMarkerAnimated } from "./ui/map/marker-animated";
import { Slider } from "@/components/ui/slider";
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogFooter,
    DialogHeader,
    DialogTitle,
} from "@/components/ui/animate-ui/components/radix/dialog";

const MAPBOX_ACCESS_TOKEN = import.meta.env.VITE_MAPBOX_ACCESS_TOKEN;
const HAS_MAPBOX_TOKEN = Boolean(MAPBOX_ACCESS_TOKEN);

const FALLBACK_STYLES = {
  light: "https://basemaps.cartocdn.com/gl/positron-gl-style/style.json",
  dark: "https://basemaps.cartocdn.com/gl/dark-matter-gl-style/style.json",
};

interface Airport {
    name: string
    ident: string
    iata_code: string
    id: number
    lat: number
    long: number
}

export function FocusFlight() {

    const HOLD_TO_STOP_DURATION = 1500

    const [airports, setAirports] = useState<Airport[]>([])

    const [selectedDpAirport, setSelectedDpAirport] = useState<Airport | null>(null)
    const [selectedArAirport, setSelectedArAirport] = useState<Airport | null>(null)
    const [currentSelect, setcurrentSelect] = useState<"departure" | "arrival" | null>(null)
    const [route, setRoute] = useState<[number, number][]>([])
    const [focusTime, setFocusTime] = useState(30000)
    const [timeLeft, setTimeLeft] = useState(30000)
    const [isTimerDialogOpen, setIsTimerDialogOpen] = useState(false)
    const [draftFocusMinutes, setDraftFocusMinutes] = useState(1)
    const [isHoldingStop, setIsHoldingStop] = useState(false)
    const [holdProgress, setHoldProgress] = useState(0)
    const [currentLocation, setCurrentLocation] = useState<[longitude: number, latitude: number][] | null>(null)
    const holdTimeoutRef = useRef<number | null>(null)
    const holdProgressIntervalRef = useRef<number | null>(null)


    const clearHoldTimers = () => {
        if (holdTimeoutRef.current) {
            window.clearTimeout(holdTimeoutRef.current)
            holdTimeoutRef.current = null
        }
        if (holdProgressIntervalRef.current) {
            window.clearInterval(holdProgressIntervalRef.current)
            holdProgressIntervalRef.current = null
        }
    }

    const startHoldToStop = () => {
        if (!isPlaying || route.length === 0 || isHoldingStop) {
            return
        }

        setIsHoldingStop(true)
        setHoldProgress(0)

        const holdStartedAt = Date.now()

        holdProgressIntervalRef.current = window.setInterval(() => {
            const elapsed = Date.now() - holdStartedAt
            const progress = Math.min(elapsed / HOLD_TO_STOP_DURATION, 1)
            setHoldProgress(progress)
        }, 16)

        holdTimeoutRef.current = window.setTimeout(() => {
            clearHoldTimers()
            setHoldProgress(1)
            setIsHoldingStop(false)
            handleEndRoute()
        }, HOLD_TO_STOP_DURATION)
    }

    const cancelHoldToStop = () => {
        if (!isHoldingStop) {
            return
        }
        clearHoldTimers()
        setIsHoldingStop(false)
        setHoldProgress(0)
    }


    const getLocation = () => {
        if (!navigator.geolocation) {
            console.error("Geolocation is not supported by this browser.")
            return
        }

        navigator.geolocation.getCurrentPosition((pos) => {
            setCurrentLocation([[pos.coords.longitude, pos.coords.latitude]])
        }, (error) => {
            console.error("Error getting geolocation:", error)
        })
    }

    const {isPlaying, toggle, stop} = useCameraFollowControl()

    useEffect(() => {
        const fetchAirports = async () => {
            try {
                const response = await fetch("/airports.json")
                if (!response.ok) {
                    throw new Error(`HTTP error! status: ${response.status}`)
                }
                const data = await response.json()
                setAirports(data)
            } catch (error) {
                console.error("Failed to fetch airports:", error)
            }
        }
        fetchAirports() // Perf nuke, temporarily disable
        getLocation()
    }, [])

    const handleEndRoute = () => {
        clearHoldTimers()
        setIsHoldingStop(false)
        setHoldProgress(0)
        stop()

        setRoute([])
        setSelectedDpAirport(null)
        setSelectedArAirport(null)
        setcurrentSelect(null)
        setFocusTime(30000)
        setTimeLeft(30000)
    }

    const handleAirportClick = (airport: Airport) => {
        if (currentSelect === "departure") {
            setSelectedDpAirport(airport)
            setcurrentSelect("arrival")
        } else if (currentSelect === "arrival") {
            setSelectedArAirport(airport)
            setcurrentSelect(null)
        }
    }

    const handleToggleTimerDialog = () => {
        if (!isTimerDialogOpen) {
            setDraftFocusMinutes(Math.max(1, Math.round(focusTime / 60000)))
        }
        setIsTimerDialogOpen((prev) => !prev)
    }

    const handleApplyTimer = () => {
        const nextFocusTime = draftFocusMinutes * 60000
        setFocusTime(nextFocusTime)
        if (!isPlaying) {
            setTimeLeft(nextFocusTime)
        }
        setIsTimerDialogOpen(false)
    }


    useEffect(() => {
        // Build route
        if (selectedDpAirport && selectedArAirport) {
            const builtRoute = turf.greatCircle([selectedDpAirport.long, selectedDpAirport.lat], [selectedArAirport.long, selectedArAirport.lat], { npoints: 200 })
            setRoute(builtRoute.geometry.coordinates as [number, number][])
            setTimeLeft(focusTime)
        }


    }, [selectedDpAirport, selectedArAirport, focusTime])

    useEffect(() => {
        if (!isPlaying) {
            setTimeLeft(focusTime)
        }
    }, [isPlaying, focusTime])

    useEffect(() => {
        if (!isPlaying) {
            cancelHoldToStop()
        }
    }, [isPlaying])

    useEffect(() => {
        return () => {
            clearHoldTimers()
        }
    }, [])

    useEffect(() => {
        if (!isPlaying || route.length === 0) {
            return
        }

        const startTimestamp = Date.now()
        setTimeLeft(focusTime)

        const timer = window.setInterval(() => {
            const elapsed = Date.now() - startTimestamp
            const remaining = Math.max(focusTime - elapsed, 0)
            setTimeLeft(remaining)

            if (remaining === 0) {
                window.clearInterval(timer)
            }
        }, 200)

        return () => window.clearInterval(timer)
    }, [isPlaying, route.length, focusTime])

    const totalSecondsLeft = Math.ceil(timeLeft / 1000)
    const hoursLeft = Math.floor(totalSecondsLeft / 3600)
    const minutesLeft = Math.floor((totalSecondsLeft % 3600) / 60)
    const visibleTimeUnits = [
        { label: "Hrs", value: hoursLeft },
        { label: "Min", value: minutesLeft },
    ].filter((unit) => unit.value !== 0)

  return (
    <Card className="w-full h-screen p-0 gap-0 overflow-hidden">
        <div className="absolute top-4 left-4 z-10 flex flex-col items-start gap-2">
            <button
                className={`px-3 py-1 rounded ${currentSelect === "departure" ? "bg-blue-600 text-white" : "bg-gray-200 text-yellow-300"}`}
                onClick={() => setcurrentSelect("departure")}
            >
                {selectedDpAirport ? `Departure: ${selectedDpAirport.iata_code || selectedDpAirport.ident}` : "Select Departure"}
            </button>
            <button
                className={`px-3 py-1 rounded ${currentSelect === "arrival" ? "bg-green-600 text-white" : "bg-gray-200 text-pink-400"}`}
                onClick={() => setcurrentSelect("arrival")}
            >
                {selectedArAirport ? `Arrival: ${selectedArAirport.iata_code || selectedArAirport.ident}` : "Select Arrival"}
            </button>
            <button
                className={`relative overflow-hidden px-3 py-1 rounded ${isPlaying ? "bg-red-600 text-white" : "bg-gray-200 text-purple-400"}`}
                onClick={() => {
                    if (!isPlaying) {
                        toggle()
                    }
                }}
                onMouseDown={startHoldToStop}
                onMouseUp={cancelHoldToStop}
                onMouseLeave={cancelHoldToStop}
                onTouchStart={startHoldToStop}
                onTouchEnd={cancelHoldToStop}
                onTouchCancel={cancelHoldToStop}
                disabled={route.length === 0}
                
            >
                {isPlaying && (
                    <span
                        className="absolute inset-y-0 left-0 bg-red-300/60"
                        style={{ width: `${holdProgress * 100}%` }}
                    />
                )}
                <span className="relative z-10">
                    {isPlaying ? (isHoldingStop ? "Hold to give up" : "Stop Focus Flight") : "Start Focus Flight"}
                </span>
            </button>
            <button
                className="px-3 py-1 rounded bg-gray-200 text-slate-700"
                onClick={handleToggleTimerDialog}
            >
                {isTimerDialogOpen ? "Close Timer" : "Set Timer"}
            </button>
            <Dialog open={isTimerDialogOpen} onOpenChange={setIsTimerDialogOpen}>
                <DialogContent>
                    <DialogHeader>
                        <DialogTitle>Focus Timer</DialogTitle>
                        <DialogDescription>Adjust focus duration in minutes.</DialogDescription>
                    </DialogHeader>
                    <div className="space-y-4 py-2">
                        <p className="text-sm text-muted-foreground">{draftFocusMinutes} min</p>
                        <Slider
                            value={[draftFocusMinutes]}
                            min={1}
                            max={180}
                            step={1}
                            onValueChange={(value) => setDraftFocusMinutes(value[0] ?? 1)}
                        />
                    </div>
                    <DialogFooter>
                        <button
                            className="px-3 py-1 rounded bg-gray-200 text-slate-700"
                            onClick={() => setIsTimerDialogOpen(false)}
                        >
                            Cancel
                        </button>
                        <button
                            className="px-3 py-1 rounded bg-blue-600 text-white"
                            onClick={handleApplyTimer}
                        >
                            Apply
                        </button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>
            
        </div>
        <Map
            accessToken={MAPBOX_ACCESS_TOKEN}
            styles={HAS_MAPBOX_TOKEN ? undefined : FALLBACK_STYLES}
            style="mapbox://styles/mapbox/dark-v11"
            center={currentLocation ? currentLocation[0] : [106.7009, 10.7769]}
            pitch={80}
            zoom={12} 
            showLoader={false}
        >
            <MapLine coordinates={route} color="#facc15" width={3} />
            <MapCameraFollow
                path={route}
                autoStart={isPlaying}
                duration={focusTime}
                pitch={60}
                zoom={12}
                onComplete={handleEndRoute}
                marker
            />
            {currentLocation && (<MapMarkerAnimated id="pulsing-dot" coordinates={currentLocation} duration={1000} color="rgba(0, 100, 255, 1)" />)}
            <AirportMarkers airports={airports} minZoom={6} maxMarkers={500} onClick={handleAirportClick} />
        </Map>
        {/* Bottom */}

        {isPlaying && (
            <>
                <div className="absolute justify-center bottom-4 left-4 z-10 text-white px-4 py-2 rounded">
                    <span>Time Left</span>
                    <div className="flex items-center gap-3">
                    {visibleTimeUnits.map((unit) => (
                        <div key={unit.label} className="flex flex-col items-center">
                        <Counter value={unit.value} places={[10, 1]} gradientFrom="transparent" fontSize={40} />
                        <span className="text-xs text-white/80">{unit.label}</span>
                        </div>
                    ))}
                    </div>
                </div>
                <div className="absolute bottom-4 right-4 z-10 bg-black/50 text-white px-4 py-2 rounded backdrop-blur-sm">
                    <p className="text-sm">
                    {selectedArAirport && `Arrival: ${selectedArAirport.name} (${selectedArAirport.iata_code || selectedArAirport.ident})`}
                    </p>
                </div>
            </>
        )}
    </Card>

  );
}