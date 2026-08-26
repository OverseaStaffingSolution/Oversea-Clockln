// Service pour les appels aux fonctions PostgreSQL Supabase et gestion des pointages
import { supabase } from './supabase';
import { cacheService } from './cacheService';

export interface PointageRecord {
  id?: string | number;
  agent_id: string;
  date: string; // YYYY-MM-DD
  heure_arrivee?: string | null;
  heure_depart?: string | null;
  clock_in_time?: string | null;
  clock_out_time?: string | null;
  arrivee_latitude?: number | null;
  arrivee_longitude?: number | null;
  arrivee_precision?: number | null;
  depart_latitude?: number | null;
  depart_longitude?: number | null;
  depart_precision?: number | null;
  duree?: string | number | null;
  duree_texte?: string | null;
  duree_minutes?: number | null;
  statut?: 'EN_COURS' | 'VALIDE' | 'ANOMALIE' | 'CORRIGE' | 'OK' | string;
  [key: string]: any;
}

export interface SiteInfo {
  id?: number | string;
  nom?: string;
  name?: string;
  latitude: number;
  longitude: number;
  rayon_metres: number;
  adresse?: string;
  [key: string]: any;
}

export interface ClockResponse {
  success: boolean;
  message: string;
  statut?: string;
  heure?: string;
  distance?: number;
  pointage_id?: number | string;
  duree?: string | null;
  duree_texte?: string | null;
  error?: string;
}

/**
 * Appelle la fonction RPC clock_in avec la position GPS
 */
export async function clockIn(
  agentId: string,
  latitude: number,
  longitude: number,
  precision: number,
  ip?: string | null
): Promise<ClockResponse> {
  try {
    const roundedPrecision = Math.round(precision || 0);

    // 1. Appel RPC Supabase PostgreSQL
    const { data, error } = await supabase.rpc('clock_in', {
      p_agent_id: agentId,
      p_latitude: latitude,
      p_longitude: longitude,
      p_precision: roundedPrecision,
      p_ip: ip || null
    });

    if (error) {
      console.warn('RPC clock_in retourné avec erreur:', error);
      return {
        success: false,
        error: error.message,
        message: error.message || "Erreur lors de l'enregistrement de l'arrivée"
      };
    }

    // Invalider le cache du pointage du jour et de l'historique
    cacheService.remove(`today_pointage_${agentId}`);
    cacheService.invalidatePattern(`historique_${agentId}`);

    if (data && typeof data === 'object') {
      return {
        success: data.success !== false,
        message: data.message || "Arrivée enregistrée avec succès",
        statut: data.statut || 'OK',
        heure: data.heure,
        distance: data.distance,
        pointage_id: data.pointage_id
      };
    }

    return {
      success: true,
      message: "Arrivée enregistrée avec succès",
      statut: "OK",
      heure: new Date().toISOString()
    };
  } catch (err: any) {
    console.error('Exception in clockIn:', err);
    return {
      success: false,
      error: err.message,
      message: err.message || 'Erreur de connexion au serveur'
    };
  }
}

/**
 * Appelle la fonction RPC clock_out avec la position GPS
 */
export async function clockOut(
  agentId: string,
  latitude: number,
  longitude: number,
  precision: number,
  ip?: string | null
): Promise<ClockResponse> {
  try {
    const roundedPrecision = Math.round(precision || 0);

    // 1. Appel RPC Supabase PostgreSQL
    const { data, error } = await supabase.rpc('clock_out', {
      p_agent_id: agentId,
      p_latitude: latitude,
      p_longitude: longitude,
      p_precision: roundedPrecision,
      p_ip: ip || null
    });

    if (error) {
      console.warn('RPC clock_out retourné avec erreur:', error);
      return {
        success: false,
        error: error.message,
        message: error.message || "Erreur lors de l'enregistrement du départ"
      };
    }

    // Invalider le cache du pointage du jour et de l'historique
    cacheService.remove(`today_pointage_${agentId}`);
    cacheService.invalidatePattern(`historique_${agentId}`);

    if (data && typeof data === 'object') {
      return {
        success: data.success !== false,
        message: data.message || "Départ enregistré avec succès",
        statut: data.statut || 'OK',
        heure: data.heure,
        duree: data.duree,
        duree_texte: data.duree_texte,
        distance: data.distance,
        pointage_id: data.pointage_id
      };
    }

    return {
      success: true,
      message: "Départ enregistré avec succès",
      statut: "OK",
      heure: new Date().toISOString()
    };
  } catch (err: any) {
    console.error('Exception in clockOut:', err);
    return {
      success: false,
      error: err.message,
      message: err.message || 'Erreur de connexion au serveur'
    };
  }
}

