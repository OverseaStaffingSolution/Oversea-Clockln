import { useState, useRef, useCallback, useEffect } from 'react';

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
  minAccuracy?: number;
  autoStopAfter?: number;
}

export function useGeolocation(options: UseGeolocationOptions = {}) {
  const {
    enableHighAccuracy = true,
    timeout = 20000,
    maximumAge = 15000,
    minAccuracy = 100,
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

  const stopGPS = useCallback(() => {
    cleanup();
    setStatus(GPS_STATUS.INACTIVE);
    setPosition(null);
    setError(null);
  }, [cleanup]);

  useEffect(() => {
    return () => {
      cleanup();
    };
  }, [cleanup]);

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

      // Tentative 1 : Haute précision
      if (enableHighAccuracy) {
        try {
          geoPos = await getSinglePosition({
            enableHighAccuracy: true,
            timeout: 7000,
            maximumAge: maximumAge || 10000
          });
        } catch (highAccErr: any) {
          console.warn('High accuracy failed:', highAccErr);
          if (highAccErr.code === 1) {
            throw highAccErr; // Permission refusée
          }
        }
      }

      // Tentative 2 : Standard (Wi-Fi/Réseau)
      if (!geoPos) {
        try {
          geoPos = await getSinglePosition({
            enableHighAccuracy: false,
            timeout: 10000,
            maximumAge: 30000
          });
        } catch (stdErr: any) {
          console.warn('Standard failed:', stdErr);
          if (stdErr.code === 1) {
            throw stdErr;
          }
        }
      }

      // Tentative 3 : watchPosition
      if (!geoPos) {
        geoPos = await new Promise<GeolocationPosition>((resolve, reject) => {
          const timeoutId = setTimeout(() => {
            if (watchIdRef.current !== null) {
              navigator.geolocation.clearWatch(watchIdRef.current);
              watchIdRef.current = null;
            }
            reject({ code: 3, message: 'GPS timeout' });
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

      if (stopTimeoutRef.current) {
        clearTimeout(stopTimeoutRef.current);
      }
      stopTimeoutRef.current = setTimeout(() => {
        stopGPS();
      }, autoStopAfter);

      return validPos;
    } catch (err: any) {
      let errorMessage = 'Impossible d\'obtenir la position GPS.';

      if (err.code === 1) {
        setStatus(GPS_STATUS.PERMISSION_DENIED);
        errorMessage =
          '📍 Permission GPS refusée.\n\n' +
          'Pour autoriser la géolocalisation :\n' +
          '• Chrome / Edge : cliquez sur le cadenas 🔒 dans la barre d\'adresse → ' +
          'Paramètres du site → Autoriser la géolocalisation → Recharger la page.\n\n' +
          '• Safari (iPhone) : Réglages → Vie privée → Services de localisation → Safari → Autoriser.\n\n' +
          '• Android : Réglages → Applications → [Votre navigateur] → Autorisations → Localisation → Autoriser.\n\n' +
          'Après avoir modifié la permission, rechargez la page et réessayez.';
      } else if (err.code === 2) {
        setStatus(GPS_STATUS.ERROR);
        errorMessage = 'Position indisponible. Activez le GPS ou le Wi-Fi.';
      } else if (err.code === 3) {
        setStatus(GPS_STATUS.TIMEOUT);
        errorMessage = 'Délai GPS dépassé. Réessayez.';
      } else {
        setStatus(GPS_STATUS.ERROR);
        errorMessage = err.message || errorMessage;
      }

      setError(errorMessage);
      setIsActive(false);
      throw new Error(errorMessage);
    }
  }, [enableHighAccuracy, maximumAge, autoStopAfter, cleanup, stopGPS, getSinglePosition]);

  const getCurrentPosition = useCallback(async (): Promise<GPSPosition> => {
    return startGPS();
  }, [startGPS]);

  const statusMessage = {
    [GPS_STATUS.INACTIVE]: 'GPS inactif - Cliquez sur Clock In ou Clock Out',
    [GPS_STATUS.SEARCHING]: 'Recherche du signal GPS...',
    [GPS_STATUS.ACTIVE]: `GPS OK - Précision: ${Math.round(accuracy || 0)}m`,
    [GPS_STATUS.ERROR]: 'Erreur GPS - Activez la localisation',
    [GPS_STATUS.PERMISSION_DENIED]: '📍 Permission GPS refusée - Cliquez sur le cadenas 🔒 pour autoriser',
    [GPS_STATUS.TIMEOUT]: 'Délai GPS dépassé - Réessayez',
    [GPS_STATUS.INSUFFICIENT_ACCURACY]: `Signal faible - Précision: ${Math.round(accuracy || 0)}m`
  }[status];

  return {
    position,
    status,
    error,
    accuracy,
    isActive,
    startGPS,
    stopGPS,
    getCurrentPosition,
    isSearching: status === GPS_STATUS.SEARCHING,
    isActiveState: status === GPS_STATUS.ACTIVE,
    isError:
      status === GPS_STATUS.ERROR ||
      status === GPS_STATUS.PERMISSION_DENIED ||
      status === GPS_STATUS.TIMEOUT,
    isInactive: status === GPS_STATUS.INACTIVE,
    isInsufficientAccuracy: status === GPS_STATUS.INSUFFICIENT_ACCURACY,
    statusMessage
  };
}