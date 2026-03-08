import { useState } from "react";
import { Popover, PopoverContent } from "./ui/animate-ui/components/radix/popover";
import { PopoverTrigger } from "./ui/animate-ui/primitives/radix/popover";
import { FaSpa } from "react-icons/fa";
import { FiMonitor, FiBookOpen, FiActivity, FiCode } from "react-icons/fi";
import { MdSelfImprovement } from "react-icons/md";

type SeatData = {
  id: string;
  row: number;
  col: string;
  class: string;
  status: string;
  price: number;
  isExit?: boolean;
};

const SEAT_CLASSES = {
  FIRST: "first",
  BUSINESS: "business",
  ECONOMY: "economy",
};

const SEAT_STATUS = {
  AVAILABLE: "available",
  TAKEN: "taken",
  SELECTED: "selected",
  PREMIUM: "premium",
};

function generateSeats(): SeatData[] {
  const seats: SeatData[] = [];
  const takenSeats = new Set([
    "1A","1B","2C","3A","3D",
    "5B","5C","6A","6D",
    "8B","8C","9A","9D","10C","10D",
    "12A","12B","13C","13D","14A","14C",
    "15B","15C","16A","16D","17B","17C",
    "18C","18D","19A","19B","20B","20C",
    "21A","21D","22C","22B","23B","23C",
    "24A","24D","25C","25B","26B","26C",
    "27A","27D","28B","28C","29C","29B",
    "30A","30D","31B","31C","32C","32B",
  ]);

  // First class (rows 1-3)
  for (let row = 1; row <= 3; row++) {
    ["A", "B", "C", "D"].forEach((col) => {
      const id = `${row}${col}`;
      seats.push({
        id,
        row,
        col,
        class: SEAT_CLASSES.FIRST,
        status: takenSeats.has(id) ? SEAT_STATUS.TAKEN : SEAT_STATUS.AVAILABLE,
        price: 450,
      });
    });
  }

  // Business (rows 5-10)
  for (let row = 5; row <= 10; row++) {
    ["A", "B", "C", "D"].forEach((col) => {
      const id = `${row}${col}`;
      seats.push({
        id,
        row,
        col,
        class: SEAT_CLASSES.BUSINESS,
        status: takenSeats.has(id) ? SEAT_STATUS.TAKEN : SEAT_STATUS.AVAILABLE,
        price: 220,
      });
    });
  }

  // Economy (rows 12-32)
  for (let row = 12; row <= 32; row++) {
    ["A", "B", "C", "D"].forEach((col) => {
      const id = `${row}${col}`;
      const isExit = row === 16 || row === 22;
      seats.push({
        id,
        row,
        col,
        class: SEAT_CLASSES.ECONOMY,
        status: takenSeats.has(id) ? SEAT_STATUS.TAKEN : SEAT_STATUS.AVAILABLE,
        price: isExit ? 95 : 55,
        isExit,
      });
    });
  }

  return seats;
}

interface Activity {
  id: string;
  name: string;
  icon: React.ReactNode;
  color?: string;
}

export interface SeatSelectionChoice {
  seatId: string;
  activityId: string;
  activityName: string;
}

const focusActivities: Activity[] = [
  { id: "focus",    name: "Focus",    icon: <MdSelfImprovement />, color: "text-purple-400" },
  { id: "work",     name: "Work",     icon: <FiMonitor />,         color: "text-slate-300" },
  { id: "meditate", name: "Meditate", icon: <FaSpa />,             color: "text-violet-400" },
  { id: "read",     name: "Read",     icon: <FiBookOpen />,        color: "text-teal-400" },
  { id: "exercise", name: "Exercise", icon: <FiActivity />,        color: "text-slate-300" },
  { id: "coding",   name: "Coding",   icon: <FiCode />,            color: "text-blue-400" }
];

