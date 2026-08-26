import { createClient } from '@supabase/supabase-js'
import { cacheService } from './cacheService'

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY

if (!supabaseUrl || !supabaseAnonKey) {
  console.warn('Missing Supabase environment variables: VITE_SUPABASE_URL and VITE_SUPABASE_ANON_KEY')
}

export const supabase = createClient(
  supabaseUrl || 'https://placeholder.supabase.co', 
  supabaseAnonKey || 'placeholder'
)

export interface Agent {
  id: string;
  email: string;
  nom: string;
  prenom: string;
  role: string;
  actif: boolean;
  [key: string]: any;
}

export async function getCurrentAgent(): Promise<Agent | null> {
  const cacheKey = 'current_agent_profile';
  const cached = cacheService.get<Agent>(cacheKey);
  if (cached) {
    // Return cached immediately, trigger background refresh if online
    supabase.auth.getUser().then(({ data: { user } }) => {
      if (user) {
        supabase
          .from('agents')
          .select('*')
          .eq('id', user.id)
          .single()
          .then(({ data }) => {
            if (data) cacheService.set(cacheKey, data, 60, true);
          });
      }
    }).catch(() => {});
    return cached;
  }

  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return null
  
  const { data, error } = await supabase
    .from('agents')
    .select('*')
    .eq('id', user.id)
    .single()
  
  if (error) {
    console.error('Error fetching agent:', error)
    return null
  }

  if (data) {
    cacheService.set(cacheKey, data, 60, true);
  }
  return data as Agent
}

