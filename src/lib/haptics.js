import { Haptics, ImpactStyle, NotificationType } from '@capacitor/haptics';
import { isNativeApp } from './native.js';

export function canVibrate() {
  return typeof navigator !== 'undefined' && typeof navigator.vibrate === 'function';
}

export function triggerHaptic(pattern = 18, enabled = true) {
  if (!enabled) return false;
  if (isNativeApp) {
    if (Array.isArray(pattern)) {
      void Haptics.notification({ type: NotificationType.Success });
    } else {
      void Haptics.impact({ style: ImpactStyle.Medium });
    }
    return true;
  }
  if (!canVibrate()) return false;
  try {
    return navigator.vibrate(pattern);
  } catch {
    return false;
  }
}

export function triggerButtonHaptic(enabled = true) {
  if (!enabled) return false;
  if (isNativeApp) {
    void Haptics.impact({ style: ImpactStyle.Light });
    return true;
  }
  if (!canVibrate()) return false;
  try {
    return navigator.vibrate(10);
  } catch {
    return false;
  }
}
