// ─── 기본 열거형 ─────────────────────────────────────────────

export type TransactionType = 'income' | 'expense';
export type AccountType = 'revenue' | 'expense' | 'asset' | 'liability' | 'equity';
export type UserRole = 'finance_officer' | 'senior_pastor' | 'executive_elder' | 'auditor';
export type TransactionStatus = 'recorded' | 'pending_approval' | 'approved' | 'rejected';
export type InputMethod = 'manual' | 'receipt_ocr' | 'bank_csv' | 'voice' | 'pdf';

// ─── 회계 모듈 타입 ──────────────────────────────────────────

export interface Transaction {
  id: string;
  transaction_date: string;
  type: TransactionType;
  account_id: string;
  amount: number;
  description: string;
  vendor: string | null;
  payment_method: string | null;
  memo: string | null;
  related_member_id: string | null;
  related_cell_id: string | null;
  related_mission_id: string | null;
  input_method: InputMethod | null;
  ai_confidence: number | null;
  status: TransactionStatus;
  created_by: string;
  created_at: string;
  approved_by: string | null;
  approved_at: string | null;
  updated_at: string;
}

export interface Account {
  id: string;
  code: string;
  name: string;
  type: AccountType;
  parent_id: string | null;
  is_active: boolean;
  sort_order: number;
  created_at: string;
}

export interface Budget {
  id: string;
  account_id: string;
  year: number;
  month: number | null;
  amount: number;
  note: string | null;
  created_at: string;
}

export interface AuditLog {
  id: string;
  table_name: string;
  record_id: string;
  operation: 'INSERT' | 'UPDATE' | 'DELETE';
  old_values: Record<string, unknown> | null;
  new_values: Record<string, unknown> | null;
  changed_by: string;
  changed_at: string;
}

// ─── 이음 플랫폼 타입 (읽기 전용) ────────────────────────────

export interface Member {
  id: string;
  name: string;
  cell_id: string | null;
  mission_id: string | null;
}

export interface Cell {
  id: string;
  cell_number: number;
  leader_name: string;
  mission_id: string;
}

export interface Mission {
  id: string;
  name: string;
  code: string;
}

// ─── 인증 타입 ───────────────────────────────────────────────

export interface AuthUser {
  id: string;
  email: string;
  name: string;
  role: UserRole;
}

// ─── AI 관련 타입 ────────────────────────────────────────────

export interface OcrResult {
  date: string | null;
  amount: number | null;
  vendor: string | null;
  items: string[];
  rawText: string;
  confidence: number;
}

export interface NlqResult {
  sql: string;
  chartType: 'bar' | 'line' | 'pie' | 'table' | null;
  explanation: string;
}
