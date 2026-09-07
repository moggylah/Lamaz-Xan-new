import { useEffect, useMemo, useState } from 'react';
import {
  findBestNamedMatch,
  getCities,
  getCountries,
  getMosqueTimings,
  getMosques,
  reverseGeocodeDeviceLocation,
} from '../lib/mymasjid.js';
import { t } from '../lib/i18n.js';
import { getNearbyOpenStreetMapMosques } from '../lib/openstreetmap.js';

export default function MosqueSelector({ selectedMosque, onSelect, onClear, onLocationDetected, language = 'ru' }) {
  const [countries, setCountries] = useState([]);
  const [cities, setCities] = useState([]);
  const [mosques, setMosques] = useState([]);
  const [countryId, setCountryId] = useState('');
  const [cityId, setCityId] = useState('');
  const [loading, setLoading] = useState('countries');
  const [error, setError] = useState('');
  const [notice, setNotice] = useState('');

  useEffect(() => {
    let active = true;
    getCountries()
      .then((items) => { if (active) setCountries(items); })
      .catch(() => { if (active) setError(t(language, 'mosque.errorCountries')); })
      .finally(() => { if (active) setLoading(''); });
    return () => { active = false; };
  }, [language]);

  async function chooseCountry(id) {
    setCountryId(String(id)); setCityId(''); setCities([]); setMosques([]); setNotice('');
    if (!id) return;
    setLoading('cities'); setError('');
    try { setCities(await getCities(id)); }
    catch { setError(t(language, 'mosque.errorCities')); }
    finally { setLoading(''); }
  }

  async function chooseCity(id, overrideCountryId = countryId) {
    setCityId(String(id)); setMosques([]); setNotice('');
    if (!id || !overrideCountryId) return;
    setLoading('mosques'); setError('');
    try { setMosques(await getMosques(overrideCountryId, id)); }
    catch { setError(t(language, 'mosque.errorMosques')); }
    finally { setLoading(''); }
  }

  async function selectMosque(mosque) {
    const mosqueKey = mosque.guidId || mosque.id;
    setLoading('mosque:' + mosqueKey); setError('');
    try {
      if (mosque.source === 'openstreetmap') {
        onLocationDetected?.({ lat: mosque.lat, lng: mosque.lng });
        onSelect({ mosque: { id: mosque.id, name: mosque.name, address: mosque.address || '', city: mosque.city || '', country: mosque.country || '', source: 'openstreetmap', lat: mosque.lat, lng: mosque.lng }, schedule: null });
        setNotice(t(language, 'mosque.calculatedSelected'));
      } else {
        const schedule = await getMosqueTimings(mosque.guidId);
        onSelect({ mosque: { guidId: mosque.guidId, id: mosque.id, name: mosque.name, address: mosque.address || '', city: mosque.city || '', country: mosque.country || '', source: 'myMasjid' }, schedule });
        setNotice('');
      }
    } catch { setError(t(language, 'mosque.errorSchedule')); }
    finally { setLoading(''); }
  }

  async function findNearby() {
    if (!navigator.geolocation) { setError(t(language, 'mosque.noGeolocation')); return; }
    setLoading('nearby'); setError(''); setNotice('');
    navigator.geolocation.getCurrentPosition(async ({ coords }) => {
      const lat = Number(coords.latitude.toFixed(6));
      const lng = Number(coords.longitude.toFixed(6));
      onLocationDetected?.({ lat, lng });

      const osmPromise = getNearbyOpenStreetMapMosques(lat, lng).catch(() => []);
      let officialMosques = [];
      let matchedPlace = '';

      try {
        const geo = await reverseGeocodeDeviceLocation(lat, lng);
        matchedPlace = geo.city || geo.locality || geo.principalSubdivision || geo.countryName || '';
        const country = findBestNamedMatch(countries, [geo.countryName, geo.countryCode]);
        if (country) {
          setCountryId(String(country.id));
          const countryCities = await getCities(country.id);
          setCities(countryCities);
          const city = findBestNamedMatch(countryCities, [geo.city, geo.locality, geo.principalSubdivision]);
          if (city) {
            setCityId(String(city.id));
            officialMosques = (await getMosques(country.id, city.id)).map((mosque) => ({ ...mosque, source: 'myMasjid' }));
          }
        }
      } catch {
        officialMosques = [];
      }

      const osmMosques = await osmPromise;
      const officialNames = officialMosques.map((mosque) => String(mosque.name || '').toLocaleLowerCase());
      const uniqueOsmMosques = osmMosques.filter((mosque) => {
        const name = mosque.name.toLocaleLowerCase();
        return !officialNames.some((officialName) => officialName === name || (officialName.length > 5 && (officialName.includes(name) || name.includes(officialName))));
      });
      const combined = [...officialMosques, ...uniqueOsmMosques];
      setMosques(combined);

      if (!combined.length) setError(t(language, 'mosque.noneNearby'));
      else if (!officialMosques.length) setNotice(t(language, 'mosque.onlyCalculatedNearby', { place: matchedPlace }));
      else setNotice(t(language, 'mosque.sourcesNote'));
      setLoading('');
    }, () => {
      setLoading('');
      setError(t(language, 'mosque.locationDenied'));
    }, { enableHighAccuracy: true, timeout: 15000, maximumAge: 0 });
  }

  const selectedLabel = useMemo(() => selectedMosque ? [selectedMosque.name, selectedMosque.city].filter(Boolean).join(' · ') : '', [selectedMosque]);

  return (
    <div className="mosque-selector">
      {selectedMosque && (
        <div className="selected-mosque-card">
          <span className="selected-mosque-label">{t(language, 'mosque.selected')}</span>
          <strong>{selectedLabel}</strong>
          {selectedMosque.address && <small>{selectedMosque.address}</small>}
          <button type="button" className="text-action danger-action" onClick={onClear}>{t(language, 'mosque.useCalculation')}</button>
        </div>
      )}

      <button type="button" className="primary-action nearby-button" onClick={findNearby} disabled={Boolean(loading)}>
        {loading === 'nearby' ? t(language, 'mosque.searching') : t(language, 'mosque.findNearby')}
      </button>
      <div className="selector-divider"><span>{t(language, 'mosque.orChoose')}</span></div>

      <label className="selector-label">{t(language, 'mosque.country')}
        <select value={countryId} onChange={(e) => chooseCountry(e.target.value)} disabled={loading === 'countries'}>
          <option value="">{loading === 'countries' ? t(language, 'mosque.loading') : t(language, 'mosque.chooseCountry')}</option>
          {countries.map((country) => <option key={country.id} value={country.id}>{country.name}</option>)}
        </select>
      </label>

      <label className="selector-label">{t(language, 'mosque.city')}
        <select value={cityId} onChange={(e) => chooseCity(e.target.value)} disabled={!countryId || loading === 'cities'}>
          <option value="">{loading === 'cities' ? t(language, 'mosque.loading') : t(language, 'mosque.chooseCity')}</option>
          {cities.map((city) => <option key={city.id} value={city.id}>{city.name}</option>)}
        </select>
      </label>

      {loading === 'mosques' && <p className="selector-status">{t(language, 'mosque.loadingMosques')}</p>}
      {error && <p className="panel-error">{error}</p>}
      {notice && <p className="provider-note mosque-source-note">{notice}</p>}
      {mosques.length > 0 && (
        <div className="mosque-results">
          {mosques.map((mosque) => {
            const mosqueKey = mosque.guidId || mosque.id;
            const isSelected = (mosque.guidId && selectedMosque?.guidId === mosque.guidId) || selectedMosque?.id === mosque.id;
            return (
              <button type="button" className={`mosque-result ${isSelected ? 'selected' : ''}`} key={mosqueKey} onClick={() => selectMosque(mosque)} disabled={Boolean(loading)}>
                <strong>{mosque.name}</strong>
                <small>{[mosque.address, mosque.city, mosque.distance != null ? t(language, 'mosque.distance', { distance: mosque.distance.toFixed(1) }) : ''].filter(Boolean).join(' · ')}</small>
                <em className={`mosque-source-badge ${mosque.source === 'openstreetmap' ? 'calculated' : 'official'}`}>{t(language, mosque.source === 'openstreetmap' ? 'mosque.calculatedTimes' : 'mosque.officialSchedule')}</em>
                <span>{loading === 'mosque:' + mosqueKey ? t(language, 'mosque.loading') : isSelected ? t(language, 'mosque.chosen') : t(language, 'mosque.choose')}</span>
              </button>
            );
          })}
        </div>
      )}
    </div>
  );
}
