import { useState } from "react";

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

const classColors = {
  [SEAT_CLASSES.FIRST]: {
    available: "bg-amber-400/20 border-amber-400 hover:bg-amber-400/50 text-amber-300",
    taken: "bg-slate-700/50 border-slate-600 text-slate-600 cursor-not-allowed",
    selected: "bg-amber-400 border-amber-300 text-slate-900 shadow-[0_0_12px_rgba(251,191,36,0.6)]",
  },
  [SEAT_CLASSES.BUSINESS]: {
    available: "bg-sky-500/20 border-sky-500 hover:bg-sky-500/40 text-sky-300",
    taken: "bg-slate-700/50 border-slate-600 text-slate-600 cursor-not-allowed",
    selected: "bg-sky-400 border-sky-300 text-slate-900 shadow-[0_0_12px_rgba(56,189,248,0.6)]",
  },
  [SEAT_CLASSES.ECONOMY]: {
    available: "bg-emerald-500/15 border-emerald-600 hover:bg-emerald-500/35 text-emerald-400",
    taken: "bg-slate-700/50 border-slate-600 text-slate-600 cursor-not-allowed",
    selected: "bg-emerald-400 border-emerald-300 text-slate-900 shadow-[0_0_12px_rgba(52,211,153,0.6)]",
  },
};

function Seat({ seat, isSelected, onSelect }: { seat: SeatData; isSelected: boolean; onSelect: (seat: SeatData) => void }) {
  const colors = classColors[seat.class];
  let colorClass = isSelected
    ? colors.selected
    : seat.status === SEAT_STATUS.TAKEN
    ? colors.taken
    : colors.available;

  return (
    <button
      onClick={() => seat.status !== SEAT_STATUS.TAKEN && onSelect(seat)}
      disabled={seat.status === SEAT_STATUS.TAKEN}
      title={seat.status === SEAT_STATUS.TAKEN ? "Taken" : `${seat.id}`}
      className={`
        w-8 h-8 sm:w-9 sm:h-9 md:w-10 md:h-10 lg:w-11 lg:h-11
        rounded-md border text-[10px] sm:text-[11px] md:text-xs font-bold transition-all duration-150
        flex items-center justify-center relative
        ${colorClass}
        ${seat.status !== SEAT_STATUS.TAKEN ? "cursor-pointer" : ""}
      `}
    >
      {seat.col}
      {seat.isExit && seat.status !== SEAT_STATUS.TAKEN && (
        <span className="absolute -top-1 -right-1 w-2 h-2 bg-orange-400 rounded-full" />
      )}
    </button>
  );
}

