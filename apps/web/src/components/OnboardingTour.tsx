import { useState, useEffect } from "react";
import {
  Clock,
  Users,
  Trophy,
  Share2,
  Sparkles,
  ChevronRight,
  ChevronLeft,
  X,
  CheckCircle2,
} from "lucide-react";
import { triggerHaptic } from "../utils/haptics.js";

interface TourStep {
  title: string;
  subtitle: string;
  description: string;
  tip?: string;
  icon: any;
  color: string;
}

const TOUR_STEPS: TourStep[] = [
  {
    title: "Твой статус и время старта",
    subtitle: "ШАГ 1 ИЗ 5",
    description:
      "Выбирай: 🟢 Готов, 🟡 Возможно или 🔴 Не смогу. В скролле укажи время, к которому будешь свободен (например, 19:00). Сквад увидит точный час старта без спама «кс?» в чате.",
    tip: "Статус автоматически сбрасывается каждую ночь.",
    icon: Clock,
    color: "#23A55A",
  },
  {
    title: "Состав команды и Live-статусы",
    subtitle: "ШАГ 2 ИЗ 5",
    description:
      "В блоке «СОСТАВ КОМАНДЫ» видны все тиммейты. Здесь в реальном времени загораются метки: когда кто-то уже зашёл в CS2, сидит в TeamSpeak или едет домой с работы (с расчётом ETA в минутах).",
    tip: "Твоя карточка с пометкой [Вы] всегда находится на самом верху списка.",
    icon: Users,
    color: "#3F5F96",
  },
  {
    title: "Детальная статистика игрока",
    subtitle: "ШАГ 3 ИЗ 5",
    description:
      "Нажми на любую карточку игрока в списке! Она плавно раскроется и покажет историю последних 5 игр (W/L), винрейт, K/D, % хедшотов и актуальный динамический FACEIT рейтинг за последние 30 матчей.",
    tip: "В один клик можно перейти в профили FACEIT и Steam тиммейта.",
    icon: Trophy,
    color: "#FF5500",
  },
  {
    title: "Инвайты и управление сквадом",
    subtitle: "ШАГ 4 ИЗ 5",
    description:
      "Нажми кнопку «ПРИГЛАСИТЬ» внизу экрана, чтобы скопировать или отправить готовую инвайт-ссылку в беседу пацанов. Во вкладке «Группа» можно настраивать размер сквада (по умолч. 5 чел) и переключаться между группами.",
    tip: "Как только соберется 5 готовых игроков, бот сам отправит пуш о полном сборе!",
    icon: Share2,
    color: "#8BA4CC",
  },
  {
    title: "Умный профиль и автоматизация",
    subtitle: "ШАГ 5 ИЗ 5",
    description:
      "Во вкладке «Профиль» привяжи Steam и FACEIT, сохрани точку «Дом» для расчёта времени в пути и подключи рабочий календарь (iCal/Webcal), чтобы бот автоматически ставил готовность по твоему расписанию!",
    tip: "🔒 Точные GPS-координаты никому не видны — только статус «Дома» или «В пути».",
    icon: Sparkles,
    color: "#F0B232",
  },
];

interface Props {
  isOpen: boolean;
  onClose: () => void;
}

