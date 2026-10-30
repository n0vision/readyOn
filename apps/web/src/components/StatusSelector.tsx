import type { ReadyStatusType } from "@readyon/shared";
import { THEME } from "../styles/theme.js";

interface Props {
  value: ReadyStatusType;
  onChange: (status: ReadyStatusType) => void;
}

const statusOptions: { status: ReadyStatusType; label: string }[] = [
  { status: "READY", label: "ГОТОВ" },
  { status: "UNLIKELY", label: "ПОПОЗЖЕ" },
  { status: "UNAVAILABLE", label: "НЕ СЕГОДНЯ" },
];

export function StatusSelector({ value, onChange }: Props) {
  return (
    <div className="p-1 rounded-2xl bg-black/40 border border-white/5 flex gap-1.5 shadow-inner">
      {statusOptions.map((opt) => {
        const theme = THEME.status[opt.status];
        const isSelected = value === opt.status;

        return (
          <button
            key={opt.status}
            onClick={() => onChange(opt.status)}
            className={`flex-1 py-2.5 px-2 rounded-xl text-xs font-bold uppercase tracking-wider transition-all duration-200 cursor-pointer ${
              isSelected
                ? theme.activeButton
                : "text-white/60 hover:text-white hover:bg-white/5"
            }`}
          >
            {opt.label}
          </button>
        );
      })}
    </div>
  );
}
