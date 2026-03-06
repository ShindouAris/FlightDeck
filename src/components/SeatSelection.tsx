import { useState } from "react";
import { Popover, PopoverContent } from "./ui/animate-ui/components/radix/popover";
import { PopoverTrigger } from "./ui/animate-ui/primitives/radix/popover";
import { FaSpa } from "react-icons/fa";
import { FiMonitor, FiBookOpen, FiActivity, FiPlus, FiCode } from "react-icons/fi";
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
    "1A","1C","2B","2F","3A","3D","3F",
    "5B","5C","5D","6A","6E","6F",
    "8B","8C","9A","9D","10C","10F",
    "12A","12B","12E","13C","13F","14A","14D",
    "15B","15C","16A","16D","16F","17B","17E",
    "18C","18D","19A","19F","20B","20E",
    "21A","21D","22C","22F","23B","23E",
    "24A","24D","25C","25F","26B","26E",
    "27A","27D","28B","28F","29C","29E",
    "30A","30D","31B","31F","32C","32E",
  ]);

  // First class (rows 1-3)
  for (let row = 1; row <= 3; row++) {
    ["A", "C", "D", "F"].forEach((col) => {
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
    ["A", "B", "C", "D", "E", "F"].forEach((col) => {
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
    ["A", "B", "C", "D", "E", "F"].forEach((col) => {
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
  onSelect,
}: {
  seat: SeatData;
  isSelected: boolean;
  onSelect: (seat: SeatData) => void;
}) {
  const isTaken = seat.status === SEAT_STATUS.TAKEN;
  const [open, setOpen] = useState(false);

  const baseStyle =
    "w-9 h-9 sm:w-10 sm:h-10 md:w-11 md:h-11 rounded-lg border transition-all duration-150 flex items-center justify-center relative text-[10px] font-mono tracking-wider";

  const stateStyle = isSelected
    ? "bg-white/90 border-white/70 text-slate-900 shadow-[0_0_16px_rgba(255,255,255,0.25)]"
    : isTaken
    ? "bg-[#0d1018] border-[#1a1e28] text-[#2a2f3d] cursor-not-allowed opacity-40"
    : "bg-[#1c2235] border-[#2d3a52] text-[#4a5878] hover:bg-[#232c44] hover:border-[#3d4e6a] cursor-pointer";

  return (
    <Popover open={open} onOpenChange={(open) => !isTaken && setOpen(open)}>
      <PopoverTrigger asChild>
        <button
          disabled={isTaken}
          title={isTaken ? "Taken" : seat.id}
          className={`${baseStyle} ${stateStyle}`}
        >
          {seat.col}
          {seat.isExit && !isTaken && (
            <span className="absolute -top-0.5 -right-0.5 w-1.5 h-1.5 bg-orange-400/80 rounded-full" />
          )}
        </button>
      </PopoverTrigger>
      <PopoverContent
        side="bottom"
        sideOffset={10}
        collisionPadding={16}
        className="w-72 p-4 border border-white/8 rounded-2xl shadow-2xl"
        style={{ background: "rgba(18, 22, 36, 0.96)", backdropFilter: "blur(16px)" }}
        initial={{ opacity: 0, y: 14, scale: 0.94 }}
        animate={{ opacity: 1, y: 0, scale: 1 }}
        exit={{ opacity: 0, y: 8, scale: 0.97 }}
        transition={{ type: "spring", stiffness: 380, damping: 28 }}
      >
        <p className="text-[11px] font-mono text-slate-500 mb-1">Seat: {seat.id}</p>
        <h3 className="text-sm font-semibold text-white mb-4 leading-snug">
          What do you want to focus?
        </h3>
        <div className="grid grid-cols-3 gap-2">
          {focusActivities.map((act) => (
            <button
              key={act.id}
              className="flex items-center gap-1.5 px-2.5 py-2 rounded-full bg-white/6 hover:bg-white/12 border border-white/8 text-slate-300 hover:text-white text-xs font-mono transition-all duration-150 select-none"
              onClick={() => {
                onSelect(seat);
                setOpen(false);
              }}
            >
              <span className={`text-sm shrink-0 ${act.color ?? "text-slate-300"}`}>{act.icon}</span>
              <span className="truncate">{act.name}</span>
            </button>
          ))}
          <button className="flex items-center justify-center px-2.5 py-2 rounded-full bg-white/6 hover:bg-white/12 border border-white/8 text-slate-500 hover:text-slate-300 transition-all duration-150">
            <FiPlus className="text-sm" />
          </button>
        </div>
      </PopoverContent>
    </Popover>
  );
}

export default function SeatSelection() {
  const [seats] = useState(generateSeats);
  const [selected, setSelected] = useState<SeatData | null>(null);

  const handleSelect = (seat: SeatData) => {
    setSelected(seat);
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
              <Seat key={s.id} seat={s} isSelected={selected?.id === s.id} onSelect={handleSelect} />
            ))}
          </div>
          <div className="w-8 sm:w-10 md:w-12 text-center font-mono text-[10px] text-[#2d3748] select-none">
            {paddedRow}
          </div>
          <div className="flex gap-1 sm:gap-1.5">
            {right.map((s) => (
              <Seat key={s.id} seat={s} isSelected={selected?.id === s.id} onSelect={handleSelect} />
            ))}
          </div>
        </div>
      );
    });
  };

  return (
    <div
      className="min-h-screen flex flex-col lg:flex-row gap-0"
      style={{
        background: "#080b12",
        fontFamily: "'DM Mono', 'Courier New', monospace",
      }}
    >
      {/* Plane map */}
      <div className="flex-1 flex flex-col items-center py-10 px-4 overflow-y-auto ">

        {/* Plane body */}
        <div
          className="relative w-full max-w-70 sm:max-w-xs md:max-w-sm"
          style={{ filter: "drop-shadow(0 0 40px rgba(0,0,0,0.8))" }}
        >

          {/* Fuselage body */}
          <div
            className="w-full px-5 sm:px-6 pb-50 pt-7 rounded-full"
            style={{
              background: "#0e1220",
              borderLeft: "1px solid #1e2840",
              borderRight: "1px solid #1e2840",
            }}
          >
            {/* Cockpit / Nose section */}
            <div className="flex flex-col items-center gap-1.5 pt-4 pb-6 mb-3">
              <div className="w-8 h-8 rounded-full flex items-center justify-center"
                style={{ background: "rgba(255,255,255,0.04)", border: "1px solid #1e2840" }}>
              </div>
              <span className="text-[8px] font-mono tracking-[0.35em] uppercase"
                style={{ color: "#1e2840" }}>cockpit</span>
              <div className="w-16 h-px mt-1" style={{ background: "linear-gradient(to right, transparent, #1e2840, transparent)" }} />
            </div>

            {/* First Class column headers */}
            <div className="flex items-center justify-center gap-2 sm:gap-3 mb-3">
              <div className="flex gap-1 sm:gap-1.5">
                {["A", "C"].map((c) => (
                  <div key={c} className="w-9 sm:w-10 md:w-11 text-center text-[9px] text-[#2d3748] font-mono tracking-widest">
                    {c}
                  </div>
                ))}
              </div>
              <div className="w-8 sm:w-10 md:w-12" />
              <div className="flex gap-1 sm:gap-1.5">
                {["D", "F"].map((c) => (
                  <div key={c} className="w-9 sm:w-10 md:w-11 text-center text-[9px] text-[#2d3748] font-mono tracking-widest">
                    {c}
                  </div>
                ))}
              </div>
            </div>

            {/* First Class */}
            <div className="flex flex-col gap-2">
              {renderRows(firstSeats, { left: ["A", "C"], right: ["D", "F"] })}
            </div>

            {/* Galley divider */}
            <div className="my-4 flex items-center gap-3 justify-center">
              <div className="h-px flex-1" style={{ background: "linear-gradient(to right, transparent, #1e2840)" }} />
              <span className="text-[8px] font-mono text-[#1e2840] tracking-[0.3em] uppercase">galley</span>
              <div className="h-px flex-1" style={{ background: "linear-gradient(to left, transparent, #1e2840)" }} />
            </div>

            {/* Business class column headers */}
            <div className="flex items-center justify-center gap-2 sm:gap-3 mb-3">
              <div className="flex gap-1 sm:gap-1.5">
                {["A", "B", "C"].map((c) => (
                  <div key={c} className="w-9 sm:w-10 md:w-11 text-center text-[9px] text-[#2d3748] font-mono tracking-widest">
                    {c}
                  </div>
                ))}
              </div>
              <div className="w-8 sm:w-10 md:w-12" />
              <div className="flex gap-1 sm:gap-1.5">
                {["D", "E", "F"].map((c) => (
                  <div key={c} className="w-9 sm:w-10 md:w-11 text-center text-[9px] text-[#2d3748] font-mono tracking-widest">
                    {c}
                  </div>
                ))}
              </div>
            </div>

            {/* Business */}
            <div className="flex flex-col gap-2">
              {renderRows(businessSeats, { left: ["A", "B", "C"], right: ["D", "E", "F"] })}
            </div>

            {/* Galley divider */}
            <div className="my-4 flex items-center gap-3 justify-center">
              <div className="h-px flex-1" style={{ background: "linear-gradient(to right, transparent, #1e2840)" }} />
              <span className="text-[8px] font-mono text-[#1e2840] tracking-[0.3em] uppercase">galley</span>
              <div className="h-px flex-1" style={{ background: "linear-gradient(to left, transparent, #1e2840)" }} />
            </div>

            {/* Economy */}
            <div className="flex flex-col gap-2">
              {renderRows(economySeats, { left: ["A", "B", "C"], right: ["D", "E", "F"] })}
            </div>
          </div>

        </div>
      </div>
    </div>
  );
}