import { useEffect, useMemo, useRef, useState } from 'react';
import { CompassMiniIcon, QiblaIcon } from './Icons.jsx';
import { t } from '../lib/i18n.js';

function normalize(value) {
  return ((value % 360) + 360) % 360;
}

function signedAngle(value) {
  return ((value + 540) % 360) - 180;
}

function smoothHeading(previous, next, factor = 0.18) {
  if (previous == null) return normalize(next);
  const delta = signedAngle(next - previous);
  return normalize(previous + delta * factor);
}

const SENSOR_TIMEOUT_MS = 5000;

function getScreenAngle() {
  if (Number.isFinite(window.screen?.orientation?.angle)) return window.screen.orientation.angle;
  if (Number.isFinite(window.orientation)) return window.orientation;
  return 0;
}

export default function QiblaCompass({ qiblaBearing, language = 'ru' }) {
  const [heading, setHeading] = useState(null);
  const [accuracy, setAccuracy] = useState(null);
  const [status, setStatus] = useState('idle');

  const listenersRef = useRef([]);
  const headingRef = useRef(null);
  const sourceRef = useRef(null);
  const timeoutRef = useRef(null);
  const lastEventRef = useRef(0);

  const difference = useMemo(() => {
    if (heading == null) return null;
    return signedAngle(qiblaBearing - heading);
  }, [heading, qiblaBearing]);

  const aligned = difference != null && Math.abs(difference) <= 6;
  const dialAngle = heading == null ? 0 : normalize(-heading);
  const qiblaNeedleAngle = difference == null ? 0 : difference;
  const turnDegrees = difference == null ? 0 : Math.round(Math.abs(difference));

  function removeListeners() {
    for (const { eventName, handler } of listenersRef.current) {
      window.removeEventListener(eventName, handler, true);
    }
    listenersRef.current = [];
    if (timeoutRef.current) {
      window.clearTimeout(timeoutRef.current);
      timeoutRef.current = null;
    }
  }

  useEffect(() => () => removeListeners(), []);

  function applyHeading(value, source, sensorAccuracy = null) {
    if (!Number.isFinite(value)) return;
    if (sourceRef.current === 'webkit' && source !== 'webkit') return;

    const now = performance.now();
    if (sourceRef.current === source && now - lastEventRef.current < 12) return;
    lastEventRef.current = now;

    if (source === 'webkit') sourceRef.current = 'webkit';
    else if (!sourceRef.current) sourceRef.current = source;

    if (Number.isFinite(sensorAccuracy) && sensorAccuracy >= 0) {
      setAccuracy(sensorAccuracy);
    }

    const next = smoothHeading(headingRef.current, normalize(value));
    headingRef.current = next;
    setHeading(next);
    setStatus('active');
    if (timeoutRef.current) {
      window.clearTimeout(timeoutRef.current);
      timeoutRef.current = null;
    }
  }

  function handleOrientation(event) {
    if (Number.isFinite(event.webkitCompassHeading)) {
      applyHeading(
        event.webkitCompassHeading + getScreenAngle(),
        'webkit',
        event.webkitCompassAccuracy,
      );
      return;
    }

    if (Number.isFinite(event.alpha)) {
      const source = event.absolute === true ? 'absolute' : 'relative';
      applyHeading(360 - event.alpha + getScreenAngle(), source);
    }
  }

  async function startCompass() {
    try {
      setStatus('requesting');
      const Orientation = window.DeviceOrientationEvent;

      if (!Orientation) {
        setStatus('unsupported');
        return;
      }

      if (typeof Orientation.requestPermission === 'function') {
        const permission = await Orientation.requestPermission();
        if (permission !== 'granted') {
          setStatus('denied');
          return;
        }
      }

      removeListeners();
      headingRef.current = null;
      sourceRef.current = null;
      lastEventRef.current = 0;
      setAccuracy(null);

      if ('ondeviceorientationabsolute' in window) {
        window.addEventListener('deviceorientationabsolute', handleOrientation, true);
        listenersRef.current.push({ eventName: 'deviceorientationabsolute', handler: handleOrientation });
      } else {
        window.addEventListener('deviceorientation', handleOrientation, true);
        listenersRef.current.push({ eventName: 'deviceorientation', handler: handleOrientation });
      }

      setStatus('listening');
      timeoutRef.current = window.setTimeout(() => {
        if (headingRef.current == null) setStatus('unavailable');
      }, SENSOR_TIMEOUT_MS);
    } catch (error) {
      console.error(error);
      setStatus('error');
    }
  }

  const needsActivation = heading == null;
  const lowAccuracy = Number.isFinite(accuracy) && accuracy > 25;

  let guidance = t(language, 'qibla.instruction');
  if (difference != null) {
    if (aligned) guidance = t(language, 'qibla.alignedInstruction');
    else if (difference > 0) guidance = t(language, 'qibla.turnRight', { degrees: turnDegrees });
    else guidance = t(language, 'qibla.turnLeft', { degrees: turnDegrees });
  }

  return (
    <section className="qibla-screen">
      <div className={`qibla-guide-card ${aligned ? 'is-aligned' : ''}`}>
        <div className="qibla-guide-label">{guidance}</div>
        <div className="qibla-guide-scale" aria-hidden="true">
          <span />
          <strong>{aligned ? '✓' : difference != null ? `${turnDegrees}°` : '—'}</strong>
          <span />
        </div>
      </div>

      <div className={`compass-shell compass-clean ${aligned ? 'is-aligned' : ''}`}>
        <div className="compass-face">
          <div className="compass-inner-ring" aria-hidden="true" />

          <div className="compass-dial" style={{ transform: `rotate(${dialAngle}deg)` }} aria-hidden="true">
            <div className="compass-ticks" />
            <span className="cardinal north">N</span>
            <span className="cardinal east">E</span>
            <span className="cardinal south">S</span>
            <span className="cardinal west">W</span>
          </div>

          <div className={`qibla-top-target ${aligned ? 'is-visible' : ''}`} aria-hidden="true">
            {aligned ? <QiblaIcon size={42} /> : <span />}
          </div>

          <div
            className={`compass-qibla-pointer ${heading == null ? 'is-idle' : ''}`}
            style={{ transform: `rotate(${qiblaNeedleAngle}deg)`, '--qibla-angle': `${qiblaNeedleAngle}deg` }}
            aria-hidden="true"
          >
            <span className="compass-qibla-arrow" />
            <span className="compass-qibla-label"><QiblaIcon size={24} /></span>
          </div>

          <div className="compass-center" aria-hidden="true">
            <span />
          </div>
        </div>
      </div>

      <div className={`qibla-readout ${aligned ? 'is-aligned' : ''}`}>
        <CompassMiniIcon size={22} />
        <div className="qibla-readout-main">
          <strong>
            {aligned
              ? t(language, 'qibla.aligned')
              : t(language, 'qibla.value', { degrees: Math.round(qiblaBearing) })}
          </strong>
          {heading != null && (
            <span>{t(language, 'qibla.heading', { degrees: Math.round(heading) })}</span>
          )}
        </div>
      </div>

      {needsActivation && (
        <button className="compass-activate" type="button" onClick={startCompass}>
          {['requesting', 'listening'].includes(status) ? t(language, 'qibla.requesting') : t(language, 'qibla.enable')}
        </button>
      )}

      {lowAccuracy && <p className="sensor-note">{t(language, 'qibla.calibrate')}</p>}

      {['denied', 'unsupported', 'unavailable', 'error'].includes(status) && (
        <p className="sensor-note">{t(language, 'qibla.unavailable')}</p>
      )}
    </section>
  );
}
