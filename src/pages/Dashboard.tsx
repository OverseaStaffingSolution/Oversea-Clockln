import React, { useState, useEffect, useCallback, useRef } from 'react';
import {
  User,
  Shield,
  MapPin,
  CheckCircle2,
  AlertTriangle,
  AlertCircle,
  Info,
  X,
  Loader2,
  LogIn,
  LogOut,
  Calendar,
  Clock,
  Timer,
  WifiOff
} from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';
import { GlassCard } from '../components/ui/GlassCard';
import { GPSStatus } from '../components/ui/GPSStatus';
import { ConfirmationModal } from '../components/ui/ConfirmationModal';
import { InstallButton } from '../components/ui/InstallButton';
import { ClockLoader } from '../components/ui/ClockLoader';
import { ConnectionStatus } from '../components/ui/ConnectionStatus'; // ✅ Import ajouté
import { useGeolocation, GPSPosition, GPS_STATUS } from '../hooks/useGeolocation';
import { useOnlineStatus } from '../hooks/useOnlineStatus';
import { useAgentSchedule } from '../hooks/useAgentSchedule';
import {
  clockIn,
  clockOut,
  getTodayPointage,
  getSiteInfo,
  PointageRecord,
  SiteInfo
} from '../services/pointageService';
import {
  CALL_CENTER_COORDINATES,
  AUTHORIZED_RADIUS_METERS,
  getDistanceToCallCenter,
  formatPosition
} from '../utils/gpsHelpers';
import { formatTime, formatDuration } from '../utils/dateHelpers';
import { MESSAGES } from '../utils/messages';
import { cacheService } from '../services/cacheService';

// Helper pour transformer les erreurs techniques en messages compréhensibles
const getUserFriendlyErrorMessage = (err: any): string => {
  // Si c'est déjà un message utilisateur, on le retourne tel quel
  if (err && err.isUserMessage) return err.message;

  const message = err?.message || String(err) || '';

  // Erreurs réseau
  if (message === 'Failed to fetch' || message === 'Network Error' || message.includes('network')) {
    return 'Connection lost. Please check your internet connection and try again.';
  }

  // Timeout
  if (message.includes('timeout') || message.includes('Timeout') || message.includes('timed out')) {
    return 'The request timed out. Please try again.';
  }

  // Erreurs GPS
  if (message.includes('GPS') || message.includes('geolocation') || message.includes('Geolocation')) {
    return 'GPS unavailable. Please enable location services and try again.';
  }

  // Erreurs Supabase
  if (message.includes('Supabase') || message.includes('RPC') || message.includes('rpc')) {
    return 'Server error. Please try again in a few moments.';
  }

  // Erreurs d'authentification
  if (message.includes('auth') || message.includes('Auth') || message.includes('JWT') || message.includes('token')) {
    return 'Session expired. Please log in again.';
  }

  // Erreurs de validation
  if (message.includes('validation') || message.includes('Validation') || message.includes('invalid')) {
    return 'Invalid input. Please check your data and try again.';
  }

  // Si le message est déjà compréhensible, on le garde
  if (message && message.length < 200 && !message.includes('{') && !message.includes('[')) {
    return message;
  }

  // Fallback
  return 'Something went wrong. Please try again.';
};

