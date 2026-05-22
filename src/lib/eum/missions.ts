import { supabase } from '@/lib/supabase/client';
import type { Mission } from '@/types';

// 이음 플랫폼 선교회 데이터 — 읽기 전용 (12개 선교회)
export async function getAllMissions(): Promise<Mission[]> {
  const { data, error } = await supabase
    .from('missions')
    .select('id, name, code')
    .order('code');

  if (error) throw error;
  return data ?? [];
}

export async function getMissionById(id: string): Promise<Mission | null> {
  const { data, error } = await supabase
    .from('missions')
    .select('id, name, code')
    .eq('id', id)
    .single();

  if (error) return null;
  return data;
}
