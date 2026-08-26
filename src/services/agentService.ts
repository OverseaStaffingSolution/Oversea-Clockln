import { supabase, Agent } from './supabase'

export async function getAgent(agentId: string): Promise<Agent | null> {
  const { data, error } = await supabase
    .from('agents')
    .select('*')
    .eq('id', agentId)
    .single()

  if (error) throw error
  return data as Agent
}

export async function getAgentByEmail(email: string): Promise<Agent | null> {
  const { data, error } = await supabase
    .from('agents')
    .select('*')
    .eq('email', email)
    .single()

  if (error) throw error
  return data as Agent
}

export async function isManager(agentId: string): Promise<boolean> {
  const agent = await getAgent(agentId)
  return agent?.role === 'manager'
}

export async function getActiveAgents(): Promise<Agent[]> {
  const { data, error } = await supabase
    .from('agents')
    .select('*')
    .eq('actif', true)
    .order('nom', { ascending: true })

  if (error) throw error
  return (data || []) as Agent[]
}
