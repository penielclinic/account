import { supabase } from '@/lib/supabase/client';
import type { Member } from '@/types';

// 이음 플랫폼 교적 데이터 — 읽기 전용 (CLAUDE.md §1 규칙 3)
export async function searchMembers(query: string): Promise<Member[]> {
  const { data, error } = await supabase
    .from('members')
    .select('id, name, cell_id, mission_id')
    .ilike('name', `%${query}%`)
    .limit(20);

  if (error) throw error;
  return data ?? [];
}

export async function getMemberById(id: string): Promise<Member | null> {
  const { data, error } = await supabase
    .from('members')
    .select('id, name, cell_id, mission_id')
    .eq('id', id)
    .single();

  if (error) return null;
  return data;
}
