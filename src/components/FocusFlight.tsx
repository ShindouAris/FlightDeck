import { Map  } from "@/components/ui/map/map";
import { Card } from "./ui/card";
import { useEffect, useRef, useState } from "react";
import { useMap } from "./ui/map/hooks";
import { AirportMarkers } from "./AirportMarkers";
import { MapLine } from "./ui/map/line";
import { MapCameraFollow } from "./ui/map/camera-follow";
import { useCameraFollowControl } from "./ui/map/hooks";
import * as turf from "@turf/turf";
import { MapMarkerAnimated } from "./ui/map/marker-animated";
import { ActionBar } from "./ActionBar";
import SeatSelection, { type SeatSelectionChoice } from "./SeatSelection";
import { Slider } from "@/components/ui/slider";
import { Button } from "@/components/ui/button";
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogFooter,
    DialogHeader,
    DialogTitle,
} from "@/components/ui/animate-ui/components/radix/dialog";
import { gooeyToast } from "goey-toast";
import { RiPlaneFill } from "react-icons/ri";
import { LuPlaneLanding, LuPlaneTakeoff } from "react-icons/lu";
import { AnimatePresence, motion } from "framer-motion";
import { BoardingTicket } from "./TicketRender";
import { useWakeLock } from "@/hooks/use-wakelock";
import Setting from "./Settings";
import { IoSettingsOutline } from "react-icons/io5";
import Counter from "./ui/Counter";
import { useTranslation } from "react-i18next";

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

type BookingStep = "idle" | "select-departure" | "select-focus-time" | "select-arrival" | "select-seat" | "ticket" | "ready"
type TicketPhase = "printing" | "printed" | "tear-ready" | "board-ready"
type ScreenCoverMode = "booking" | "boarding"

function MapController({
    selectedDpAirport,
    selectedArAirport,
    focusTime,
}: {
    selectedDpAirport: Airport | null
    selectedArAirport: Airport | null
    focusTime: number
}) {
    const { map, isLoaded } = useMap()

    useEffect(() => {
        if (!selectedDpAirport || !selectedArAirport || !isLoaded || !map) return

        const builtRoute = turf.greatCircle(
            [selectedDpAirport.long, selectedDpAirport.lat],
            [selectedArAirport.long, selectedArAirport.lat],
            { npoints: 200 }
        )
        const coords = builtRoute.geometry.coordinates as [number, number][]

        let minLat = Infinity, maxLat = -Infinity, minLng = Infinity, maxLng = -Infinity
        for (const [lng, lat] of coords) {
            minLat = Math.min(minLat, lat)
            maxLat = Math.max(maxLat, lat)
            minLng = Math.min(minLng, lng)
            maxLng = Math.max(maxLng, lng)
        }

        const bounds: [[number, number], [number, number]] = [[minLng, minLat], [maxLng, maxLat]]
        map.zoomTo(5)
        map.fitBounds(bounds, { padding: 100, duration: 2000 })
    }, [selectedDpAirport, selectedArAirport, focusTime, map, isLoaded])

    return null
}

function MapFlightEndReturn({
    currentLocation,
    trigger,
}: {
    currentLocation: [longitude: number, latitude: number][] | null
    trigger: number
}) {
    const { map, isLoaded } = useMap()

    useEffect(() => {
        if (trigger === 0 || !currentLocation || !map || !isLoaded) return

        map.stop()
        map.flyTo({
            center: currentLocation[0],
            bearing: 0,
            pitch: 0,
            zoom: 10,
            duration: 3000,
            essential: true,
        })
    }, [currentLocation, trigger, map, isLoaded])

    return null
}

