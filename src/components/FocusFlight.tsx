import { Map  } from "@/components/ui/map/map";
import { Card } from "./ui/card";
import { useEffect, useRef, useState } from "react";
import { AirportMarkers } from "./AirportMarkers";
import { MapLine } from "./ui/map/line";
import { MapCameraFollow, useCameraFollowControl } from "./ui/map/camera-follow";
import * as turf from "@turf/turf";
import { MapMarkerAnimated } from "./ui/map/marker-animated";
import { ActionBar } from "./ActionBar";
import { Slider } from "@/components/ui/slider";
import { gooeyToast } from "goey-toast";
import { RiPlaneFill } from "react-icons/ri";
import { LuPlaneLanding, LuPlaneTakeoff } from "react-icons/lu";

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
    const [bookingStep, setBookingStep] = useState<"idle" | "select-departure" | "select-focus-time" | "select-arrival" | "ready">("idle")
    const [route, setRoute] = useState<[number, number][]>([])
    const [focusTime, setFocusTime] = useState(1800000)
    const [timeLeft, setTimeLeft] = useState(1800000)
    const [draftFocusMinutes, setDraftFocusMinutes] = useState(30)
    const [isHoldingStop, setIsHoldingStop] = useState(false)
    const [holdProgress, setHoldProgress] = useState(0)
    const [currentLocation, setCurrentLocation] = useState<[longitude: number, latitude: number][] | null>(null)
    const [actionBarOpen, setActionBarOpen] = useState(true)
    const holdTimeoutRef = useRef<number | null>(null)
    const holdProgressIntervalRef = useRef<number | null>(null)
    const currentMarkerLocationRef = useRef<[number, number] | null>(null)


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
        setActionBarOpen(true)
        stop()

        setRoute([])
        setSelectedDpAirport(null)
        setSelectedArAirport(null)
        setBookingStep("idle")
        setDraftFocusMinutes(30)
        setFocusTime(1800000)
        setTimeLeft(1800000)
    }

    const handleAirportClick = (airport: Airport) => {
        if (bookingStep === "select-departure") {
            if (selectedArAirport?.id === airport.id) {
                gooeyToast.error("Departure and Arrival cannot be the same airport!")
                return
            }
            setSelectedDpAirport(airport)
            setBookingStep("select-focus-time")
        } else if (bookingStep === "select-arrival") {
            if (selectedDpAirport?.id === airport.id) {
                gooeyToast.error("Departure and Arrival cannot be the same airport!")
                return
            }
            setSelectedArAirport(airport)
            setBookingStep("ready")
        }
    }

    const handleApplyFocusTime = () => {
        const nextFocusTime = draftFocusMinutes * 60000
        setFocusTime(nextFocusTime)
        setTimeLeft(nextFocusTime)
        setBookingStep("select-arrival")
    }

    const handleGo = () => {
        if (isPlaying) return
        if (route.length < 2) {
            gooeyToast.error("Please select both Departure and Arrival airports to start the Focus Flight.")
            return
        }
        toggle()
        const IntervalID = setInterval(() => {
            setActionBarOpen(false)
            clearInterval(IntervalID)
        }, 3000)
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

  return (
    <Card className="w-full h-screen p-0 gap-0 overflow-hidden relative">

        {/* ─── Map (always at base) ─────────────────────────────────── */}
        <Map
            accessToken={MAPBOX_ACCESS_TOKEN}
            styles={HAS_MAPBOX_TOKEN ? undefined : FALLBACK_STYLES}
            center={currentLocation ? currentLocation[0] : [106.7009, 10.7769]}
            pitch={0}
            zoom={12}
            showLoader={false}
        >
            {route.length >= 2 && (
                <>
                    <MapLine coordinates={route} color="#facc15" width={3} />
                    <MapCameraFollow
                        path={route}
                        autoStart={isPlaying}
                        duration={focusTime}
                        pitch={60}
                        zoom={12}
                        onComplete={handleEndRoute}
                        onLocationChange={(location) => {
                            currentMarkerLocationRef.current = location
                        }}
                        marker
                    />
                </>
            )}
            {currentLocation && !isPlaying && (
                <MapMarkerAnimated id="pulsing-dot" coordinates={currentLocation} duration={1000} color="rgba(0, 100, 255, 1)" />
            )}
            <AirportMarkers airports={airports} minZoom={6} maxMarkers={500} onClick={handleAirportClick} />
        </Map>

        {/* ─── IDLE: Full-screen blocking overlay ───────────────────── */}
        {bookingStep === "idle" && (
            <div className="absolute inset-0 z-20 bg-black/55 backdrop-blur-[1.5px] pointer-events-auto">
                <div className="absolute inset-0 flex flex-col items-center justify-center gap-2 pointer-events-none select-none">
                    <p className="text-emerald-400 text-5xl uppercase tracking-widest font-semibold">Welcome aboard</p>
                    <p className="text-blue-400 tracking-[0.45em] uppercase font-bold text-2xl"></p>
                    <p className="text-pink-300 text-xl font-light">Where are we flying today?</p>
                </div>
            </div>
        )}

        {/* ─── IDLE: "Book my flight" button ────────────────────────── */}
        {bookingStep === "idle" && (
            <div className="absolute bottom-8 left-1/2 -translate-x-1/2 z-30">
                <button
                    onClick={() => setBookingStep("select-departure")}
                    className="group flex items-center gap-3 px-8 py-4 rounded-2xl
                               bg-black/65 backdrop-blur-xl
                               border border-amber-400/30
                               text-amber-100 font-semibold text-base
                               shadow-[0_8px_40px_rgba(251,191,36,0.12)]
                               hover:shadow-[0_8px_60px_rgba(251,191,36,0.22)]
                               hover:border-amber-400/55 hover:bg-black/75
                               transition-all duration-300"
                >
                    <RiPlaneFill className="text-amber-400 text-lg transition-transform duration-300 group-hover:translate-x-0.5 group-hover:-translate-y-0.5" />
                    <span>Book my flight</span>
                </button>
            </div>
        )}

        {/* ─── SELECT DEPARTURE / ARRIVAL: Step hint pill ───────────── */}
        {(bookingStep === "select-departure" || bookingStep === "select-arrival") && (
            <div className="absolute top-5 left-1/2 -translate-x-1/2 z-10 pointer-events-none">
                <div className="flex items-center gap-2.5 px-5 py-2.5 rounded-full bg-black/65 backdrop-blur-xl border border-white/10 shadow-lg">
                    <span className={`w-2 h-2 rounded-full shrink-0 animate-pulse ${bookingStep === "select-departure" ? "bg-amber-400" : "bg-violet-400"}`} />
                    <span className="text-white/80 text-sm font-medium whitespace-nowrap">
                        {bookingStep === "select-departure"
                            ? "Click a marker to set departure airport"
                            : "Click a marker to set arrival airport"}
                    </span>
                </div>
            </div>
        )}

        {/* ─── SELECT ARRIVAL: Departure + focus time strip ─────────── */}
        {bookingStep === "select-arrival" && selectedDpAirport && (
            <div className="absolute bottom-8 left-1/2 -translate-x-1/2 z-10">
                <div className="flex items-center gap-3 px-4 py-3 rounded-2xl bg-black/65 backdrop-blur-xl border border-white/10 shadow-xl">
                    <LuPlaneTakeoff className="text-emerald-400 text-base shrink-0" />
                    <div className="min-w-0">
                        <p className="text-white/35 text-[10px] uppercase tracking-widest font-semibold">Departing</p>
                        <p className="text-white/75 text-sm font-semibold truncate">
                            {selectedDpAirport.iata_code || selectedDpAirport.ident} · {selectedDpAirport.name}
                        </p>
                    </div>
                    <div className="pl-3 ml-1 border-l border-white/10 shrink-0">
                        <p className="text-white/35 text-[10px] uppercase tracking-widest font-semibold">Focus</p>
                        <p className="text-amber-400 text-sm font-bold tabular-nums">{draftFocusMinutes}m</p>
                    </div>
                </div>
            </div>
        )}

        {/* ─── SELECT FOCUS TIME: Overlay + slide-up card ───────────── */}
        {bookingStep === "select-focus-time" && (
            <div className="absolute inset-0 z-20 bg-black/45 backdrop-blur-[2px] flex items-end justify-center pb-10 px-4">
                <div className="w-full max-w-md">
                    <div className="bg-black/80 backdrop-blur-2xl border border-white/10 rounded-3xl p-6
                                    shadow-[0_-20px_80px_rgba(0,0,0,0.6)] space-y-5">
                        {/* Departure confirmation row */}
                        <div className="flex items-center gap-3">
                            <div className="w-9 h-9 rounded-xl bg-emerald-500/15 flex items-center justify-center shrink-0">
                                <LuPlaneTakeoff className="text-emerald-400 text-base" />
                            </div>
                            <div className="min-w-0">
                                <p className="text-white/30 text-[10px] uppercase tracking-widest font-semibold">Departing from</p>
                                <p className="text-white/80 text-sm font-semibold">{selectedDpAirport?.name}</p>
                                <p className="text-white/40 text-xs">{selectedDpAirport?.iata_code || selectedDpAirport?.ident}</p>
                            </div>
                        </div>

                        <div className="h-px bg-white/[0.07]" />

                        {/* Focus duration slider */}
                        <div className="space-y-4">
                            <div className="flex items-baseline justify-between">
                                <p className="text-white/50 text-sm">Focus Duration</p>
                                <div>
                                    <span className="text-amber-400 text-3xl font-bold tabular-nums">{draftFocusMinutes}</span>
                                    <span className="text-white/30 text-sm ml-1">min</span>
                                </div>
                            </div>
                            <Slider
                                value={[draftFocusMinutes]}
                                min={5}
                                max={900}
                                step={5}
                                onValueChange={(value) => setDraftFocusMinutes(value[0] ?? 30)}
                            />
                            <div className="flex justify-between text-white/20 text-[11px]">
                                <span>5 min</span>
                                <span>15 hrs</span>
                            </div>
                        </div>

                        {/* Confirm → go pick arrival */}
                        <button
                            onClick={handleApplyFocusTime}
                            className="w-full py-3.5 rounded-xl font-semibold text-sm flex items-center justify-center gap-2
                                       bg-amber-500/15 border border-amber-400/30 text-amber-100
                                       hover:bg-amber-500/25 hover:border-amber-400/50
                                       transition-all duration-200"
                        >
                            <LuPlaneLanding className="text-amber-300 text-base" />
                            Set destination
                        </button>
                    </div>
                </div>
            </div>
        )}

        {/* ─── READY: Summary card + "Go" button ────────────────────── */}
        {bookingStep === "ready" && selectedDpAirport && selectedArAirport && !isPlaying && (
            <div className="absolute bottom-8 left-1/2 -translate-x-1/2 z-20 w-full max-w-md px-4">
                <div className="bg-black/80 backdrop-blur-2xl border border-white/10 rounded-3xl p-5
                                shadow-[0_-20px_80px_rgba(0,0,0,0.5)] space-y-4">
                    {/* Route summary */}
                    <div className="flex items-stretch gap-3">
                        <div className="flex flex-col items-center gap-0.5 pt-1.5 pb-1.5">
                            <div className="w-2 h-2 rounded-full bg-emerald-400 shrink-0" />
                            <div className="w-px flex-1 bg-white/10 my-1" />
                            <div className="w-2 h-2 rounded-full bg-violet-400 shrink-0" />
                        </div>
                        <div className="flex-1 space-y-3 min-w-0">
                            <div>
                                <p className="text-white/30 text-[10px] uppercase tracking-widest font-semibold">Departure</p>
                                <p className="text-white/80 text-sm font-semibold truncate">
                                    {selectedDpAirport.iata_code || selectedDpAirport.ident} · {selectedDpAirport.name}
                                </p>
                            </div>
                            <div>
                                <p className="text-white/30 text-[10px] uppercase tracking-widest font-semibold">Arrival</p>
                                <p className="text-white/80 text-sm font-semibold truncate">
                                    {selectedArAirport.iata_code || selectedArAirport.ident} · {selectedArAirport.name}
                                </p>
                            </div>
                        </div>
                        <div className="pl-3 ml-1 border-l border-white/[0.07] flex flex-col justify-center items-end shrink-0">
                            <p className="text-white/30 text-[10px] uppercase tracking-widest font-semibold">Focus</p>
                            <p className="text-amber-400 text-xl font-bold tabular-nums">
                                {draftFocusMinutes}<span className="text-white/30 text-xs font-normal ml-0.5">m</span>
                            </p>
                        </div>
                    </div>

                    <div className="h-px bg-white/[0.07]" />

                    {/* Go */}
                    <button
                        onClick={handleGo}
                        className="w-full py-3.5 rounded-xl font-semibold text-base flex items-center justify-center gap-2.5
                                   bg-emerald-500/15 border border-emerald-400/30 text-emerald-100
                                   hover:bg-emerald-500/25 hover:border-emerald-400/50
                                   transition-all duration-200"
                    >
                        <RiPlaneFill className="text-emerald-300 text-lg" />
                        Go
                    </button>
                </div>
            </div>
        )}

        {/* ─── FLYING: Hold-to-end pill ──────────────────────────────── */}
        {isPlaying && route.length > 0 && (
            <div className="absolute top-5 left-1/2 -translate-x-1/2 z-10">
                <button
                    className={`relative overflow-hidden flex items-center gap-2.5 px-5 py-2.5 rounded-full backdrop-blur-xl border transition-all duration-200 text-sm font-medium
                        ${isHoldingStop
                            ? "bg-black/70 border-red-400/40 text-red-300"
                            : "bg-black/60 border-white/10 text-white/50 hover:text-white/70 hover:border-white/20"}`}
                    onMouseDown={startHoldToStop}
                    onMouseUp={cancelHoldToStop}
                    onMouseLeave={cancelHoldToStop}
                    onTouchStart={startHoldToStop}
                    onTouchEnd={cancelHoldToStop}
                    onTouchCancel={cancelHoldToStop}
                >
                    {isHoldingStop && (
                        <span
                            className="absolute inset-y-0 left-0 bg-red-500/20 transition-none"
                            style={{ width: `${holdProgress * 100}%` }}
                        />
                    )}
                    <span className="relative z-10">
                        {isHoldingStop ? "Hold to end focus session" : "Hold to end flight"}
                    </span>
                </button>
            </div>
        )}

        {/* ─── FLYING: ActionBar ────────────────────────────────────── */}
        {isPlaying && selectedDpAirport && selectedArAirport && (
            <div className="absolute bottom-4 left-1/2 -translate-x-1/2 z-10 w-full px-4 flex justify-center">
                <ActionBar
                    open={actionBarOpen}
                    distance={Math.round(turf.distance(
                        currentMarkerLocationRef.current
                            ? [currentMarkerLocationRef.current[0], currentMarkerLocationRef.current[1]]
                            : [selectedDpAirport.long, selectedDpAirport.lat],
                        [selectedArAirport.long, selectedArAirport.lat],
                        { units: 'nauticalmiles' }
                    ))}
                    origin={selectedDpAirport.name}
                    destination={selectedArAirport.name}
                    iataorigin={selectedDpAirport.iata_code || selectedDpAirport.ident}
                    iatadestination={selectedArAirport.iata_code || selectedArAirport.ident}
                    timeLeft={totalSecondsLeft}
                    totalTime={Math.ceil(focusTime / 1000)}
                    endTime={new Date(Date.now() + timeLeft)}
                    handleOpenClick={() => setActionBarOpen(o => !o)}
                />
            </div>
        )}

    </Card>
  )
}