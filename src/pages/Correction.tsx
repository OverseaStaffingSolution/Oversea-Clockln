import React, { useState, useEffect, useCallback } from 'react';
import {
  Calendar,
  Clock,
  FileText,
  FileEdit,
  PenLine,
  ListChecks,
  LogIn,
  LogOut,
  Send,
  RefreshCw,
  Inbox,
  MessageSquare,
  CheckCircle2,
  XCircle,
  AlertCircle,
  X,
  Loader2,
  Sparkles,
  WifiOff
} from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';
import { supabase } from '../services/supabase';
import { formatDate, formatTime } from '../utils/dateHelpers';
import { GlassCard } from '../components/ui/GlassCard';
import { Button } from '../components/ui/Button';
import { useOnlineStatus } from '../hooks/useOnlineStatus';
import { cacheService } from '../services/cacheService';

export interface CorrectionRecord {
  id?: string | number;
  agent_id: string;
  date: string;
  type: 'IN' | 'OUT' | string;
  heure_souhaitee?: string;
  heure?: string;
  raison: string;
  statut: 'EN_ATTENTE' | 'APPROUVEE' | 'REJETEE' | string;
  commentaire_manager?: string | null;
  created_at?: string;
  [key: string]: any;
}

export function Correction() {
  const { user, agent } = useAuth();
  const isOnline = useOnlineStatus();
  const effectiveAgentId = agent?.id || user?.id;

  // Navigation par vue (Formulaire / Liste)
  const [activeView, setActiveView] = useState<'form' | 'list'>('form');

  const [loading, setLoading] = useState<boolean>(true);
  const [submitting, setSubmitting] = useState<boolean>(false);
  const [corrections, setCorrections] = useState<CorrectionRecord[]>([]);
  const [activeTab, setActiveTab] = useState<'EN_ATTENTE' | 'APPROUVEE' | 'REJETEE'>('EN_ATTENTE');

  const todayStr = new Date().toISOString().split('T')[0];
  const minDateStr = (() => {
    const d = new Date();
    d.setDate(d.getDate() - 7);
    return d.toISOString().split('T')[0];
  })();

  const [form, setForm] = useState({
    date: todayStr,
    type: 'IN' as 'IN' | 'OUT',
    heure: '08:00',
    raison: ''
  });

  const [formErrors, setFormErrors] = useState<Record<string, string>>({});
  const [toast, setToast] = useState<{ message: string; type: 'success' | 'error' | 'info' } | null>(null);

  /**
   * Afficher un message toast avec auto-fermeture
   */
  const showToast = useCallback((message: string, type: 'success' | 'error' | 'info' = 'info') => {
    setToast({ message, type });
    const timer = setTimeout(() => {
      setToast(null);
    }, 5000);
    return () => clearTimeout(timer);
  }, []);

  /**
   * Charger les demandes de correction depuis Supabase avec cache instantané
   */
  const loadCorrections = useCallback(async () => {
    if (!effectiveAgentId) {
      setLoading(false);
      return;
    }

    const cacheKey = `corrections_${effectiveAgentId}`;
    const cached = cacheService.get<CorrectionRecord[]>(cacheKey);
    if (cached) {
      setCorrections(cached);
      setLoading(false);
    } else {
      setLoading(true);
    }

    try {
      const { data, error } = await supabase
        .from('corrections')
        .select('*')
        .eq('agent_id', effectiveAgentId)
        .order('created_at', { ascending: false });

      if (error) {
        console.warn('Erreur chargement corrections:', error);
      }
      if (data) {
        setCorrections(data);
        cacheService.set(cacheKey, data, 10, true);
      }
    } catch (err: any) {
      console.error('Exception chargement corrections:', err);
      if (!cached) {
        showToast('Error loading correction requests', 'error');
      }
    } finally {
      setLoading(false);
    }
  }, [effectiveAgentId, showToast]);

  useEffect(() => {
    loadCorrections();
  }, [loadCorrections]);

  // Filtrer les corrections par statut
  const getFilteredCorrections = (statut: 'EN_ATTENTE' | 'APPROUVEE' | 'REJETEE') => {
    return corrections.filter(c => c.statut === statut);
  };

  // Gérer les changements de champs du formulaire
  const handleFormChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>
  ) => {
    const { name, value } = e.target;
    setForm(prev => ({ ...prev, [name]: value }));
    if (formErrors[name]) {
      setFormErrors(prev => ({ ...prev, [name]: '' }));
    }
  };

  // Valider le formulaire
  const validateForm = () => {
    const errors: Record<string, string> = {};
    if (!form.date) {
      errors.date = 'Date is required';
    } else if (form.date > todayStr) {
      errors.date = 'Date cannot be in the future';
    } else if (form.date < minDateStr) {
      errors.date = 'Correction is limited to the last 7 business days';
    }

    if (!form.type) {
      errors.type = 'Record type is required';
    }

    if (!form.heure) {
      errors.heure = 'Time is required';
    }

    if (!form.raison || form.raison.trim().length < 10) {
      errors.raison = 'Reason must be at least 10 characters';
    }

    setFormErrors(errors);
    return Object.keys(errors).length === 0;
  };

  // Soumettre la demande
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!isOnline) {
      showToast('You are currently offline. Please reconnect to submit a correction request.', 'error');
      return;
    }
    if (!validateForm()) return;
    if (!effectiveAgentId) {
      showToast('Agent session not found. Please log in again.', 'error');
      return;
    }

    setSubmitting(true);
    try {
      const { error } = await supabase
        .from('corrections')
        .insert({
          agent_id: effectiveAgentId,
          date: form.date,
          type: form.type,
          heure_souhaitee: form.heure,
          raison: form.raison.trim(),
          statut: 'EN_ATTENTE'
        });

      if (error) {
        throw error;
      }

      showToast('Correction request submitted successfully', 'success');

      cacheService.remove(`corrections_${effectiveAgentId}`);
      cacheService.invalidatePattern(`historique_${effectiveAgentId}`);

      setForm({
        date: todayStr,
        type: 'IN',
        heure: '08:00',
        raison: ''
      });
      setFormErrors({});

      await loadCorrections();
      setActiveTab('EN_ATTENTE');
      setActiveView('list');
    } catch (err: any) {
      console.error('Erreur soumission correction:', err);
      showToast(err.message ? `Error: ${err.message}` : 'Failed to submit request', 'error');
    } finally {
      setSubmitting(false);
    }
  };

  // Rendu visuel du statut avec icônes professionnelles
  const renderStatusBadge = (statut: string) => {
    const config: Record<
      string,
      { label: string; icon: React.ReactNode; color: string; bg: string; border: string }
    > = {
      EN_ATTENTE: {
        label: 'Pending',
        icon: <Clock className="w-3.5 h-3.5 text-[#FC9905] animate-pulse" />,
        color: 'text-[#FC9905]',
        bg: 'bg-[#FC9905]/10',
        border: 'border-[#FC9905]/30'
      },
      APPROUVEE: {
        label: 'Approved',
        icon: <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />,
        color: 'text-emerald-700',
        bg: 'bg-emerald-500/10',
        border: 'border-emerald-500/30'
      },
      REJETEE: {
        label: 'Rejected',
        icon: <XCircle className="w-3.5 h-3.5 text-red-600" />,
        color: 'text-red-700',
        bg: 'bg-red-500/10',
        border: 'border-red-500/30'
      }
    };

    const current = config[statut] || {
      label: statut,
      icon: <AlertCircle className="w-3.5 h-3.5 text-gray-500" />,
      color: 'text-gray-700',
      bg: 'bg-gray-100',
      border: 'border-gray-200'
    };

    return (
      <span
        className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold border ${current.color} ${current.bg} ${current.border} shadow-xs`}
      >
        {current.icon}
        <span>{current.label}</span>
      </span>
    );
  };

  // Compteurs par statut
  const countEnAttente = getFilteredCorrections('EN_ATTENTE').length;
  const countApprouvee = getFilteredCorrections('APPROUVEE').length;
  const countRejetee = getFilteredCorrections('REJETEE').length;

  const tabs: Array<{
    key: 'EN_ATTENTE' | 'APPROUVEE' | 'REJETEE';
    label: string;
    icon: React.ReactNode;
    count: number;
  }> = [
    {
      key: 'EN_ATTENTE',
      label: 'Pending',
      icon: <Clock className="w-4 h-4" />,
      count: countEnAttente
    },
    {
      key: 'APPROUVEE',
      label: 'Approved',
      icon: <CheckCircle2 className="w-4 h-4" />,
      count: countApprouvee
    },
    {
      key: 'REJETEE',
      label: 'Rejected',
      icon: <XCircle className="w-4 h-4" />,
      count: countRejetee
    }
  ];

  return (
    <div className="space-y-6 sm:space-y-8 max-w-4xl mx-auto pb-12">
      {/* Toast Notification */}
      {toast && (
        <div
          className={`fixed top-6 left-1/2 -translate-x-1/2 z-50 px-5 py-3.5 rounded-2xl border text-sm font-medium backdrop-blur-2xl shadow-xl transition-all duration-300 flex items-center gap-3 max-w-[90vw] ${
            toast.type === 'success'
              ? 'bg-emerald-50/95 border-emerald-200 text-emerald-900 shadow-emerald-900/10'
              : toast.type === 'error'
              ? 'bg-red-50/95 border-red-200 text-red-900 shadow-red-900/10'
              : 'bg-amber-50/95 border-amber-200 text-amber-900 shadow-amber-900/10'
          }`}
        >
          {toast.type === 'success' ? (
            <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
          ) : toast.type === 'error' ? (
            <AlertCircle className="w-4 h-4 text-red-600 shrink-0" />
          ) : (
            <Sparkles className="w-4 h-4 text-amber-600 shrink-0" />
          )}
          <span>{toast.message}</span>
          <button
            onClick={() => setToast(null)}
            className="text-gray-400 hover:text-gray-700 ml-2 font-bold transition-colors p-0.5 rounded-md hover:bg-gray-100"
            title="Close"
          >
            <X className="w-4 h-4" />
          </button>
        </div>
      )}

      {/* Header */}
      <div>
        <div className="flex items-center gap-3 mb-2">
          <div className="w-10 h-10 rounded-xl bg-[#FC9905]/15 border border-[#FC9905]/30 flex items-center justify-center text-[#FC9905]">
            <FileEdit className="w-5 h-5" />
          </div>
          <h1 className="text-3xl sm:text-4xl font-serif font-bold text-[#FC9905] tracking-tight">
            Time Card Correction
          </h1>
        </div>
        <p className="text-base text-gray-700 font-light">
          Submit an adjustment request if you forgot to clock in or clock out.
        </p>
      </div>

      {/* Main View Navigation Tabs */}
      <div className="flex gap-3 p-1.5 bg-[#110195]/5 rounded-2xl border border-[#110195]/10">
        <button
          type="button"
          onClick={() => setActiveView('form')}
          className={`flex-1 py-3 px-4 rounded-xl text-sm font-bold transition-all duration-300 flex items-center justify-center gap-2 ${
            activeView === 'form'
              ? 'bg-gradient-to-r from-[#110195] to-[#FC9905] text-white shadow-lg shadow-[#110195]/20'
              : 'bg-white/60 text-gray-700 hover:text-gray-900 hover:bg-white/90 border border-transparent hover:border-[#110195]/10'
          }`}
        >
          <PenLine className="w-4 h-4 shrink-0" />
          <span>New Request</span>
        </button>
        <button
          type="button"
          onClick={() => setActiveView('list')}
          className={`flex-1 py-3 px-4 rounded-xl text-sm font-bold transition-all duration-300 flex items-center justify-center gap-2 ${
            activeView === 'list'
              ? 'bg-gradient-to-r from-[#110195] to-[#FC9905] text-white shadow-lg shadow-[#110195]/20'
              : 'bg-white/60 text-gray-700 hover:text-gray-900 hover:bg-white/90 border border-transparent hover:border-[#110195]/10'
          }`}
        >
          <ListChecks className="w-4 h-4 shrink-0" />
          <span>My Requests</span>
          {corrections.length > 0 && (
            <span
              className={`text-xs px-2 py-0.5 rounded-full font-mono font-bold ${
                activeView === 'list' ? 'bg-white/20 text-white' : 'bg-[#110195]/10 text-[#110195]'
              }`}
            >
              {corrections.length}
            </span>
          )}
        </button>
      </div>

      {/* Conditional Content by Active View */}
      {activeView === 'form' ? (
        /* SECTION 1: REQUEST FORM */
        <div className="max-w-2xl mx-auto w-full">
          <GlassCard className="!p-6 sm:!p-8 border border-[#110195]/10 shadow-sm">
            <div className="flex items-center gap-2.5 mb-6 pb-4 border-b border-[#110195]/10">
              <div className="p-2 rounded-lg bg-[#110195]/10 text-[#110195]">
                <PenLine className="w-5 h-5" />
              </div>
              <div>
                <h2 className="text-xl font-serif font-bold text-gray-900">
                  New Correction Request
                </h2>
                <p className="text-xs text-gray-500 mt-0.5">
                  Fill in the details of the time record to adjust for managerial approval.
                </p>
              </div>
            </div>

            <form onSubmit={handleSubmit} className="space-y-5">
              {/* Offline warning banner */}
              {!isOnline && (
                <div className="p-3.5 rounded-xl bg-amber-500/10 border border-amber-500/30 text-amber-950 flex items-center gap-3 text-xs font-medium">
                  <WifiOff className="w-4 h-4 text-amber-800 shrink-0" />
                  <span>
                    You are currently offline. New correction requests cannot be submitted without an internet connection.
                  </span>
                </div>
              )}

              {/* Date */}
              <div>
                <label className="block text-xs font-semibold text-gray-700 uppercase tracking-wider mb-2 flex items-center gap-1.5">
                  <Calendar className="w-3.5 h-3.5 text-[#110195]" />
                  <span>Correction Date</span>
                  <span className="text-red-500">*</span>
                </label>
                <input
                  type="date"
                  name="date"
                  value={form.date}
                  onChange={handleFormChange}
                  max={todayStr}
                  min={minDateStr}
                  className={`w-full px-4 py-3 rounded-xl text-sm bg-white/70 border ${
                    formErrors.date
                      ? 'border-red-400 focus:ring-red-300'
                      : 'border-[#110195]/15 focus:border-[#FC9905]'
                  } text-gray-900 focus:outline-none focus:ring-2 focus:ring-[#FC9905]/30 transition-all`}
                />
                {formErrors.date && (
                  <p className="text-red-600 text-xs font-medium mt-1.5 flex items-center gap-1">
                    <AlertCircle className="w-3.5 h-3.5" />
                    <span>{formErrors.date}</span>
                  </p>
                )}
                <p className="text-[11px] text-gray-500 mt-1.5">
                  Allowed within the last 7 business days.
                </p>
              </div>

              {/* Type de pointage */}
              <div>
                <label className="block text-xs font-semibold text-gray-700 uppercase tracking-wider mb-2 flex items-center gap-1.5">
                  <Clock className="w-3.5 h-3.5 text-[#110195]" />
                  <span>Record Type</span>
                  <span className="text-red-500">*</span>
                </label>
                <div className="grid grid-cols-2 gap-3 p-1.5 bg-[#110195]/5 rounded-xl border border-[#110195]/10">
                  <button
                    type="button"
                    onClick={() => setForm(prev => ({ ...prev, type: 'IN' }))}
                    className={`py-2.5 px-3 rounded-lg text-xs font-bold transition-all flex items-center justify-center gap-2 ${
                      form.type === 'IN'
                        ? 'bg-white text-emerald-700 shadow-sm border border-emerald-500/30'
                        : 'text-gray-600 hover:text-gray-900'
                    }`}
                  >
                    <LogIn className="w-4 h-4 text-emerald-600" />
                    <span>CLOCK IN</span>
                  </button>
                  <button
                    type="button"
                    onClick={() => setForm(prev => ({ ...prev, type: 'OUT' }))}
                    className={`py-2.5 px-3 rounded-lg text-xs font-bold transition-all flex items-center justify-center gap-2 ${
                      form.type === 'OUT'
                        ? 'bg-white text-red-700 shadow-sm border border-red-500/30'
                        : 'text-gray-600 hover:text-gray-900'
                    }`}
                  >
                    <LogOut className="w-4 h-4 text-red-600" />
                    <span>CLOCK OUT</span>
                  </button>
                </div>
                {formErrors.type && (
                  <p className="text-red-600 text-xs font-medium mt-1.5 flex items-center gap-1">
                    <AlertCircle className="w-3.5 h-3.5" />
                    <span>{formErrors.type}</span>
                  </p>
                )}
              </div>

              {/* Heure souhaitée */}
              <div>
                <label className="block text-xs font-semibold text-gray-700 uppercase tracking-wider mb-2 flex items-center gap-1.5">
                  <Clock className="w-3.5 h-3.5 text-[#110195]" />
                  <span>Requested Time</span>
                  <span className="text-red-500">*</span>
                </label>
                <input
                  type="time"
                  name="heure"
                  value={form.heure}
                  onChange={handleFormChange}
                  className={`w-full px-4 py-3 rounded-xl text-sm bg-white/70 border ${
                    formErrors.heure
                      ? 'border-red-400 focus:ring-red-300'
                      : 'border-[#110195]/15 focus:border-[#FC9905]'
                  } text-gray-900 focus:outline-none focus:ring-2 focus:ring-[#FC9905]/30 transition-all font-mono`}
                />
                {formErrors.heure && (
                  <p className="text-red-600 text-xs font-medium mt-1.5 flex items-center gap-1">
                    <AlertCircle className="w-3.5 h-3.5" />
                    <span>{formErrors.heure}</span>
                  </p>
                )}
              </div>

              {/* Raison / Motif */}
              <div>
                <label className="block text-xs font-semibold text-gray-700 uppercase tracking-wider mb-2 flex items-center gap-1.5">
                  <FileText className="w-3.5 h-3.5 text-[#110195]" />
                  <span>Reason / Explanation</span>
                  <span className="text-red-500">*</span>
                </label>
                <textarea
                  name="raison"
                  rows={3}
                  value={form.raison}
                  onChange={handleFormChange}
                  placeholder="Explain clearly why the clock in/out was not recorded on time..."
                  className={`w-full px-4 py-3 rounded-xl text-sm bg-white/70 border ${
                    formErrors.raison
                      ? 'border-red-400 focus:ring-red-300'
                      : 'border-[#110195]/15 focus:border-[#FC9905]'
                  } text-gray-900 placeholder:text-gray-400 focus:outline-none focus:ring-2 focus:ring-[#FC9905]/30 transition-all resize-none`}
                />
                <div className="flex justify-between items-center mt-1.5">
                  {formErrors.raison ? (
                    <p className="text-red-600 text-xs font-medium flex items-center gap-1">
                      <AlertCircle className="w-3.5 h-3.5" />
                      <span>{formErrors.raison}</span>
                    </p>
                  ) : (
                    <span className="text-[11px] text-gray-400">Min. 10 characters</span>
                  )}
                  <span className="text-[11px] text-gray-400 font-mono">
                    {form.raison.length} chars
                  </span>
                </div>
              </div>

              {/* Bouton d'envoi */}
              <div className="pt-3">
                <Button
                  type="submit"
                  variant="secondary"
                  fullWidth
                  loading={submitting}
                  disabled={submitting || !isOnline}
                  className="!py-3.5 text-sm font-bold shadow-md flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {!isOnline ? (
                    <>
                      <WifiOff className="w-4 h-4" />
                      <span>OFFLINE - SUBMISSION DISABLED</span>
                    </>
                  ) : submitting ? (
                    <>
                      <Loader2 className="w-4 h-4 animate-spin" />
                      <span>Submitting...</span>
                    </>
                  ) : (
                    <>
                      <Send className="w-4 h-4" />
                      <span>SUBMIT REQUEST</span>
                    </>
                  )}
                </Button>
              </div>
            </form>
          </GlassCard>
        </div>
      ) : (
        /* SECTION 2 : LISTE DES DEMANDES AVEC ONGLETS */
        <div className="w-full space-y-4">
          <GlassCard className="!p-6 border border-[#110195]/10 shadow-sm">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-6 pb-4 border-b border-[#110195]/10">
              <div className="flex items-center gap-2.5">
                <div className="p-2 rounded-lg bg-[#110195]/10 text-[#110195]">
                  <ListChecks className="w-5 h-5" />
                </div>
                <div>
                  <h2 className="text-xl font-serif font-bold text-gray-900">
                    Correction Requests History
                  </h2>
                  <p className="text-xs text-gray-500 mt-0.5">
                    Track managerial review status in real-time.
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={loadCorrections}
                disabled={!isOnline}
                className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-[#110195]/5 hover:bg-[#110195]/10 text-[#110195] text-xs font-semibold transition-colors border border-[#110195]/10 self-start sm:self-auto disabled:opacity-50 disabled:cursor-not-allowed"
                title="Refresh list"
              >
                <RefreshCw className="w-3.5 h-3.5" />
                <span>Refresh</span>
              </button>
            </div>

            {/* Offline notice for list */}
            {!isOnline && (
              <div className="p-3 rounded-xl bg-amber-500/10 border border-amber-500/30 text-amber-950 flex items-center gap-2.5 text-xs font-medium mb-4">
                <WifiOff className="w-4 h-4 text-amber-800 shrink-0" />
                <span>You are offline. Showing cached correction requests.</span>
              </div>
            )}

            {/* Barre d'onglets de filtrage */}
            <div className="flex items-center gap-2 p-1.5 bg-[#110195]/5 rounded-xl border border-[#110195]/10 mb-6 overflow-x-auto">
              {tabs.map(tab => {
                const isActive = activeTab === tab.key;
                return (
                  <button
                    key={tab.key}
                    type="button"
                    onClick={() => setActiveTab(tab.key)}
                    className={`flex-1 min-w-[120px] py-2.5 px-3 rounded-lg text-xs font-bold transition-all flex items-center justify-center gap-2 ${
                      isActive
                        ? 'bg-white text-[#FC9905] shadow-sm border border-[#FC9905]/30'
                        : 'text-gray-600 hover:text-gray-900 hover:bg-white/40'
                    }`}
                  >
                    <span className={isActive ? 'text-[#FC9905]' : 'text-gray-500'}>
                      {tab.icon}
                    </span>
                    <span>{tab.label}</span>
                    {tab.count > 0 && (
                      <span
                        className={`text-[10px] px-2 py-0.5 rounded-full font-mono ${
                          isActive
                            ? 'bg-[#FC9905] text-white'
                            : 'bg-[#110195]/10 text-gray-700'
                        }`}
                      >
                        {tab.count}
                      </span>
                    )}
                  </button>
                );
              })}
            </div>

            {/* Liste des cartes ou état de chargement */}
            {loading ? (
              <div className="py-16 flex flex-col items-center justify-center gap-3">
                <Loader2 className="w-8 h-8 text-[#FC9905] animate-spin" />
                <p className="text-xs text-gray-500 font-medium">Loading requests...</p>
              </div>
            ) : (
              <div className="space-y-3">
                {getFilteredCorrections(activeTab).length === 0 ? (
                  <div className="py-16 px-4 text-center">
                    <div className="w-12 h-12 rounded-2xl bg-gray-100 flex items-center justify-center mx-auto mb-3 text-gray-400 border border-gray-200">
                      <Inbox className="w-6 h-6" />
                    </div>
                    <p className="text-sm font-semibold text-gray-700">
                      {activeTab === 'EN_ATTENTE' && 'No pending requests'}
                      {activeTab === 'APPROUVEE' && 'No approved requests yet'}
                      {activeTab === 'REJETEE' && 'No rejected requests'}
                    </p>
                    <p className="text-xs text-gray-400 mt-1 max-w-sm mx-auto">
                      Submitted requests will appear here with tracking and manager comments.
                    </p>
                  </div>
                ) : (
                  getFilteredCorrections(activeTab).map(item => {
                    const isRejetee = item.statut === 'REJETEE';
                    const isApprouvee = item.statut === 'APPROUVEE';
                    const borderColor = isApprouvee
                      ? 'border-l-emerald-500'
                      : isRejetee
                      ? 'border-l-red-500'
                      : 'border-l-[#FC9905]';

                    return (
                      <div
                        key={item.id}
                        className={`p-4 sm:p-5 rounded-xl bg-white/70 border border-[#110195]/10 border-l-4 ${borderColor} shadow-xs transition-all hover:bg-white hover:shadow-md`}
                      >
                        <div className="flex items-start justify-between gap-3 flex-wrap">
                          <div className="space-y-2 flex-1 min-w-[240px]">
                            <div className="flex items-center gap-2.5 flex-wrap">
                              <span className="inline-flex items-center gap-1 text-xs font-semibold text-gray-900 bg-[#110195]/5 px-2.5 py-1 rounded-md border border-[#110195]/10">
                                <Calendar className="w-3.5 h-3.5 text-[#110195]" />
                                <span>{formatDate(item.date)}</span>
                              </span>
                              <span
                                className={`inline-flex items-center gap-1 text-xs font-bold px-2.5 py-1 rounded-md ${
                                  item.type === 'IN'
                                    ? 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                                    : 'bg-red-50 text-red-700 border border-red-200'
                                }`}
                              >
                                {item.type === 'IN' ? (
                                  <>
                                    <LogIn className="w-3.5 h-3.5" />
                                    <span>CLOCK IN</span>
                                  </>
                                ) : (
                                  <>
                                    <LogOut className="w-3.5 h-3.5" />
                                    <span>CLOCK OUT</span>
                                  </>
                                )}
                              </span>
                              <span className="inline-flex items-center gap-1 text-xs text-gray-600 font-mono bg-gray-50 px-2 py-1 rounded-md border border-gray-200">
                                <Clock className="w-3.5 h-3.5 text-gray-500" />
                                <span>{formatTime(item.heure_souhaitee || item.heure)}</span>
                              </span>
                            </div>

                            <div className="text-xs text-gray-700 mt-2 leading-relaxed bg-[#110195]/5 p-3 rounded-lg border border-[#110195]/10">
                              <span className="font-semibold text-gray-900 block mb-1 flex items-center gap-1.5">
                                <FileText className="w-3.5 h-3.5 text-[#110195]" />
                                <span>Provided reason:</span>
                              </span>
                              <p className="text-gray-800">{item.raison}</p>
                            </div>

                            {/* Commentaire du Manager en cas de rejet */}
                            {isRejetee && item.commentaire_manager && (
                              <div className="mt-2.5 p-3 rounded-lg bg-red-50/90 border border-red-200 text-xs text-red-900">
                                <span className="font-bold flex items-center gap-1.5 text-red-800 mb-1">
                                  <MessageSquare className="w-3.5 h-3.5" />
                                  <span>Manager feedback:</span>
                                </span>
                                <p className="text-red-950 font-medium">{item.commentaire_manager}</p>
                              </div>
                            )}
                          </div>

                          <div className="shrink-0 self-start">
                            {renderStatusBadge(item.statut)}
                          </div>
                        </div>
                      </div>
                    );
                  })
                )}
              </div>
            )}
          </GlassCard>
        </div>
      )}
    </div>
  );
}

export default Correction;
