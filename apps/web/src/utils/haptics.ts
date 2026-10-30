/**
 * Telegram WebApp Haptic Feedback wrapper with graceful fallback for web browsers
 */
export function triggerHaptic(
  type: "light" | "medium" | "heavy" | "success" | "warning" | "error" | "selection" = "medium"
) {
  try {
    const tg = (window as any).Telegram?.WebApp?.HapticFeedback;
    if (!tg) return;

    if (type === "selection") {
      tg.selectionChanged?.();
    } else if (type === "success" || type === "warning" || type === "error") {
      tg.notificationOccurred?.(type);
    } else {
      tg.impactOccurred?.(type);
    }
  } catch (e) {
    // Non-Telegram environment fallback
  }
}
