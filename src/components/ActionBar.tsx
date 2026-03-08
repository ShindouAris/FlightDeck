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

function formatEndTime(date: Date): string {
    return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
}

const LocationCard = ({ iata, name, is_dest }: { iata: string, name: string, is_dest: boolean }) => {
    return (
        <div className="flex items-center gap-3 rounded-2xl border border-slate-900/8 bg-slate-950/3 px-4 py-3 dark:border-white/[0.07] dark:bg-white/4">
            <div className={`shrink-0 w-8 h-8 rounded-xl flex items-center justify-center ${is_dest ? 'bg-violet-500/12 dark:bg-violet-500/15' : 'bg-emerald-500/12 dark:bg-emerald-500/15'}`}>
                {is_dest
                    ? <LuPlaneLanding className="text-violet-500 dark:text-violet-400 text-base" />
                    : <LuPlaneTakeoff className="text-emerald-500 dark:text-emerald-400 text-base" />}
            </div>
            <div className="min-w-0">
                <p className="text-slate-900/85 dark:text-white/80 text-base font-semibold leading-none">{iata}</p>
                <p className="text-slate-600/70 dark:text-white/30 text-[11px] mt-1 truncate">{name}</p>
            </div>
            <span className="ml-auto text-[9px] uppercase tracking-widest font-semibold shrink-0 text-slate-500/70 dark:text-white/20">
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
            <div className="relative flex flex-col items-center overflow-hidden rounded-3xl border border-slate-900/8 bg-white/92 shadow-[0_18px_48px_rgba(15,23,42,0.14)] backdrop-blur-2xl dark:border-white/8 dark:bg-[#08090f]/95 dark:shadow-[0_8px_48px_rgba(0,0,0,0.7)]">

                {/* Progress bar — top edge */}
                <div className="absolute top-0 left-0 right-0 h-0.5 bg-slate-900/5 dark:bg-white/4">
                    <div
                        className="h-full bg-linear-to-r from-violet-500 to-indigo-400 transition-all duration-500"
                        style={{ width: `${progress * 100}%` }}
                    />
                </div>

                {/* Drag handle + toggle */}
                <button
                    onClick={handleOpenClick}
                    className="group flex w-full cursor-pointer flex-col items-center gap-1.5 pt-4 pb-2 focus:outline-none"
                    aria-label={open ? "Collapse" : "Expand"}
                >
                    <div className="h-0.75 w-8 rounded-full bg-slate-900/12 transition-colors duration-200 group-hover:bg-slate-900/22 dark:bg-white/15 dark:group-hover:bg-white/30" />
                    <IoIosArrowUp
                        className={`text-sm text-slate-500 transition-all duration-300 ease-in-out group-hover:text-slate-700 dark:text-white/20 dark:group-hover:text-white/40 ${open ? '' : 'rotate-180'}`}
                    />
                </button>

                {/* Stats row — always visible */}
                <div className="flex items-center w-full px-6 pb-5">
                    {/* Arrival time */}
                    <div className="flex flex-col items-start flex-1 gap-0.5">
                        <span className="text-[8px] font-semibold uppercase tracking-[0.18em] text-slate-500 dark:text-white/30">Arrives</span>
                        <span className="text-lg font-semibold leading-none text-slate-950 tabular-nums dark:text-white/90">
                            {formatEndTime(endTime)}
                        </span>
                    </div>

                    <div className="mx-1 h-8 w-px bg-slate-900/8 dark:bg-white/[0.07]" />

                    {/* Time remaining */}
                    <div className="flex flex-col items-center flex-1 gap-0.5">
                        <span className="text-[8px] font-semibold uppercase tracking-[0.18em] text-slate-500 dark:text-white/30">Remaining</span>
                        <div className="flex items-end gap-1.5">
                            {visibleTimeUnits.map((unit) => (
                                <div key={unit.label} className="flex flex-col items-center font-bold text-violet-600 dark:text-violet-400">
                                    <Counter value={unit.value} places={[10, 1]} gradientFrom="transparent" gap={0} fontSize={20} />
                                    <span className="text-[8px] uppercase tracking-[0.12em] font-semibold! text-slate-700 dark:text-white">{unit.label}</span>
                                </div>
                            ))}
                        </div>
                    </div>

                    <div className="mx-1 h-8 w-px bg-slate-900/8 dark:bg-white/[0.07]" />

                    {/* Distance */}
                    <div className="flex flex-col items-end flex-1 gap-0.5">
                        <span className="text-[8px] font-semibold uppercase tracking-[0.18em] text-slate-500 dark:text-white/30">Distance</span>
                        <span className="text-lg font-semibold leading-none text-slate-800 tabular-nums dark:text-white/70">
                            <Counter value={distance} gradientFrom="transparent" gap={2} fontSize={20} />
                            <span className="text-xs font-normal text-slate-500 dark:text-white/25"> nm</span>
                        </span>
                    </div>
                </div>

                <div
                    className={`w-full overflow-hidden transition-all duration-300 ease-in-out`}
                    >
                    <div className="flex w-full justify-center gap-2.5 border-t border-slate-900/6 bg-slate-900/3 px-5 py-3 dark:border-white/6 dark:bg-white/2">
                        <LuPlaneLanding className="text-sm shrink-0 text-violet-500/80 dark:text-violet-400/80" />
                        <span className="truncate text-[11px] font-medium tracking-wide text-slate-600 dark:text-white/40">{destination}</span>
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
                                    <Button
                                        key={i}
                                        variant="outline"
                                        size="lg"
                                        className="w-12 rounded-2xl border-slate-900/10 bg-white/90 text-slate-700 shadow-[0_10px_24px_rgba(15,23,42,0.08)] hover:bg-slate-100 dark:border-white/10 dark:bg-white/6 dark:text-white/80 dark:hover:bg-white/12"
                                        onClick={b.onClick}
                                    >
                                        {/* @ts-ignore */}
                                        {cloneElement(b.icon, { className: "!w-8 !h-8" })} 
                                    </Button>
                                    <span key={`${i}-text`} className="text-sm font-medium text-slate-700 dark:text-white/70">
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
        <div className="flex min-h-screen items-end justify-start bg-[radial-gradient(circle_at_top_left,rgba(148,163,184,0.22),transparent_28%),linear-gradient(180deg,#f8fafc_0%,#e2e8f0_100%)] p-6 dark:bg-[radial-gradient(circle_at_top_left,rgba(99,102,241,0.14),transparent_28%),linear-gradient(180deg,#060710_0%,#111827_100%)]">
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