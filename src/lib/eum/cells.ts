import { supabase } from '@/lib/supabase/client';
import type { Cell } from '@/types';

// 이음 플랫폼 순(셀그룹) 데이터 — 읽기 전용 (44개 순)
export async function getAllCells(): Promise<Cell[]> {
  const { data, error } = await supabase
    .from('cells')
    .select('id, cell_number, leader_name, mission_id')
    .order('cell_number');

  if (error) throw error;
  return data ?? [];
}

export async function getCellById(id: string): Promise<Cell | null> {
  const { data, error } = await supabase
    .from('cells')
    .select('id, cell_number, leader_name, mission_id')
    .eq('id', id)
    .single();

  if (error) return null;
  return data;
}
