# DATA_MODEL.md — 데이터 모델

> Claude Code가 DB 작업을 할 때 반드시 참조하는 스키마 문서입니다.
> 변경 시 이 문서와 실제 마이그레이션 파일을 함께 업데이트하세요.

---

## 스키마 분리 원칙

| 스키마 | 소유 | 용도 |
|---|---|---|
| `public` | 이음 플랫폼 | members, cells, missions 등 (회계는 **읽기 전용**) |
| `accounting` | 회계 모듈 | 본 모듈 전용 테이블 |
| `auth` | Supabase | 인증 (직접 수정 금지) |

---

## accounting 스키마 테이블 (7개)

### 1. `accounting.transactions` — 거래내역

가장 핵심 테이블. 모든 수입/지출이 여기에 기록됩니다.

```sql
CREATE TABLE accounting.transactions (
  id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),

  -- 기본 정보
  transaction_date DATE NOT NULL,
  type            TEXT NOT NULL CHECK (type IN ('income', 'expense')),
  account_id      UUID NOT NULL REFERENCES accounting.accounts(id),
  amount          NUMERIC(15, 2) NOT NULL CHECK (amount > 0),

  -- 상세 정보
  description     TEXT NOT NULL,
  vendor          TEXT,                          -- 거래처
  payment_method  TEXT,                          -- 현금/계좌이체/카드 등
  memo            TEXT,

  -- 이음 플랫폼 연동 (모두 nullable)
  related_member_id   UUID REFERENCES public.members(id),
  related_cell_id     UUID REFERENCES public.cells(id),
  related_mission_id  UUID REFERENCES public.missions(id),

  -- 입력 방식 추적
  input_method    TEXT CHECK (input_method IN
    ('manual', 'receipt_ocr', 'bank_csv', 'voice', 'pdf')),
  ai_confidence   NUMERIC(3, 2),                 -- AI 추출 시 0.00 ~ 1.00

  -- 결재 상태
  status          TEXT DEFAULT 'recorded' CHECK (status IN
    ('recorded', 'pending_approval', 'approved', 'rejected')),

  -- 감사 추적
  created_by      UUID NOT NULL REFERENCES auth.users(id),
  created_at      TIMESTAMPTZ DEFAULT now(),
  approved_by     UUID REFERENCES auth.users(id),
  approved_at     TIMESTAMPTZ,
  updated_at      TIMESTAMPTZ DEFAULT now()
);

CREATE INDEX idx_transactions_date ON accounting.transactions(transaction_date DESC);
CREATE INDEX idx_transactions_account ON accounting.transactions(account_id);
CREATE INDEX idx_transactions_member ON accounting.transactions(related_member_id);
CREATE INDEX idx_transactions_status ON accounting.transactions(status);
```

---

### 2. `accounting.accounts` — 계정과목

수입/지출 분류 체계. 2~3단계 계층 구조.

```sql
CREATE TABLE accounting.accounts (
  id            UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  code          TEXT UNIQUE NOT NULL,           -- 예: '4101' (수입), '5301' (지출)
  name          TEXT NOT NULL,                  -- 예: '주일헌금'
  parent_id     UUID REFERENCES accounting.accounts(id),
  type          TEXT NOT NULL CHECK (type IN ('income', 'expense')),
  description   TEXT,
  is_active     BOOLEAN DEFAULT TRUE,
  sort_order    INTEGER DEFAULT 0,
  created_at    TIMESTAMPTZ DEFAULT now()
);
```

**시드 데이터 (수입)**:
- 4100 헌금
  - 4101 주일헌금
  - 4102 십일조
  - 4103 감사헌금
  - 4104 선교헌금
  - 4105 건축헌금
  - 4106 특별헌금
- 4200 기타수입

**시드 데이터 (지출)**:
- 5100 인건비 (사례비, 4대보험, 퇴직급여)
- 5200 관리운영비 (공과금, 통신비, 사무용품, 차량유지비)
- 5300 사역비 (예배사역, 교육사역, 청년부, 주일학교)
- 5400 선교비 (국내선교, 해외선교, 선교사 후원)
- 5500 심방·구제비
- 5600 시설비
- 5700 기타지출

---

### 3. `accounting.budgets` — 예산

연도·계정과목별 예산 계획.

```sql
CREATE TABLE accounting.budgets (
  id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  fiscal_year     INTEGER NOT NULL,             -- 예: 2026
  account_id      UUID NOT NULL REFERENCES accounting.accounts(id),
  planned_amount  NUMERIC(15, 2) NOT NULL,
  notes           TEXT,
  created_at      TIMESTAMPTZ DEFAULT now(),
  updated_at      TIMESTAMPTZ DEFAULT now(),
  UNIQUE(fiscal_year, account_id)
);
```

---

### 4. `accounting.attachments` — 첨부파일

영수증·증빙 이미지/PDF.

