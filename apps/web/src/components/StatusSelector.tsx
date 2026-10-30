import type { ReadyStatusType } from "@readyon/shared";

interface Props {
  value: ReadyStatusType;
  onChange: (status: ReadyStatusType) => void;
}

const options: { status: ReadyStatusType; emoji: string; label: string; color: string }[] = [
  { status: "READY", emoji: "🟢", label: "Готов", color: "border-green-500 bg-green-500/10" },
  { status: "UNLIKELY", emoji: "🟡", label: "Может быть", color: "border-yellow-500 bg-yellow-500/10" },
  { status: "UNAVAILABLE", emoji: "🔴", label: "Не сегодня", color: "border-red-500 bg-red-500/10" },
];

export function StatusSelector({ value, onChange }: Props) {
  return (
    <div className="flex gap-2">
      {options.map((opt) => (
        <button
          key={opt.status}
          onClick={() => onChange(opt.status)}
          className={`flex-1 py-3 px-2 rounded-xl border-2 text-center transition-all ${
            value === opt.status
              ? opt.color + " scale-105"
              : "border-white/10 bg-[var(--tg-theme-secondary-bg-color)]"
          }`}
        >
          <div className="text-lg">{opt.emoji}</div>
          <div className="text-xs mt-1">{opt.label}</div>
        </button>
      ))}
    </div>
  );
}
