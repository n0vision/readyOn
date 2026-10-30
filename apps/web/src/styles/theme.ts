/**
 * readyOn — Central Design Tokens & Styling Theme
 * 
 * Edit this file to customize colors, glows, borders, and badges across the entire app!
 */

export const THEME = {
  // Status definitions
  status: {
    READY: {
      label: "ГОТОВ",
      color: "#00e676",
      bgClass: "bg-[#00e676]",
      textClass: "text-[#00e676]",
      borderClass: "border-[#00e676]",
      glowClass: "shadow-[0_0_18px_rgba(0,230,118,0.45)]",
      avatarRing: "ring-2 ring-[#00e676] shadow-[0_0_12px_rgba(0,230,118,0.5)]",
      activeButton: "bg-[#00e676] text-black font-extrabold shadow-[0_0_18px_rgba(0,230,118,0.4)]",
    },
    UNLIKELY: {
      label: "ПОПОЗЖЕ",
      color: "#f59e0b",
      bgClass: "bg-[#f59e0b]",
      textClass: "text-[#f59e0b]",
      borderClass: "border-[#f59e0b]",
      glowClass: "shadow-[0_0_18px_rgba(245,158,11,0.45)]",
      avatarRing: "ring-2 ring-[#f59e0b] shadow-[0_0_12px_rgba(245,158,11,0.45)]",
      activeButton: "bg-[#f59e0b] text-black font-extrabold shadow-[0_0_18px_rgba(245,158,11,0.4)]",
    },
    UNAVAILABLE: {
      label: "НЕ СЕГОДНЯ",
      color: "#ef4444",
      bgClass: "bg-[#ef4444]",
      textClass: "text-[#ef4444]",
      borderClass: "border-[#ef4444]",
      glowClass: "shadow-[0_0_18px_rgba(239,68,68,0.45)]",
      avatarRing: "ring-2 ring-[#ef4444] shadow-[0_0_12px_rgba(239,68,68,0.45)]",
      activeButton: "bg-[#ef4444] text-white font-extrabold shadow-[0_0_18px_rgba(239,68,68,0.4)]",
    },
    UNSET: {
      label: "НЕ ВЫСТАВИЛ",
      color: "#6b7280",
      bgClass: "bg-white/10",
      textClass: "text-white/40",
      borderClass: "border-white/10",
      glowClass: "",
      avatarRing: "ring-1 ring-white/10 opacity-60",
      activeButton: "",
    },
  },

  // Gaming Platform Badges
  platforms: {
    steam: {
      color: "#38bdf8",
      bg: "bg-[#0284c7]/15",
      border: "border-[#0284c7]/30",
      text: "text-[#38bdf8]",
    },
    faceit: {
      color: "#fb923c",
      bg: "bg-[#ea580c]/15",
      border: "border-[#ea580c]/30",
      text: "text-[#fb923c]",
      levelBg: "bg-[#f97316]",
    },
    transit: {
      color: "#fbbf24",
      bg: "bg-amber-500/15",
      border: "border-amber-500/30",
      text: "text-amber-300",
    },
  },
};