```sql
CREATE TABLE accounting.attachments (
  id                  UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  transaction_id      UUID NOT NULL REFERENCES accounting.transactions(id) ON DELETE CASCADE,
  file_url            TEXT NOT NULL,            -- Supabase Storage URL
  file_type           TEXT NOT NULL,            -- 'image/jpeg', 'application/pdf' 등
  file_size           INTEGER,
  original_filename   TEXT,
  ocr_extracted_text  TEXT,                     -- AI가 추출한 원본 텍스트
  uploaded_by         UUID NOT NULL REFERENCES auth.users(id),
  uploaded_at         TIMESTAMPTZ DEFAULT now()
);
```

**Storage 버킷**: `accounting-receipts` (RLS 적용)

---

### 5. `accounting.user_roles` — 회계 모듈 권한

이음 플랫폼의 사용자 중 회계 모듈에 접근 가능한 사람만 등록.

```sql
CREATE TABLE accounting.user_roles (
  id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id     UUID UNIQUE NOT NULL REFERENCES auth.users(id),
  role        TEXT NOT NULL CHECK (role IN
    ('finance_officer', 'senior_pastor', 'executive_elder', 'auditor')),
  is_active   BOOLEAN DEFAULT TRUE,
  granted_by  UUID REFERENCES auth.users(id),
  granted_at  TIMESTAMPTZ DEFAULT now()
);
```

---

### 6. `accounting.audit_logs` — 변경 이력

모든 INSERT/UPDATE/DELETE를 자동 기록 (Postgres trigger).

```sql
CREATE TABLE accounting.audit_logs (
  id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  table_name  TEXT NOT NULL,
  record_id   UUID NOT NULL,
  action      TEXT NOT NULL CHECK (action IN ('INSERT', 'UPDATE', 'DELETE')),
  before_data JSONB,
  after_data  JSONB,
  user_id     UUID REFERENCES auth.users(id),
  timestamp   TIMESTAMPTZ DEFAULT now()
);

CREATE INDEX idx_audit_table_record ON accounting.audit_logs(table_name, record_id);
CREATE INDEX idx_audit_timestamp ON accounting.audit_logs(timestamp DESC);
```

**Trigger 적용 대상**: `transactions`, `budgets`, `accounts`, `user_roles`

---

### 7. `accounting.ai_queries` — AI 질의 로그

자연어 질의응답 이력.

```sql
CREATE TABLE accounting.ai_queries (
  id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id         UUID NOT NULL REFERENCES auth.users(id),
  question        TEXT NOT NULL,
  sql_generated   TEXT,
  sql_validated   BOOLEAN,                      -- SELECT-only 검증 통과 여부
  response        JSONB,                        -- 답변 + 차트 데이터
  tokens_used     INTEGER,
  cost_usd        NUMERIC(8, 4),
  duration_ms     INTEGER,
  created_at      TIMESTAMPTZ DEFAULT now()
);
```

---

## RLS 정책 요약

```sql
-- transactions 예시
CREATE POLICY "finance_officer_full_access" ON accounting.transactions
  FOR ALL
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM accounting.user_roles
      WHERE user_id = auth.uid()
        AND role = 'finance_officer'
        AND is_active = TRUE
    )
  );

CREATE POLICY "leaders_read_only" ON accounting.transactions
  FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM accounting.user_roles
      WHERE user_id = auth.uid()
        AND role IN ('senior_pastor', 'executive_elder', 'auditor')
        AND is_active = TRUE
    )
  );
```

---

## 마이그레이션 파일 규칙

`supabase/migrations/` 아래에 시간순 prefix로 저장:

```
20260415_001_create_accounting_schema.sql
20260415_002_create_accounts_table.sql
20260415_003_create_transactions_table.sql
20260415_004_create_budgets_table.sql
20260415_005_create_attachments_table.sql
20260415_006_create_audit_logs_table.sql
20260415_007_create_user_roles_table.sql
20260415_008_create_ai_queries_table.sql
20260415_009_add_audit_triggers.sql
20260415_010_setup_rls_policies.sql
20260415_011_seed_accounts.sql
```

---

## 주요 쿼리 예시 (자연어 질의 학습용)

### 이번 달 총 지출
```sql
SELECT SUM(amount) AS total_expense
FROM accounting.transactions
WHERE type = 'expense'
  AND transaction_date >= date_trunc('month', CURRENT_DATE)
  AND transaction_date < date_trunc('month', CURRENT_DATE) + interval '1 month';
```

### 작년 동월 대비 선교비 비교
```sql
SELECT
  date_trunc('month', t.transaction_date) AS month,
  SUM(t.amount) AS amount
FROM accounting.transactions t
JOIN accounting.accounts a ON t.account_id = a.id
WHERE a.code LIKE '54%'    -- 선교비 계열
  AND t.transaction_date >= CURRENT_DATE - INTERVAL '13 months'
GROUP BY month
ORDER BY month;
```

### ○○순의 활동비 (이음 통합 예시)
```sql
SELECT t.transaction_date, t.amount, t.description
FROM accounting.transactions t
JOIN public.cells c ON t.related_cell_id = c.id
WHERE c.name = '베드로순'
  AND t.transaction_date >= date_trunc('year', CURRENT_DATE)
ORDER BY t.transaction_date DESC;
```
