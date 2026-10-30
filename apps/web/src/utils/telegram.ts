/**
 * Telegram WebApp Fullscreen & Viewport Setup
 */
export function initTelegramFullscreen() {
  try {
    const tg = (window as any).Telegram?.WebApp;
    if (!tg) return;

    // Signal readiness
    tg.ready?.();

    // Expand to full available height
    tg.expand?.();

    // Request true Fullscreen (Telegram WebApp 8.0+)
    if (typeof tg.requestFullscreen === "function") {
      tg.requestFullscreen();
    }

    // Prevent vertical gestures from pulling down/closing the mini app
    if (typeof tg.disableVerticalSwipes === "function") {
      tg.disableVerticalSwipes();
    }

    // Set Discord Slate chrome colors
    tg.setHeaderColor?.("#1E1F22");
    tg.setBackgroundColor?.("#1E1F22");
  } catch (err) {
    console.warn("Telegram WebApp fullscreen init error:", err);
  }
}
