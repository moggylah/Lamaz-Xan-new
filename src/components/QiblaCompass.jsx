import { useEffect, useMemo, useRef, useState } from 'react';
import { CompassMiniIcon, QiblaIcon } from './Icons.jsx';
import { t } from '../lib/i18n.js';
import { magvar } from 'magvar';

function normalize(value) {
  return ((value % 360) + 360) % 360;
}

function signedAngle(value) {
  return ((value + 540) % 360) - 180;
}

function smoothHeading(previous, next, elapsedMs = 50) {
  if (previous == null) return normalize(next);
  const delta = signedAngle(next - previous);
  const factor = Math.min(0.5, Math.max(0.12, 1 - Math.exp(-elapsedMs / 140)));
  return normalize(previous + delta * factor);
}

const SOURCE_PRIORITY = { absolute: 2, webkit: 3 };

const SENSOR_TIMEOUT_MS = 5000;

function getScreenAngle() {
  if (Number.isFinite(window.screen?.orientation?.angle)) return window.screen.orientation.angle;
  if (Number.isFinite(window.orientation)) return window.orientation;
  return 0;
}

export default function QiblaCompass({ qiblaBearing, location, language = 'ru' }) {
  const [heading, setHeading] = useState(null);
  const [accuracy, setAccuracy] = useState(null);
  const [status, setStatus] = useState('idle');
  const [tilted, setTilted] = useState(false);

  const listenersRef = useRef([]);
  const headingRef = useRef(null);
  const sourceRef = useRef(null);
  const timeoutRef = useRef(null);
  const lastEventRef = useRef(0);
  const lastAppliedRef = useRef(0);

  const magneticDeclination = useMemo(() => {
    if (!Number.isFinite(location?.lat) || !Number.isFinite(location?.lng)) return 0;
    try { return magvar(location.lat, location.lng, 0, new Date()); }
    catch { return 0; }
  }, [location?.lat, location?.lng]);

  const difference = useMemo(() => {
    if (heading == null) return null;
    return signedAngle(qiblaBearing - heading);
  }, [heading, qiblaBearing]);

  const reliableAccuracy = !Number.isFinite(accuracy) || accuracy <= 15;
  const aligned = difference != null && Math.abs(difference) <= 5 && reliableAccuracy && !tilted;
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
    const now = performance.now();
    const previousSource = sourceRef.current;
    const currentPriority = SOURCE_PRIORITY[previousSource] || 0;
    const nextPriority = SOURCE_PRIORITY[source] || 0;
    if (nextPriority < currentPriority && now - lastEventRef.current < 1500) return;
    if (previousSource === source && now - lastEventRef.current < 16) return;
    lastEventRef.current = now;
    sourceRef.current = source;

    if (Number.isFinite(sensorAccuracy) && sensorAccuracy >= 0) setAccuracy(sensorAccuracy);
    else if (source !== previousSource) setAccuracy(null);

    const elapsed = lastAppliedRef.current ? now - lastAppliedRef.current : 50;
    lastAppliedRef.current = now;
    const next = smoothHeading(headingRef.current, normalize(value), elapsed);
    headingRef.current = next;
    setHeading(next);
    setStatus('active');
    if (timeoutRef.current) {
      window.clearTimeout(timeoutRef.current);
      timeoutRef.current = null;
    }
  }

  function handleOrientation(event) {
    const beta = Number.isFinite(event.beta) ? event.beta : 0;
    const gamma = Number.isFinite(event.gamma) ? event.gamma : 0;
    const isTooTilted = Math.abs(beta) > 70 || Math.abs(gamma) > 70;
    setTilted(isTooTilted);
    if (isTooTilted) return;

    if (Number.isFinite(event.webkitCompassHeading)) {
      const trueHeading = event.webkitCompassHeading + magneticDeclination + getScreenAngle();
      applyHeading(trueHeading, 'webkit', event.webkitCompassAccuracy);
      return;
    }

    if (event.absolute === true && Number.isFinite(event.alpha)) {
      applyHeading(360 - event.alpha + getScreenAngle(), 'absolute');
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
        const permission = await Orientation.requestPermission(true);
        if (permission !== 'granted') {
          setStatus('denied');
          return;
        }
      }

      removeListeners();
      headingRef.current = null;
      sourceRef.current = null;
      lastEventRef.current = 0;
      lastAppliedRef.current = 0;
      setAccuracy(null);
      setTilted(false);

      window.addEventListener('deviceorientationabsolute', handleOrientation, true);
      window.addEventListener('deviceorientation', handleOrientation, true);
      listenersRef.current.push(
        { eventName: 'deviceorientationabsolute', handler: handleOrientation },
        { eventName: 'deviceorientation', handler: handleOrientation },
      );

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
  const lowAccuracy = Number.isFinite(accuracy) && accuracy > 15;

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
            style={{ transform: `rotate(${qiblaNeedleAngle}deg)` }}
            aria-hidden="true"
          >
            <span className="compass-qibla-arrow" />
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

      {tilted && <p className="sensor-note">{t(language, 'qibla.holdFlat')}</p>}
      {lowAccuracy && <p className="sensor-note">{t(language, 'qibla.calibrate')}</p>}

      {['denied', 'unsupported', 'unavailable', 'error'].includes(status) && (
        <p className="sensor-note">{t(language, 'qibla.unavailable')}</p>
      )}
    </section>
  );
}
