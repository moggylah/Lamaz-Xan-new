export function canVibrate() {
  return typeof navigator !== 'undefined' && typeof navigator.vibrate === 'function';
}

export function triggerHaptic(pattern = 18, enabled = true) {
  if (!enabled) return false;
  if (isNativeApp) {
    void Haptics.impact({ style: ImpactStyle.Light });
    return true;
  }
  if (!canVibrate()) return false;
  try {
    return navigator.vibrate(pattern);
  } catch {
    return false;
  }
}
import { Haptics, ImpactStyle } from '@capacitor/haptics';
import { isNativeApp } from './native.js';
