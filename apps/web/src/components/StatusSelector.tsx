import type { ReadyStatusType } from "@readyon/shared";

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
  return (
    <div className="hud-card rounded-2xl p-3.5 space-y-3">
      {/* 3 Main Status Pills */}
      <div className="flex items-center gap-2.5">
        {/* READY */}
        <button
          onClick={() => onChange("READY")}
          className={`flex-1 py-2.5 rounded-xl text-xs font-black tracking-wider transition-all duration-200 cursor-pointer ${
            value === "READY"
              ? "bg-[#00f076] text-black shadow-[0_0_22px_rgba(0,240,118,0.6)] scale-[1.02]"
              : "bg-transparent border border-white/10 text-white/70 hover:border-white/25 hover:text-white"
          }`}
        >
          READY
        </button>

        {/* MAYBE */}
        <button
          onClick={() => onChange("UNLIKELY")}
          className={`flex-1 py-2.5 rounded-xl text-xs font-bold tracking-wider transition-all duration-200 cursor-pointer ${
            value === "UNLIKELY"
              ? "bg-[#f59e0b] text-black font-black shadow-[0_0_22px_rgba(245,158,11,0.6)] scale-[1.02]"
              : "bg-transparent border border-[#d97706]/70 text-[#f59e0b] hover:bg-[#f59e0b]/10"
          }`}
        >
          MAYBE
        </button>

        {/* BUSY */}
        <button
          onClick={() => onChange("UNAVAILABLE")}
          className={`flex-1 py-2.5 rounded-xl text-xs font-bold tracking-wider transition-all duration-200 cursor-pointer ${
            value === "UNAVAILABLE"
              ? "bg-[#ef4444] text-white font-black shadow-[0_0_22px_rgba(239,68,68,0.6)] scale-[1.02]"
              : "bg-transparent border border-[#dc2626]/70 text-[#ef4444] hover:bg-[#ef4444]/10"
          }`}
        >
          BUSY
        </button>
      </div>

      {/* Sub-line with centered Time Pill */}
      <div className="relative flex items-center justify-center pt-1">
        <div className="absolute inset-0 flex items-center">
          <div className="w-full border-t border-white/10"></div>
        </div>
        <button
          onClick={onOpenTimePicker}
          className="relative px-4 py-1 rounded-full bg-[#19202c] border border-white/15 text-xs font-medium text-white/90 hover:border-[#00f076]/50 hover:text-white transition-all cursor-pointer flex items-center gap-1.5"
        >
          <span className="text-white/50 text-[10px]">⏰</span>
          <span>{availableFrom ? `From ${availableFrom}` : "From 20:00"}</span>
        </button>
      </div>
    </div>
  );
}