export function Dashboard() {
  const { user, agent } = useAuth();
  const isOnline = useOnlineStatus();
  const [currentTime, setCurrentTime] = useState(new Date());

  const {
    position,
    status,
    error: gpsError,
    accuracy,
    isActive,
    startGPS,
    stopGPS
  } = useGeolocation({
    enableHighAccuracy: true,
    timeout: 20000,
    maximumAge: 15000,
    minAccuracy: 50,
    autoStopAfter: 10000
  });

  const effectiveAgentId = agent?.id || user?.id;

  const { heure_debut, heure_fin } = useAgentSchedule(effectiveAgentId);

  const [todayPointage, setTodayPointage] = useState<PointageRecord | null>(() => {
    if (effectiveAgentId) {
      return cacheService.get<PointageRecord>(`today_pointage_${effectiveAgentId}`);
    }
    return null;
  });
  const [siteInfo, setSiteInfo] = useState<SiteInfo | null>(() => {
    return cacheService.get<SiteInfo>('call_center_site_info');
  });
  const [initialLoading, setInitialLoading] = useState<boolean>(() => {
    return !todayPointage && !siteInfo;
  });

  const [loading, setLoading] = useState<boolean>(false);
  const [isPointing, setIsPointing] = useState<'arrival' | 'departure' | null>(null);

  const [showModal, setShowModal] = useState<boolean>(false);
  const [modalType, setModalType] = useState<'arrival' | 'departure'>('arrival');
  const [modalPosition, setModalPosition] = useState<{ latitude: number; longitude: number; accuracy: number } | null>(null);
  const [modalDistance, setModalDistance] = useState<number | null>(null);
  const [modalIsInZone, setModalIsInZone] = useState<boolean>(false);
  const [isConfirming, setIsConfirming] = useState<boolean>(false);

  const [canClockIn, setCanClockIn] = useState<boolean>(() => {
    if (!todayPointage) return true;
    const hasArrival = Boolean(todayPointage.clock_in_time || todayPointage.heure_arrivee);
    const hasDeparture = Boolean(todayPointage.clock_out_time || todayPointage.heure_depart);
    return !hasArrival;
  });
  const [canClockOut, setCanClockOut] = useState<boolean>(() => {
    if (!todayPointage) return false;
    const hasArrival = Boolean(todayPointage.clock_in_time || todayPointage.heure_arrivee);
    const hasDeparture = Boolean(todayPointage.clock_out_time || todayPointage.heure_depart);
    return hasArrival && !hasDeparture;
  });

  const [feedback, setFeedback] = useState<{
    type: 'success' | 'error' | 'info';
    message: string;
  } | null>(null);

  const timerRef = useRef<NodeJS.Timeout | null>(null);

  useEffect(() => {
    timerRef.current = setInterval(() => setCurrentTime(new Date()), 1000);
    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
    };
  }, []);

  const updateButtonStates = useCallback((pointage: PointageRecord | null) => {
    if (!pointage) {
      setCanClockIn(true);
      setCanClockOut(false);
      return;
    }

    const hasArrival = Boolean(pointage.clock_in_time || pointage.heure_arrivee);
    const hasDeparture = Boolean(pointage.clock_out_time || pointage.heure_depart);

    if (hasArrival && !hasDeparture) {
      setCanClockIn(false);
      setCanClockOut(true);
    } else if (hasArrival && hasDeparture) {
      setCanClockIn(false);
      setCanClockOut(false);
    } else {
      setCanClockIn(true);
      setCanClockOut(false);
    }
  }, []);

  const refreshData = useCallback(async () => {
    if (!effectiveAgentId) return;
    try {
      if ('caches' in window) {
        await caches.delete('supabase-api-cache');
      }
      cacheService.remove(`today_pointage_${effectiveAgentId}`);
      cacheService.remove('call_center_site_info');

      const pointage = await getTodayPointage(effectiveAgentId);
      setTodayPointage(pointage);
      updateButtonStates(pointage);
      const site = await getSiteInfo();
      setSiteInfo(site);
    } catch (err) {
      console.error('Refresh error:', err);
      setFeedback({
        type: 'error',
        message: getUserFriendlyErrorMessage(err)
      });
    }
  }, [effectiveAgentId, updateButtonStates]);

  const loadInitialData = useCallback(async () => {
    if (!effectiveAgentId) {
      setInitialLoading(false);
      return;
    }

    try {
      setInitialLoading(true);
      await refreshData();
    } catch (err) {
      console.error('Initial load error:', err);
      setFeedback({
        type: 'error',
        message: getUserFriendlyErrorMessage(err)
      });
    } finally {
      setInitialLoading(false);
    }
  }, [effectiveAgentId, refreshData]);

  useEffect(() => {
    loadInitialData();
  }, [loadInitialData]);

  const getClientIP = async (): Promise<string | null> => {
    try {
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 3000);
      const response = await fetch('https://api.ipify.org?format=json', {
        signal: controller.signal
      });
      clearTimeout(timeoutId);
      const data = await response.json();
      return data.ip || null;
    } catch (err) {
      console.warn('IP fetch failed:', err);
      return null;
    }
  };

  const handleClockIn = async () => {
    if (!isOnline) {
      setFeedback({
        type: 'error',
        message: 'You are currently offline. Clock in requires an active internet connection.'
      });
      return;
    }

    if (loading || isPointing || isConfirming || !canClockIn) return;

    if (!effectiveAgentId) {
      setFeedback({
        type: 'error',
        message: 'Agent ID not found. Please sign in again.'
      });
      return;
    }

    setLoading(true);
    setIsPointing('arrival');
    setFeedback(null);

    try {
      const positionData = await startGPS();

      if (!positionData) {
        throw new Error('GPS unavailable');
      }

      const dist = getDistanceToCallCenter(
        positionData.latitude,
        positionData.longitude,
        siteInfo?.latitude,
        siteInfo?.longitude
      );
      const effectiveRadius = siteInfo?.rayon_metres || AUTHORIZED_RADIUS_METERS;
      const isInZone = dist <= effectiveRadius;

      setModalPosition({
        latitude: positionData.latitude,
        longitude: positionData.longitude,
        accuracy: positionData.accuracy || 50
      });
      setModalDistance(Math.round(dist));
      setModalIsInZone(isInZone);
      setModalType('arrival');
      setShowModal(true);
    } catch (err: any) {
      console.error('GPS error handleClockIn:', err);
      setFeedback({
        type: 'error',
        message: getUserFriendlyErrorMessage(err)
      });
    } finally {
      setLoading(false);
      setIsPointing(null);
    }
  };

  const handleClockOut = async () => {
    if (!isOnline) {
      setFeedback({
        type: 'error',
        message: 'You are currently offline. Clock out requires an active internet connection.'
      });
      return;
    }

    if (loading || isPointing || isConfirming || !canClockOut) return;

    if (!effectiveAgentId) {
      setFeedback({
        type: 'error',
        message: 'Agent ID not found. Please sign in again.'
      });
      return;
    }

    setLoading(true);
    setIsPointing('departure');
    setFeedback(null);

    try {
      const positionData = await startGPS();

      if (!positionData) {
        throw new Error('GPS unavailable');
      }

      const dist = getDistanceToCallCenter(
        positionData.latitude,
        positionData.longitude,
        siteInfo?.latitude,
        siteInfo?.longitude
      );
      const effectiveRadius = siteInfo?.rayon_metres || AUTHORIZED_RADIUS_METERS;
      const isInZone = dist <= effectiveRadius;

      setModalPosition({
        latitude: positionData.latitude,
        longitude: positionData.longitude,
        accuracy: positionData.accuracy || 50
      });
      setModalDistance(Math.round(dist));
      setModalIsInZone(isInZone);
      setModalType('departure');
      setShowModal(true);
    } catch (err: any) {
      console.error('GPS error handleClockOut:', err);
      setFeedback({
        type: 'error',
        message: getUserFriendlyErrorMessage(err)
      });
    } finally {
      setLoading(false);
      setIsPointing(null);
    }
  };

  const handleConfirm = async () => {
    if (!modalIsInZone || !effectiveAgentId || !modalPosition) return;

    setIsConfirming(true);
    try {
      const ip = await getClientIP();
      const result = modalType === 'arrival'
        ? await clockIn(
            effectiveAgentId,
            modalPosition.latitude,
            modalPosition.longitude,
            modalPosition.accuracy,
            ip
          )
        : await clockOut(
            effectiveAgentId,
            modalPosition.latitude,
            modalPosition.longitude,
            modalPosition.accuracy,
            ip
          );

      if (result && result.success) {
        setFeedback({
          type: 'success',
          message: result.message || (modalType === 'arrival' ? MESSAGES.SUCCESS.CLOCK_IN_OK : MESSAGES.SUCCESS.CLOCK_OUT_OK)
        });

        await refreshData();
      } else {
        const errorMsg = result?.message || (modalType === 'arrival' ? MESSAGES.POINTAGE.HORS_ZONE : MESSAGES.POINTAGE.NO_IN);
        setFeedback({
          type: 'error',
          message: errorMsg
        });
      }
    } catch (err: any) {
      console.error('Confirm error:', err);
      setFeedback({
        type: 'error',
        message: getUserFriendlyErrorMessage(err)
      });
    } finally {
      setIsConfirming(false);
      setShowModal(false);
      setTimeout(() => stopGPS(), 3000);
    }
  };

  const formattedClockTime = currentTime.toLocaleTimeString('en-US', {
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit',
    hour12: false
  });

  const formattedClockDate = currentTime.toLocaleDateString('en-US', {
    weekday: 'long',
    year: 'numeric',
    month: 'long',
    day: 'numeric'
  });

  const displayDuration = () => {
    if (todayPointage?.duree_texte) return todayPointage.duree_texte;
    if (todayPointage?.duree) return formatDuration(todayPointage.duree);

    const arrivalTime = todayPointage?.clock_in_time || todayPointage?.heure_arrivee;
    const departureTime = todayPointage?.clock_out_time || todayPointage?.heure_depart;

    if (arrivalTime && departureTime) {
      const todayStr = todayPointage?.date || new Date().toISOString().split('T')[0];
      const start = new Date(`${todayStr}T${arrivalTime}`);
      const end = new Date(`${todayStr}T${departureTime}`);
      const diffSecs = Math.max(0, Math.floor((end.getTime() - start.getTime()) / 1000));
      return formatDuration(diffSecs);
    }

    if (arrivalTime && !departureTime) {
      const todayStr = todayPointage?.date || new Date().toISOString().split('T')[0];
      const start = new Date(`${todayStr}T${arrivalTime}`);
      const diffSecs = Math.max(0, Math.floor((currentTime.getTime() - start.getTime()) / 1000));
      return formatDuration(diffSecs);
    }

    return '--:--';
  };

  const liveDistance = position
    ? Math.round(
        getDistanceToCallCenter(
          position.latitude,
          position.longitude,
          siteInfo?.latitude,
          siteInfo?.longitude
        )
      )
    : null;

  const targetRadius = siteInfo?.rayon_metres || AUTHORIZED_RADIUS_METERS;

  const isWorkingDay = (): boolean => {
    const days = ['lundi', 'mardi', 'mercredi', 'jeudi', 'vendredi', 'samedi', 'dimanche'];
    const today = new Date().getDay(); // 0=Dim, 1=Lun, ..., 6=Sam
    const dayIndex = today === 0 ? 6 : today - 1;
    const dayName = days[dayIndex];
    
    if (!agent?.jours_travailles || agent.jours_travailles.length === 0) {
      return true; // Par défaut, si pas configuré, on autorise
    }
    return agent.jours_travailles.includes(dayName);
  };

  if (initialLoading) {
    return <ClockLoader subtitle="Loading your day..." size="medium" />;
  }

  return (
    <div className="space-y-6 sm:space-y-8 pb-10 max-w-5xl mx-auto">
      <InstallButton />
      
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-6">
        <div>
          <h1 className="text-3xl sm:text-4xl lg:text-5xl font-serif font-bold text-[#FC9905] mb-2 tracking-tight">
            Hello, {agent?.prenom || agent?.nom || user?.email?.split('@')[0] || 'Agent'}!
          </h1>
          <p className="text-base sm:text-lg text-gray-700 font-light flex items-center gap-2">
            <span>Logged in as</span>
            <span className="inline-flex items-center gap-1.5 font-semibold text-gray-900 capitalize bg-white/60 px-2.5 py-0.5 rounded-lg border border-[#110195]/10">
              {agent?.role === 'manager' ? (
                <>
                  <Shield className="w-4 h-4 text-[#110195] shrink-0" />
                  Manager
                </>
              ) : (
                <>
                  <User className="w-4 h-4 text-[#110195] shrink-0" />
                  {agent?.role || 'Agent'}
                </>
              )}
            </span>
          </p>
        </div>

        <GlassCard className="!p-4 sm:!p-5 text-center md:text-right !rounded-2xl border border-[#110195]/10 shrink-0">
          <div className="text-2xl sm:text-3xl font-bold text-gray-900 tracking-widest font-mono">
            {formattedClockTime}
          </div>
          <div className="text-xs sm:text-sm text-gray-600 capitalize mt-1">
            {formattedClockDate}
          </div>
          {/* ✅ Indicateur de connexion ajouté ici */}
          <div className="mt-2 flex justify-center md:justify-end">
            <ConnectionStatus />
          </div>
        </GlassCard>
      </div>

      <div className="space-y-3">
        <GPSStatus
          status={status}
          accuracy={accuracy}
          isActive={isActive}
          error={gpsError}
          onRetry={startGPS}
        />

        {position && (
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between text-xs text-gray-600 px-3.5 py-2.5 bg-[#110195]/5 rounded-xl border border-[#110195]/10 gap-2">
            <span className="inline-flex items-center gap-1.5">
              <MapPin className="w-3.5 h-3.5 text-[#110195] shrink-0" />
              <span>
                {formatPosition(position.latitude, position.longitude).latitude},{' '}
                {formatPosition(position.latitude, position.longitude).longitude}
              </span>
            </span>
            <span className="inline-flex items-center gap-1.5 font-medium text-gray-800">
              <span>Distance: {liveDistance}m</span>
              {liveDistance !== null && liveDistance <= targetRadius ? (
                <span className="inline-flex items-center gap-1 text-emerald-700 font-semibold bg-emerald-50 px-2 py-0.5 rounded-md border border-emerald-200">
                  <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600 shrink-0" />
                  Within radius
                </span>
              ) : (
                <span className="inline-flex items-center gap-1 text-amber-700 font-semibold bg-amber-50 px-2 py-0.5 rounded-md border border-amber-200">
                  <AlertTriangle className="w-3.5 h-3.5 text-amber-600 shrink-0" />
                  Outside radius
                </span>
              )}
            </span>
          </div>
        )}
      </div>

      {feedback && (
        <div
          className={`p-4 rounded-2xl border text-sm font-medium transition-all duration-300 flex flex-col sm:flex-row sm:items-center justify-between gap-3 ${
            feedback.type === 'success'
              ? 'bg-green-50 border-green-200 text-green-800 shadow-sm'
              : feedback.type === 'error'
              ? 'bg-red-50 border-red-200 text-red-800 shadow-sm'
              : 'bg-amber-50 border-amber-200 text-amber-800 shadow-sm'
          }`}
        >
          <div className="flex items-start gap-3 min-w-0">
            <div className="shrink-0 mt-0.5">
              {feedback.type === 'success' ? (
                <CheckCircle2 className="w-5 h-5 text-emerald-600" />
              ) : feedback.type === 'error' ? (
                <AlertCircle className="w-5 h-5 text-red-600" />
              ) : (
                <Info className="w-5 h-5 text-amber-600" />
              )}
            </div>
            <p className="leading-snug">{feedback.message}</p>
          </div>
          <button
            onClick={() => setFeedback(null)}
            className="text-gray-400 hover:text-gray-700 p-1 rounded-lg hover:bg-black/5 self-end sm:self-center transition-colors"
            aria-label="Close"
          >
            <X className="w-4 h-4" />
          </button>
        </div>
      )}

      {!isOnline && (
        <div className="p-4 rounded-2xl bg-amber-500/10 border border-amber-500/30 text-amber-950 flex items-center gap-3.5 shadow-sm">
          <div className="w-9 h-9 rounded-xl bg-amber-500/20 flex items-center justify-center shrink-0 text-amber-900">
            <WifiOff className="w-5 h-5" />
          </div>
          <div className="min-w-0">
            <p className="font-bold text-sm text-amber-950">You are currently offline</p>
            <p className="text-xs text-amber-800/90 mt-0.5 leading-relaxed">
              Clocking in and out requires an active internet connection to authenticate and verify GPS location. Please reconnect to continue.
            </p>
          </div>
        </div>
      )}

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 sm:gap-6">
        <button
          onClick={handleClockIn}
          disabled={loading || !canClockIn || !isOnline || !isWorkingDay()}
          className={`w-full py-6 px-8 rounded-2xl font-bold text-xl transition-all duration-300 shadow-md hover:shadow-lg active:scale-[0.98] flex items-center justify-center gap-3 ${
            !isOnline
              ? 'bg-gray-200 text-gray-400 cursor-not-allowed border border-gray-300/40'
              : !isWorkingDay()
              ? 'bg-gray-200 text-gray-400 cursor-not-allowed border border-gray-300/40'
              : loading && isPointing === 'arrival'
              ? 'bg-gray-300 text-gray-600 cursor-not-allowed'
              : !canClockIn && (todayPointage?.clock_in_time || todayPointage?.heure_arrivee)
              ? 'bg-gray-200 text-gray-500 cursor-not-allowed'
              : 'bg-[#110195] text-white hover:bg-[#1a02d4]'
          }`}
        >
          {!isOnline ? (
            <>
              <WifiOff className="w-6 h-6 text-gray-400" />
              <span>Offline</span>
            </>
          ) : !isWorkingDay() ? (
            <>
              <Clock className="w-6 h-6 text-gray-400" />
              <span>Rest Day</span>
            </>
          ) : loading && isPointing === 'arrival' ? (
            <>
              <Loader2 className="w-6 h-6 animate-spin" />
              <span>Saving...</span>
            </>
          ) : !canClockIn && (todayPointage?.clock_in_time || todayPointage?.heure_arrivee) ? (
            <>
              <CheckCircle2 className="w-6 h-6 text-emerald-600" />
              <span>Clock In recorded</span>
            </>
          ) : (
            <>
              <LogIn className="w-6 h-6" />
              <span>Clock In</span>
            </>
          )}
        </button>

        <button
          onClick={handleClockOut}
          disabled={loading || !canClockOut || !isOnline || !isWorkingDay()}
          className={`w-full py-6 px-8 rounded-2xl font-bold text-xl transition-all duration-300 shadow-md hover:shadow-lg active:scale-[0.98] flex items-center justify-center gap-3 ${
            !isOnline
              ? 'bg-gray-200 text-gray-400 cursor-not-allowed border border-gray-300/40'
              : !isWorkingDay()
              ? 'bg-gray-200 text-gray-400 cursor-not-allowed border border-gray-300/40'
              : loading && isPointing === 'departure'
              ? 'bg-gray-300 text-gray-600 cursor-not-allowed'
              : !canClockOut && (todayPointage?.clock_out_time || todayPointage?.heure_depart)
              ? 'bg-gray-200 text-gray-500 cursor-not-allowed'
              : 'bg-[#FC9905] text-white hover:bg-[#e68a00]'
          }`}
        >
          {!isOnline ? (
            <>
              <WifiOff className="w-6 h-6 text-gray-400" />
              <span>Offline</span>
            </>
          ) : !isWorkingDay() ? (
            <>
              <Clock className="w-6 h-6 text-gray-400" />
              <span>Rest Day</span>
            </>
          ) : loading && isPointing === 'departure' ? (
            <>
              <Loader2 className="w-6 h-6 animate-spin" />
              <span>Saving...</span>
            </>
          ) : !canClockOut && (todayPointage?.clock_out_time || todayPointage?.heure_depart) ? (
            <>
              <CheckCircle2 className="w-6 h-6 text-gray-500" />
              <span>Clock Out recorded</span>
            </>
          ) : (
            <>
              <LogOut className="w-6 h-6" />
              <span>Clock Out</span>
            </>
          )}
        </button>
      </div>

      {!isWorkingDay() && (
        <div className="text-center text-gray-500 text-sm mt-2">
          Aujourd'hui est un jour de repos
        </div>
      )}

      <div className="pt-4">
        <GlassCard className="!p-5 sm:!p-6 border border-[#110195]/10">
          <h3 className="text-base font-serif font-bold text-gray-900 mb-4 flex items-center gap-2.5">
            <Calendar className="w-5 h-5 text-[#110195]" />
            <span>Today</span>
          </h3>
          <div className="grid grid-cols-3 gap-2 sm:gap-4 text-center">
            <div className="bg-[#110195]/5 p-2.5 sm:p-3 rounded-xl border border-[#110195]/10">
              <div className="flex items-center justify-center gap-1 text-[10px] sm:text-xs text-gray-500 font-medium uppercase tracking-wider">
                <LogIn className="w-3 h-3 sm:w-3.5 sm:h-3.5 text-gray-400 shrink-0" />
                <span>Clock In</span>
              </div>
              <span className="block text-base sm:text-xl font-bold text-gray-900 mt-1 font-mono">
                {todayPointage?.clock_in_time || todayPointage?.heure_arrivee
                  ? formatTime(todayPointage?.clock_in_time || todayPointage?.heure_arrivee)
                  : '--:--'}
              </span>
            </div>
            <div className="bg-[#110195]/5 p-2.5 sm:p-3 rounded-xl border border-[#110195]/10">
              <div className="flex items-center justify-center gap-1 text-[10px] sm:text-xs text-gray-500 font-medium uppercase tracking-wider">
                <LogOut className="w-3 h-3 sm:w-3.5 sm:h-3.5 text-gray-400 shrink-0" />
                <span>Clock Out</span>
              </div>
              <span className="block text-base sm:text-xl font-bold text-gray-900 mt-1 font-mono">
                {todayPointage?.clock_out_time || todayPointage?.heure_depart
                  ? formatTime(todayPointage?.clock_out_time || todayPointage?.heure_depart)
                  : '--:--'}
              </span>
            </div>
            <div className="bg-[#FC9905]/10 p-2.5 sm:p-3 rounded-xl border border-[#FC9905]/20">
              <div className="flex items-center justify-center gap-1 text-[10px] sm:text-xs text-[#FC9905] font-semibold uppercase tracking-wider">
                <Timer className="w-3 h-3 sm:w-3.5 sm:h-3.5 text-[#FC9905] shrink-0" />
                <span>Duration</span>
              </div>
              <span className="block text-base sm:text-xl font-bold text-gray-900 mt-1 font-mono truncate">
                {displayDuration()}
              </span>
            </div>
          </div>
        </GlassCard>
      </div>

      <ConfirmationModal
        isOpen={showModal}
        onClose={() => {
          if (!isConfirming) {
            setShowModal(false);
          }
        }}
        onConfirm={handleConfirm}
        type={modalType}
        position={modalPosition}
        distance={modalDistance}
        isInZone={modalIsInZone}
        targetRadius={targetRadius}
        agentHeureDebut={heure_debut}
        agentHeureFin={heure_fin}
        isLoading={isConfirming}
      />
    </div>
  );
}

export default Dashboard;