export function FocusFlight() {
    useWakeLock()
    const { t } = useTranslation()

    const getTimePeriod = (d: Date = new Date()) => {
        const h = d.getHours()
        if (h >= 5 && h < 12) return "morning"
        if (h >= 12 && h < 17) return "afternoon"
        if (h >= 17 && h < 22) return "evening"
        return "evening"
    }

    const timePeriod = getTimePeriod()
    const timeGreeting = t(`focus.cover.greeting.${timePeriod}`)

    const HOLD_TO_STOP_DURATION = 1500
    const TICKET_PRINT_DURATION = 4000
    const SCREEN_COVER_DURATION = 1800

    const [airports, setAirports] = useState<Airport[]>([])

    const [selectedDpAirport, setSelectedDpAirport] = useState<Airport | null>(null)
    const [selectedArAirport, setSelectedArAirport] = useState<Airport | null>(null)
    const [bookingStep, setBookingStep] = useState<BookingStep>("idle")
    const [seatSelection, setSeatSelection] = useState<SeatSelectionChoice | null>(null)
    const [ticketPhase, setTicketPhase] = useState<TicketPhase>("printing")
    const [screenCoverMode, setScreenCoverMode] = useState<ScreenCoverMode | null>(null)
    const [route, setRoute] = useState<[number, number][]>([])
    const [focusTime, setFocusTime] = useState(1800000)
    const [timeLeft, setTimeLeft] = useState(1800000)
    const [draftFocusMinutes, setDraftFocusMinutes] = useState(30)
    const [isHoldingStop, setIsHoldingStop] = useState(false)
    const [holdProgress, setHoldProgress] = useState(0)
    const [currentLocation, setCurrentLocation] = useState<[longitude: number, latitude: number][] | null>(null)
    const [actionBarOpen, setActionBarOpen] = useState(true)
    const [flightEndReturnTrigger, setFlightEndReturnTrigger] = useState(0)
    const [showFlightEndedDialog, setShowFlightEndedDialog] = useState(false)
    const [isSettingsOpen, setIsSettingsOpen] = useState(false)
    const holdTimeoutRef = useRef<number | null>(null)
    const holdProgressIntervalRef = useRef<number | null>(null)
    const currentMarkerLocationRef = useRef<[number, number] | null>(null)

    const resetSessionState = (nextStep: "idle" | "select-departure") => {
        setRoute([])
        setSelectedDpAirport(null)
        setSelectedArAirport(null)
        setBookingStep(nextStep)
        setSeatSelection(null)
        setTicketPhase("printing")
        setScreenCoverMode(null)
        setDraftFocusMinutes(30)
        setFocusTime(1800000)
        setTimeLeft(1800000)
        setActionBarOpen(true)
        currentMarkerLocationRef.current = null
    }

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
            console.error(t("focus.errors.geolocation_unsupported"))
            return
        }

        navigator.geolocation.getCurrentPosition((pos) => {
            setCurrentLocation([[pos.coords.longitude, pos.coords.latitude]])
        }, (error) => {
            console.error(t("focus.errors.geolocation_error"), error)
        })
    }

    const {isPlaying, toggle, stop} = useCameraFollowControl()

    const handleBeginBooking = () => {
        setScreenCoverMode("booking")
    }

    const handleOpenSettings = () => {
        setIsSettingsOpen(true)
    }

    const handleCloseSettings = () => {
        setIsSettingsOpen(false)
    }

    const handleSeatSelect = (choice: SeatSelectionChoice) => {
        setSeatSelection(choice)
    }

    const handleSeatConfirm = () => {
        if (!seatSelection) {
            return
        }

        setTicketPhase("printing")
        setBookingStep("ticket")
    }

    const handleCheckIn = () => {
        setTicketPhase("tear-ready")
    }

    const handleTicketTorn = () => {
        setTicketPhase((phase) => phase === "tear-ready" ? "board-ready" : phase)
    }

    const handleBoarding = () => {
        if (ticketPhase !== "board-ready") {
            return
        }

        setBookingStep("ready")
        setScreenCoverMode("boarding")
    }

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

    useEffect(() => {
        if (bookingStep !== "ticket" || ticketPhase !== "printing") {
            return
        }

        const timeout = window.setTimeout(() => {
            setTicketPhase("printed")
        }, TICKET_PRINT_DURATION)

        return () => window.clearTimeout(timeout)
    }, [bookingStep, ticketPhase, TICKET_PRINT_DURATION])

    useEffect(() => {
        if (screenCoverMode !== "booking") {
            return
        }

        const timeout = window.setTimeout(() => {
            setBookingStep("select-departure")
            setScreenCoverMode(null)
        }, SCREEN_COVER_DURATION)

        return () => window.clearTimeout(timeout)
    }, [screenCoverMode, SCREEN_COVER_DURATION])

    const handleEndRoute = () => {
        clearHoldTimers()
        setIsHoldingStop(false)
        setHoldProgress(0)
        setActionBarOpen(true)
        stop()
        document.exitFullscreen().then(() => {console.log("Exited fullscreen")}).catch((err) => {console.error("Error exiting fullscreen:", err)})

        if (currentLocation) {
            setFlightEndReturnTrigger((value) => value + 1)
        }

        resetSessionState("idle")
        setShowFlightEndedDialog(true)
    }

    const handleCreateAnotherSession = () => {
        setShowFlightEndedDialog(false)
        resetSessionState("select-departure")
    }

    const handleExitToMainScreen = () => {
        setShowFlightEndedDialog(false)
        resetSessionState("idle")
    }

    const handleAirportClick = (airport: Airport) => {
        if (bookingStep === "select-departure") {
            if (selectedArAirport?.id === airport.id) {
                gooeyToast.error(t("focus.errors.same_airport"))
                return
            }
            setSelectedDpAirport(airport)
            setBookingStep("select-focus-time")
        } else if (bookingStep === "select-arrival") {
            if (selectedDpAirport?.id === airport.id) {
                gooeyToast.error(t("focus.errors.same_airport"))
                return
            }
            setSelectedArAirport(airport)
            setSeatSelection(null)
            setTicketPhase("printing")
            setBookingStep("select-seat")
        }
    }

    const handleApplyFocusTime = () => {
        const nextFocusTime = draftFocusMinutes * 60000
        setFocusTime(nextFocusTime)
        setTimeLeft(nextFocusTime)
        setBookingStep("select-arrival")
    }


    const handleGo = async () => {
        if (isPlaying) return
        if (route.length < 2) {
            gooeyToast.error(t("focus.errors.select_both_airports"))
            return false
        }
        try {
            await document.documentElement.requestFullscreen()
            const audio = new Audio("/seatbelt.mp3")
            audio.volume = 0.65
            void audio.play()
            toggle()
            const IntervalID = setInterval(() => {
                setActionBarOpen(false)
                clearInterval(IntervalID)
            }, 3000)
            return true
        } catch (error) {
            console.error("Error starting focus flight:", error)
            gooeyToast.error(t("focus.errors.unable_to_start"))
            return false
        }
    }

    const handleGoFromBoardingCover = async () => {
        const hasStarted = await handleGo()

        if (hasStarted) {
            setScreenCoverMode(null)
        }
    }


    useEffect(() => {
        if (!selectedDpAirport || !selectedArAirport) return
        const builtRoute = turf.greatCircle(
            [selectedDpAirport.long, selectedDpAirport.lat],
            [selectedArAirport.long, selectedArAirport.lat],
            { npoints: 200 }
        )
        setRoute(builtRoute.geometry.coordinates as [number, number][])
        setTimeLeft(focusTime)
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
    const isSeatSelected = Boolean(seatSelection)
    const ticketDistanceKm = selectedDpAirport && selectedArAirport
        ? Math.round(turf.distance(
            [selectedDpAirport.long, selectedDpAirport.lat],
            [selectedArAirport.long, selectedArAirport.lat],
            { units: "kilometers" }
        ))
        : 0
    const coverCopy = screenCoverMode === "boarding"
        ? { title: t("focus.cover.boarding_title"), subtitle: t("focus.cover.boarding_subtitle") }
        : { title: timeGreeting, subtitle: t("focus.cover.booking_subtitle") }

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
            <MapController
                selectedDpAirport={selectedDpAirport}
                selectedArAirport={selectedArAirport}
                focusTime={focusTime}
            />
            <MapFlightEndReturn currentLocation={currentLocation} trigger={flightEndReturnTrigger} />
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
                <div className="absolute inset-0 flex flex-col items-center justify-center gap-2 pointer-events-none select-none px-4">
                    <p className="text-emerald-400 text-3xl sm:text-4xl lg:text-5xl uppercase tracking-widest font-semibold text-center">{timeGreeting}, User</p>
                    <p className="text-pink-300 text-base sm:text-lg lg:text-xl font-light text-center">{t("focus.cover.booking_subtitle")}</p>
                </div>
            </div>
        )}

        {/* ─── IDLE: "Book my flight" button ────────────────────────── */}
        {bookingStep === "idle" && !screenCoverMode && (
            <div className="absolute bottom-8 left-1/2 -translate-x-1/2 z-30">
                <button
                    onClick={handleBeginBooking}
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
                    <span>{t("buttons.book_flight")}</span>
                </button>
            </div>
        )}

        {bookingStep === "idle" && !screenCoverMode && (
            <div className="absolute top-5 right-5 z-30">
                <button
                    type="button"
                    onClick={handleOpenSettings}
                    className="flex items-center gap-2 rounded-2xl border border-white/12 bg-black/60 px-4 py-3 text-sm font-medium text-white/75 backdrop-blur-xl transition-all duration-300 hover:border-white/20 hover:bg-black/72 hover:text-white"
                >
                    <IoSettingsOutline className="text-base" />
                    <span>{t("buttons.settings")}</span>
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
                            ? t("focus.hints.click_set_departure")
                            : t("focus.hints.click_set_arrival")}
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
                    <motion.div initial={{ y: "100%" }} animate={{ y: 0 }} exit={{y: "100%"}} transition={{ animation: {
                        type: "spring", stiffness: 320, damping: 36, mass: 1
                    } }} className="bg-black/80 backdrop-blur-2xl border border-white/10 rounded-3xl p-6
                                    shadow-[0_-20px_80px_rgba(0,0,0,0.6)] space-y-5">
                        {/* Departure confirmation row */}
                        <div className="flex items-center gap-3">
                            <div className="w-9 h-9 rounded-xl bg-emerald-500/15 flex items-center justify-center shrink-0">
                                <LuPlaneTakeoff className="text-emerald-400 text-base" />
                            </div>
                            <div className="min-w-0">
                                    <p className="text-white/30 text-[10px] uppercase tracking-widest font-semibold">{t("focus.ui.departing_from")}</p>
                                <p className="text-white/80 text-sm font-semibold">{selectedDpAirport?.name}</p>
                                <p className="text-white/40 text-xs">{selectedDpAirport?.iata_code || selectedDpAirport?.ident}</p>
                            </div>
                        </div>

                        <div className="h-px bg-white/[0.07]" />

                        {/* Focus duration slider */}
                        <div className="space-y-4">
                            <div className="flex items-center justify-between">
                                <div>
                                    <p className="text-white/50 text-sm">{t("focus.ui.focus_duration")}</p>
                                </div>
                                <div className="flex items-baseline gap-2">
                                    <Counter value={draftFocusMinutes} gradientFrom="transparent" textColor="#FE9EC7" fontWeight={'bold'} fontSize={30} gap={1} />
                                    <span className="text-white/30 text-sm">{t("focus.ui.min")}</span>
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
                                <span>{t("focus.ui.min_short")}</span>
                                <span>{t("focus.ui.max_short")}</span>
                            </div>

                            <div className="pt-2 border-t border-white/10">
                                <div className="flex items-center justify-between">
                                    <span className="text-white/30 text-sm">Landing at:</span>
                                    <span className="text-emerald-400 text-sm font-medium">
                                        {(() => {
                                            const landingTime = new Date(Date.now() + draftFocusMinutes * 60 * 1000)
                                            const isNextDay = landingTime.toDateString() !== new Date().toDateString()
                                            const timeStr = landingTime.toLocaleString('en-US', {hour: '2-digit', minute: '2-digit'})
                                            return isNextDay 
                                                ? `Tomorrow ${timeStr}` 
                                                : timeStr
                                        })()}
                                    </span>
                                </div>
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
                                {t("focus.buttons.set_destination")}
                        </button>
                    </motion.div>
                </div>
            </div>
        )}

        {/* ─── SELECT SEAT: Full-screen seat selection overlay ──────── */}
        <AnimatePresence>
        {bookingStep === "select-seat" && (
            <>
                {/* Blurred backdrop */}
                <motion.div
                    className="absolute inset-0 z-20 backdrop-blur-md bg-transparent"
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0 }}
                    transition={{ duration: 0.3 }}
                />

                {/* Slide-up panel */}
                <motion.div
                    className="absolute inset-x-0 bottom-0 top-0 z-30 flex flex-col overflow-hidden"
                    initial={{ y: "100%" }}
                    animate={{ y: 0 }}
                    exit={{ y: "-100%" }}
                    transition={{ type: "spring", stiffness: 320, damping: 36, mass: 1 }}
                >
                    {/* Header pill */}
                    <div className="absolute top-5 left-1/2 -translate-x-1/2 z-10 pointer-events-none">
                        <div className="flex items-center gap-2.5 px-5 py-2.5 rounded-full backdrop-blur-xl border border-white/10 shadow-lg">
                            <span className="w-2 h-2 rounded-full shrink-0 animate-pulse bg-blue-400" />
                            <span className="text-white/80 text-sm font-medium whitespace-nowrap">{t("focus.ui.choose_your_seat")}</span>
                        </div>
                    </div>

                    {/* Scrollable seat map */}
                    <div className="flex-1 overflow-y-auto">
                        <SeatSelection onSeatSelect={handleSeatSelect} />
                    </div>

                    {/* Confirm button */}
                    <div className="shrink-0 px-4 py-4 bg-[#080b12]/90 backdrop-blur-xl border-t border-white/[0.07]">
                        <button
                            disabled={!isSeatSelected}
                            onClick={handleSeatConfirm}
                            className={`w-full py-3.5 rounded-xl font-semibold text-sm flex items-center justify-center gap-2 transition-all duration-200
                                ${isSeatSelected
                                    ? "bg-emerald-500/15 border border-emerald-400/30 text-emerald-100 hover:bg-emerald-500/25 hover:border-emerald-400/50 cursor-pointer"
                                    : "bg-white/5 border border-white/10 text-white/30 cursor-not-allowed"
                                }`}
                        >
                            <RiPlaneFill className={`text-lg ${isSeatSelected ? "text-emerald-300" : "text-white/20"}`} />
                            {isSeatSelected ? t("focus.buttons.print_boarding") : t("focus.buttons.select_seat_continue")}
                        </button>
                    </div>
                </motion.div>
            </>
        )}
        </AnimatePresence>

        <AnimatePresence>
        {bookingStep === "ticket" && selectedDpAirport && selectedArAirport && seatSelection && (
            <motion.div
                className="absolute inset-0 z-30 flex items-center justify-center overflow-hidden px-4 py-8 backdrop-blur-xl"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                transition={{ duration: 0.25 }}
            >
                <div className="absolute inset-0 bg-[transparent_30%]" />
                <div className="relative z-10 flex w-full max-w-5xl flex-col items-center justify-center gap-8 lg:flex-row lg:items-end lg:gap-14">
                    <motion.div
                        key={`${selectedDpAirport.id}-${selectedArAirport.id}-${seatSelection.seatId}`}
                        initial={{ clipPath: "inset(0 0 100% 0)", y: 320, scaleX: 0.94, rotateX: -35 }}
                        animate={{ clipPath: "inset(0 0 0 0)", y: 0, scaleX: 1, rotateX: 0 }}
                        transition={{ duration: 4, ease: "easeOut" }}
                        className="perspective-[1000px]"
                    >
                        <BoardingTicket
                            iataDeparture={selectedDpAirport.iata_code || selectedDpAirport.ident}
                            iataArrival={selectedArAirport.iata_code || selectedArAirport.ident}
                            departure={selectedDpAirport.name}
                            arrival={selectedArAirport.name}
                            seat={seatSelection.seatId}
                            distance={ticketDistanceKm}
                            timefocus={draftFocusMinutes}
                            disableTorn={ticketPhase !== "tear-ready"}
                            onTorn={handleTicketTorn}
                        />
                    </motion.div>

                    <div className="w-full max-w-sm rounded-[2rem] border border-white/10 bg-black/45 p-6 text-white shadow-[0_24px_80px_rgba(0,0,0,0.45)] backdrop-blur-2xl">
                        <p className="text-[10px] uppercase tracking-[0.45em] text-white/35">Gate workflow</p>
                        <div className="mt-4 space-y-3">
                            <p className="text-3xl font-semibold tracking-tight text-white">
                                {ticketPhase === "printing" && t("focus.ticket.phases.printing.title")}
                                {ticketPhase === "printed" && t("focus.ticket.phases.printed.title")}
                                {ticketPhase === "tear-ready" && t("focus.ticket.phases.tear-ready.title")}
                                {ticketPhase === "board-ready" && t("focus.ticket.phases.board-ready.title")}
                            </p>
                            <p className="text-sm leading-6 text-white/60">
                                {ticketPhase === "printing" && `${t("focus.ticket.phases.printing.desc")} ${seatSelection ? `${seatSelection.seatId} ${seatSelection.activityName.toLowerCase()}` : ""}`}
                                {ticketPhase === "printed" && t("focus.ticket.phases.printed.desc")}
                                {ticketPhase === "tear-ready" && t("focus.ticket.phases.tear-ready.desc")}
                                {ticketPhase === "board-ready" && t("focus.ticket.phases.board-ready.desc")}
                            </p>
                        </div>

                        <motion.div
                        initial={{ scaleY: 0.2, scaleX: 0.6, borderRadius: "2px", opacity: 0 }}
                        animate={{ scaleY: 1, scaleX: 1, borderRadius: "12px", opacity: 1 }}
                        transition={{ duration: 0.4, ease: "easeOut", type : "spring", stiffness: 320, damping: 36 }}

                         className="mt-6 flex flex-col gap-3">
                            {ticketPhase === "printed" && (
                                <Button
                                    type="button"
                                    className="h-12 rounded-full bg-white text-black hover:bg-white/90"
                                    onClick={handleCheckIn}
                                >
                                    Check In
                                </Button>
                            )}
                            {ticketPhase === "board-ready" && (
                                <Button
                                    type="button"
                                    className="h-12 rounded-full bg-emerald-500 text-black hover:bg-emerald-400"
                                    onClick={handleBoarding}
                                >
                                    Boarding
                                </Button>
                            )}
                        </motion.div>
                    </div>
                </div>
            </motion.div>
        )}
        </AnimatePresence>

        <AnimatePresence>
        {screenCoverMode && (
            <motion.div
                className="absolute inset-0 z-40 overflow-hidden"
                initial={{ opacity: 1 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                transition={{ duration: 0.2 }}
            >
                <motion.div
                    className="absolute inset-0 bg-[#02040a]"
                    initial={{ y: "100%" }}
                    animate={{ y: 0 }}
                    exit={{ y: "-100%" }}
                    transition={{ duration: 1.1, ease: [0.22, 1, 0.36, 1] }}
                />
                <div className="absolute inset-0 bg-[radial-gradient(circle_at_top,rgba(74,222,128,0.12),transparent_34%),radial-gradient(circle_at_bottom,rgba(59,130,246,0.16),transparent_40%)]" />
                <motion.div
                    className="absolute inset-0 flex flex-col items-center justify-center px-6 text-center"
                    initial={{ opacity: 0, y: 22 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -24 }}
                    transition={{ duration: 0.45, delay: 0.2 }}
                >
                    <p className="text-xs font-semibold uppercase tracking-[0.6em] text-white/35">Focus Flight</p>
                    <p className="mt-5 text-4xl font-semibold uppercase tracking-[0.16em] text-emerald-300 sm:text-5xl">
                        {coverCopy.title}
                    </p>
                    <p className="mt-3 text-lg font-light text-blue-200/85 sm:text-xl">{coverCopy.subtitle}</p>
                    {screenCoverMode === "boarding" && (
                        <Button
                            type="button"
                            className="mt-8 h-12 w-22 rounded-full bg-emerald-500 px-8 text-black hover:bg-emerald-400"
                            onClick={handleGoFromBoardingCover}
                        >
                            <RiPlaneFill className="mr-2 text-lg" />
                            Go
                        </Button>
                    )}
                </motion.div>
            </motion.div>
        )}
        </AnimatePresence>

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
                        {isHoldingStop ? t("focus.ui.hold_to_end_focus") : t("focus.ui.hold_to_end_flight")}
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

        <AnimatePresence>
        {isSettingsOpen && (
            <motion.div
                className="absolute inset-0 z-50"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                transition={{ duration: 0.2 }}
            >
                <Setting onClose={handleCloseSettings} />
            </motion.div>
        )}
        </AnimatePresence>

        <Dialog open={showFlightEndedDialog}>
            <DialogContent
                showCloseButton={false}
                className="max-w-md border-white/10 bg-black/85 text-white shadow-[0_24px_100px_rgba(0,0,0,0.55)] backdrop-blur-2xl"
            >
                <DialogHeader className="gap-3 text-left">
                    <DialogTitle className="text-2xl font-semibold tracking-tight text-emerald-300">
                        {t("focus.dialog.flight_ended_title")}
                    </DialogTitle>
                    <DialogDescription className="text-sm leading-6 text-white/65">
                        {t("focus.dialog.flight_ended_desc")}
                    </DialogDescription>
                </DialogHeader>
                <DialogFooter className="mt-2 flex-col gap-3 sm:flex-row sm:justify-end">
                    <Button
                        type="button"
                        variant="outline"
                        className="border-white/15 bg-white/5 text-white hover:bg-white/10 hover:text-white"
                        onClick={handleExitToMainScreen}
                    >
                        {t("focus.dialog.exit_main")}
                    </Button>
                    <Button
                        type="button"
                        className="bg-emerald-500 text-black hover:bg-emerald-400"
                        onClick={handleCreateAnotherSession}
                    >
                        {t("focus.dialog.create_another")}
                    </Button>
                </DialogFooter>
            </DialogContent>
        </Dialog>

    </Card>
  )
}