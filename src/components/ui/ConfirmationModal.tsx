import React, { useEffect, useRef, useState } from 'react';
import {
  X,
  Clock,
  CheckCircle2,
  XCircle,
  AlertCircle,
  AlertTriangle,
  ShieldAlert,
  Loader2,
  HelpCircle,
} from 'lucide-react';
import { calculatePunctuality, formatTime24h } from '../../utils/timeHelpers';

export interface ConfirmationModalProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: () => void;
  type: 'arrival' | 'departure';
  position: { latitude: number; longitude: number; accuracy: number } | null;
  distance: number | null;
  isInZone: boolean;
  targetRadius: number;
  agentHeureDebut?: string | null;
  agentHeureFin?: string | null;
  isLoading?: boolean;
}

export function ConfirmationModal({
  isOpen,
  onClose,
  onConfirm,
  type,
  position,
  distance,
  isInZone,
  targetRadius,
  agentHeureDebut,
  isLoading = false,
}: ConfirmationModalProps) {
  const modalRef = useRef<HTMLDivElement>(null);
  const [modalTime, setModalTime] = useState<string>(() => formatTime24h());

  // Actualiser l'heure chaque seconde quand la modale est ouverte
  useEffect(() => {
    if (!isOpen) return;
    setModalTime(formatTime24h());
    const interval = setInterval(() => {
      setModalTime(formatTime24h());
    }, 1000);
    return () => clearInterval(interval);
  }, [isOpen]);

  // Fermer avec la touche Échap
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && isOpen && !isLoading) {
        onClose();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, isLoading, onClose]);

  // Verrouiller le défilement de la page en arrière-plan (version robuste mobile)
  useEffect(() => {
    if (isOpen) {
      // Empêcher le scroll sur le body
      document.body.style.overflow = 'hidden';
      document.body.style.position = 'fixed';
      document.body.style.width = '100%';
      document.body.style.top = `-${window.scrollY}px`;
      // Sauvegarder la position de scroll pour la restaurer
      const scrollY = window.scrollY;
      document.body.dataset.scrollY = String(scrollY);
    } else {
      // Restaurer le scroll
      document.body.style.overflow = '';
      document.body.style.position = '';
      document.body.style.width = '';
      const scrollY = parseInt(document.body.dataset.scrollY || '0', 10);
      document.body.style.top = '';
      window.scrollTo(0, scrollY);
      delete document.body.dataset.scrollY;
    }
    return () => {
      document.body.style.overflow = '';
      document.body.style.position = '';
      document.body.style.width = '';
      const scrollY = parseInt(document.body.dataset.scrollY || '0', 10);
      document.body.style.top = '';
      window.scrollTo(0, scrollY);
      delete document.body.dataset.scrollY;
    };
  }, [isOpen]);

  if (!isOpen) return null;

  const isArrival = type === 'arrival';

  // Calcul de la ponctualité uniquement pour l'arrivée
  const punctuality = isArrival ? calculatePunctuality(agentHeureDebut) : null;

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-labelledby="modal-title"
      className="fixed inset-0 z-50 flex items-center justify-center p-4 sm:p-6 bg-black/50 backdrop-blur-sm animate-fadeIn overscroll-contain touch-none"
      onClick={(e) => {
        if (e.target === e.currentTarget && !isLoading) onClose();
      }}
    >
      <div
        ref={modalRef}
        className="w-full max-w-lg rounded-3xl bg-white border border-gray-200 shadow-2xl p-6 sm:p-8 animate-scaleUp relative overflow-y-auto max-h-[90vh]"
      >
        {/* En-tête de la modale */}
        <div className="flex items-start justify-between mb-6 relative z-10">
          <div>
            <h2 id="modal-title" className="text-xl sm:text-2xl font-serif font-bold text-[#110195] tracking-tight">
              {isArrival ? "Confirmation d'arrivée" : 'Confirmation de départ'}
            </h2>
            <p className="text-xs sm:text-sm text-gray-500 mt-1">
              Vérifiez les informations avant de valider
            </p>
          </div>
          <button
            onClick={onClose}
            disabled={isLoading}
            className="text-gray-400 hover:text-gray-700 transition-colors p-1.5 rounded-xl hover:bg-gray-100 disabled:opacity-40"
            aria-label="Fermer la modale"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Liste des détails */}
        <div className="space-y-3 relative z-10">
          {/* 1. Heure actuelle */}
          <div className="flex items-center justify-between p-3.5 rounded-2xl bg-gray-50 border border-gray-200">
            <div className="flex items-center gap-3">
              <div className="w-9 h-9 rounded-xl bg-[#110195]/10 border border-[#110195]/20 flex items-center justify-center shrink-0">
                <Clock className="w-4 h-4 text-[#110195]" />
              </div>
              <div>
                <span className="text-[11px] font-medium uppercase tracking-wider text-gray-500 block">
                  Heure actuelle
                </span>
                <span className="text-base sm:text-lg font-bold font-mono text-gray-900 tracking-wider">
                  {modalTime}
                </span>
              </div>
            </div>
            <span className="text-xs font-mono text-gray-400 bg-gray-100 px-2 py-1 rounded-lg border border-gray-200">
              Live
            </span>
          </div>

          {/* 2. Statut zone */}
          <div
            className={`flex items-center justify-between p-3.5 rounded-2xl border transition-colors ${
              isInZone
                ? 'bg-emerald-50 border-emerald-200'
                : 'bg-red-50 border-red-200'
            }`}
          >
            <div className="flex items-center gap-3">
              <div
                className={`w-9 h-9 rounded-xl flex items-center justify-center shrink-0 ${
                  isInZone
                    ? 'bg-emerald-100 text-emerald-600 border border-emerald-300'
                    : 'bg-red-100 text-red-600 border border-red-300'
                }`}
              >
                {isInZone ? (
                  <CheckCircle2 className="w-5 h-5" />
                ) : (
                  <XCircle className="w-5 h-5" />
                )}
              </div>
              <div>
                <span className="text-[11px] font-medium uppercase tracking-wider text-gray-500 block">
                  Statut de la zone
                </span>
                <span
                  className={`text-xs sm:text-sm font-semibold ${
                    isInZone ? 'text-emerald-700' : 'text-red-700'
                  }`}
                >
                  {isInZone
                    ? `Dans le rayon autorisé (${targetRadius}m)`
                    : `Hors zone (${distance || 0}m > ${targetRadius}m)`}
                </span>
              </div>
            </div>
            <span
              className={`text-[11px] font-bold px-2.5 py-1 rounded-lg border uppercase ${
                isInZone
                  ? 'bg-emerald-100 text-emerald-700 border-emerald-300'
                  : 'bg-red-100 text-red-700 border-red-300'
              }`}
            >
              {isInZone ? 'Conforme' : 'Non autorisé'}
            </span>
          </div>

          {/* 3. Ponctualité (UNIQUEMENT pour ARRIVÉE) */}
          {isArrival && punctuality && (
            <div
              className={`flex items-center justify-between p-3.5 rounded-2xl border transition-colors ${
                punctuality.status === 'ON_TIME'
                  ? 'bg-emerald-50 border-emerald-200'
                  : punctuality.status === 'EARLY'
                  ? 'bg-amber-50 border-amber-200'
                  : punctuality.status === 'LATE'
                  ? 'bg-red-50 border-red-200'
                  : 'bg-gray-50 border-gray-200'
              }`}
            >
              <div className="flex items-center gap-3">
                <div
                  className={`w-9 h-9 rounded-xl flex items-center justify-center shrink-0 ${
                    punctuality.status === 'ON_TIME'
                      ? 'bg-emerald-100 text-emerald-600 border border-emerald-300'
                      : punctuality.status === 'EARLY'
                      ? 'bg-amber-100 text-amber-600 border border-amber-300'
                      : punctuality.status === 'LATE'
                      ? 'bg-red-100 text-red-600 border border-red-300'
                      : 'bg-gray-100 text-gray-400 border border-gray-300'
                  }`}
                >
                  {punctuality.status === 'ON_TIME' ? (
                    <CheckCircle2 className="w-5 h-5" />
                  ) : punctuality.status === 'EARLY' ? (
                    <AlertTriangle className="w-5 h-5" />
                  ) : punctuality.status === 'LATE' ? (
                    <AlertCircle className="w-5 h-5" />
                  ) : (
                    <HelpCircle className="w-5 h-5" />
                  )}
                </div>
                <div>
                  <span className="text-[11px] font-medium uppercase tracking-wider text-gray-500 block">
                    Statut ponctualité
                  </span>
                  <span
                    className={`text-xs sm:text-sm font-semibold ${
                      punctuality.status === 'ON_TIME'
                        ? 'text-emerald-700'
                        : punctuality.status === 'EARLY'
                        ? 'text-amber-700'
                        : punctuality.status === 'LATE'
                        ? 'text-red-700'
                        : 'text-gray-500'
                    }`}
                  >
                    {punctuality.label}
                  </span>
                </div>
              </div>

              {punctuality.expectedTime && (
                <span className="text-xs font-mono text-gray-500 bg-gray-100 px-2 py-1 rounded-lg border border-gray-200">
                  Prévu: {punctuality.expectedTime}
                </span>
              )}
            </div>
          )}
        </div>

        {/* Boutons d'action */}
        <div className="flex gap-3 sm:gap-4 mt-6 sm:mt-8 relative z-10">
          {/* Bouton NON (Annuler) */}
          <button
            type="button"
            onClick={onClose}
            disabled={isLoading}
            className="flex-1 py-3.5 px-4 rounded-2xl font-bold text-white text-sm sm:text-base bg-[#110195] hover:bg-[#1a02d4] transition-all duration-200 shadow-md hover:shadow-lg active:scale-[0.98] disabled:opacity-50 cursor-pointer text-center"
          >
            NON
          </button>

          {/* Bouton OUI (Valider) */}
          <button
            type="button"
            onClick={onConfirm}
            disabled={!isInZone || isLoading}
            className={`flex-1 py-3.5 px-4 rounded-2xl font-bold text-white text-sm sm:text-base transition-all duration-200 shadow-md hover:shadow-lg active:scale-[0.98] text-center flex items-center justify-center gap-2 ${
              isInZone && !isLoading
                ? 'bg-[#FC9905] hover:bg-[#e68a00] cursor-pointer'
                : 'bg-gray-300 text-gray-500 cursor-not-allowed shadow-none'
            }`}
          >
            {isLoading ? (
              <>
                <Loader2 className="w-5 h-5 animate-spin" />
                <span>Envoi...</span>
              </>
            ) : (
              <span>OUI</span>
            )}
          </button>
        </div>

        {/* Message d'avertissement quand hors zone */}
        {!isInZone && (
          <div className="mt-4 p-3 rounded-2xl bg-red-50 border border-red-200 flex items-center gap-2.5 text-xs text-red-700 relative z-10 animate-fadeIn">
            <ShieldAlert className="w-4 h-4 text-red-500 shrink-0" />
            <span>
              Position hors zone autorisée. Rapprochez-vous à moins de {targetRadius}m du call center pour valider votre pointage.
            </span>
          </div>
        )}
      </div>
    </div>
  );
}

export default ConfirmationModal;