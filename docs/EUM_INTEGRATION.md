# EUM_INTEGRATION.md — 이음(Eum) 플랫폼 연동 가이드

> 회계 모듈을 이음 플랫폼의 다른 모듈(교적·순보고·대심방·선교회 관리 등)과 연결하는 방법.

---

## 통합 철학

회계 모듈은 **독립 데스크탑 앱**이지만, 이음 플랫폼의 데이터를 활용해야 더 가치가 큽니다.

| 원칙 | 의미 |
|---|---|
| **Read-Only Boundary** | 회계는 이음 데이터를 **읽기만** 합니다. 쓰지 않습니다. |
| **Schema Separation** | 회계 전용 데이터는 `accounting` 스키마에 격리합니다. |
| **Foreign Key Soft-Link** | `related_member_id` 등은 nullable FK로 약하게 연결. 멤버 삭제돼도 거래는 남습니다. |
| **One Source of Truth** | 성도 정보는 교적 앱이 유일한 소스. 회계는 캐시·미러링 하지 않습니다. |

---

## 1. 공유 인프라

### Supabase 프로젝트
- 이음 플랫폼과 **동일 Supabase 프로젝트**를 사용합니다.
- 환경변수:
  ```bash
  NEXT_PUBLIC_SUPABASE_URL=https://xxxxx.supabase.co
  NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJ...
  SUPABASE_SERVICE_ROLE_KEY=eyJ...   # 서버 전용
  SUPABASE_READONLY_KEY=eyJ...        # AI 질의 전용 read-only role
  ```

### 인증
- 이음 플랫폼 계정으로 로그인 (Supabase Auth)
- 회계 권한은 별도 `accounting.user_roles`에서 관리

---

## 2. 이음 데이터 접근 레이어 (`src/lib/eum/`)

회계 모듈에서 이음 데이터를 읽을 때는 반드시 이 레이어를 통과합니다. 직접 `public.*` 테이블에 SELECT 하지 마세요.

### 2.1 `members.ts` — 성도 정보

```typescript
import { supabase } from '@/lib/supabase/client';

export interface EumMember {
  id: string;
  name: string;
  birth_date: string | null;
  cell_id: string | null;
  mission_ids: string[];
  phone: string | null;
  is_active: boolean;
}

/**
 * 이름으로 성도 검색 (자동완성용)
 * @example 심방비 입력 시 받은 사람 선택
 */
export async function searchMembers(query: string): Promise<EumMember[]> {
  const { data, error } = await supabase
    .from('members')
    .select('id, name, birth_date, cell_id, phone, is_active')
    .ilike('name', `%${query}%`)
    .eq('is_active', true)
    .order('name')
    .limit(20);

  if (error) throw error;
  return data;
}

/**
 * ID로 성도 단건 조회 (거래 상세 화면에서 이름 표시용)
 */
export async function getMemberById(id: string): Promise<EumMember | null> {
  const { data } = await supabase
    .from('members')
    .select('id, name, birth_date, cell_id, phone, is_active')
    .eq('id', id)
    .single();
  return data;
}
```

### 2.2 `cells.ts` — 순(셀그룹)

```typescript
export interface EumCell {
  id: string;
  name: string;
  mission_id: string;
  leader_member_id: string | null;
  member_count: number;
}

export async function listAllCells(): Promise<EumCell[]> {
  const { data } = await supabase
    .from('cells')
    .select('id, name, mission_id, leader_member_id')
    .eq('is_active', true)
    .order('name');
  return data ?? [];
}
```

### 2.3 `missions.ts` — 선교회

```typescript
export interface EumMission {
  id: string;
  name: string;          // '남선교회', '여선교회', '청년부' 등
  cell_count: number;
}

export async function listAllMissions(): Promise<EumMission[]> {
  const { data } = await supabase
    .from('missions')
    .select('id, name')
    .eq('is_active', true)
    .order('display_order');
  return data ?? [];
}
```

---

## 3. 거래 입력 시 이음 연결 UX

### 시나리오 A: 심방비 지출
1. 재무 담당자가 거래 입력 폼에서 계정과목 = "심방비" 선택
2. UI가 자동으로 **"받은 분 (선택)"** 필드 노출
3. 이름 자동완성으로 성도 검색 (`searchMembers`)
4. 선택 시 `related_member_id` 자동 채워짐
5. 저장 후 상세 화면에 "○○ 집사 심방" 표시

### 시나리오 B: 선교회 활동비
1. 계정과목 = "선교회 활동비" 선택
2. **"선교회 (선택)"** 필드 노출
3. `listAllMissions()`로 12개 선교회 드롭다운
4. 선택 → `related_mission_id` 저장

