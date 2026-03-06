import { LuPlane } from "react-icons/lu";
import DottedMap from "dotted-map";
import { useMemo, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";

interface BoardingTicketProps {
  iataDeparture: string;
  iataArrival: string;
  departure: string;
  arrival: string;
  seat: string;
  distance: number;
  timefocus: number;
  flightNo?: string;
  date?: string;
  onTorn?: () => void;
}

/** Generates a pseudo-random barcode SVG from a seed string */
function generateBarcode(seed: string, width = 280, height = 50) {
  let hash = 0;
  for (let i = 0; i < seed.length; i++) {
    hash = (hash << 5) - hash + seed.charCodeAt(i);
    hash |= 0;
  }
  const bars: string[] = [];
  let x = 0;
  const rng = () => {
    hash = (hash * 1103515245 + 12345) & 0x7fffffff;
    return hash / 0x7fffffff;
  };
  while (x < width) {
    const barWidth = Math.floor(rng() * 3) + 1;
    const isBlack = rng() > 0.35;
    if (isBlack) {
      bars.push(`<rect x="${x}" y="0" width="${barWidth}" height="${height}" fill="white"/>`);
    }
    x += barWidth + 1;
  }
  return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${width} ${height}">${bars.join("")}</svg>`;
}

export const BoardingTicket: React.FC<BoardingTicketProps> = ({
  iataDeparture,
  iataArrival,
  departure,
  arrival,
  seat,
  distance,
  timefocus,
  flightNo = "ARS367",
  date,
  onTorn,
}) => {
  const [torn, setTorn] = useState(false);

  const map = useMemo(() => {
    const m = new DottedMap({ height: 100, grid: "diagonal" });
    return m.getSVG({
      radius: 0.22,
      color: "#ffffff30",
      shape: "circle",
      backgroundColor: "transparent",
    });
  }, []);

  const barcodeSvg = useMemo(
    () => generateBarcode(`${iataDeparture}-${iataArrival}-${flightNo}`),
    [iataDeparture, iataArrival, flightNo]
  );

  const displayDate =
    date ?? new Date().toLocaleDateString("sv-SE"); // YYYY/MM/DD

  const durationLabel =
    timefocus >= 60
      ? `${Math.floor(timefocus / 60)}h${timefocus % 60 ? `${timefocus % 60}m` : ""}`
      : `${timefocus}m`;

  const handleTear = () => {
    if (!torn) setTorn(true);
  };

  return (
    <div
      className="relative w-85 select-none cursor-pointer"
      onClick={handleTear}
      title={torn ? "" : "Click to tear"}
    >
      {/* ══════════ TOP HALF — main ticket body ══════════ */}
      <motion.div
        className="relative bg-[#1c1c28] rounded-t-[28px] overflow-hidden shadow-2xl shadow-black/60"
        animate={
          torn
            ? { y: -8, transition: { type: "spring", stiffness: 300, damping: 20 } }
            : { y: 0 }
        }
      >
        {/* Map background */}
        <div className="relative h-36 overflow-hidden">
          <img
            src={`data:image/svg+xml;utf8,${encodeURIComponent(map)}`}
            className="absolute inset-0 w-full h-full object-cover scale-150 opacity-60"
            alt="world map"
            draggable={false}
          />
          <div className="absolute inset-x-0 bottom-0 h-20 bg-linear-to-t from-[#1c1c28] via-[#1c1c28]/80 to-transparent" />

          {/* IATA codes */}
          <div className="relative z-10 flex items-start justify-between px-7 pt-7">
            <div className="flex flex-col gap-0.5">
              <span className="text-white text-3xl font-extrabold tracking-wide leading-none">
                {iataDeparture}
              </span>
              <span className="text-gray-400 text-[11px] tracking-wide">
                {departure}
              </span>
            </div>

            <div className="flex flex-col items-center gap-1 pt-1">
              <span className="text-gray-500 text-[11px] font-medium tracking-wider">
                {durationLabel}
              </span>
              <div className="flex items-center gap-1 w-20">
                <div className="flex-1 border-t border-dashed border-gray-600" />
                <LuPlane className="text-gray-400 text-sm rotate-0" />
                <div className="flex-1 border-t border-dashed border-gray-600" />
              </div>
            </div>

            <div className="flex flex-col items-end gap-0.5">
              <span className="text-white text-3xl font-extrabold tracking-wide leading-none">
                {iataArrival}
              </span>
              <span className="text-gray-400 text-[11px] tracking-wide">
                {arrival}
              </span>
            </div>
          </div>
        </div>

        {/* Info grid */}
        <div className="relative z-10 px-7 pb-2 pt-1 grid grid-cols-2 gap-y-3.5">
          <div className="flex flex-col gap-0.5">
            <span className="text-gray-500 text-[10px] uppercase tracking-widest">
              Flight No.
            </span>
            <span className="text-white text-sm font-bold tracking-wide">
              {flightNo}
            </span>
          </div>
          <div className="flex flex-col items-end gap-0.5">
            <span className="text-gray-500 text-[10px] uppercase tracking-widest">
              Distance
            </span>
            <span className="text-white text-sm font-bold tracking-wide">
              {distance}
              <span className="text-gray-400 font-normal ml-1 text-xs">km</span>
            </span>
          </div>
          <div className="flex flex-col gap-0.5">
            <span className="text-gray-500 text-[10px] uppercase tracking-widest">
              Seat
            </span>
            <span className="text-white text-sm font-bold tracking-wide">
              {seat}
            </span>
          </div>
          <div className="flex flex-col items-end gap-0.5">
            <span className="text-gray-500 text-[10px] uppercase tracking-widest">
              Date
            </span>
            <span className="text-white text-sm font-bold tracking-wide">
              {displayDate}
            </span>
          </div>
        </div>

        {/* Bottom notch (top half of tear line) */}
        <div className="relative flex items-end">
          <div className="w-4 h-4 bg-black rounded-tr-full -ml-px" />
          <div className="flex-1 border-b border-dashed border-gray-600/50 mx-1 mb-0" />
          <div className="w-4 h-4 bg-black rounded-tl-full -mr-px" />
        </div>
      </motion.div>

      {/* ══════════ BOTTOM HALF — barcode stub ══════════ */}
      <motion.div
        className="relative bg-[#1c1c28] rounded-b-[28px] overflow-hidden shadow-2xl shadow-black/60"
        style={{ transformOrigin: "top left" }}
        animate={
          torn
            ? {
                y: 30,
                x: 12,
                rotate: 4,
                opacity: 0.7,
                transition: {
                  type: "spring",
                  stiffness: 200,
                  damping: 18,
                  delay: 0.05,
                },
              }
            : { y: 0, x: 0, rotate: 0, opacity: 1 }
        }
        onAnimationComplete={() => {
          if (torn && onTorn) onTorn();
        }}
      >
        {/* Top notch (bottom half of tear line) */}
        <div className="relative flex items-start">
          <div className="w-4 h-4 bg-black rounded-br-full -ml-px" />
          <div className="flex-1" />
          <div className="w-4 h-4 bg-black rounded-bl-full -mr-px" />
        </div>

        {/* Barcode */}
        <div className="px-8 pb-5 pt-2 flex flex-col items-center gap-2">
          <img
            src={`data:image/svg+xml;utf8,${encodeURIComponent(barcodeSvg)}`}
            className="w-full h-12 opacity-80"
            alt="barcode"
            draggable={false}
          />
          <span className="text-gray-500 text-[10px] tracking-[0.25em] font-mono">
            {iataDeparture}-{iataArrival}-{flightNo}
          </span>
        </div>
      </motion.div>
    </div>
  );
};

export const TicketPrint = () => {
  return (
    <div className="w-full h-screen flex items-center justify-center bg-black">
      <motion.div
        initial={{clipPath: "inset(0 0 100% 0)"}}
        animate={{clipPath: "inset(0% 0 0 0)"}}
        transition={{duration: 1}}
      
      >
        <BoardingTicket
          iataDeparture="KHN"
          iataArrival="EHU"
          departure="Nanchang"
          arrival="Ezhou"
          seat="12A"
          distance={184}
          timefocus={29}
          flightNo="CM0001"
          date="2026/03/03"
        />
      </motion.div>
    </div>
  );
};