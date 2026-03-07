import React, { ReactElement, useState, cloneElement } from 'react'
import { IoIosArrowUp } from "react-icons/io";
import { LuPlaneLanding, LuPlaneTakeoff } from "react-icons/lu";
import { IoSettingsOutline } from "react-icons/io5";
import { Button } from './ui/button';
import Counter from './ui/Counter';

interface ActionButton {
    title: string
    icon: ReactElement
    onClick: () => void
}

interface ActionBarProps {
    open: boolean
    distance: number
    origin: string
    destination: string
    iataorigin: string
    iatadestination: string
    /** Remaining time in seconds */
    timeLeft: number
    /** Total focus duration in seconds, used to compute progress */
    totalTime: number
    endTime: Date
    button?: ActionButton[]
    handleOpenClick: () => void
}

function formatTimeLeft(totalSeconds: number): string {
    const h = Math.floor(totalSeconds / 3600)
    const m = Math.floor((totalSeconds % 3600) / 60)
    const s = totalSeconds % 60
    if (h > 0) return `${h}h ${m}m`
    if (m > 0) return `${m}m ${s < 10 ? `0${s}` : s}s`
    return `${s}s`
}

function formatEndTime(date: Date): string {
    return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
}

const LocationCard = ({ iata, name, is_dest }: { iata: string, name: string, is_dest: boolean }) => {
    return (
        <div className="flex items-center gap-3 rounded-2xl bg-white/4 border border-white/[0.07] px-4 py-3">
            <div className={`shrink-0 w-8 h-8 rounded-xl flex items-center justify-center ${is_dest ? 'bg-violet-500/15' : 'bg-emerald-500/15'}`}>
                {is_dest
                    ? <LuPlaneLanding className="text-violet-400 text-base" />
                    : <LuPlaneTakeoff className="text-emerald-400 text-base" />}
            </div>
            <div className="min-w-0">
                <p className="text-white/80 text-base font-semibold leading-none">{iata}</p>
                <p className="text-white/30 text-[11px] mt-1 truncate">{name}</p>
            </div>
            <span className="ml-auto text-[9px] uppercase tracking-widest font-semibold shrink-0 text-white/20">
                {is_dest ? 'Arrival' : 'Departure'}
            </span>
        </div>
    )
}