function Seat({
  seat,
  isSelected,
  selectedActivity,
  onSelect,
}: {
  seat: SeatData;
  isSelected: boolean;
  selectedActivity?: Activity;
  onSelect: (seat: SeatData, activity: Activity) => void;
}) {
  const isTaken = seat.status === SEAT_STATUS.TAKEN;
  const [open, setOpen] = useState(false);

  const baseStyle =
    "w-12 h-12 sm:w-13 sm:h-13 md:w-15 md:h-15 rounded-lg border transition-all duration-150 flex items-center justify-center relative text-[10px] font-mono tracking-wider";

  const stateStyle = isSelected
    ? "border-slate-900/80 bg-slate-900 text-white shadow-[0_10px_24px_rgba(15,23,42,0.22)] dark:border-white/70 dark:bg-white/90 dark:text-slate-900 dark:shadow-[0_0_16px_rgba(255,255,255,0.25)]"
    : isTaken
    ? "cursor-not-allowed border-slate-300/90 bg-slate-200/95 text-slate-400 opacity-55 dark:border-[#1a1e28] dark:bg-[#0d1018] dark:text-[#2a2f3d] dark:opacity-40"
    : "cursor-pointer border-slate-300 bg-white text-slate-500 shadow-[0_6px_16px_rgba(148,163,184,0.12)] hover:border-slate-400 hover:bg-slate-50 hover:text-slate-700 dark:border-[#2d3a52] dark:bg-[#1c2235] dark:text-[#4a5878] dark:shadow-none dark:hover:border-[#3d4e6a] dark:hover:bg-[#232c44]";

  return (
    <Popover open={open} onOpenChange={(open) => !isTaken && setOpen(open)}>
      <PopoverTrigger asChild>
        <button
          disabled={isTaken}
          title={isTaken ? "Taken" : seat.id}
          className={`${baseStyle} ${stateStyle}`}
        >
          {selectedActivity
            ? <span className={`text-base ${selectedActivity.color ?? "text-slate-300"}`}>{selectedActivity.icon}</span>
            : null
          }
          {seat.isExit && !isTaken && (
            <span className="absolute -top-0.5 -right-0.5 h-1.5 w-1.5 rounded-full bg-orange-500/80 dark:bg-orange-400/80" />
          )}
        </button>
      </PopoverTrigger>
      <PopoverContent
        side="bottom"
        sideOffset={10}
        collisionPadding={16}
        className="w-72 rounded-2xl border border-slate-900/8 bg-white/95 p-4 shadow-[0_22px_55px_rgba(15,23,42,0.18)] backdrop-blur-xl dark:border-white/8 dark:bg-[rgba(18,22,36,0.96)] dark:shadow-2xl"
        initial={{ opacity: 0, y: 14, scale: 0.94 }}
        animate={{ opacity: 1, y: 0, scale: 1 }}
        exit={{ opacity: 0, y: 8, scale: 0.97 }}
        transition={{ type: "spring", stiffness: 380, damping: 28 }}
      >
        <p className="mb-1 text-[11px] font-mono text-slate-500 dark:text-slate-500">Seat: {seat.id}</p>
        <h3 className="mb-4 text-sm font-semibold leading-snug text-slate-900 dark:text-white">
          What do you want to focus?
        </h3>
        <div className="grid grid-cols-3 gap-2">
          {focusActivities.map((act) => (
            <button
              key={act.id}
              className="select-none rounded-full border border-slate-200 bg-slate-100 px-2.5 py-2 text-xs font-mono text-slate-600 transition-all duration-150 hover:border-slate-300 hover:bg-slate-200 hover:text-slate-900 dark:border-white/8 dark:bg-white/6 dark:text-slate-300 dark:hover:bg-white/12 dark:hover:text-white"
              onClick={() => {
                onSelect(seat, act);
                setOpen(false);
              }}
            >
              <span className={`text-sm shrink-0 ${act.color ?? "text-slate-300"}`}>{act.icon}</span>
              <span className="truncate">{act.name}</span>
            </button>
          ))}
        </div>
      </PopoverContent>
    </Popover>
  );
}

