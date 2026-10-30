/**
 * readyOn — Central Design Tokens & Styling Theme
 * 
 * Discord Slate Palette:
 * - App Background: #1E1F22
 * - Card Surfaces: #2B2D31
 * - Dark Base: #323336
 * - Primary Accent: #3F5F96 (Steel Navy)
 * - Accent Steel Text: #8BA4CC
 */

export const THEME = {
  colors: {
    bgApp: "#1E1F22",
    bgCard: "#2B2D31",
    bgBase: "#323336",
    accent: "#3F5F96",
    accentHover: "#4D72B0",
    accentSteel: "#8BA4CC",
    textPrimary: "#F2F3F5",
    textSecondary: "#DBDEE1",
    textMuted: "#949BA4",
    borderSubtle: "rgba(255, 255, 255, 0.05)",
  },

  // Status definitions
  status: {
    READY: {
      label: "Готов",
      color: "#23A55A",
      bgClass: "bg-[#23A55A]",
      textClass: "text-[#23A55A]",
      borderClass: "border-[#23A55A]",
      dotClass: "bg-[#23A55A]",
      activeButton: "bg-[#3F5F96] text-white font-bold shadow-sm",
    },
    UNLIKELY: {
      label: "Возможно",
      color: "#F0B232",
      bgClass: "bg-[#F0B232]",
      textClass: "text-[#F0B232]",
      borderClass: "border-[#F0B232]",
      dotClass: "bg-[#F0B232]",
      activeButton: "bg-[#3F5F96] text-white font-bold shadow-sm",
    },
    UNAVAILABLE: {
      label: "Не смогу",
      color: "#F23F43",
      bgClass: "bg-[#F23F43]",
      textClass: "text-[#F23F43]",
      borderClass: "border-[#F23F43]",
      dotClass: "bg-[#F23F43]",
      activeButton: "bg-[#3F5F96] text-white font-bold shadow-sm",
    },
    UNSET: {
      label: "Не в сети",
      color: "#80848E",
      bgClass: "bg-[#80848E]",
      textClass: "text-[#80848E]",
      borderClass: "border-[#80848E]",
      dotClass: "bg-[#80848E]",
      activeButton: "",
    },
  },

  // Gaming Platform Brand Colors
  platforms: {
    steam: {
      brandColor: "#66C0F4",
      bg: "bg-[#1E1F22]",
      border: "border-white/5",
      text: "text-[#8BA4CC]",
    },
    faceit: {
      brandColor: "#FF5500",
      bg: "bg-[#1E1F22]",
      border: "border-white/5",
      text: "text-white/90",
    },
    transit: {
      brandColor: "#F0B232",
      bg: "bg-amber-500/10",
      border: "border-amber-500/20",
      text: "text-amber-300",
    },
  },
};
