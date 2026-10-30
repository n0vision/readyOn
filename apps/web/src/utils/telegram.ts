/**
 * Telegram WebApp Fullscreen, Safe Areas & Viewport Setup
 */

export function initTelegramFullscreen() {
  try {
    const tg = (window as any).Telegram?.WebApp;
    if (!tg) return;

    // Signal readiness
    tg.ready?.();

    // Expand to full available height
    tg.expand?.();

    // Request true Fullscreen in Telegram WebApp 8.0+
    if (typeof tg.requestFullscreen === "function") {
      tg.requestFullscreen();
    }

    // Prevent vertical gestures from pulling down/closing the mini app during scroll
    if (typeof tg.disableVerticalSwipes === "function") {
      tg.disableVerticalSwipes();
    }

    // Set Discord Slate chrome colors
    tg.setHeaderColor?.("#1E1F22");
    tg.setBackgroundColor?.("#1E1F22");

    // Dynamic Safe Area Synchronization
    const updateSafeAreas = () => {
      // contentSafeAreaInset includes Telegram's floating [✕ Закрыть] and [⋮] buttons
      const contentTop =
        tg.contentSafeAreaInset?.top ??
        tg.safeAreaInset?.top ??
        0;

      const contentBottom =
        tg.contentSafeAreaInset?.bottom ??
        tg.safeAreaInset?.bottom ??
        0;

      // In Telegram Fullscreen, floating header controls take at least 56-64px
      const isFullscreen = tg.isFullscreen || typeof tg.requestFullscreen === "function";
      const effectiveTop = Math.max(contentTop, isFullscreen ? 60 : 0);

      document.documentElement.style.setProperty("--app-safe-top", `${effectiveTop}px`);
      document.documentElement.style.setProperty("--app-safe-bottom", `${contentBottom}px`);
    };

    updateSafeAreas();

    // Listen to Telegram events
    tg.onEvent?.("safeAreaChanged", updateSafeAreas);
    tg.onEvent?.("contentSafeAreaChanged", updateSafeAreas);
    tg.onEvent?.("fullscreenChanged", updateSafeAreas);
    tg.onEvent?.("viewportChanged", updateSafeAreas);
  } catch (err) {
    console.warn("Telegram WebApp fullscreen init error:", err);
  }
}
