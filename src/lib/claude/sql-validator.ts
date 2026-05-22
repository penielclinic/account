// AI 생성 SQL의 안전성 검증 (CLAUDE.md §6 참조)
// SELECT-only 화이트리스트 — INSERT/UPDATE/DELETE/DDL 차단

const FORBIDDEN_KEYWORDS = [
  'INSERT',
  'UPDATE',
  'DELETE',
  'DROP',
  'ALTER',
  'TRUNCATE',
  'CREATE',
  'GRANT',
  'REVOKE',
  'EXECUTE',
  'EXEC',
];

export function validateSql(sql: string): void {
  const normalized = sql.trim().toUpperCase();

  // SELECT로 시작해야 함
  if (!/^\s*SELECT\b/i.test(sql)) {
    throw new Error(`SQL 검증 실패: SELECT로 시작하지 않습니다.\n${sql}`);
  }

  // 금지어 포함 여부 확인
  for (const keyword of FORBIDDEN_KEYWORDS) {
    const pattern = new RegExp(`\\b${keyword}\\b`, 'i');
    if (pattern.test(normalized)) {
      throw new Error(`SQL 검증 실패: 금지어 "${keyword}" 포함.\n${sql}`);
    }
  }

  // 세미콜론 이후 추가 구문 차단
  const withoutStrings = sql.replace(/'[^']*'/g, "''");
  const statements = withoutStrings.split(';').filter((s) => s.trim());
  if (statements.length > 1) {
    throw new Error('SQL 검증 실패: 여러 구문(;) 불허.\n' + sql);
  }
}
