export interface Coords {
  lat: number;
  lng: number;
}

/** Resolves to null rather than throwing if permission is denied or the API is unavailable. */
export function getCurrentPosition(): Promise<Coords | null> {
  return new Promise((resolve) => {
    if (!('geolocation' in navigator)) {
      resolve(null);
      return;
    }
    navigator.geolocation.getCurrentPosition(
      (pos) => resolve({ lat: pos.coords.latitude, lng: pos.coords.longitude }),
      () => resolve(null),
      { timeout: 8000 },
    );
  });
}
