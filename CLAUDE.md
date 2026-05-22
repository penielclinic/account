# CLAUDE.md — 이음(Eum) 회계 모듈

> **이 문서는 Claude Code가 매 세션 시작 시 가장 먼저 읽어야 하는 핵심 컨텍스트입니다.**
> 모든 다른 .md 파일보다 우선순위가 높으며, 충돌 시 이 문서를 따릅니다.

---

## 0. 빠른 컨텍스트 (Quick Context)

- **프로젝트명**: 이음 회계 모듈 (Eum Accounting)
- **소속**: 해운대순복음교회 이음(Eum) 통합 플랫폼의 11번째 모듈
- **유형**: Electron 데스크탑 앱 (Windows 전용 .exe)
- **사용자**: 재무 담당자 1~2명, 담임목사·시무장로 (열람·승인)
- **개발자**: 원장님 (PM/기획) + 박경원 장로 (Lead Dev/Reviewer)
- **목적**: 교회 회계를 AI 기반으로 자동화하고, 이음 플랫폼의 교적·순보고 데이터와 연결

---

## 1. 절대 규칙 (NEVER VIOLATE)

1. **이 모듈은 데스크탑 전용입니다.** 모바일 UI 분기, 반응형 디자인은 작성하지 않습니다.
2. **모든 DB 테이블은 `accounting` 스키마에 생성**합니다. `public` 스키마에 직접 만들지 마세요.
3. **`members` 테이블은 읽기 전용**입니다. 회계 모듈은 절대 members를 INSERT/UPDATE/DELETE 하지 않습니다. (교적 앱이 소유)
4. **AI 자연어 질의는 SELECT만 허용**합니다. INSERT/UPDATE/DELETE는 SQL 화이트리스트로 차단하세요.
5. **민감 데이터(주민번호 등)는 절대 저장 금지**입니다. 입력 폼에서도 차단하세요.
6. **모든 변경은 `audit_logs`에 자동 기록**되어야 합니다. Postgres trigger로 강제합니다.
7. **세션 종료 전 반드시 `docs/SESSIONS.md`를 업데이트**하세요.
8. **PR을 만들기 전 박경원 장로의 코드 리뷰 체크리스트(`docs/REVIEW_CHECKLIST.md`)를 통과**해야 합니다.

---

## 2. 기술 스택 (확정)

### 데스크탑 셸
- **Electron 30** + electron-builder (Windows .exe)
- **Auto-updater**: electron-updater (GitHub Releases 기반)

### 프론트엔드
- **Next.js 14** (App Router, `output: 'export'`로 정적 빌드)
- **React 18** + **TypeScript 5** (strict mode)
- **TailwindCSS 3.4** + **shadcn/ui** + **Lucide 아이콘**
- **Zustand 4** (클라이언트 상태) + **TanStack Query 5** (서버 상태/캐싱)
- **Recharts** + **Tremor** (대시보드 차트)
- **Zod** (런타임 스키마 검증)

### 백엔드
- **Supabase** (이음 플랫폼 공유 프로젝트)
  - PostgreSQL 15+ · Auth · Storage · Realtime
  - 회계 모듈은 `accounting` 스키마 분리
- **Claude API** (`claude-opus-4-7`)
  - 영수증 OCR (Vision)
  - 자연어 → SQL (질의응답)
  - PDF 직접 분석 (document content type)

### 보고서 생성
- **docx** (Word 보고서)
- **jsPDF** + **jspdf-autotable** (PDF 보고서)
- **ExcelJS** (Excel 내보내기)

### 테스트
- **Vitest** (단위 테스트)
- **Playwright** (E2E 테스트, Electron 지원)

### 배포
- **GitHub Actions** (CI/CD)
- **electron-builder** (Windows installer 생성)
- **GitHub Releases** (자동 배포)

---

## 3. 디렉토리 구조

