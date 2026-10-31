import { useEffect } from "react";
import { PATCHNOTES, type Patchnote, type PatchnoteChangeType } from "@readyon/shared";
import {
  Bell,
  X,
  Sparkles,
  Zap,
  Wrench,
  CheckCircle2,
  HelpCircle,
  ExternalLink,
} from "lucide-react";
import { triggerHaptic } from "../utils/haptics.js";

interface Props {
  isOpen: boolean;
  onClose: () => void;
  onOpenTour: () => void;
  onMarkAllAsRead: () => void;
}

export function PatchnotesModal({
  isOpen,
  onClose,
  onOpenTour,
  onMarkAllAsRead,
}: Props) {
  useEffect(() => {
    if (isOpen) {
      onMarkAllAsRead();
    }
  }, [isOpen, onMarkAllAsRead]);

  if (!isOpen) return null;

  const renderBadge = (type: PatchnoteChangeType) => {
    switch (type) {
      case "new":
        return (
          <span className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded bg-[#23A55A]/15 border border-[#23A55A]/30 text-[#23A55A] text-[10px] font-extrabold uppercase tracking-wider shrink-0">
            <Sparkles className="w-2.5 h-2.5" />
            <span>NEW</span>
          </span>
        );
      case "improved":
        return (
          <span className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded bg-[#3F5F96]/20 border border-[#3F5F96]/40 text-[#8BA4CC] text-[10px] font-extrabold uppercase tracking-wider shrink-0">
            <Zap className="w-2.5 h-2.5" />
            <span>УЛУЧШЕНИЕ</span>
          </span>
        );
      case "fix":
        return (
          <span className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded bg-[#F0B232]/15 border border-[#F0B232]/30 text-[#F0B232] text-[10px] font-extrabold uppercase tracking-wider shrink-0">
            <Wrench className="w-2.5 h-2.5" />
            <span>ФИКС</span>
          </span>
        );
    }
  };

  return (
    <div
      style={{
        paddingTop: "max(calc(var(--app-safe-top, 0px) + 16px), 72px)",
        paddingBottom: "max(calc(var(--app-safe-bottom, 0px) + 24px), 32px)",
        paddingLeft: "16px",
        paddingRight: "16px",
      }}
      className="fixed inset-0 bg-black/80 backdrop-blur-md flex items-center justify-center z-[100] animate-fadeIn"
    >
      <div
        onClick={(e) => e.stopPropagation()}
        style={{
          maxHeight:
            "calc(100dvh - max(calc(var(--app-safe-top, 0px) + 16px), 72px) - max(calc(var(--app-safe-bottom, 0px) + 24px), 32px))",
        }}
        className="bg-[#2B2D31] border border-white/10 rounded-2xl w-full max-w-md flex flex-col shadow-2xl overflow-hidden animate-scaleUp"
      >
        {/* Header */}
        <div className="flex items-center justify-between px-4 py-3.5 border-b border-white/5 shrink-0 bg-[#2B2D31]">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-xl bg-[#3F5F96]/20 border border-[#3F5F96]/30 flex items-center justify-center text-[#8BA4CC]">
              <Bell className="w-4 h-4" />
            </div>
            <div>
              <h2 className="text-sm font-extrabold text-white leading-tight">
                Что нового в readyOn
              </h2>
              <p className="text-[10px] text-[#949BA4] font-medium">
                Патчноуты и история обновлений
              </p>
            </div>
          </div>

          <button
            onClick={() => {
              triggerHaptic("selection");
              onClose();
            }}
            className="w-8 h-8 rounded-lg bg-[#1E1F22] hover:bg-[#323336] text-[#949BA4] hover:text-white flex items-center justify-center transition-colors cursor-pointer"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Action Banner: Replay Onboarding Tour */}
        <div className="p-3 bg-[#1E1F22]/60 border-b border-white/5 shrink-0">
          <button
            onClick={() => {
              triggerHaptic("selection");
              onClose();
              onOpenTour();
            }}
            className="w-full py-2 px-3 rounded-xl bg-[#1E1F22] hover:bg-[#323336] border border-[#3F5F96]/30 text-xs font-semibold text-[#DBDEE1] flex items-center justify-between transition-all cursor-pointer group"
          >
            <div className="flex items-center gap-2">
              <HelpCircle className="w-3.5 h-3.5 text-[#8BA4CC]" />
              <span>Гид для новичков (Обучение)</span>
            </div>
            <span className="text-[10px] text-[#8BA4CC] font-bold group-hover:underline">
              Запустить тур →
            </span>
          </button>
        </div>

        {/* Patchnotes Feed */}
        <div className="flex-1 overflow-y-auto p-4 space-y-4">
          {PATCHNOTES.map((patch: Patchnote) => (
            <div
              key={patch.id}
              className="bg-[#1E1F22] border border-white/5 rounded-xl p-3.5 space-y-3"
            >
              {/* Optional Visual Banner */}
              {patch.bannerUrl && (
                <div className="w-full h-36 rounded-lg overflow-hidden border border-white/5 relative bg-[#131416]">
                  <img
                    src={patch.bannerUrl}
                    alt={patch.title}
                    className="w-full h-full object-cover"
                    loading="lazy"
                  />
                </div>
              )}

              {/* Version title row */}
              <div className="flex items-center justify-between gap-2 border-b border-white/5 pb-2">
                <div className="flex items-center gap-2">
                  <span className="text-xs font-black text-white px-2 py-0.5 rounded bg-white/10 font-mono">
                    {patch.version}
                  </span>
                  {patch.badge && (
                    <span className="text-[9px] px-1.5 py-0.2 rounded bg-[#23A55A]/20 text-[#23A55A] font-extrabold uppercase tracking-wider">
                      {patch.badge}
                    </span>
                  )}
                </div>
                <span className="text-[10px] text-[#949BA4] font-medium">
                  {patch.date}
                </span>
              </div>

              {/* Title & Summary */}
              <div>
                <h3 className="text-xs font-bold text-white leading-snug">
                  {patch.title}
                </h3>
                <p className="text-[11px] text-[#949BA4] mt-0.5 leading-relaxed">
                  {patch.summary}
                </p>
              </div>

              {/* Changes List */}
              <div className="space-y-2 pt-1">
                {patch.changes.map((change, idx) => (
                  <div
                    key={idx}
                    className="flex items-start gap-2 text-xs leading-relaxed"
                  >
                    <div className="mt-0.5">{renderBadge(change.type)}</div>
                    <div className="flex-1 min-w-0">
                      <span className="font-semibold text-[#F2F3F5] mr-1">
                        {change.title}:
                      </span>
                      <span className="text-[11px] text-[#949BA4]">
                        {change.description}
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>

        {/* Footer */}
        <div className="p-3 border-t border-white/5 bg-[#2B2D31] shrink-0">
          <button
            onClick={() => {
              triggerHaptic("success");
              onClose();
            }}
            className="w-full py-2.5 px-4 rounded-xl text-xs font-bold text-white bg-[#3F5F96] hover:bg-[#4D72B0] transition-colors cursor-pointer flex items-center justify-center gap-1.5 shadow-sm"
          >
            <CheckCircle2 className="w-4 h-4" />
            <span>Всё понятно, закрыть</span>
          </button>
        </div>
      </div>
    </div>
  );
}