/**
 * Récupère le pointage du jour pour un agent avec mise en cache ultra-rapide
 */
export async function getTodayPointage(
  agentId: string,
  skipCache = false
): Promise<PointageRecord | null> {
  const cacheKey = `today_pointage_${agentId}`;
  
  if (!skipCache) {
    const cached = cacheService.get<PointageRecord>(cacheKey);
    if (cached !== null) {
      return cached;
    }
  }

  try {
    const today = new Date().toISOString().split('T')[0]; // YYYY-MM-DD

    const { data, error } = await supabase
      .from('pointages')
      .select('*')
      .eq('agent_id', agentId)
      .eq('date', today)
      .maybeSingle();

    if (error) {
      console.warn('Avertissement récupération pointage du jour:', error);
      return cacheService.get<PointageRecord>(cacheKey);
    }

    if (!data) {
      return null;
    }

    const record: PointageRecord = {
      ...data,
      clock_in_time: data.clock_in_time || data.heure_arrivee || null,
      clock_out_time: data.clock_out_time || data.heure_depart || null,
      heure_arrivee: data.heure_arrivee || data.clock_in_time || null,
      heure_depart: data.heure_depart || data.clock_out_time || null,
      duree: data.duree || data.duree_texte || data.duree_minutes || null,
      duree_texte: data.duree_texte || data.duree || null
    };

    cacheService.set(cacheKey, record, 3, true);
    return record;
  } catch (err) {
    console.error('Exception in getTodayPointage:', err);
    return cacheService.get<PointageRecord>(cacheKey);
  }
}

/**
 * Récupère les informations du site (call center) avec cache 24h persistant
 */
export async function getSiteInfo(): Promise<SiteInfo | null> {
  const cacheKey = 'call_center_site_info';
  const cached = cacheService.get<SiteInfo>(cacheKey);
  if (cached !== null) {
    return cached;
  }

  const defaultSite: SiteInfo = {
    id: 1,
    nom: 'Call Center Oversea (Delmas)',
    latitude: 18.551058,
    longitude: -72.280095,
    rayon_metres: 100,
    adresse: 'Delmas 75, Port-au-Prince, Haïti'
  };

  try {
    const { data, error } = await supabase
      .from('site')
      .select('*')
      .limit(1)
      .maybeSingle();

    if (error) {
      console.warn('Site non trouvé dans la table "site", utilisation des valeurs par défaut:', error);
    }

    if (data) {
      const siteInfo: SiteInfo = {
        id: data.id || 1,
        nom: data.nom || data.name || defaultSite.nom,
        latitude: Number(data.latitude) || defaultSite.latitude,
        longitude: Number(data.longitude) || defaultSite.longitude,
        rayon_metres: Number(data.rayon_metres || data.rayon) || defaultSite.rayon_metres,
        adresse: data.adresse || defaultSite.adresse
      };
      cacheService.set(cacheKey, siteInfo, 1440, true); // Cache 24 heures
      return siteInfo;
    }

    cacheService.set(cacheKey, defaultSite, 1440, true);
    return defaultSite;
  } catch (err) {
    console.warn('Exception in getSiteInfo, retour aux valeurs par défaut:', err);
    cacheService.set(cacheKey, defaultSite, 1440, true);
    return defaultSite;
  }
}

