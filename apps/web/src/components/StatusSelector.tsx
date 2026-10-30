import type { ReadyStatusType } from "@readyon/shared";
import { Clock, ChevronDown } from "lucide-react";
import { triggerHaptic } from "../utils/haptics.js";

interface Props {
  value: ReadyStatusType;
  availableFrom?: string | null;
  onChange: (status: ReadyStatusType) => void;
  onOpenTimePicker?: () => void;
}

export function StatusSelector({
  value,
  availableFrom,
  onChange,
  onOpenTimePicker,
}: Props) {
  const handleSelect = (status: ReadyStatusType) => {
    if (status === "READY") triggerHaptic("heavy");
    else if (status === "UNLIKELY") triggerHaptic("medium");
    else triggerHaptic("warning");
    onChange(status);
  };

  const handleTimeClick = () => {
    triggerHaptic("selection");
    onOpenTimePicker?.();
  };

  return (
    <div className="hud-card rounded-3xl p-4 space-y-4">
      {/* 3 Large Tactile Status Buttons (h-16, 64px) */}
      <div className="flex items-center gap-2.5">
        {/* ГОТОВ */}
        <button
          onClick={() => handleSelect("READY")}
          className={`flex-1 h-16 rounded-2xl flex flex-col items-center justify-center transition-all duration-200 cursor-pointer active:scale-95 ${
            value === "READY"
              ? "bg-[#00f076] text-black shadow-[0_0_26px_rgba(0,240,118,0.65)] scale-[1.02]"
              : "bg-transparent border border-white/10 text-white/75 hover:border-white/30 hover:text-white"
          }`}
        >
          <span className="font-hud text-base font-black tracking-wider">ГОТОВ</span>
          <span className={`text-[10px] font-bold mt-0.5 flex items-center gap-1 ${value === "READY" ? "text-black/85" : "text-[#00f076]"}`}>
            <span className="w-1.5 h-1.5 rounded-full bg-current animate-pulse"></span>
            <span>Играю</span>
          </span>
        </button>

        {/* ПОПОЗЖЕ */}
        <button
          onClick={() => handleSelect("UNLIKELY")}
          className={`flex-1 h-16 rounded-2xl flex flex-col items-center justify-center transition-all duration-200 cursor-pointer active:scale-95 ${
            value === "UNLIKELY"
              ? "bg-[#f59e0b] text-black shadow-[0_0_26px_rgba(245,158,11,0.65)] scale-[1.02]"
              : "bg-transparent border border-[#d97706]/70 text-[#f59e0b] hover:bg-[#f59e0b]/10"
          }`}
        >
          <span className="font-hud text-base font-black tracking-wider">ПОПОЗЖЕ</span>
          <span className={`text-[10px] font-bold mt-0.5 flex items-center gap-1 ${value === "UNLIKELY" ? "text-black/85" : "text-[#f59e0b]"}`}>
            <span className="w-1.5 h-1.5 rounded-full bg-current"></span>
            <span>Попозже</span>
          </span>
        </button>

        {/* НЕ СЕГОДНЯ */}
        <button
          onClick={() => handleSelect("UNAVAILABLE")}
          className={`flex-1 h-16 rounded-2xl flex flex-col items-center justify-center transition-all duration-200 cursor-pointer active:scale-95 ${
            value === "UNAVAILABLE"
              ? "bg-[#ef4444] text-white shadow-[0_0_26px_rgba(239,68,68,0.65)] scale-[1.02]"
              : "bg-transparent border border-[#dc2626]/70 text-[#ef4444] hover:bg-[#ef4444]/10"
          }`}
        >
          <span className="font-hud text-xs font-black tracking-wider">НЕ СЕГОДНЯ</span>
          <span className={`text-[10px] font-bold mt-0.5 flex items-center gap-1 ${value === "UNAVAILABLE" ? "text-white/85" : "text-[#ef4444]"}`}>
            <span className="w-1.5 h-1.5 rounded-full bg-current"></span>
            <span>Не смогу</span>
          </span>
        </button>
      </div>

      {/* Sub-line with centered Time Capsule (Large h-12, 48px) */}
      <div className="relative flex items-center justify-center pt-1">
        <div className="absolute inset-0 flex items-center">
          <div className="w-full border-t border-white/10"></div>
        </div>
        <button
          onClick={handleTimeClick}
          className="relative h-12 px-6 rounded-full bg-[#18202d] border border-white/15 text-sm font-bold text-white hover:border-[#00f076]/60 hover:shadow-[0_0_14px_rgba(0,240,118,0.3)] transition-all cursor-pointer flex items-center gap-2 active:scale-95"
        >
          <Clock className="w-4 h-4 text-[#00f076]" />
          <span className="font-hud tracking-wider">{availableFrom ? `С ${availableFrom}` : "Выбрать время"}</span>
          <ChevronDown className="w-3.5 h-3.5 text-white/50" />
        </button>
      </div>
    </div>
  );
}