export function OnboardingTour({ isOpen, onClose }: Props) {
  const [currentStep, setCurrentStep] = useState(0);

  useEffect(() => {
    if (isOpen) {
      setCurrentStep(0);
    }
  }, [isOpen]);

  if (!isOpen) return null;

  const step = TOUR_STEPS[currentStep];
  const Icon = step.icon;
  const isLast = currentStep === TOUR_STEPS.length - 1;

  const handleNext = () => {
    if (isLast) {
      triggerHaptic("success");
      onClose();
    } else {
      triggerHaptic("selection");
      setCurrentStep((prev) => prev + 1);
    }
  };

  const handlePrev = () => {
    if (currentStep > 0) {
      triggerHaptic("selection");
      setCurrentStep((prev) => prev - 1);
    }
  };

  const handleSkip = () => {
    triggerHaptic("selection");
    onClose();
  };

  return (
    <div
      style={{
        paddingTop: "max(calc(var(--app-safe-top, 0px) + 20px), 76px)",
        paddingBottom: "max(calc(var(--app-safe-bottom, 0px) + 72px), 84px)",
        paddingLeft: "16px",
        paddingRight: "16px",
      }}
      className="fixed inset-0 z-[100] flex items-center justify-center bg-black/80 backdrop-blur-md animate-fadeIn select-none"
    >
      <div
        style={{
          maxHeight:
            "calc(100dvh - max(calc(var(--app-safe-top, 0px) + 20px), 76px) - max(calc(var(--app-safe-bottom, 0px) + 72px), 84px))",
        }}
        className="w-full max-w-sm bg-[#2B2D31] border border-white/10 rounded-3xl p-5 shadow-2xl relative overflow-hidden flex flex-col space-y-4"
      >
        {/* Subtle decorative glow */}
        <div
          className="absolute -top-12 -right-12 w-36 h-36 rounded-full blur-3xl opacity-20 pointer-events-none transition-colors duration-500"
          style={{ backgroundColor: step.color }}
        />

        {/* Top Header: Step Badge & Close */}
        <div className="flex items-center justify-between z-10">
          <span
            className="text-[10px] font-extrabold uppercase tracking-widest px-2.5 py-1 rounded-full border transition-colors"
            style={{
              color: step.color,
              borderColor: `${step.color}40`,
              backgroundColor: `${step.color}15`,
            }}
          >
            {step.subtitle}
          </span>
          <button
            onClick={handleSkip}
            className="text-[#949BA4] hover:text-white p-1 rounded-lg hover:bg-white/5 transition-colors cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Step Icon & Title */}
        <div className="flex items-center gap-3.5 z-10 pt-1">
          <div
            className="w-12 h-12 rounded-2xl flex items-center justify-center shrink-0 border transition-all duration-300"
            style={{
              backgroundColor: `${step.color}15`,
              borderColor: `${step.color}35`,
              color: step.color,
            }}
          >
            <Icon className="w-6 h-6" />
          </div>
          <div>
            <h3 className="text-base font-extrabold text-white leading-tight">
              {step.title}
            </h3>
          </div>
        </div>

        {/* Step Description */}
        <div className="space-y-3 z-10 text-xs text-[#DBDEE1] leading-relaxed">
          <p>{step.description}</p>

          {step.tip && (
            <div className="p-2.5 rounded-xl bg-[#1E1F22] border border-white/5 text-[11px] text-[#949BA4]">
              {step.tip}
            </div>
          )}
        </div>

        {/* Step Progress Dots */}
        <div className="flex items-center justify-center gap-1.5 py-1 z-10">
          {TOUR_STEPS.map((_, idx) => (
            <button
              key={idx}
              onClick={() => {
                triggerHaptic("selection");
                setCurrentStep(idx);
              }}
              className={`h-1.5 rounded-full transition-all duration-300 ${
                idx === currentStep
                  ? "w-6 bg-white"
                  : "w-1.5 bg-white/20 hover:bg-white/40"
              }`}
            />
          ))}
        </div>

        {/* Bottom Navigation Buttons */}
        <div className="flex items-center gap-2 pt-1 z-10">
          {currentStep > 0 ? (
            <button
              type="button"
              onClick={handlePrev}
              className="py-2.5 px-3.5 rounded-xl bg-[#1E1F22] hover:bg-[#323336] text-xs font-semibold text-[#DBDEE1] border border-white/5 flex items-center gap-1 transition-colors cursor-pointer"
            >
              <ChevronLeft className="w-4 h-4" />
              <span>Назад</span>
            </button>
          ) : (
            <button
              type="button"
              onClick={handleSkip}
              className="py-2.5 px-3.5 rounded-xl text-xs font-semibold text-[#949BA4] hover:text-white transition-colors cursor-pointer"
            >
              Пропустить
            </button>
          )}

          <button
            type="button"
            onClick={handleNext}
            className="flex-1 py-2.5 px-4 rounded-xl text-xs font-extrabold text-white shadow-lg transition-all active:scale-[0.98] cursor-pointer flex items-center justify-center gap-1.5"
            style={{
              backgroundColor: isLast ? "#23A55A" : "#3F5F96",
            }}
          >
            {isLast ? (
              <>
                <CheckCircle2 className="w-4 h-4" />
                <span>Погнали в бой! 🚀</span>
              </>
            ) : (
              <>
                <span>Далее</span>
                <ChevronRight className="w-4 h-4" />
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  );
}
