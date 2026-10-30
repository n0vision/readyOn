/**
 * Telegram WebApp Fullscreen, Safe Areas & Viewport Setup
 * Fullscreen mode is strictly restricted to mobile devices (iOS / Android).
 * Desktop clients (tdesktop, macos, web) use standard windowed view without full screen takeover.
 */

export function isMobileDevice(tg?: any): boolean {
  if (tg?.platform) {
    const platform = String(tg.platform).toLowerCase();
    if (["ios", "android", "android_x"].includes(platform)) return true;
    if (["tdesktop", "macos", "web", "weba", "webk"].includes(platform)) return false;
  }

  if (typeof navigator !== "undefined") {
    return /Android|iPhone|iPad|iPod/i.test(navigator.userAgent);
  }

  return false;
}

export function initTelegramFullscreen() {
  try {
    const tg = (window as any).Telegram?.WebApp;
    if (!tg) return;

    // Signal readiness to Telegram
    tg.ready?.();

    // Set Discord Slate chrome colors
    tg.setHeaderColor?.("#1E1F22");
    tg.setBackgroundColor?.("#1E1F22");

    const isMobile = isMobileDevice(tg);

    if (isMobile) {
      // Mobile-only: expand and request full screen
      tg.expand?.();

      if (typeof tg.requestFullscreen === "function") {
        tg.requestFullscreen();
      }

      if (typeof tg.disableVerticalSwipes === "function") {
        tg.disableVerticalSwipes();
      }

      // Dynamic Safe Area Synchronization for Mobile
      const updateMobileSafeAreas = () => {
        const contentTop =
          tg.contentSafeAreaInset?.top ??
          tg.safeAreaInset?.top ??
          0;

        const contentBottom =
          tg.contentSafeAreaInset?.bottom ??
          tg.safeAreaInset?.bottom ??
          0;

        const isFullscreen = tg.isFullscreen || typeof tg.requestFullscreen === "function";
        const baseTop = Math.max(contentTop, isFullscreen ? 70 : 0);
        const effectiveTop = baseTop + 10; // Extra +10px buffer for iPhone notch/island

        document.documentElement.style.setProperty("--app-safe-top", `${effectiveTop}px`);
        document.documentElement.style.setProperty("--app-safe-bottom", `${contentBottom}px`);
      };

      updateMobileSafeAreas();

      tg.onEvent?.("safeAreaChanged", updateMobileSafeAreas);
      tg.onEvent?.("contentSafeAreaChanged", updateMobileSafeAreas);
      tg.onEvent?.("fullscreenChanged", updateMobileSafeAreas);
      tg.onEvent?.("viewportChanged", updateMobileSafeAreas);
    } else {
      // Desktop: exit fullscreen if accidentally active and clear safe-area insets
      if (typeof tg.exitFullscreen === "function" && tg.isFullscreen) {
        tg.exitFullscreen();
      }

      document.documentElement.style.setProperty("--app-safe-top", "0px");
      document.documentElement.style.setProperty("--app-safe-bottom", "0px");
    }
  } catch (err) {
    console.warn("Telegram WebApp fullscreen init error:", err);
  }
}
