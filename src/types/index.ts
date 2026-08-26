/**
 * Centralized Type Definitions for Oversea ClockIn
 * Adheres strictly to Clean Architecture and strict TypeScript typing.
 */

export interface Agent {
  id: string;
  email: string;
  nom: string;
  prenom: string;
  role: 'agent' | 'manager' | 'admin' | string;
  actif: boolean;
  telephone?: string | null;
  matricule?: string | null;
  site_id?: string | number | null;
  created_at?: string;
  updated_at?: string;
  [key: string]: unknown;
}

export type PointageStatus = 'VALIDE' | 'HORS_ZONE' | 'CORRIGE' | 'EN_ATTENTE' | string;

export interface PointageRecord {
  id?: number | string;
  agent_id: string;
  date: string;
  clock_in_time?: string | null;
  clock_in_lat?: number | null;
  clock_in_lng?: number | null;
  clock_in_statut?: PointageStatus | null;
  clock_in_ip?: string | null;
  clock_out_time?: string | null;
  clock_out_lat?: number | null;
  clock_out_lng?: number | null;
  clock_out_statut?: PointageStatus | null;
  clock_out_ip?: string | null;
  duree?: string | null;
  heure_arrivee?: string | null;
  heure_depart?: string | null;
  statut_arrivee?: PointageStatus | null;
  statut_depart?: PointageStatus | null;
  synchronise?: boolean;
  created_at?: string;
  updated_at?: string;
  [key: string]: unknown;
}

export type CorrectionType = 'IN' | 'OUT' | 'JOURNEE_COMPLETE';
export type CorrectionStatus = 'EN_ATTENTE' | 'APPROUVEE' | 'REJETEE';

export interface CorrectionRecord {
  id?: number | string;
  agent_id: string;
  date: string;
  type: CorrectionType | string;
  heure_souhaitee?: string;
  heure?: string;
  raison: string;
  statut: CorrectionStatus | string;
  commentaire_manager?: string | null;
  created_at?: string;
  traite_le?: string | null;
  traite_par?: string | null;
  [key: string]: unknown;
}

export interface Coordinates {
  latitude: number;
  longitude: number;
}

export interface SiteInfo {
  id?: string | number;
  nom: string;
  latitude: number;
  longitude: number;
  rayon_metres: number;
  adresse?: string;
  actif?: boolean;
}

export interface ScheduleDay {
  jour_semaine: number; // 0 = Dimanche, 1 = Lundi, ...
  heure_debut: string; // '08:00'
  heure_fin: string; // '17:00'
  actif: boolean;
}

export interface AgentSchedule {
  agent_id: string;
  schedules: ScheduleDay[];
}

export interface CacheEntry<T> {
  data: T;
  timestamp: number;
  ttl: number;
  version?: number;
}