function SectionLabel({ label, subtitle, accent }: { label: string; subtitle: string; accent: string }) {
  return (
    <div className="flex items-center gap-3 my-3">
      <div className={`h-px flex-1 ${accent}`} />
      <div className="text-center">
        <div className="text-xs font-black tracking-widest uppercase text-slate-300">{label}</div>
        <div className="text-[10px] text-slate-500">{subtitle}</div>
      </div>
      <div className={`h-px flex-1 ${accent}`} />
    </div>
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

      return (
        <div key={row} className="flex items-center gap-2 sm:gap-3 justify-center">
          <span className="text-slate-600 text-[10px] sm:text-xs w-4 sm:w-5 md:w-6 text-right font-mono">{row}</span>
          <div className="flex gap-1 sm:gap-1.5 md:gap-2">
            {left.map((s) => (
              <Seat key={s.id} seat={s} isSelected={selected?.id === s.id} onSelect={handleSelect} />
            ))}
          </div>
          <div className="w-6 sm:w-8 md:w-10 text-center text-slate-700 text-[9px] sm:text-[10px]">✈</div>
          <div className="flex gap-1 sm:gap-1.5 md:gap-2">
            {right.map((s) => (
              <Seat key={s.id} seat={s} isSelected={selected?.id === s.id} onSelect={handleSelect} />
            ))}
          </div>
          <span className="w-4 sm:w-5 md:w-6" />
        </div>
      );
    });
  };

  return (
    <div
      className="min-h-screen flex flex-col lg:flex-row gap-0"
      style={{
        background: "linear-gradient(135deg, #0a0f1e 0%, #0d1525 40%, #091018 100%)",
        fontFamily: "'DM Mono', 'Courier New', monospace",
      }}
    >
      {/* Plane map */}
      <div className="flex-1 flex flex-col items-center py-8 px-4 overflow-y-auto">

        {/* Plane body */}
        <div
          className="relative w-full max-w-xs sm:max-w-sm md:max-w-md lg:max-w-lg rounded-t-[80px] rounded-b-2xl border border-slate-700/60 px-4 sm:px-6 md:px-8 pt-10 pb-6"
          style={{
            background: "linear-gradient(180deg, rgba(15,23,42,0.9) 0%, rgba(10,16,30,0.95) 100%)",
            boxShadow: "0 0 60px rgba(56,189,248,0.05), inset 0 1px 0 rgba(255,255,255,0.05)",
          }}
        >
          {/* Nose decoration */}
          <div className="absolute -top-3 left-1/2 -translate-x-1/2 w-6 h-6 rounded-full bg-slate-800 border border-slate-600 flex items-center justify-center">
            <div className="w-2 h-2 rounded-full bg-sky-500/60" />
          </div>

          {/* Column labels */}
          <div className="flex items-center gap-2 sm:gap-3 justify-center mb-3">
            <span className="w-4 sm:w-5 md:w-6" />
            <div className="flex gap-1 sm:gap-1.5 md:gap-2">
              {["A", "B", "C"].map((c) => (
                <div key={c} className="w-8 sm:w-9 md:w-10 lg:w-11 text-center text-[10px] sm:text-[11px] md:text-xs text-slate-500 font-bold">{c}</div>
              ))}
            </div>
            <div className="w-6 sm:w-8 md:w-10" />
            <div className="flex gap-1 sm:gap-1.5 md:gap-2">
              {["D", "E", "F"].map((c) => (
                <div key={c} className="w-8 sm:w-9 md:w-10 lg:w-11 text-center text-[10px] sm:text-[11px] md:text-xs text-slate-500 font-bold">{c}</div>
              ))}
            </div>
            <span className="w-4 sm:w-5 md:w-6" />
          </div>

          {/* First Class */}
          <div className="flex flex-col gap-1.5 sm:gap-2 md:gap-2.5">
            {renderRows(firstSeats, { left: ["A", "C"], right: ["D", "F"] })}
          </div>

          {/* Galley */}
          <div className="my-3 flex items-center gap-2 justify-center">
            <div className="h-px flex-1 bg-slate-700/50" />
            <div className="text-[9px] text-slate-600 tracking-widest uppercase px-2 py-1 rounded border border-slate-700/50">Galley</div>
            <div className="h-px flex-1 bg-slate-700/50" />
          </div>

          {/* Business */}
          <div className="flex flex-col gap-1.5 sm:gap-2 md:gap-2.5">
            {renderRows(businessSeats, { left: ["A", "B", "C"], right: ["D", "E", "F"] })}
          </div>

          {/* Galley */}
          <div className="my-3 flex items-center gap-2 justify-center">
            <div className="h-px flex-1 bg-slate-700/50" />
            <div className="text-[9px] text-slate-600 tracking-widest uppercase px-2 py-1 rounded border border-slate-700/50">Galley</div>
            <div className="h-px flex-1 bg-slate-700/50" />
          </div>

          {/* Economy */}
          <div className="flex flex-col gap-1.5 sm:gap-2 md:gap-2.5">
            {renderRows(economySeats, { left: ["A", "B", "C"], right: ["D", "E", "F"] })}
          </div>

          {/* Tail */}
          <div className="mt-6 flex items-center justify-center gap-1 opacity-30">
            <div className="h-px w-12 bg-slate-500" />
            <div className="text-[9px] text-slate-500 tracking-widest">TAIL</div>
            <div className="h-px w-12 bg-slate-500" />
          </div>
        </div>
      </div>
    </div>
  );
}