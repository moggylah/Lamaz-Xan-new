import { useEffect, useRef, useState } from 'react';
import { t } from '../lib/i18n.js';

const SEARCH_LAYERS = new Set(['city', 'country', 'state', 'locality', 'district', 'county']);
const SEARCH_LANGUAGES = new Set(['de', 'en', 'fr']);

function getResultLabel(feature) {
  const properties = feature.properties || {};
  const primary = properties.name || properties.city || properties.country || '';
  const secondary = [properties.city, properties.state, properties.country]
    .filter((value, index, list) => value && value !== primary && list.indexOf(value) === index)
    .join(' · ');
  return { primary, secondary };
}

export default function LocationSearch({ onSelect, language = 'ru' }) {
  const [query, setQuery] = useState('');
  const [results, setResults] = useState([]);
  const [status, setStatus] = useState('idle');
  const [open, setOpen] = useState(false);
  const requestRef = useRef(null);
  const normalizedQuery = query.trim();

  useEffect(() => {
    if (normalizedQuery.length < 3) {
      requestRef.current?.abort();
      setResults([]);
      setStatus('idle');
      return undefined;
    }

    const timer = window.setTimeout(async () => {
      requestRef.current?.abort();
      const controller = new AbortController();
      requestRef.current = controller;
      setStatus('loading');

      try {
        const params = new URLSearchParams({ q: normalizedQuery, limit: '15' });
        if (SEARCH_LANGUAGES.has(language)) params.set('lang', language);
        const response = await fetch('https://photon.komoot.io/api/?' + params.toString(), { signal: controller.signal });
        if (!response.ok) throw new Error('search');
        const payload = await response.json();
        const items = (payload.features || []).filter((feature) => SEARCH_LAYERS.has(feature.properties?.type || feature.properties?.osm_value || ''));
        setResults(items.slice(0, 7));
        setStatus(items.length ? 'success' : 'empty');
        setOpen(true);
      } catch (error) {
        if (error.name !== 'AbortError') {
          setResults([]);
          setStatus('error');
          setOpen(true);
        }
      }
    }, 450);

    return () => window.clearTimeout(timer);
  }, [normalizedQuery, language]);

  function choose(feature) {
    const [lng, lat] = feature.geometry.coordinates;
    const label = getResultLabel(feature);
    setQuery([label.primary, label.secondary].filter(Boolean).join(', '));
    setOpen(false);
    onSelect({ lat: Number(Number(lat).toFixed(6)), lng: Number(Number(lng).toFixed(6)) });
  }

  return (
    <div className="location-search">
      <label htmlFor="location-search-input">{t(language, 'settings.locationSearch')}</label>
      <div className={"location-search-field " + (open ? 'is-open' : '')}>
        <svg width="19" height="19" viewBox="0 0 24 24" fill="none" aria-hidden="true">
          <circle cx="10.8" cy="10.8" r="6.3" stroke="currentColor" strokeWidth="1.7"/>
          <path d="m15.5 15.5 4 4" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round"/>
        </svg>
        <input
          id="location-search-input"
          type="search"
          value={query}
          placeholder={t(language, 'settings.locationSearchPlaceholder')}
          autoComplete="off"
          onChange={(event) => { setQuery(event.target.value); setOpen(true); }}
          onFocus={() => { if (results.length || status === 'error' || status === 'empty') setOpen(true); }}
          aria-expanded={open}
          aria-controls="location-search-results"
          onKeyDown={(event) => { if (event.key === 'Escape') setOpen(false); }}
        />
        {status === 'loading' && <span className="location-search-spinner" aria-label={t(language, 'settings.searching')}/>} 
      </div>

      {normalizedQuery.length > 0 && normalizedQuery.length < 3 && (
        <small className="location-search-hint">{t(language, 'settings.locationSearchHint')}</small>
      )}

      {open && normalizedQuery.length >= 3 && (
        <div id="location-search-results" className="location-search-results" role="listbox">
          {results.map((feature) => {
            const label = getResultLabel(feature);
            const [lng, lat] = feature.geometry.coordinates;
            return (
              <button type="button" role="option" key={[feature.properties?.osm_type || '', feature.properties?.osm_id || '', lat, lng].join('-')} onClick={() => choose(feature)}>
                <span className="location-result-pin" aria-hidden="true"/>
                <span><strong>{label.primary}</strong>{label.secondary && <small>{label.secondary}</small>}</span>
                <em>{t(language, feature.properties?.type === 'country' || feature.properties?.osm_value === 'country' ? 'settings.countryResult' : 'settings.cityResult')}</em>
              </button>
            );
          })}
          {status === 'empty' && <p>{t(language, 'settings.locationNotFound')}</p>}
          {status === 'error' && <p className="panel-error">{t(language, 'settings.locationSearchError')}</p>}
        </div>
      )}
      <small className="location-search-credit">{t(language, 'settings.searchPoweredBy')}</small>
    </div>
  );
}