export const ActionBar: React.FC<ActionBarProps> = ({ open, 
        distance, 
        origin, 
        destination, 
        iataorigin, 
        iatadestination, 
        timeLeft, 
        totalTime, 
        endTime, 
        button, 
        handleOpenClick 
    }) => {
    const progress = totalTime > 0 ? Math.max(0, Math.min(1, (totalTime - timeLeft) / totalTime)) : 0

    const hoursLeft = Math.floor(timeLeft / 3600)
    const minutesLeft = Math.floor((timeLeft % 3600) / 60)
    const secondsLeft = timeLeft % 60
    const visibleTimeUnits = [
        { label: "Hrs", value: hoursLeft },
        { label: "Min", value: minutesLeft },
        { label: "Sec", value: secondsLeft },
    ].filter((unit) => unit.value !== 0)

    return (
        <div className="w-full md:w-120">
            <div className="relative flex flex-col items-center bg-[#08090f]/95 backdrop-blur-2xl border border-white/8 rounded-3xl shadow-[0_8px_48px_rgba(0,0,0,0.7)] overflow-hidden">

                {/* Progress bar — top edge */}
                <div className="absolute top-0 left-0 right-0 h-0.5 bg-white/4">
                    <div
                        className="h-full bg-linear-to-r from-violet-500 to-indigo-400 transition-all duration-500"
                        style={{ width: `${progress * 100}%` }}
                    />
                </div>

                {/* Drag handle + toggle */}
                <button
                    onClick={handleOpenClick}
                    className="w-full flex flex-col items-center pt-4 pb-2 gap-1.5 focus:outline-none cursor-pointer group"
                    aria-label={open ? "Collapse" : "Expand"}
                >
                    <div className="w-8 h-0.75 bg-white/15 rounded-full group-hover:bg-white/30 transition-colors duration-200" />
                    <IoIosArrowUp
                        className={`text-white/20 text-sm transition-all duration-300 ease-in-out group-hover:text-white/40 ${open ? '' : 'rotate-180'}`}
                    />
                </button>

                {/* Stats row — always visible */}
                <div className="flex items-center w-full px-6 pb-5">
                    {/* Arrival time */}
                    <div className="flex flex-col items-start flex-1 gap-0.5">
                        <span className="text-white/30 text-[8px] uppercase tracking-[0.18em] font-semibold">Arrives</span>
                        <span className="text-white/90 text-lg font-semibold tabular-nums leading-none">
                            {formatEndTime(endTime)}
                        </span>
                    </div>

                    <div className="w-px h-8 bg-white/[0.07] mx-1" />

                    {/* Time remaining */}
                    <div className="flex flex-col items-center flex-1 gap-0.5">
                        <span className="text-white/30 text-[8px] uppercase tracking-[0.18em] font-semibold">Remaining</span>
                        <div className="flex items-end gap-1.5">
                            {visibleTimeUnits.map((unit) => (
                                <div key={unit.label} className="flex flex-col items-center text-violet-400 font-bold">
                                    <Counter value={unit.value} places={[10, 1]} gradientFrom="transparent" gap={0} fontSize={20} />
                                    <span className="text-white text-[8px] uppercase tracking-[0.12em] font-semibold!">{unit.label}</span>
                                </div>
                            ))}
                        </div>
                    </div>

                    <div className="w-px h-8 bg-white/[0.07] mx-1" />

                    {/* Distance */}
                    <div className="flex flex-col items-end flex-1 gap-0.5">
                        <span className="text-white/30 text-[8px] uppercase tracking-[0.18em] font-semibold">Distance</span>
                        <span className="text-white/70 text-lg font-semibold tabular-nums leading-none">
                            <Counter value={distance} gradientFrom="transparent" textColor="text-white" gap={2} fontSize={20} />
                            <span className="text-white/25 text-xs font-normal"> nm</span>
                        </span>
                    </div>
                </div>

                <div
                    className={`w-full overflow-hidden transition-all duration-300 ease-in-out`}
                    >
                    <div className="w-full border-t border-white/6 bg-white/2 px-5 py-3 flex justify-center gap-2.5">
                        <LuPlaneLanding className="text-violet-400/80 text-sm shrink-0" />
                        <span className="text-white/40 text-[11px] tracking-wide font-medium truncate">{destination}</span>
                    </div>
                </div>

                {/* Collapsible panel */}
                <div className={`w-full overflow-hidden transition-all duration-300 ease-in-out ${open ? 'max-h-96 opacity-100' : 'max-h-0 opacity-0 pointer-events-none'}`}>

                    {/* Info tab */}                 
                    <div className="flex flex-col gap-2 px-4 py-4">
                        <LocationCard iata={iataorigin} name={origin} is_dest={false} />
                        <LocationCard iata={iatadestination} name={destination} is_dest={true} />
                    </div>
                    {button ? (
                        <div className="flex justify-center gap-4 p-4">
                            {button?.map((b, i) => (
                                <div key={i} className="flex flex-col items-center gap-1">
                                    <Button key={i} variant="outline" size="lg" className="w-12 bg-gray-400" onClick={b.onClick}>
                                        {/* @ts-ignore */}
                                        {cloneElement(b.icon, { className: "!w-8 !h-8" })} 
                                    </Button>
                                    <span key={`${i}-text`} className="text-white/70 text-sm font-medium">
                                        {b.title}
                                    </span>
                                </div>
                            ))}
                        </div>
                    ) : ""}
                </div>
            </div>
        </div>
    )
}

export const RenderActionBar = () => {
    const [open, setOpen] = useState(true)
    return (
        <div className="min-h-screen bg-[#060710] flex items-end justify-start p-6">
            <ActionBar
                open={open}
                distance={1842}
                origin="Noi Bai International Airport"
                destination="Tan Son Nhat International Airport"
                iataorigin="HAN"
                iatadestination="SGN"
                timeLeft={8735}
                totalTime={3600}
                button={[{
                    title: "Cài đặt",
                    icon: <IoSettingsOutline />,
                    onClick: () => alert("Cài đặt clicked")
                }]}
                endTime={new Date(Date.now() + 2340 * 1000)}
                handleOpenClick={() => setOpen(o => !o)}
            />
        </div>
    )
}