import React, { useState, useEffect, useRef } from 'react';
import {
  X,
  KeyRound,
  Eye,
  EyeOff,
  Copy,
  Check,
  CheckCircle2,
  AlertCircle,
  Loader2,
  ShieldCheck,
} from 'lucide-react';
import { useAuth } from '../../contexts/AuthContext';
import { supabase } from '../../services/supabase';

interface ChangePasswordModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export function ChangePasswordModal({ isOpen, onClose }: ChangePasswordModalProps) {
  const { user, agent, updatePassword } = useAuth();
  const modalRef = useRef<HTMLDivElement>(null);

  const [currentPassword, setCurrentPassword] = useState<string>('');
  const [loadingCurrent, setLoadingCurrent] = useState<boolean>(false);
  const [showCurrentPassword, setShowCurrentPassword] = useState<boolean>(false);
  const [copied, setCopied] = useState<boolean>(false);

  const [newPassword, setNewPassword] = useState<string>('');
  const [confirmPassword, setConfirmPassword] = useState<string>('');
  const [showNewPassword, setShowNewPassword] = useState<boolean>(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState<boolean>(false);

  const [isSubmitting, setIsSubmitting] = useState<boolean>(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);

  // Charger le mot de passe actuel directement depuis la table agents à l'ouverture
  useEffect(() => {
    if (!isOpen) return;

    // Réinitialiser les champs et messages
    setNewPassword('');
    setConfirmPassword('');
    setErrorMsg(null);
    setSuccessMsg(null);
    setCopied(false);
    setShowCurrentPassword(false);
    setShowNewPassword(false);
    setShowConfirmPassword(false);

    const fetchCurrentPassword = async () => {
      const targetId = agent?.id || user?.id;
      if (!targetId) return;

      setLoadingCurrent(true);
      try {
        const { data, error } = await supabase
          .from('agents')
          .select('password')
          .eq('id', targetId)
          .single();

        if (error) {
          console.warn('Impossible de récupérer le mot de passe actuel:', error);
          if (agent?.password) {
            setCurrentPassword(String(agent.password));
          }
        } else if (data?.password) {
          setCurrentPassword(String(data.password));
        } else if (agent?.password) {
          setCurrentPassword(String(agent.password));
        } else {
          setCurrentPassword('');
        }
      } catch (err) {
        console.warn('Erreur fetch password:', err);
        if (agent?.password) {
          setCurrentPassword(String(agent.password));
        }
      } finally {
        setLoadingCurrent(false);
      }
    };

    fetchCurrentPassword();
  }, [isOpen, agent, user]);

  // Fermer avec la touche Échap
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && isOpen && !isSubmitting) {
        onClose();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, isSubmitting, onClose]);

  // Verrouiller le scroll sur le body (version robuste mobile)
  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = 'hidden';
      document.body.style.position = 'fixed';
      document.body.style.width = '100%';
      document.body.style.top = `-${window.scrollY}px`;
      const scrollY = window.scrollY;
      document.body.dataset.scrollY = String(scrollY);
    } else {
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

  const handleCopyCurrentPassword = async () => {
    if (!currentPassword) return;
    try {
      await navigator.clipboard.writeText(currentPassword);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch (err) {
      console.error('Erreur copie presse-papier:', err);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg(null);
    setSuccessMsg(null);

    if (!newPassword) {
      setErrorMsg('Veuillez saisir un nouveau mot de passe.');
      return;
    }

    if (newPassword.length < 6) {
      setErrorMsg('Le nouveau mot de passe doit comporter au moins 6 caractères.');
      return;
    }

    if (newPassword !== confirmPassword) {
      setErrorMsg('Les deux mots de passe ne correspondent pas.');
      return;
    }

    setIsSubmitting(true);
    try {
      const result = await updatePassword(newPassword);

      if (result.success) {
        setCurrentPassword(newPassword);
        setNewPassword('');
        setConfirmPassword('');
        setSuccessMsg('Votre mot de passe a été modifié avec succès dans votre authentification et votre fiche agent !');
      } else {
        setErrorMsg(result.error || 'Erreur lors de la modification du mot de passe.');
      }
    } catch (err: any) {
      setErrorMsg(err?.message || 'Une erreur inattendue est survenue.');
    } finally {
      setIsSubmitting(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-labelledby="change-password-title"
      className="fixed inset-0 z-[100] flex items-center justify-center p-4 sm:p-6 bg-black/50 backdrop-blur-sm animate-fadeIn overscroll-contain"
      onClick={(e) => {
        if (e.target === e.currentTarget && !isSubmitting) onClose();
      }}
    >
      <div
        ref={modalRef}
        className="w-full max-w-md rounded-3xl bg-white border border-gray-200 shadow-2xl p-6 sm:p-7 animate-scaleUp relative overflow-y-auto max-h-[92vh]"
      >
        {/* En-tête */}
        <div className="flex items-start justify-between mb-5 relative z-10">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-[#110195]/10 border border-[#110195]/20 flex items-center justify-center shrink-0 shadow-xs">
              <KeyRound className="w-5 h-5 text-[#110195]" />
            </div>
            <div>
              <h2
                id="change-password-title"
                className="text-lg sm:text-xl font-serif font-bold text-[#110195] tracking-tight"
              >
                Changer mot de passe
              </h2>
              <p className="text-xs text-gray-500 mt-0.5">
                Authentification & profil agent
              </p>
            </div>
          </div>

          <button
            onClick={onClose}
            disabled={isSubmitting}
            className="text-gray-400 hover:text-gray-700 transition-colors p-1.5 rounded-xl hover:bg-gray-100 disabled:opacity-40"
            aria-label="Fermer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Message de succès */}
        {successMsg && (
          <div className="mb-5 p-3.5 rounded-2xl bg-emerald-50 border border-emerald-200 flex items-start gap-2.5 text-xs text-emerald-800 animate-fadeIn">
            <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0 mt-0.5" />
            <div className="flex-1 font-medium">{successMsg}</div>
          </div>
        )}

        {/* Message d'erreur */}
        {errorMsg && (
          <div className="mb-5 p-3.5 rounded-2xl bg-red-50 border border-red-200 flex items-start gap-2.5 text-xs text-red-700 animate-fadeIn">
            <AlertCircle className="w-4 h-4 text-red-500 shrink-0 mt-0.5" />
            <div className="flex-1 font-medium">{errorMsg}</div>
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          {/* Section 1 : Mot de passe actuel (lu depuis la table agents) */}
          <div className="p-3.5 rounded-2xl bg-[#110195]/5 border border-[#110195]/15">
            <div className="flex items-center justify-between mb-1.5">
              <label className="text-xs font-semibold text-gray-700 flex items-center gap-1.5">
                <ShieldCheck className="w-3.5 h-3.5 text-[#FC9905]" />
                Mot de passe actuel
              </label>
              {currentPassword && (
                <button
                  type="button"
                  onClick={handleCopyCurrentPassword}
                  className="text-[11px] text-[#110195] hover:text-[#FC9905] font-medium flex items-center gap-1 transition-colors"
                  title="Copier le mot de passe actuel"
                >
                  {copied ? (
                    <>
                      <Check className="w-3 h-3 text-emerald-600" />
                      <span className="text-emerald-600 font-semibold">Copié !</span>
                    </>
                  ) : (
                    <>
                      <Copy className="w-3 h-3" />
                      <span>Copier</span>
                    </>
                  )}
                </button>
              )}
            </div>

            <div className="relative flex items-center">
              {loadingCurrent ? (
                <div className="w-full py-2.5 px-3 rounded-xl bg-white/80 border border-gray-200 text-xs text-gray-400 flex items-center gap-2">
                  <Loader2 className="w-3.5 h-3.5 animate-spin text-[#110195]" />
                  <span>Chargement du mot de passe...</span>
                </div>
              ) : currentPassword ? (
                <div className="w-full flex items-center justify-between py-2 px-3 rounded-xl bg-white border border-gray-200 shadow-xs">
                  <span className="font-mono text-sm tracking-wider text-gray-800 select-all break-all">
                    {showCurrentPassword ? currentPassword : '•'.repeat(Math.min(currentPassword.length || 8, 14))}
                  </span>
                  <button
                    type="button"
                    onClick={() => setShowCurrentPassword(!showCurrentPassword)}
                    className="p-1 rounded-lg text-gray-400 hover:text-gray-700 hover:bg-gray-100 transition-colors ml-2 shrink-0"
                    title={showCurrentPassword ? 'Masquer' : 'Afficher'}
                    aria-label={showCurrentPassword ? 'Masquer le mot de passe actuel' : 'Afficher le mot de passe actuel'}
                  >
                    {showCurrentPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>
              ) : (
                <div className="w-full py-2 px-3 rounded-xl bg-white/60 border border-gray-200 text-xs text-gray-400 italic">
                  Non configuré dans la table agent
                </div>
              )}
            </div>
            <p className="text-[11px] text-gray-400 mt-1.5">
              Enregistré dans la colonne password de votre profil agent.
            </p>
          </div>

          {/* Section 2 : Nouveau mot de passe */}
          <div>
            <label className="block text-xs font-semibold text-gray-700 mb-1.5">
              Nouveau mot de passe
            </label>
            <div className="relative">
              <input
                type={showNewPassword ? 'text' : 'password'}
                value={newPassword}
                onChange={(e) => setNewPassword(e.target.value)}
                placeholder="Au moins 6 caractères"
                disabled={isSubmitting}
                className="w-full py-2.5 px-3.5 pr-10 rounded-xl border border-gray-200 bg-gray-50/50 text-sm text-gray-900 placeholder:text-gray-400 focus:outline-none focus:ring-2 focus:ring-[#110195]/20 focus:border-[#110195] transition-all disabled:opacity-60"
              />
              <button
                type="button"
                onClick={() => setShowNewPassword(!showNewPassword)}
                className="absolute right-2.5 top-1/2 -translate-y-1/2 p-1 text-gray-400 hover:text-gray-700 transition-colors"
                title={showNewPassword ? 'Masquer' : 'Afficher'}
              >
                {showNewPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
              </button>
            </div>
            {newPassword && newPassword.length < 6 && (
              <p className="text-[11px] text-amber-600 mt-1 font-medium">
                ⚠️ Minimum 6 caractères requis.
              </p>
            )}
          </div>

          {/* Section 3 : Confirmer le nouveau mot de passe */}
          <div>
            <label className="block text-xs font-semibold text-gray-700 mb-1.5">
              Confirmer le nouveau mot de passe
            </label>
            <div className="relative">
              <input
                type={showConfirmPassword ? 'text' : 'password'}
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                placeholder="Répétez le nouveau mot de passe"
                disabled={isSubmitting}
                className="w-full py-2.5 px-3.5 pr-10 rounded-xl border border-gray-200 bg-gray-50/50 text-sm text-gray-900 placeholder:text-gray-400 focus:outline-none focus:ring-2 focus:ring-[#110195]/20 focus:border-[#110195] transition-all disabled:opacity-60"
              />
              <button
                type="button"
                onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                className="absolute right-2.5 top-1/2 -translate-y-1/2 p-1 text-gray-400 hover:text-gray-700 transition-colors"
                title={showConfirmPassword ? 'Masquer' : 'Afficher'}
              >
                {showConfirmPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
              </button>
            </div>
            {confirmPassword && newPassword !== confirmPassword && (
              <p className="text-[11px] text-red-500 mt-1 font-medium">
                Les mots de passe ne correspondent pas.
              </p>
            )}
            {confirmPassword && newPassword === confirmPassword && newPassword.length >= 6 && (
              <p className="text-[11px] text-emerald-600 mt-1 font-medium flex items-center gap-1">
                <Check className="w-3 h-3" />
                Les mots de passe correspondent parfaitement.
              </p>
            )}
          </div>

          {/* Boutons d'action */}
          <div className="flex gap-3 pt-3">
            <button
              type="button"
              onClick={onClose}
              disabled={isSubmitting}
              className="flex-1 py-3 px-4 rounded-xl font-semibold text-gray-700 text-sm bg-gray-100 hover:bg-gray-200 transition-all active:scale-[0.98] disabled:opacity-50 text-center"
            >
              {successMsg ? 'Fermer' : 'Annuler'}
            </button>

            <button
              type="submit"
              disabled={
                isSubmitting ||
                !newPassword ||
                newPassword.length < 6 ||
                newPassword !== confirmPassword
              }
              className="flex-1 py-3 px-4 rounded-xl font-bold text-white text-sm bg-[#FC9905] hover:bg-[#e68a00] transition-all shadow-md hover:shadow-lg active:scale-[0.98] disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2 text-center"
            >
              {isSubmitting ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  <span>Enregistrement...</span>
                </>
              ) : (
                <span>Enregistrer</span>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

export default ChangePasswordModal;
