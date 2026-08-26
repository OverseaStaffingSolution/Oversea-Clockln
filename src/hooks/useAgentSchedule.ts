import { useState, useEffect } from 'react';
import { supabase } from '../services/supabase';
import { cacheService } from '../services/cacheService';

export interface AgentSchedule {
  heure_debut: string | null;
  heure_fin: string | null;
  jours_travailles: string[] | null;
  loading: boolean;
  error: Error | null;
}

export function useAgentSchedule(agentId: string | undefined): AgentSchedule {
  const [schedule, setSchedule] = useState<AgentSchedule>(() => {
    if (!agentId) {
      return {
        heure_debut: null,
        heure_fin: null,
        jours_travailles: null,
        loading: false,
        error: null,
      };
    }

    const cached = cacheService.get<{
      heure_debut: string | null;
      heure_fin: string | null;
      jours_travailles: string[] | null;
    }>(`agent_schedule_${agentId}`);

    if (cached) {
      return {
        heure_debut: cached.heure_debut || null,
        heure_fin: cached.heure_fin || null,
        jours_travailles: cached.jours_travailles || null,
        loading: false,
        error: null,
      };
    }

    return {
      heure_debut: null,
      heure_fin: null,
      jours_travailles: null,
      loading: true,
      error: null,
    };
  });

  useEffect(() => {
    if (!agentId) {
      setSchedule(prev => ({ ...prev, loading: false }));
      return;
    }

    let isMounted = true;

    const fetchSchedule = async () => {
      try {
        const { data, error } = await supabase
          .from('agents')
          .select('heure_debut, heure_fin, jours_travailles')
          .eq('id', agentId)
          .maybeSingle();

        if (error) throw error;

        const result = {
          heure_debut: data?.heure_debut || null,
          heure_fin: data?.heure_fin || null,
          jours_travailles: data?.jours_travailles || null,
        };

        cacheService.set(`agent_schedule_${agentId}`, result, 60); // Cache 60 min

        if (isMounted) {
          setSchedule({
            ...result,
            loading: false,
            error: null,
          });
        }
      } catch (err) {
        console.error('Erreur chargement horaires agent:', err);
        if (isMounted) {
          setSchedule(prev => ({
            ...prev,
            loading: false,
            error: err instanceof Error ? err : new Error('Erreur inconnue'),
          }));
        }
      }
    };

    fetchSchedule();

    return () => {
      isMounted = false;
    };
  }, [agentId]);

  return schedule;
}
