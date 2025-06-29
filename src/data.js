import { createClient } from '@supabase/supabase-js';

export const supabase = createClient(
  import.meta.env.VITE_SUPABASE_URL,
  import.meta.env.VITE_SUPABASE_ANON_KEY
);

// Actual schema fields may vary; adapt field names accordingly.
export async function fetchPositions() {
  const { data, error } = await supabase.from('positions').select('*');
  if (error) throw error;
  return data;
}

export async function fetchTrades(limit = 100) {
  const { data, error } = await supabase.from('trades').select('*').order('ts', {ascending:false}).limit(limit);
  if (error) throw error;
  return data;
}