### 시나리오 C: 순별 식사비
1. 계정과목 = "순 식사비" 선택
2. **"순 (선택)"** 필드 노출
3. `listAllCells()`로 44개 순 드롭다운
4. 선택 → `related_cell_id` 저장

---

## 4. AI 자연어 질의 통합

이음 데이터와 회계 데이터를 함께 질의할 수 있도록, AI 시스템 프롬프트에 **JOIN 가능한 테이블 정보**를 제공합니다.

### 시스템 프롬프트에 포함할 스키마 정보

```
다음 테이블에 SELECT 쿼리를 작성하세요:

## 회계 테이블 (accounting 스키마)
- accounting.transactions (id, transaction_date, type, amount, description,
    account_id, related_member_id, related_cell_id, related_mission_id, ...)
- accounting.accounts (id, code, name, type)
- accounting.budgets (fiscal_year, account_id, planned_amount)

## 이음 플랫폼 테이블 (public 스키마, JOIN 가능)
- public.members (id, name, cell_id, ...)
- public.cells (id, name, mission_id)
- public.missions (id, name)

## 주의사항
- SELECT만 허용
- 이음 테이블은 읽기 전용
- 거래는 t.related_*_id로 이음 테이블과 JOIN
```

### 예상 질의 예시

| 질문 | 생성될 쿼리 |
|---|---|
| "○○순의 작년 활동비" | `transactions JOIN cells WHERE cells.name = '○○순'` |
| "남선교회 올해 헌금 총액" | `transactions JOIN missions WHERE missions.name = '남선교회'` |
| "김OO 집사 심방비 받은 횟수" | `transactions JOIN members WHERE members.name = '김OO'` |
| "선교회별 올해 활동비 순위" | `GROUP BY missions.name ORDER BY SUM(amount) DESC` |

---

## 5. 보안: AI가 이음 데이터에 쓰기 못하게 막기

```sql
-- AI 질의 전용 read-only role
CREATE ROLE accounting_ai_reader NOLOGIN;

-- 회계 테이블 SELECT 권한
GRANT USAGE ON SCHEMA accounting TO accounting_ai_reader;
GRANT SELECT ON ALL TABLES IN SCHEMA accounting TO accounting_ai_reader;

-- 이음 테이블 SELECT 권한 (제한적으로)
GRANT USAGE ON SCHEMA public TO accounting_ai_reader;
GRANT SELECT (id, name, cell_id, mission_id) ON public.members TO accounting_ai_reader;
GRANT SELECT (id, name, mission_id) ON public.cells TO accounting_ai_reader;
GRANT SELECT (id, name) ON public.missions TO accounting_ai_reader;

-- 다른 모든 권한은 자동으로 거부됨 (INSERT/UPDATE/DELETE 불가)
```

회계 모듈은 AI 질의 시 `SUPABASE_READONLY_KEY`로 연결된 클라이언트를 사용합니다.

---

## 6. 통합 대시보드 (선택 — 향후 확장)

장기적으로 이음 플랫폼 통합 대시보드에서 회계 핵심 지표를 보여줄 수 있습니다.

### Edge Function: `/api/eum/finance-summary`
이음 플랫폼의 다른 모듈에서 호출할 수 있는 API.

```typescript
// supabase/functions/finance-summary/index.ts
// 반환: 당월 수입/지출/잉여금/예산 집행률
// 단, 담임목사·시무장로 권한만 호출 가능
```

이 부분은 **Phase 5 이후**에 추가 검토합니다.

---

## 7. 통합 체크리스트

각 PR에서 이음 통합 코드를 추가할 때 다음을 확인하세요:

- [ ] 이음 테이블 직접 접근 금지 — `src/lib/eum/`만 사용
- [ ] 외부 키는 모두 nullable + ON DELETE SET NULL
- [ ] 캐싱이 필요하면 TanStack Query의 staleTime 설정 (실시간이 아닌 5분)
- [ ] 이음 데이터 변경 (성도 이름 등) 시 회계 거래에는 영향 없음 검증
- [ ] AI 질의 시 read-only role 사용 검증

---

## 8. 충돌 방지

| 상황 | 해결 |
|---|---|
| 이음에서 성도 삭제 | `related_member_id`가 NULL이 되고, 거래 표시는 "삭제된 성도"로 fallback |
| 이음에서 순 통폐합 | `related_cell_id`는 그대로 유지 (구 순 ID), 분석 시 별도 매핑 테이블 사용 |
| 이음 Supabase URL 변경 | 환경변수 한 곳만 수정하면 됨 (동일 프로젝트라 거의 발생 안 함) |