```
eum-accounting/
├── CLAUDE.md                  ← 이 파일 (메인 컨텍스트)
├── README.md                  ← 일반 사용자/개발자 안내
├── package.json
├── tsconfig.json
├── next.config.js
├── tailwind.config.ts
│
├── electron/                  ← Electron 메인 프로세스
│   ├── main.ts
│   ├── preload.ts
│   └── ipc-handlers.ts
│
├── src/
│   ├── app/                   ← Next.js App Router
│   │   ├── (auth)/login/
│   │   ├── (dashboard)/
│   │   │   ├── page.tsx       ← 메인 대시보드
│   │   │   ├── transactions/  ← 거래 입력·목록
│   │   │   ├── analytics/     ← 주/월/연 비교
│   │   │   ├── reports/       ← 보고서 생성
│   │   │   ├── budgets/       ← 예산 관리
│   │   │   ├── accounts/      ← 계정과목
│   │   │   ├── ai-query/      ← AI 질의응답
│   │   │   └── settings/
│   │   └── api/               ← API Routes (서버 액션)
│   │
│   ├── components/
│   │   ├── ui/                ← shadcn/ui 컴포넌트
│   │   ├── charts/            ← Recharts 래퍼
│   │   ├── input/             ← 5가지 입력 방식 컴포넌트
│   │   │   ├── ReceiptOCR.tsx
│   │   │   ├── BankCSVUpload.tsx
│   │   │   ├── VoiceInput.tsx
│   │   │   ├── ManualForm.tsx
│   │   │   └── PDFUpload.tsx
│   │   └── reports/
│   │
│   ├── lib/
│   │   ├── supabase/          ← Supabase 클라이언트
│   │   ├── claude/            ← Claude API 래퍼
│   │   │   ├── ocr.ts
│   │   │   ├── nlq.ts         ← Natural Language Query
│   │   │   └── classify.ts
│   │   ├── eum/               ← ⭐ 이음 플랫폼 통합 레이어
│   │   │   ├── members.ts     ← 교적 데이터 읽기 전용 클라이언트
│   │   │   ├── cells.ts       ← 순(셀그룹) 데이터
│   │   │   └── missions.ts    ← 선교회 데이터
│   │   └── utils/
│   │
│   ├── stores/                ← Zustand stores
│   ├── hooks/                 ← React hooks
│   └── types/                 ← TypeScript 타입 정의
│
├── supabase/
│   ├── migrations/            ← SQL 마이그레이션
│   ├── functions/             ← Edge Functions
│   └── seed.sql               ← 계정과목 표준안 시드 데이터
│
├── docs/                      ← ⭐ 추가 문서
│   ├── SESSIONS.md            ← 세션별 작업 로그
│   ├── ARCHITECTURE.md        ← 상세 아키텍처
│   ├── DATA_MODEL.md          ← DB 스키마 문서
│   ├── EUM_INTEGRATION.md     ← 이음 플랫폼 연동 가이드
│   ├── REVIEW_CHECKLIST.md    ← 박경원 장로 코드 리뷰 체크리스트
│   └── PHASES.md              ← 단계별 개발 계획
│
└── tests/
    ├── unit/
    └── e2e/
```

---

## 4. 이음 플랫폼 통합 원칙 ⭐

회계 모듈은 독립 데스크탑 앱이지만, 이음 플랫폼의 데이터를 **읽기 전용**으로 참조합니다.

### 공유하는 것
- ✅ **Supabase 프로젝트** (같은 인스턴스)
- ✅ **`public.members`** (성도 정보 — 읽기 전용)
- ✅ **`public.cells`** (44개 순 — 읽기 전용)
- ✅ **`public.missions`** (12개 선교회 — 읽기 전용)
- ✅ **Supabase Auth** (이음 계정으로 로그인)
- ✅ **디자인 토큰** (TailwindCSS config 공유)

### 회계 모듈 전용
- 🔒 **`accounting.*` 스키마의 모든 테이블** (transactions, accounts, budgets 등)
- 🔒 **Storage 버킷**: `accounting-receipts` (영수증·증빙)
- 🔒 **RLS 정책**: 회계 권한이 있는 사용자만 접근

### 통합 시나리오 예시
1. 심방비 지출 입력 시 → `public.members`에서 성도 검색 → 거래의 `related_member_id` 필드에 FK
2. 선교회비 입력 시 → `public.missions`에서 선교회 선택 → `related_mission_id` FK
3. 순별 활동비 입력 시 → `public.cells`에서 순 선택 → `related_cell_id` FK
4. AI 질의: "○○순의 작년 활동비 얼마야?" → cells JOIN으로 자동 처리

> 상세 통합 방법은 `docs/EUM_INTEGRATION.md` 참조

---

## 5. 권한 체계 (RBAC)

Supabase RLS 정책으로 강제하며, 사용자 역할은 `public.user_roles` 테이블에서 관리합니다.

| 역할 | enum 값 | 권한 |
|---|---|---|
| 재무 담당자 | `finance_officer` | 거래 CRUD, 영수증 업로드, 보고서 생성 |
| 담임목사 | `senior_pastor` | 전체 열람, 자연어 질의, 결재 승인 |
| 시무장로 | `executive_elder` | 전체 열람, 자연어 질의, 결재 승인 |
| 감사위원 | `auditor` | 열람 전용, 감사 코멘트 |

> ⚠️ 이 4개 역할은 회계 모듈 전용입니다. 이음 플랫폼의 다른 역할(예: `cell_leader`)을 부여받은 사용자는 회계 모듈에 접근할 수 없습니다.

---

## 6. AI 사용 가이드라인

