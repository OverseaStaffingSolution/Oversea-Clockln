import { useState, useRef, useCallback, useEffect } from 'react';

// Statuts possibles du GPS
export const GPS_STATUS = {
  INACTIVE: 'inactive',
  SEARCHING: 'searching',
  ACTIVE: 'active',
  ERROR: 'error',
  PERMISSION_DENIED: 'permission_denied',
  TIMEOUT: 'timeout',
  INSUFFICIENT_ACCURACY: 'insufficient_accuracy'
} as const;

export type GPSStatusType = typeof GPS_STATUS[keyof typeof GPS_STATUS];

export interface GPSPosition {
  latitude: number;
  longitude: number;
  accuracy?: number;
}

export interface UseGeolocationOptions {
  enableHighAccuracy?: boolean;
  timeout?: number;
  maximumAge?: number;
  minAccuracy?: number; // Précision minimale cible en mètres (défaut: 100m)
  autoStopAfter?: number; // S'arrête automatiquement après X ms (défaut: 10000ms)
}

export function useGeolocation(options: UseGeolocationOptions = {}) {
  const {
    enableHighAccuracy = true,
    timeout = 20000,
    maximumAge = 15000,
    minAccuracy = 100, // Précision cible
    autoStopAfter = 10000
  } = options;

  const [position, setPosition] = useState<GPSPosition | null>(null);
  const [status, setStatus] = useState<GPSStatusType>(GPS_STATUS.INACTIVE);
  const [error, setError] = useState<string | null>(null);
  const [accuracy, setAccuracy] = useState<number | null>(null);
  const [isActive, setIsActive] = useState<boolean>(false);

  const watchIdRef = useRef<number | null>(null);
  const stopTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const isAcquiringRef = useRef<boolean>(false);

  // Nettoyer les ressources
  const cleanup = useCallback(() => {
    if (watchIdRef.current !== null) {
      navigator.geolocation.clearWatch(watchIdRef.current);
      watchIdRef.current = null;
    }
    if (stopTimeoutRef.current) {
      clearTimeout(stopTimeoutRef.current);
      stopTimeoutRef.current = null;
    }
    isAcquiringRef.current = false;
    setIsActive(false);
  }, []);

  // Arrêter le GPS
  const stopGPS = useCallback(() => {
    cleanup();
    setStatus(GPS_STATUS.INACTIVE);
    setPosition(null);
    setError(null);
  }, [cleanup]);

  // Nettoyage au démontage du composant
  useEffect(() => {
    return () => {
      cleanup();
    };
  }, [cleanup]);

  /**
   * Helper pour obtenir la position avec promesse et options personnalisées
   */
  const getSinglePosition = useCallback(
    (opts: PositionOptions): Promise<GeolocationPosition> => {
      return new Promise((resolve, reject) => {
        if (!navigator.geolocation) {
          reject(new Error('GPS non supporté par votre navigateur'));
          return;
        }
        navigator.geolocation.getCurrentPosition(resolve, reject, opts);
      });
    },
    []
  );

  /**
   * Démarrer l'acquisition GPS avec stratégie progressive (Haute précision -> Fallback standard)
   */
  const startGPS = useCallback(async (): Promise<GPSPosition> => {
    cleanup();

    if (!navigator.geolocation) {
      const errMsg = 'La géolocalisation n\'est pas supportée par votre navigateur.';
      setStatus(GPS_STATUS.ERROR);
      setError(errMsg);
      throw new Error(errMsg);
    }

    setStatus(GPS_STATUS.SEARCHING);
    setError(null);
    setPosition(null);
    setIsActive(true);
    isAcquiringRef.current = true;

    try {
      let geoPos: GeolocationPosition | null = null;

      // 1. Première tentative : Haute précision avec timeout de 7 secondes
      if (enableHighAccuracy) {
        try {
          geoPos = await getSinglePosition({
            enableHighAccuracy: true,
            timeout: 7000,
            maximumAge: maximumAge || 10000
          });
        } catch (highAccErr: any) {
          console.warn('GPS haute précision non disponible immédiatement, basculement en mode standard...', highAccErr);
          // Si permission refusée explicitement, ne pas réessayer en standard
          if (highAccErr.code === 1 /* PERMISSION_DENIED */) {
            throw highAccErr;
          }
        }
      }

      // 2. Deuxième tentative : Si haute précision a échoué ou a dépassé le délai, essayer le mode standard (Wi-Fi/Réseau)
      if (!geoPos) {
        try {
          geoPos = await getSinglePosition({
            enableHighAccuracy: false,
            timeout: 10000,
            maximumAge: 30000
          });
        } catch (stdErr: any) {
          console.warn('Tentative standard échouée, essai avec watchPosition...', stdErr);
          if (stdErr.code === 1 /* PERMISSION_DENIED */) {
            throw stdErr;
          }
        }
      }

      // 3. Troisième tentative : Si toujours rien, essayer watchPosition pour capturer le premier signal entrant
      if (!geoPos) {
        geoPos = await new Promise<GeolocationPosition>((resolve, reject) => {
          const timeoutId = setTimeout(() => {
            if (watchIdRef.current !== null) {
              navigator.geolocation.clearWatch(watchIdRef.current);
              watchIdRef.current = null;
            }
            reject({ code: 3, message: 'Délai GPS dépassé' });
          }, 8000);

          watchIdRef.current = navigator.geolocation.watchPosition(
            (pos) => {
              clearTimeout(timeoutId);
              if (watchIdRef.current !== null) {
                navigator.geolocation.clearWatch(watchIdRef.current);
                watchIdRef.current = null;
              }
              resolve(pos);
            },
            (err) => {
              clearTimeout(timeoutId);
              if (watchIdRef.current !== null) {
                navigator.geolocation.clearWatch(watchIdRef.current);
                watchIdRef.current = null;
              }
              reject(err);
            },
            { enableHighAccuracy: false, timeout: 8000, maximumAge: 60000 }
          );
        });
      }

      // Position obtenue avec succès !
      const { latitude, longitude, accuracy: posAccuracy } = geoPos.coords;
      const validPos: GPSPosition = {
        latitude,
        longitude,
        accuracy: posAccuracy
      };

      setPosition(validPos);
      setAccuracy(posAccuracy);
      setStatus(GPS_STATUS.ACTIVE);
      setError(null);

      // Programmer l'arrêt automatique après autoStopAfter (ex: 10s)
      if (stopTimeoutRef.current) {
        clearTimeout(stopTimeoutRef.current);
      }
      stopTimeoutRef.current = setTimeout(() => {
        stopGPS();
      }, autoStopAfter);

      return validPos;
    } catch (err: any) {
      let errorMessage = 'Unable to acquire GPS position.';

      if (err.code === 1 /* PERMISSION_DENIED */) {
        setStatus(GPS_STATUS.PERMISSION_DENIED);
        errorMessage = 'Please allow location access in your browser.';
      } else if (err.code === 2 /* POSITION_UNAVAILABLE */) {
        setStatus(GPS_STATUS.ERROR);
        errorMessage = 'Location unavailable. Please enable GPS or Wi-Fi.';
      } else if (err.code === 3 /* TIMEOUT */) {
        setStatus(GPS_STATUS.TIMEOUT);
        errorMessage = 'GPS signal timed out. Please move near a window or check location settings.';
      } else {
        setStatus(GPS_STATUS.ERROR);
        errorMessage = err.message || errorMessage;
      }

      setError(errorMessage);
      setIsActive(false);
      throw new Error(errorMessage);
    }
  }, [enableHighAccuracy, maximumAge, autoStopAfter, cleanup, stopGPS, getSinglePosition]);

  // Récupérer une position unique
  const getCurrentPosition = useCallback(async (): Promise<GPSPosition> => {
    return startGPS();
  }, [startGPS]);

  const statusMessage = {
    [GPS_STATUS.INACTIVE]: 'GPS inactive - Click Clock In or Clock Out',
    [GPS_STATUS.SEARCHING]: 'Acquiring GPS signal...',
    [GPS_STATUS.ACTIVE]: `GPS connected - Accuracy: ${Math.round(accuracy || 0)}m`,
    [GPS_STATUS.ERROR]: 'GPS error - Please enable location services',
    [GPS_STATUS.PERMISSION_DENIED]: 'Location permission denied',
    [GPS_STATUS.TIMEOUT]: 'GPS timeout - Please try again',
    [GPS_STATUS.INSUFFICIENT_ACCURACY]: `Low accuracy signal - Accuracy: ${Math.round(accuracy || 0)}m`
  }[status];

  return {
    // États
    position,
    status,
    error,
    accuracy,
    isActive,
    // Actions
    startGPS,
    stopGPS,
    getCurrentPosition,
    // Status helpers
    isSearching: status === GPS_STATUS.SEARCHING,
    isActiveState: status === GPS_STATUS.ACTIVE,
    isError:
      status === GPS_STATUS.ERROR ||
      status === GPS_STATUS.PERMISSION_DENIED ||
      status === GPS_STATUS.TIMEOUT,
    isInactive: status === GPS_STATUS.INACTIVE,
    isInsufficientAccuracy: status === GPS_STATUS.INSUFFICIENT_ACCURACY,
    // Message pour affichage
    statusMessage
  };
}
