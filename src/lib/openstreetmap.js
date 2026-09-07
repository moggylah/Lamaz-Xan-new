const OVERPASS_ENDPOINTS = [
  'https://overpass.private.coffee/api/interpreter',
  'https://overpass-api.de/api/interpreter',
  'https://maps.mail.ru/osm/tools/overpass/api/interpreter',
];

function distanceKm(lat1, lng1, lat2, lng2) {
  const toRadians = (value) => value * Math.PI / 180;
  const dLat = toRadians(lat2 - lat1);
  const dLng = toRadians(lng2 - lng1);
  const a = Math.sin(dLat / 2) ** 2 + Math.cos(toRadians(lat1)) * Math.cos(toRadians(lat2)) * Math.sin(dLng / 2) ** 2;
  return 6371 * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
}

function buildAddress(tags = {}) {
  const street = [tags['addr:street'], tags['addr:housenumber']].filter(Boolean).join(' ');
  return [street, tags['addr:postcode'], tags['addr:city']].filter(Boolean).join(', ');
}

function mapElement(element, origin) {
  const lat = Number(element.lat ?? element.center?.lat);
  const lng = Number(element.lon ?? element.center?.lon);
  if (!Number.isFinite(lat) || !Number.isFinite(lng)) return null;
  const tags = element.tags || {};
  return {
    id: 'osm-' + element.type + '-' + element.id,
    name: tags.name || tags['name:en'] || tags['name:ar'] || 'Mosque',
    address: buildAddress(tags),
    city: tags['addr:city'] || '',
    country: tags['addr:country'] || '',
    lat,
    lng,
    distance: distanceKm(origin.lat, origin.lng, lat, lng),
    source: 'openstreetmap',
  };
}

export async function getNearbyOpenStreetMapMosques(lat, lng, radius = 10000) {
  const query = '[out:json][timeout:14];(' +
    'nwr(around:' + radius + ',' + lat + ',' + lng + ')["amenity"="place_of_worship"]["religion"="muslim"];' +
    'nwr(around:' + radius + ',' + lat + ',' + lng + ')["building"="mosque"];' +
    ');out center tags;';
  let lastError;

  for (const endpoint of OVERPASS_ENDPOINTS) {
    try {
      const controller = new AbortController();
      const timeout = window.setTimeout(() => controller.abort(), 16000);
      let response;
      try {
        response = await fetch(endpoint, {
          method: 'POST',
          headers: { 'Content-Type': 'application/x-www-form-urlencoded;charset=UTF-8' },
          body: new URLSearchParams({ data: query }),
          signal: controller.signal,
        });
      } finally {
        window.clearTimeout(timeout);
      }
      if (!response.ok) throw new Error('Overpass: ' + response.status);
      const payload = await response.json();
      const seen = new Set();
      return (payload.elements || [])
        .map((element) => mapElement(element, { lat, lng }))
        .filter((mosque) => mosque && mosque.name !== 'Mosque')
        .filter((mosque) => {
          const key = mosque.name.toLocaleLowerCase() + ':' + mosque.lat.toFixed(4) + ':' + mosque.lng.toFixed(4);
          if (seen.has(key)) return false;
          seen.add(key);
          return true;
        })
        .sort((a, b) => a.distance - b.distance)
        .slice(0, 20);
    } catch (error) {
      lastError = error;
    }
  }
  throw lastError || new Error('OpenStreetMap search failed');
}
