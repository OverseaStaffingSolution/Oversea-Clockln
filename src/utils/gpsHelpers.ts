// Utilitaires pour le GPS et calculs géographiques

export const CALL_CENTER_COORDINATES = {
  latitude: 18.551058,
  longitude: -72.280095,
  name: 'Oversea Call Center'
};

export const AUTHORIZED_RADIUS_METERS = 100;

/**
 * Convertit des degrés en radians
 */
export function toRadians(degrees: number): number {
  return (degrees * Math.PI) / 180;
}

/**
 * Calcule la distance entre deux points GPS en mètres (formule de Haversine)
 */
export function haversineDistance(
  lat1: number,
  lon1: number,
  lat2: number,
  lon2: number
): number {
  const R = 6371000; // Rayon de la Terre en mètres
  const dLat = toRadians(lat2 - lat1);
  const dLon = toRadians(lon2 - lon1);
  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos(toRadians(lat1)) *
      Math.cos(toRadians(lat2)) *
      Math.sin(dLon / 2) *
      Math.sin(dLon / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return R * c;
}

/**
 * Vérifie si une position est dans le rayon autorisé du centre
 */
export function isWithinRadius(
  lat1: number,
  lon1: number,
  lat2: number = CALL_CENTER_COORDINATES.latitude,
  lon2: number = CALL_CENTER_COORDINATES.longitude,
  radiusMeters: number = AUTHORIZED_RADIUS_METERS
): boolean {
  const distance = haversineDistance(lat1, lon1, lat2, lon2);
  return distance <= radiusMeters;
}

/**
 * Calcule la distance de l'agent par rapport au centre d'appel
 */
export function getDistanceToCallCenter(
  latitude: number,
  longitude: number,
  targetLat: number = CALL_CENTER_COORDINATES.latitude,
  targetLon: number = CALL_CENTER_COORDINATES.longitude
): number {
  return haversineDistance(
    latitude,
    longitude,
    targetLat,
    targetLon
  );
}

/**
 * Formate une position pour l'affichage
 */
export function formatPosition(latitude: number, longitude: number, accuracy?: number) {
  return {
    latitude: latitude.toFixed(6),
    longitude: longitude.toFixed(6),
    accuracy: Math.round(accuracy || 0)
  };
}