export default function SeatSelection({ onSeatSelect }: { onSeatSelect?: (choice: SeatSelectionChoice) => void } = {}) {
  const [seats] = useState(generateSeats);
  const [selection, setSelection] = useState<{ seat: SeatData; activity: Activity } | null>(null);

  const handleSelect = (seat: SeatData, activity: Activity) => {
    setSelection({ seat, activity });
    onSeatSelect?.({
      seatId: seat.id,
      activityId: activity.id,
      activityName: activity.name,
    });
  };

  const firstSeats = seats.filter((s) => s.class === SEAT_CLASSES.FIRST);
  const businessSeats = seats.filter((s) => s.class === SEAT_CLASSES.BUSINESS);
  const economySeats = seats.filter((s) => s.class === SEAT_CLASSES.ECONOMY);

  const renderRows = (seatList: SeatData[], cols: { left: string[]; right: string[] }) => {
    const rows: Record<number, SeatData[]> = {};
    seatList.forEach((seat) => {
      if (!rows[seat.row]) rows[seat.row] = [];
      rows[seat.row].push(seat);
    });

    return Object.entries(rows).map(([row, rowSeats]) => {
      const left = rowSeats.filter((s) => cols.left.includes(s.col));
      const right = rowSeats.filter((s) => cols.right.includes(s.col));
      const paddedRow = String(row).padStart(2, "0");

      return (
        <div key={row} className="flex items-center justify-center gap-2 sm:gap-3">
          <div className="flex gap-1 sm:gap-1.5">
            {left.map((s) => (
              <Seat key={s.id} seat={s} isSelected={selection?.seat.id === s.id} selectedActivity={selection?.seat.id === s.id ? selection.activity : undefined} onSelect={handleSelect} />
            ))}
          </div>
          <div className="w-12 sm:w-13 md:w-15 text-center font-mono text-[10px] text-[#2d3748] select-none">
            {paddedRow}
          </div>
          <div className="flex gap-1 sm:gap-1.5">
            {right.map((s) => (
              <Seat key={s.id} seat={s} isSelected={selection?.seat.id === s.id} selectedActivity={selection?.seat.id === s.id ? selection.activity : undefined} onSelect={handleSelect} />
            ))}
          </div>
        </div>
      );
    });
  };

  return (
    <div
      className="min-h-screen flex flex-col gap-0 lg:flex-row"
      style={{
        fontFamily: "'DM Mono', 'Courier New', monospace",
      }}
    >
      {/* Plane map */}
      <div className="flex flex-1 flex-col items-center overflow-y-auto bg-white/16 px-4 py-10 shadow-[inset_0_1px_0_rgba(255,255,255,0.38)] backdrop-blur-lg dark:bg-black/5 dark:shadow-none">

        {/* Plane body */}
        <div
          className="relative w-full max-w-70 drop-shadow-[0_22px_40px_rgba(148,163,184,0.28)] dark:drop-shadow-[0_0_40px_rgba(0,0,0,0.8)] sm:max-w-xs md:max-w-sm"
        >

          {/* Fuselage body */}
          <div
            className="w-full rounded-full border-x border-slate-300/90 bg-slate-100 px-5 pt-7 pb-50 shadow-[inset_0_1px_0_rgba(255,255,255,0.8)] dark:border-x-[#1e2840] dark:bg-[#0e1220] dark:shadow-none sm:px-6"
          >
            {/* Cockpit / Nose section */}
            <div className="flex flex-col items-center gap-1.5 pt-4 pb-6 mb-3">
              <div className="flex h-8 w-8 items-center justify-center rounded-full border border-slate-300 bg-white/80 dark:border-[#1e2840] dark:bg-white/4">
              </div>
              <span className="text-[8px] font-mono uppercase tracking-[0.35em] text-slate-400 dark:text-[#1e2840]">cockpit</span>
              <div className="mt-1 h-px w-16 bg-[linear-gradient(to_right,transparent,rgba(148,163,184,0.9),transparent)] dark:bg-[linear-gradient(to_right,transparent,#1e2840,transparent)]" />
            </div>

            {/* First Class column headers */}
            <div className="flex items-center justify-center gap-2 sm:gap-3 mb-3">
              <div className="flex gap-1 sm:gap-1.5">
                {["A", "B"].map((c) => (
                  <div key={c} className="w-9 text-center font-mono text-[9px] tracking-widest text-slate-400 dark:text-[#2d3748] sm:w-10 md:w-11">
                    {c}
                  </div>
                ))}
              </div>
              <div className="w-8 sm:w-10 md:w-12" />
              <div className="flex gap-1 sm:gap-1.5">
                {["C", "D"].map((c) => (
                  <div key={c} className="w-10 text-center font-mono text-[9px] tracking-widest text-slate-400 dark:text-[#2d3748] sm:w-13 md:w-15">
                    {c}
                  </div>
                ))}
              </div>
            </div>

            {/* First Class */}
            <div className="flex flex-col gap-2">
              {renderRows(firstSeats, { left: ["A", "B"], right: ["C", "D"] })}
            </div>

            {/* Galley divider */}
            <div className="my-4 flex items-center gap-3 justify-center">
              <div className="h-px flex-1 bg-[linear-gradient(to_right,transparent,rgba(148,163,184,0.9))] dark:bg-[linear-gradient(to_right,transparent,#1e2840)]" />
              <span className="text-[8px] font-mono uppercase tracking-[0.3em] text-slate-400 dark:text-[#1e2840]">galley</span>
              <div className="h-px flex-1 bg-[linear-gradient(to_left,transparent,rgba(148,163,184,0.9))] dark:bg-[linear-gradient(to_left,transparent,#1e2840)]" />
            </div>

            {/* Business class column headers */}
            <div className="flex items-center justify-center gap-2 sm:gap-3 mb-3">
              <div className="flex gap-1 sm:gap-1.5">
                {["A", "B"].map((c) => (
                  <div key={c} className="w-9 text-center font-mono text-[9px] tracking-widest text-slate-400 dark:text-[#2d3748] sm:w-10 md:w-11">
                    {c}
                  </div>
                ))}
              </div>
              <div className="w-8 sm:w-10 md:w-12" />
              <div className="flex gap-1 sm:gap-1.5">
                {["C", "D"].map((c) => (
                  <div key={c} className="w-10 text-center font-mono text-[9px] tracking-widest text-slate-400 dark:text-[#2d3748] sm:w-13 md:w-15">
                    {c}
                  </div>
                ))}
              </div>
            </div>

            {/* Business */}
            <div className="flex flex-col gap-2">
              {renderRows(businessSeats, { left: ["A", "B"], right: ["C", "D"] })}
            </div>

            {/* Galley divider */}
            <div className="my-4 flex items-center gap-3 justify-center">
              <div className="h-px flex-1 bg-[linear-gradient(to_right,transparent,rgba(148,163,184,0.9))] dark:bg-[linear-gradient(to_right,transparent,#1e2840)]" />
              <span className="text-[8px] font-mono uppercase tracking-[0.3em] text-slate-400 dark:text-[#1e2840]">galley</span>
              <div className="h-px flex-1 bg-[linear-gradient(to_left,transparent,rgba(148,163,184,0.9))] dark:bg-[linear-gradient(to_left,transparent,#1e2840)]" />
            </div>

            {/* Economy */}
            <div className="flex flex-col gap-2">
              {renderRows(economySeats, { left: ["A", "B"], right: ["C", "D"] })}
            </div>
          </div>

        </div>
      </div>
    </div>
  );
}