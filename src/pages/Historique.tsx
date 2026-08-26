import React, { useState, useEffect, useCallback } from 'react';
import {
  History,
  Calendar,
  Clock,
  TrendingUp,
  LogIn,
  LogOut,
  ChevronLeft,
  ChevronRight,
  RotateCcw,
  CheckCircle2,
  AlertTriangle,
  XCircle,
  FileText,
  MessageSquare,
  Inbox,
  Loader2,
  WifiOff
} from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';
import { supabase } from '../services/supabase';
import { formatDate, formatTime, formatDuration, durationToSeconds } from '../utils/dateHelpers';
import { GlassCard } from '../components/ui/GlassCard';
import { useOnlineStatus } from '../hooks/useOnlineStatus';
import { cacheService } from '../services/cacheService';

export interface PointageRecord {
  id?: number | string;
  agent_id: string;
  date: string;
  clock_in_time?: string | null;
  clock_in_lat?: number | null;
  clock_in_lng?: number | null;
  clock_in_statut?: string | null;
  clock_in_ip?: string | null;
  clock_out_time?: string | null;
  clock_out_lat?: number | null;
  clock_out_lng?: number | null;
  clock_out_statut?: string | null;
  clock_out_ip?: string | null;
  duree?: string | any | null;
  heure_arrivee?: string | null;
  heure_depart?: string | null;
  synchronise?: boolean;
  created_at?: string;
  updated_at?: string;
  [key: string]: any;
}

export interface CorrectionRecord {
  id?: number | string;
  agent_id: string;
  date: string;
  type: 'IN' | 'OUT' | string;
  heure_souhaitee?: string;
  heure?: string;
  raison: string;
  statut: 'EN_ATTENTE' | 'APPROUVEE' | 'REJETEE' | string;
  commentaire_manager?: string | null;
  created_at?: string;
  traite_le?: string | null;
  [key: string]: any;
}

export interface DayData {
  date: string;
  pointage: PointageRecord | null;
  correction: CorrectionRecord | null;
  statut:
    | 'complet'
    | 'arrivee_manquante'
    | 'depart_manquant'
    | 'correction_attente'
    | 'correction_approuvee'
    | 'correction_rejetee'
    | 'vide';
}

