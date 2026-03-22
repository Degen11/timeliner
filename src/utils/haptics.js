/**
 * Trigger subtle haptic feedback on supported devices.
 * No-ops gracefully on unsupported browsers/desktop.
 */

const HAPTIC_MS = {
  light: 10,
  medium: 20,
  heavy: 30,
}

export function haptic(intensity = 'light') {
  navigator.vibrate?.(HAPTIC_MS[intensity] ?? HAPTIC_MS.light)
}