### 모델 선택 기준
- **claude-opus-4-7**: 자연어 질의응답 (복잡한 SQL 생성, 다단계 추론)
- **claude-sonnet-4-6**: 영수증 OCR, 단순 분류, 보고서 초안 생성
- **claude-haiku-4-5**: 사용 안 함 (회계는 정확도 우선)

### 자연어 SQL 생성 안전장치
1. 시스템 프롬프트에서 **SELECT만 허용**, INSERT/UPDATE/DELETE/DROP/ALTER 금지 명시
2. 생성된 SQL을 정규식으로 한 번 더 검증 (`/^\s*SELECT/i.test(sql)`)
3. Supabase에 **read-only role**을 따로 만들어서 사용
4. 모든 AI 질의는 `accounting.ai_queries`에 로그 저장
5. 결과가 의심스러우면 사용자에게 SQL 보여주고 확인 후 실행

### 토큰 비용 관리
- 영수증 OCR: 평균 약 2,000 토큰 / 건
- 자연어 질의: 평균 약 5,000 토큰 / 건
- 월 예상 비용: $30~80

---

## 7. 코딩 컨벤션

### TypeScript
- `strict: true` 필수
- `any` 사용 금지 (불가피하면 `unknown` 사용)
- 모든 함수에 명시적 반환 타입

### Naming
- 컴포넌트: `PascalCase.tsx`
- 훅: `useCamelCase.ts`
- 유틸: `camelCase.ts`
- 상수: `UPPER_SNAKE_CASE`
- DB 테이블·컬럼: `snake_case` (PostgreSQL 관례)

### 커밋 메시지 (Conventional Commits)
```
feat(input): 영수증 사진 OCR 자동 추출 기능 추가
fix(reports): 월간 보고서 합계 계산 오류 수정
refactor(eum): members 클라이언트 캐싱 로직 분리
docs(claude): AI 안전장치 가이드 업데이트
test(nlq): 자연어 SQL 검증 단위 테스트 추가
```

### 한글 vs 영문
- **코드·변수명·DB 컬럼**: 영문
- **UI 텍스트·주석·문서**: 한글
- **계정과목·메모 필드 값**: 한글 (데이터)

---

## 8. 세션 시작 시 Claude Code가 해야 할 일

매 세션 시작 시 다음 순서로 진행하세요:

1. **이 파일 (`CLAUDE.md`) 읽기** — 최우선
2. **`docs/SESSIONS.md` 최근 항목 읽기** — 직전 작업 컨텍스트 복원
3. **`docs/PHASES.md` 확인** — 현재 단계 파악
4. **현재 git branch 확인** (`git status`, `git log --oneline -5`)
5. **사용자에게 "지금부터 작업할 내용"을 1줄로 요약 제시** 후 진행

---

## 9. 세션 종료 전 Claude Code가 해야 할 일

1. **`docs/SESSIONS.md`에 다음 형식으로 기록 추가**:
   ```markdown
   ## 2026-MM-DD HH:MM (세션 #N)
   - 작업한 것: ...
   - 변경된 파일: ...
   - 다음 세션에서 이어서 할 일: ...
   - 차단 사항 / 의사결정 필요: ...
   ```
2. **변경 사항 git commit** (Conventional Commits)
3. **PHASES.md 체크리스트 업데이트** (해당 단계 항목 완료 표시)

---

## 10. 자주 막히는 지점 (Pitfalls)

- **Electron + Next.js 정적 빌드**: `next.config.js`에 `output: 'export'` 필수. API Routes는 사용 불가 → 모든 서버 로직은 IPC handler 또는 Supabase Edge Function으로
- **Supabase RLS 디버깅**: 정책 작성 후 반드시 `auth.uid()`로 직접 쿼리해서 검증
- **Claude API streaming**: 데스크탑 앱에서 SSE 수신 시 IPC로 청크 전달 (`webContents.send`)
- **한글 Excel 출력**: ExcelJS에서 폰트 명시 안 하면 깨짐 — `Malgun Gothic` 지정
- **영수증 OCR 정확도**: 90도 회전 영수증이 많음 → 사전에 sharp로 EXIF 회전 정보 적용

---

## 11. 관련 문서 (반드시 읽어야 할 순서)

1. `CLAUDE.md` ← 지금 이 파일
2. `docs/PHASES.md` — 현재 어느 단계인지
3. `docs/SESSIONS.md` — 직전 작업 컨텍스트
4. 작업 도메인별 문서:
   - DB 작업 → `docs/DATA_MODEL.md`
   - 이음 통합 → `docs/EUM_INTEGRATION.md`
   - 아키텍처 → `docs/ARCHITECTURE.md`
   - PR 작성 → `docs/REVIEW_CHECKLIST.md`

---

**Last Updated**: 2026-04-XX
**버전**: v1.0 (초안)