export function Historique() {
  const { user, agent } = useAuth();
  const isOnline = useOnlineStatus();
  const effectiveAgentId = agent?.id || user?.id;

  const [loading, setLoading] = useState<boolean>(true);
  const [daysData, setDaysData] = useState<DayData[]>([]);
  const [currentMonth, setCurrentMonth] = useState(() => {
    const now = new Date();
    return { year: now.getFullYear(), month: now.getMonth() };
  });

  const [selectedDate, setSelectedDate] = useState<string | null>(null);
  const [stats, setStats] = useState({
    totalHeures: 0,
    joursTravailles: 0,
    moyenne: 0
  });
  const [error, setError] = useState<string | null>(null);

  const determineStatut = (
    pointage: PointageRecord | null,
    correction: CorrectionRecord | null
  ): DayData['statut'] => {
    if (correction) {
      if (correction.statut === 'EN_ATTENTE') return 'correction_attente';
      if (correction.statut === 'APPROUVEE') return 'correction_approuvee';
      if (correction.statut === 'REJETEE') return 'correction_rejetee';
    }

    if (pointage) {
      const hasIn = Boolean(pointage.clock_in_time || pointage.heure_arrivee);
      const hasOut = Boolean(pointage.clock_out_time || pointage.heure_depart);

      if (hasIn && hasOut) return 'complet';
      if (!hasIn && hasOut) return 'arrivee_manquante';
      if (hasIn && !hasOut) return 'depart_manquant';
    }

    return 'vide';
  };

  const calculateStats = (days: DayData[]) => {
    let totalSeconds = 0;
    let joursTravailles = 0;

    days.forEach(day => {
      if (day.pointage) {
        const hasIn = Boolean(day.pointage.clock_in_time || day.pointage.heure_arrivee);
        if (hasIn) {
          joursTravailles++;
        }

        if (day.pointage.duree) {
          const sec = durationToSeconds(day.pointage.duree);
          totalSeconds += sec;
        }
      }
    });

    const totalHeures = totalSeconds / 3600;
    const moyenne = joursTravailles > 0 ? totalHeures / joursTravailles : 0;

    setStats({
      totalHeures: Math.round(totalHeures * 10) / 10,
      joursTravailles,
      moyenne: Math.round(moyenne * 10) / 10
    });
  };

  const loadData = useCallback(async () => {
    if (!effectiveAgentId) {
      setLoading(false);
      return;
    }

    const year = currentMonth.year;
    const month = currentMonth.month;
    const cacheKey = `historique_${effectiveAgentId}_${year}_${month}`;

    // 1. Instant display from cache (0ms perceived latency)
    const cached = cacheService.get<DayData[]>(cacheKey);
    if (cached) {
      setDaysData(cached);
      calculateStats(cached);
      setLoading(false);
    } else {
      setLoading(true);
    }

    setError(null);

    try {
      const firstDay = new Date(year, month, 1);
      const lastDay = new Date(year, month + 1, 0);
      const startDate = firstDay.toISOString().split('T')[0];
      const endDate = lastDay.toISOString().split('T')[0];

      const { data: pointagesData, error: pointagesError } = await supabase
        .from('pointages')
        .select('*')
        .eq('agent_id', effectiveAgentId)
        .gte('date', startDate)
        .lte('date', endDate)
        .order('date', { ascending: false });

      if (pointagesError) {
        console.warn('Erreur chargement pointages:', pointagesError);
      }

      const { data: correctionsData, error: correctionsError } = await supabase
        .from('corrections')
        .select('*')
        .eq('agent_id', effectiveAgentId)
        .gte('date', startDate)
        .lte('date', endDate)
        .order('date', { ascending: false });

      if (correctionsError) {
        console.warn('Erreur chargement corrections:', correctionsError);
      }

      const daysMap = new Map<string, DayData>();

      (pointagesData || []).forEach((p: PointageRecord) => {
        daysMap.set(p.date, {
          date: p.date,
          pointage: p,
          correction: null,
          statut: determineStatut(p, null)
        });
      });

      (correctionsData || []).forEach((c: CorrectionRecord) => {
        if (daysMap.has(c.date)) {
          const existing = daysMap.get(c.date)!;
          existing.correction = c;
          existing.statut = determineStatut(existing.pointage, c);
        } else {
          daysMap.set(c.date, {
            date: c.date,
            pointage: null,
            correction: c,
            statut: determineStatut(null, c)
          });
        }
      });

      const daysArray = Array.from(daysMap.values());
      daysArray.sort((a, b) => b.date.localeCompare(a.date));

      setDaysData(daysArray);
      calculateStats(daysArray);
      cacheService.set(cacheKey, daysArray, 10, true);

      if (selectedDate && !daysMap.has(selectedDate)) {
        setSelectedDate(null);
      }
    } catch (err: any) {
      console.error('Erreur chargement historique:', err);
      if (!cached) {
        setError('Failed to retrieve time tracking data.');
      }
    } finally {
      setLoading(false);
    }
  }, [effectiveAgentId, currentMonth]);

  useEffect(() => {
    loadData();
  }, [loadData]);

  const goToPreviousMonth = () => {
    setCurrentMonth(prev => {
      if (prev.month === 0) {
        return { year: prev.year - 1, month: 11 };
      }
      return { ...prev, month: prev.month - 1 };
    });
    setSelectedDate(null);
  };

  const goToNextMonth = () => {
    const now = new Date();
    const currentYear = now.getFullYear();
    const currentMonthIndex = now.getMonth();

    setCurrentMonth(prev => {
      if (prev.year === currentYear && prev.month >= currentMonthIndex) {
        return prev;
      }
      if (prev.month === 11) {
        return { year: prev.year + 1, month: 0 };
      }
      return { ...prev, month: prev.month + 1 };
    });
    setSelectedDate(null);
  };

  const goToToday = () => {
    const now = new Date();
    setCurrentMonth({ year: now.getFullYear(), month: now.getMonth() });
    const todayStr = now.toISOString().split('T')[0];
    if (daysData.some(d => d.date === todayStr)) {
      setSelectedDate(todayStr);
    } else {
      setSelectedDate(null);
    }
  };

  const getMonthLabel = () => {
    const months = [
      'January', 'February', 'March', 'April', 'May', 'June',
      'July', 'August', 'September', 'October', 'November', 'December'
    ];
    return `${months[currentMonth.month]} ${currentMonth.year}`;
  };

  const isCurrentMonth = () => {
    const now = new Date();
    return now.getFullYear() === currentMonth.year && now.getMonth() === currentMonth.month;
  };

  const renderDayStatusBadge = (statut: DayData['statut']) => {
    const configs: Record<
      DayData['statut'],
      { label: string; icon: React.ReactNode; color: string; bg: string; border: string }
    > = {
      complet: {
        label: 'Complete',
        icon: <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />,
        color: 'text-emerald-700',
        bg: 'bg-emerald-500/10',
        border: 'border-emerald-500/30'
      },
      arrivee_manquante: {
        label: 'Missing Clock In',
        icon: <AlertTriangle className="w-3.5 h-3.5 text-red-600" />,
        color: 'text-red-700',
        bg: 'bg-red-500/10',
        border: 'border-red-500/30'
      },
      depart_manquant: {
        label: 'Missing Clock Out',
        icon: <AlertTriangle className="w-3.5 h-3.5 text-amber-600" />,
        color: 'text-amber-700',
        bg: 'bg-amber-500/10',
        border: 'border-amber-500/30'
      },
      correction_attente: {
        label: 'Pending',
        icon: <Clock className="w-3.5 h-3.5 text-[#FC9905] animate-pulse" />,
        color: 'text-[#FC9905]',
        bg: 'bg-[#FC9905]/10',
        border: 'border-[#FC9905]/30'
      },
      correction_approuvee: {
        label: 'Correction Approved',
        icon: <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />,
        color: 'text-emerald-700',
        bg: 'bg-emerald-500/10',
        border: 'border-emerald-500/30'
      },
      correction_rejetee: {
        label: 'Correction Rejected',
        icon: <XCircle className="w-3.5 h-3.5 text-red-600" />,
        color: 'text-red-700',
        bg: 'bg-red-500/10',
        border: 'border-red-500/30'
      },
      vide: {
        label: 'None',
        icon: null,
        color: 'text-gray-400',
        bg: 'bg-gray-100',
        border: 'border-gray-200'
      }
    };

    const current = configs[statut] || {
      label: 'None',
      icon: null,
      color: 'text-gray-400',
      bg: 'bg-gray-100',
      border: 'border-gray-200'
    };

    return (
      <span
        className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold border ${current.color} ${current.bg} ${current.border}`}
      >
        {current.icon}
        <span>{current.label}</span>
      </span>
    );
  };

  // CALENDAR with integrated navigation
  const renderCalendar = () => {
    const year = currentMonth.year;
    const month = currentMonth.month;
    const firstDay = new Date(year, month, 1);
    const lastDay = new Date(year, month + 1, 0);
    const daysInMonth = lastDay.getDate();
    const startDayOfWeek = firstDay.getDay();

    const dayStatuts = new Map<string, DayData['statut']>();
    daysData.forEach(day => {
      dayStatuts.set(day.date, day.statut);
    });

    const weekDays = ['Su', 'Mo', 'Tu', 'We', 'Th', 'Fr', 'Sa'];
    const cells = [];

    for (let i = 0; i < startDayOfWeek; i++) {
      cells.push(<div key={`empty-${i}`} className="aspect-square" />);
    }

    for (let day = 1; day <= daysInMonth; day++) {
      const dateStr = `${year}-${String(month + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
      const statut = dayStatuts.get(dateStr) || 'vide';
      const isToday = dateStr === new Date().toISOString().split('T')[0];
      const isSelected = dateStr === selectedDate;

      let bgColor = 'bg-white/50 hover:bg-white/80';
      let dotColor = 'bg-gray-300';
      let textColor = 'text-gray-900';

      switch (statut) {
        case 'complet':
        case 'correction_approuvee':
          dotColor = 'bg-emerald-500';
          textColor = 'text-emerald-700';
          break;
        case 'arrivee_manquante':
        case 'depart_manquant':
        case 'correction_rejetee':
          dotColor = 'bg-red-500';
          textColor = 'text-red-600';
          break;
        case 'correction_attente':
          dotColor = 'bg-[#FC9905]';
          textColor = 'text-[#FC9905]';
          break;
        default:
          dotColor = 'bg-gray-300';
          textColor = 'text-gray-400';
      }

      if (isSelected) {
        bgColor = 'bg-[#FC9905]/20 border-[#FC9905] border-2';
      }

      if (isToday && !isSelected) {
        bgColor = 'bg-[#110195]/10 border-[#110195] border-2';
      }

      cells.push(
        <button
          key={dateStr}
          onClick={() => {
            if (statut !== 'vide') {
              setSelectedDate(dateStr);
            } else {
              setSelectedDate(null);
            }
          }}
          className={`aspect-square rounded-xl flex flex-col items-center justify-center transition-all ${bgColor} ${
            statut !== 'vide' ? 'cursor-pointer hover:scale-105' : 'cursor-default opacity-60'
          }`}
          disabled={statut === 'vide'}
          title={statut !== 'vide' ? formatDate(dateStr) : 'No time record'}
        >
          <span className={`text-sm font-semibold ${textColor}`}>{day}</span>
          {statut !== 'vide' && (
            <span className={`w-2 h-2 rounded-full ${dotColor} mt-0.5`}></span>
          )}
        </button>
      );
    }

    return (
      <div className="bg-white/40 rounded-xl border border-[#110195]/10 p-4">
        {/* Month navigation inside calendar */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-4 pb-3 border-b border-[#110195]/10">
          <div className="flex items-center gap-2">
            <Calendar className="w-5 h-5 text-[#110195] shrink-0" />
            <h2 className="text-lg font-serif font-bold text-gray-900">Calendar</h2>
          </div>
          <div className="inline-flex items-center justify-between sm:justify-end gap-1 bg-white/80 p-1 rounded-xl border border-[#110195]/10 shadow-xs">
            <button
              type="button"
              onClick={goToPreviousMonth}
              aria-label="Previous month"
              className="p-1.5 rounded-lg text-gray-600 hover:text-[#FC9905] hover:bg-[#110195]/5 active:scale-95 transition-all"
            >
              <ChevronLeft className="w-4 h-4" />
            </button>
            <span className="text-sm font-bold text-gray-800 px-2 text-center min-w-[110px] select-none capitalize">
              {getMonthLabel()}
            </span>
            <button
              type="button"
              onClick={goToNextMonth}
              disabled={isCurrentMonth()}
              aria-label="Next month"
              className={`p-1.5 rounded-lg transition-all ${
                isCurrentMonth()
                  ? 'text-gray-300 cursor-not-allowed'
                  : 'text-gray-600 hover:text-[#FC9905] hover:bg-[#110195]/5 active:scale-95'
              }`}
            >
              <ChevronRight className="w-4 h-4" />
            </button>
            {!isCurrentMonth() && (
              <button
                type="button"
                onClick={goToToday}
                className="ml-1 px-2 py-1 rounded-lg text-[11px] font-semibold text-[#110195] bg-[#110195]/10 hover:bg-[#110195]/20 active:scale-95 transition-all shrink-0"
              >
                Today
              </button>
            )}
          </div>
        </div>

        <div className="grid grid-cols-7 gap-1 mb-2">
          {weekDays.map(day => (
            <div key={day} className="text-center text-xs font-semibold text-gray-500 py-1">
              {day}
            </div>
          ))}
        </div>
        <div className="grid grid-cols-7 gap-1">{cells}</div>

        {/* Legend */}
        <div className="flex flex-wrap items-center justify-center gap-3 mt-4 pt-3 border-t border-[#110195]/10">
          <span className="flex items-center gap-1 text-xs text-gray-600">
            <span className="w-2.5 h-2.5 rounded-full bg-emerald-500"></span> Complete
          </span>
          <span className="flex items-center gap-1 text-xs text-gray-600">
            <span className="w-2.5 h-2.5 rounded-full bg-red-500"></span> Missing
          </span>
          <span className="flex items-center gap-1 text-xs text-gray-600">
            <span className="w-2.5 h-2.5 rounded-full bg-[#FC9905]"></span> Correction
          </span>
          <span className="flex items-center gap-1 text-xs text-gray-600">
            <span className="w-2.5 h-2.5 rounded-full bg-gray-300"></span> None
          </span>
        </div>
      </div>
    );
  };

  const renderDayDetails = () => {
    if (!selectedDate) {
      return (
        <div className="py-12 px-4 text-center">
          <div className="w-12 h-12 rounded-2xl bg-gray-100 flex items-center justify-center mx-auto mb-3 text-gray-400 border border-gray-200">
            <Calendar className="w-6 h-6" />
          </div>
          <p className="text-sm font-semibold text-gray-700">Select a day</p>
          <p className="text-xs text-gray-400 mt-1 max-w-sm mx-auto">
            Click a day in the calendar to view time tracking details.
          </p>
        </div>
      );
    }

    const dayData = daysData.find(d => d.date === selectedDate);
    if (!dayData || dayData.statut === 'vide') {
      return (
        <div className="py-8 px-4 text-center">
          <p className="text-sm font-medium text-gray-600">No time record for this day</p>
        </div>
      );
    }

    const { pointage, correction, statut } = dayData;
    const isComplet = statut === 'complet' || statut === 'correction_approuvee';
    const isManquant = statut === 'arrivee_manquante' || statut === 'depart_manquant' || statut === 'correction_rejetee';
    const borderColor = isComplet
      ? 'border-l-emerald-500'
      : isManquant
      ? 'border-l-red-500'
      : 'border-l-[#FC9905]';

    const clockInRaw = pointage?.clock_in_time || pointage?.heure_arrivee;
    const clockOutRaw = pointage?.clock_out_time || pointage?.heure_depart;

    const clockIn = clockInRaw ? formatTime(clockInRaw) : '--:--';
    const clockOut = clockOutRaw ? formatTime(clockOutRaw) : '--:--';
    const duree = pointage?.duree ? formatDuration(pointage.duree) : '--:--';

    return (
      <div className="space-y-4">
        <div className={`p-4 rounded-2xl bg-white/70 border border-[#110195]/10 border-l-4 ${borderColor}`}>
          <div className="flex items-center justify-between mb-4 pb-3 border-b border-[#110195]/10">
            <span className="text-lg font-bold text-gray-900 capitalize flex items-center gap-2">
              <Calendar className="w-4 h-4 text-[#110195] shrink-0" />
              <span>{formatDate(selectedDate)}</span>
            </span>
            {renderDayStatusBadge(statut)}
          </div>

          <div className="grid grid-cols-3 gap-3 p-3 bg-[#110195]/5 rounded-xl border border-[#110195]/10">
            <div>
              <span className="text-[11px] font-semibold text-gray-500 uppercase tracking-wider block mb-1 flex items-center gap-1">
                <LogIn className="w-3 h-3 text-emerald-600" />
                <span>Clock In</span>
              </span>
              <span className={`text-sm sm:text-base font-mono font-bold ${clockInRaw ? 'text-emerald-700' : 'text-gray-400'}`}>
                {clockIn}
              </span>
            </div>
            <div>
              <span className="text-[11px] font-semibold text-gray-500 uppercase tracking-wider block mb-1 flex items-center gap-1">
                <LogOut className="w-3 h-3 text-red-600" />
                <span>Clock Out</span>
              </span>
              <span className={`text-sm sm:text-base font-mono font-bold ${clockOutRaw ? 'text-red-700' : 'text-gray-400'}`}>
                {clockOut}
              </span>
            </div>
            <div>
              <span className="text-[11px] font-semibold text-gray-500 uppercase tracking-wider block mb-1 flex items-center gap-1">
                <Clock className="w-3 h-3 text-[#FC9905]" />
                <span>Duration</span>
              </span>
              <span className={`text-sm sm:text-base font-mono font-bold ${pointage?.duree ? 'text-[#FC9905]' : 'text-gray-400'}`}>
                {duree}
              </span>
            </div>
          </div>

          {statut === 'correction_attente' && correction && (
            <div className="mt-3 p-3 rounded-xl bg-amber-50/80 border border-amber-200 text-xs text-amber-900 flex items-start gap-2">
              <FileText className="w-4 h-4 text-amber-700 shrink-0 mt-0.5" />
              <div>
                <span className="font-bold block text-amber-950">Request under review:</span>
                <p className="mt-0.5 text-amber-900">{correction.raison}</p>
              </div>
            </div>
          )}

          {statut === 'correction_rejetee' && correction?.commentaire_manager && (
            <div className="mt-3 p-3 rounded-xl bg-red-50/90 border border-red-200 text-xs text-red-900 flex items-start gap-2">
              <MessageSquare className="w-4 h-4 text-red-700 shrink-0 mt-0.5" />
              <div>
                <span className="font-bold block text-red-950">Rejection reason:</span>
                <p className="mt-0.5 text-red-900 font-medium">{correction.commentaire_manager}</p>
              </div>
            </div>
          )}

          {statut === 'correction_approuvee' && correction && (
            <div className="mt-3 p-3 rounded-xl bg-emerald-50/80 border border-emerald-200 text-xs text-emerald-900 flex items-start gap-2">
              <CheckCircle2 className="w-4 h-4 text-emerald-700 shrink-0 mt-0.5" />
              <div>
                <span className="font-bold block text-emerald-950">Correction approved</span>
                <p className="mt-0.5 text-emerald-800">{correction.raison}</p>
              </div>
            </div>
          )}
        </div>
      </div>
    );
  };

  return (
    <div className="space-y-6 sm:space-y-8 max-w-4xl mx-auto pb-12">
      {/* SECTION 1: HEADER with TITLE + STATS */}
      <div>
        <div className="flex items-center gap-3 mb-2">
          <div className="w-10 h-10 rounded-xl bg-[#FC9905]/15 border border-[#FC9905]/30 flex items-center justify-center text-[#FC9905]">
            <History className="w-5 h-5" />
          </div>
          <h1 className="text-3xl sm:text-4xl font-serif font-bold text-[#FC9905] tracking-tight">
            Time Tracking History
          </h1>
        </div>
        <p className="text-base text-gray-700 font-light mb-4">
          View your past time records month by month.
        </p>

        {/* Offline notice */}
        {!isOnline && (
          <div className="p-3.5 rounded-xl bg-amber-500/10 border border-amber-500/30 text-amber-950 flex items-center gap-3 text-xs font-medium mb-4">
            <WifiOff className="w-4 h-4 text-amber-800 shrink-0" />
            <span>You are currently offline. Displaying cached records. Live changes will sync once connection is restored.</span>
          </div>
        )}

        {/* STATISTICS directly under title */}
        <div className="grid grid-cols-3 gap-2 sm:gap-4">
          <GlassCard className="!p-3 sm:!p-4 border border-[#110195]/10 shadow-xs flex flex-col items-center text-center">
            <div className="w-8 h-8 sm:w-10 sm:h-10 rounded-xl bg-[#FC9905]/15 border border-[#FC9905]/30 flex items-center justify-center text-[#FC9905] shrink-0 mb-0.5 sm:mb-1">
              <Clock className="w-4 h-4 sm:w-5 sm:h-5" />
            </div>
            <span className="text-lg sm:text-2xl font-serif font-bold text-[#FC9905] block leading-none">
              {stats.totalHeures}h
            </span>
            <span className="text-[10px] sm:text-xs text-gray-500 font-medium mt-0.5 block">Total</span>
          </GlassCard>

          <GlassCard className="!p-3 sm:!p-4 border border-[#110195]/10 shadow-xs flex flex-col items-center text-center">
            <div className="w-8 h-8 sm:w-10 sm:h-10 rounded-xl bg-emerald-500/15 border border-emerald-500/30 flex items-center justify-center text-emerald-600 shrink-0 mb-0.5 sm:mb-1">
              <Calendar className="w-4 h-4 sm:w-5 sm:h-5" />
            </div>
            <span className="text-lg sm:text-2xl font-serif font-bold text-emerald-600 block leading-none">
              {stats.joursTravailles}
            </span>
            <span className="text-[10px] sm:text-xs text-gray-500 font-medium mt-0.5 block">Days</span>
          </GlassCard>

          <GlassCard className="!p-3 sm:!p-4 border border-[#110195]/10 shadow-xs flex flex-col items-center text-center">
            <div className="w-8 h-8 sm:w-10 sm:h-10 rounded-xl bg-[#110195]/10 border border-[#110195]/20 flex items-center justify-center text-[#110195] shrink-0 mb-0.5 sm:mb-1">
              <TrendingUp className="w-4 h-4 sm:w-5 sm:h-5" />
            </div>
            <span className="text-lg sm:text-2xl font-serif font-bold text-[#110195] block leading-none">
              {stats.moyenne}h
            </span>
            <span className="text-[10px] sm:text-xs text-gray-500 font-medium mt-0.5 block">Average</span>
          </GlassCard>
        </div>
      </div>

      {/* SECTION 2: CALENDAR + DAY DETAILS */}
      <div className="grid grid-cols-1 lg:grid-cols-5 gap-6">
        {/* Calendar - takes 3 columns on large screens */}
        <div className="lg:col-span-3">
          <GlassCard className="!p-4 sm:!p-6 border border-[#110195]/10 shadow-sm">
            {loading ? (
              <div className="py-8 flex flex-col items-center justify-center gap-3">
                <Loader2 className="w-6 h-6 text-[#FC9905] animate-spin" />
                <p className="text-xs text-gray-500">Loading...</p>
              </div>
            ) : (
              renderCalendar()
            )}
          </GlassCard>
        </div>

        {/* Day details - takes 2 columns on large screens */}
        <div className="lg:col-span-2">
          <GlassCard className="!p-4 sm:!p-6 border border-[#110195]/10 shadow-sm h-full">
            <div className="flex items-center gap-2 mb-4 pb-3 border-b border-[#110195]/10">
              <FileText className="w-5 h-5 text-[#110195]" />
              <h2 className="text-lg font-serif font-bold text-gray-900">Daily Record</h2>
            </div>
            {loading ? (
              <div className="py-8 flex flex-col items-center justify-center gap-3">
                <Loader2 className="w-6 h-6 text-[#FC9905] animate-spin" />
                <p className="text-xs text-gray-500">Loading...</p>
              </div>
            ) : (
              renderDayDetails()
            )}
          </GlassCard>
        </div>
      </div>
    </div>
  );
}

export default Historique;