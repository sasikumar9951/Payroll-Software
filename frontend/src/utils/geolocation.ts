export interface GeolocationResult {
  locationString: string;
  latitude?: number;
  longitude?: number;
  ip?: string;
  accuracy?: number;
}

/**
 * Gets real public IP via api64.ipify.org
 */
export async function getPublicIp(): Promise<string> {
  try {
    const res = await fetch('https://api64.ipify.org?format=json', { signal: AbortSignal.timeout(3500) });
    if (res.ok) {
      const data = await res.json();
      if (data.ip) return data.ip;
    }
  } catch (err) {
    // fallback
  }

  try {
    const res = await fetch('https://ipapi.co/json/', { signal: AbortSignal.timeout(3500) });
    if (res.ok) {
      const data = await res.json();
      if (data.ip) return data.ip;
    }
  } catch (err) {
    // fallback
  }

  return 'Local / Private Network';
}

/**
 * Reverse geocodes coordinates to a human-readable city/area name using OpenStreetMap Nominatim
 */
async function reverseGeocode(lat: number, lon: number): Promise<string> {
  try {
    const url = `https://nominatim.openstreetmap.org/reverse?format=jsonv2&lat=${lat}&lon=${lon}`;
    const res = await fetch(url, {
      headers: {
        'Accept-Language': 'en',
      },
      signal: AbortSignal.timeout(4000),
    });
    if (res.ok) {
      const data = await res.json();
      const addr = data.address || {};
      const neighbourhood = addr.suburb || addr.neighbourhood || addr.residential || addr.road || '';
      const city = addr.city || addr.town || addr.village || addr.county || '';
      const state = addr.state || '';
      const postcode = addr.postcode || '';

      const parts = [neighbourhood, city, state, postcode].filter(Boolean);
      if (parts.length > 0) {
        return `${parts.join(', ')} (${lat.toFixed(4)}, ${lon.toFixed(4)})`;
      }
      if (data.display_name) {
        return data.display_name.split(',').slice(0, 3).join(',').trim();
      }
    }
  } catch {
    // fallback to lat/lon
  }
  return `GPS: ${lat.toFixed(4)}, ${lon.toFixed(4)}`;
}

/**
 * Captures live browser GPS geolocation and public IP for check-in / check-out
 */
export async function captureLiveLocationAndIp(): Promise<GeolocationResult> {
  // 1. Get real public IP concurrently
  const ipPromise = getPublicIp();

  // 2. Query browser HTML5 Geolocation API with high-accuracy and standard fallback
  const geoPromise = new Promise<{ lat?: number; lon?: number; accuracy?: number }>((resolve) => {
    if (!navigator.geolocation) {
      resolve({});
      return;
    }

    const tryStandardAccuracy = () => {
      navigator.geolocation.getCurrentPosition(
        (pos) => {
          resolve({
            lat: pos.coords.latitude,
            lon: pos.coords.longitude,
            accuracy: pos.coords.accuracy,
          });
        },
        (err) => {
          console.warn('Geolocation standard accuracy unavailable:', err.message);
          resolve({});
        },
        { enableHighAccuracy: false, timeout: 5000, maximumAge: 30000 }
      );
    };

    navigator.geolocation.getCurrentPosition(
      (position) => {
        resolve({
          lat: position.coords.latitude,
          lon: position.coords.longitude,
          accuracy: position.coords.accuracy,
        });
      },
      (error) => {
        // If timeout or error, attempt standard Wi-Fi based positioning before giving up
        if (error.code === error.TIMEOUT) {
          tryStandardAccuracy();
        } else {
          console.warn('Geolocation permission not granted or unavailable:', error.message);
          resolve({});
        }
      },
      {
        enableHighAccuracy: true,
        timeout: 5000,
        maximumAge: 10000,
      }
    );
  });

  const [ip, coords] = await Promise.all([ipPromise, geoPromise]);

  let locationString = 'Office Web Portal';

  if (coords.lat !== undefined && coords.lon !== undefined) {
    locationString = await reverseGeocode(coords.lat, coords.lon);
  } else {
    // If browser GPS was blocked, try ipapi.co city fallback
    try {
      const ipGeoRes = await fetch('https://ipapi.co/json/', { signal: AbortSignal.timeout(3000) });
      if (ipGeoRes.ok) {
        const ipGeo = await ipGeoRes.json();
        const cityState = [ipGeo.city, ipGeo.region, ipGeo.country_name].filter(Boolean).join(', ');
        if (cityState) {
          locationString = `${cityState} (via IP)`;
        }
      }
    } catch {
      locationString = 'Remote / Home Office';
    }
  }

  return {
    locationString,
    latitude: coords.lat,
    longitude: coords.lon,
    accuracy: coords.accuracy,
    ip,
  };
}
