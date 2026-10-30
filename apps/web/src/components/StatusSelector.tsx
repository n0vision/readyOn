import type { ReadyStatusType } from "@readyon/shared";
import { Clock } from "lucide-react";
import { triggerHaptic } from "../utils/haptics.js";

interface Props {
  value: ReadyStatusType;
  availableFrom?: string | null;
  onChange: (status: ReadyStatusType) => void;
  onSelectTime?: (time: string) => void;
}

const TIME_SLOTS = [
  "Сейчас",
  "18:00",
  "18:30",
  "19:00",
  "19:30",
  "20:00",
  "20:30",
  "21:00",
  "21:30",
  "22:00",
  "22:30",
  "23:00",
];

export function StatusSelector({
  value,
  availableFrom,
  onChange,
  onSelectTime,
}: Props) {
  const handleSelectStatus = (status: ReadyStatusType) => {
    triggerHaptic("selection");
    onChange(status);
  };

  const handleSelectSlot = (slot: string) => {
    triggerHaptic("selection");
    onSelectTime?.(slot);
  };

  const getStatusSummary = () => {
    switch (value) {
      case "READY":
        return availableFrom ? `Готов с ${availableFrom}` : "Готов";
      case "UNLIKELY":
        return "Возможно";
      case "UNAVAILABLE":
        return "Не смогу";
      default:
        return "Не выбран";
    }
  };

  return (
    <div className="bg-[#2B2D31] border border-white/5 rounded-2xl p-3.5 space-y-3">
      {/* Status Header */}
      <div className="flex items-center justify-between text-xs font-semibold">
        <span className="text-[#949BA4]">Твой статус:</span>
        <span className="text-white font-bold">{getStatusSummary()}</span>
      </div>

      {/* 3-Segmented Status Control: Clean, zero dots inside buttons */}
      <div className="bg-[#1E1F22] p-1 rounded-xl flex gap-1 border border-white/5">
        {/* ГОТОВ */}
        <button
          onClick={() => handleSelectStatus("READY")}
          className={`flex-1 py-2.5 rounded-lg text-xs font-bold transition-all cursor-pointer flex items-center justify-center active:scale-95 ${
            value === "READY"
              ? "bg-[#3F5F96] text-white shadow-sm"
              : "text-[#DBDEE1]/70 hover:bg-white/5"
          }`}
        >
          Готов
        </button>

        {/* ВОЗМОЖНО */}
        <button
          onClick={() => handleSelectStatus("UNLIKELY")}
          className={`flex-1 py-2.5 rounded-lg text-xs font-bold transition-all cursor-pointer flex items-center justify-center active:scale-95 ${
            value === "UNLIKELY"
              ? "bg-[#3F5F96] text-white shadow-sm"
              : "text-[#DBDEE1]/70 hover:bg-white/5"
          }`}
        >
          Возможно
        </button>

        {/* НЕ СМОГУ */}
        <button
          onClick={() => handleSelectStatus("UNAVAILABLE")}
          className={`flex-1 py-2.5 rounded-lg text-xs font-bold transition-all cursor-pointer flex items-center justify-center active:scale-95 ${
            value === "UNAVAILABLE"
              ? "bg-[#3F5F96] text-white shadow-sm"
              : "text-[#DBDEE1]/40 hover:bg-white/5"
          }`}
        >
          Не смогу
        </button>
      </div>

      {/* Time Picker Carousel: Visible and available ONLY when status is "Готов" */}
      {value === "READY" && (
        <div className="pt-1 space-y-1.5 animate-fadeIn">
          <div className="flex items-center justify-between text-[11px] text-[#949BA4]">
            <span className="flex items-center gap-1">
              <Clock className="w-3 h-3 text-[#8BA4CC]" />
              <span>Время старта:</span>
            </span>
            <span className="text-[10px] text-white/30">скролл ↔</span>
          </div>

          {/* Horizontal snapping time pills carousel */}
          <div className="relative">
            <div className="flex items-center gap-1.5 overflow-x-auto py-1 hide-scrollbar -mx-1 px-1">
              {TIME_SLOTS.map((slot) => {
                const isSelected =
                  availableFrom === slot || (!availableFrom && slot === "Сейчас");

                return (
                  <button
                    key={slot}
                    onClick={() => handleSelectSlot(slot)}
                    className={`px-3 py-1.5 rounded-lg text-xs font-semibold shrink-0 transition-all cursor-pointer active:scale-95 ${
                      isSelected
                        ? "bg-[#3F5F96] text-white font-extrabold border border-[#3F5F96] shadow-sm flex items-center gap-1"
                        : "bg-[#1E1F22] hover:bg-[#323336] text-[#DBDEE1]/70 border border-white/5"
                    }`}
                  >
                    <span>{slot}</span>
                    {isSelected && (
                      <span className="w-1 h-1 rounded-full bg-white"></span>
                    )}
                  </button>
                );
              })}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
