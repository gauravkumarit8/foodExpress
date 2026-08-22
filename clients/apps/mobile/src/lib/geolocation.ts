import * as Location from 'expo-location';

export interface Coords {
  lat: number;
  lng: number;
}

/** Resolves to null rather than throwing if permission is denied or location fails. */
export async function getCurrentPosition(): Promise<Coords | null> {
  try {
    const { status } = await Location.requestForegroundPermissionsAsync();
    if (status !== 'granted') return null;
    const position = await Location.getCurrentPositionAsync({
      accuracy: Location.Accuracy.Balanced,
    });
    return { lat: position.coords.latitude, lng: position.coords.longitude };
  } catch {
    return null;
  }
}
