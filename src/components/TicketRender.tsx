import { LuPlane } from "react-icons/lu";
import DottedMap from "dotted-map";
import { useMemo } from "react";

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
  flightNo = "CM0001",
  date,
}) => {
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

  return (
    <div className="w-85 rounded-[28px] bg-[#1c1c28] shadow-2xl shadow-black/60 overflow-hidden select-none">
      <div className="relative h-36 overflow-hidden">
        <img
          src={`data:image/svg+xml;utf8,${encodeURIComponent(map)}`}
          className="absolute inset-0 w-full h-full object-cover scale-150 opacity-60"
          alt="world map"
          draggable={false}
        />
        <div className="absolute inset-x-0 bottom-0 h-20 bg-linear-to-t from-[#1c1c28] via-[#1c1c28]/80 to-transparent" />

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

      <div className="relative my-3 mx-0 flex items-center">
        <div className="w-4 h-8 bg-black rounded-r-full -ml-px" />
        <div className="flex-1 border-t border-dashed border-gray-600/50 mx-1" />
        <div className="w-4 h-8 bg-black rounded-l-full -mr-px" />
      </div>

      <div className="px-8 pb-7 pt-1 flex flex-col items-center gap-2">
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
    </div>
  );
};

export const DemoRender = () => {
  return (
    <div className="w-full h-screen flex items-center justify-center bg-black">
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
    </div>
  );
};