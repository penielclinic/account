# SESSIONS.md — 세션별 작업 로그

> Claude Code는 **매 세션 종료 전** 이 파일에 작업 내역을 추가합니다.
> 새 세션 시작 시 가장 최근 3~5개 항목을 읽고 컨텍스트를 복원합니다.

---

## 작성 형식

```markdown
## YYYY-MM-DD HH:MM (세션 #N)

**Phase**: Phase X — 단계명
**작업자**: Claude Code (모델: claude-opus-4-7)
**브랜치**: feature/xxx

### 작업한 것
- ...

### 변경된 파일
- `path/to/file.ts` (신규 / 수정 / 삭제)
- ...

### 의사결정
- 결정 사항 + 이유

### 다음 세션에서 이어서 할 일
- ...

### 차단 사항 / 원장님 확인 필요
- ...

### 박경원 장로 리뷰 요청 사항
- ...
```

---

## 세션 로그 (최신순)

<!-- ⚠️ 새 세션은 이 줄 바로 아래에 추가��세요 -->

---

## 2026-05-23 (세션 #4)

**Phase**: Phase 2 — 입력 방식 확장
**작업자**: Claude Code (모델: claude-sonnet-4-6)
**브랜치**: master

### 작업한 것
- `npm install dotenv` — Electron main process에서 `.env.local` 로드
- `electron/main.ts` — dotenv.config() 추가 (가장 상단, app 시작 전 로드)
- `electron/ipc-handlers.ts` — Claude API IPC 핸들러 3개 추가
  - `claude:ocr-image`: 영수증 이미지 → OcrResult (Vision API)
  - `claude:ocr-pdf`: PDF → OcrResult[] (document content type)
  - `claude:classify-transactions`: 은행CSV 거래 배치 분류 → accountCode[]
- `electron/preload.ts` — ocrImage, ocrPdf, classifyTransactions 노출
- `src/types/electron.d.ts` — 새 IPC 메서드 TypeScript 타입 추가
- `src/lib/supabase/transactions.ts` — createTransactionsBatch() 추가, createTransaction() inputMethod 파라��터 추가
- `src/hooks/useTransactions.ts` — useCreateTransactionsBatch 추가, useCreateTransaction API 변경 ({input, inputMethod})
- `src/components/input/ManualForm.tsx` — useCreateTransaction 새 API에 맞게 수정
- `src/components/input/ReceiptOCR.tsx` — 완전 구현 (4단계: idle→preview→processing→review)
- `src/components/input/BankCSVUpload.tsx` — 완전 구현 (PapaParse + Claude 자동분류)
- `src/components/input/PDFUpload.tsx` — 완�� 구현 (Claude document type)
- `src/app/(dashboard)/transactions/new/page.tsx` — 4탭 UI (수동입력/영수증OCR/은행CSV/PDF)
- `docs/PHASES.md` — Phase 1 전체 [x] 완료 표시, Phase 2 진행 상태 업데이트
- `.eslintrc.json` — `no-img-element` off 추가 (데스크탑 앱, base64 미리보기용)

### 변경된 파일
- `electron/main.ts` (수정 — dotenv)
- `electron/ipc-handlers.ts` (수정 — Claude API 핸들러 3개 추가)
- `electron/preload.ts` (수정 — 3개 IPC 노출)
- `src/types/electron.d.ts` (수정 — 새 메서드 타입)
- `src/lib/supabase/transactions.ts` (수정 — 배치 저장 추가)
- `src/hooks/useTransactions.ts` (수정 — 배치 훅 추가, API 변경)
- `src/components/input/ManualForm.tsx` (수정 — 새 mutation API)
- `src/components/input/ReceiptOCR.tsx` (수정 — 스텁 → 완전 구��)
- `src/components/input/BankCSVUpload.tsx` (수정 — 스텁 → 완전 구현)
- `src/components/input/PDFUpload.tsx` (수정 — 스텁 ��� 완전 구현)
- `src/app/(dashboard)/transactions/new/page.tsx` (수정 — 4탭)
- `docs/PHASES.md` (수정 �� Phase 1 완료 / Phase 2 진행)
- `.eslintrc.json` (수정)
- `package.json` / `package-lock.json` (dotenv 추가)

### 의사결정
- **Claude API 아키텍처**: IPC를 통해 main process에서만 API key 사용 (renderer에 노출 금지)
- **dotenv 로딩**: electron/main.ts 최상단에서 `.env.local` 로드 → dev 환경 즉시 동작
- **CSV 포맷 감지**: 고정 포맷 매칭 대신 컬럼명 패턴 매칭으로 유연하게 처리 (국민/우리/신한 공통)
- **배치 저장 API**: useCreateTransaction 시그니처를 `{input, inputMethod}` 객체로 변경 (inputMethod 구분)
- **VoiceInput**: Phase 3으로 이월 (Web Speech API + IPC 스트리밍은 별도 작업 필요)

### 다음 세션에서 이어서 할 일
- **[필수] .env.local에 ANTHROPIC_API_KEY 설정** 후 `npm run dev`로 OCR/PDF/분류 기능 테스트
- **[필수] Supabase accounting Exposed Schemas 추가** (미설정 시 DB 쿼리 전체 실패)
- Phase 2 잔여: 이음 플랫폼 연동 (members/cells/missions 검색 연결)
- Phase 2 잔여: 중복 ���래 감지 (날짜+금액 기준)
- Phase 3 시작: analytics/weekly, analytics/monthly 페이지
- GitHub push

### 차단 사항 / 원장님 확인 필요
- **[필수] `.env.local`에 `ANTHROPIC_API_KEY=` 값 입력** — API 키 없으면 OCR/분류 전체 실패
- Supabase accounting schema Exposed schemas 등록 여부 확인

### 박경원 장로 리뷰 요청 사항
- Phase 2 PR 생성 예정 — IPC 보안 아키텍처(API key 분리) 및 배치 저장 로직 확인 요청

---

## 2026-05-23 (세션 #3)

**Phase**: Phase 1 — 핵심 기능 구현
**작업자**: Claude Code (모델: claude-sonnet-4-6)
**브랜치**: master

### 작업한 것
- `src/lib/supabase/accounting.ts` 신규 생성 — accounting 스키마 전용 Supabase 클라이언트
- `src/lib/supabase/accounts.ts` 신규 생성 — `getAccounts()` (is_active 필터, code 정렬)
- `src/lib/supabase/transactions.ts` 신규 생성 — `getTransactions()` (필터/페이지네이션), `createTransaction()`, `getDashboardStats()`
- `src/hooks/useAccounts.ts` 신규 생성 — TanStack Query 훅 (staleTime 5분)
- `src/hooks/useTransactions.ts` 신규 생성 — `useTransactions`, `useDashboardStats`, `useCreateTransaction` 훅
- `src/components/input/ManualForm.tsx` 구현 — Zod 검증, Ctrl+S 단축키, 금액 천단위 포맷
- `src/app/(dashboard)/transactions/page.tsx` 구현 — 필터(구분/계정/검색) + 페이지네이션 테이블
- `src/app/(dashboard)/transactions/new/page.tsx` 구현 — ManualForm 래퍼 페이지
- `src/app/(dashboard)/accounts/page.tsx` 구현 — 수입/지출 2컬럼 테이블
- `src/app/(dashboard)/page.tsx` 구현 — 실데이터 KPI 카드 4개 + 최근 거래 5건
- `.eslintrc.json` 신규 생성 — next/core-web-vitals 설정
- `src/app/(dashboard)/ai-query/page.tsx` — 따옴표 이스케이프 수정 (ESLint)
- TypeScript typecheck: 오류 없음 / ESLint: 오류 없음

### 변경된 파일
- `src/lib/supabase/accounting.ts` (신규)
- `src/lib/supabase/accounts.ts` (신규)
- `src/lib/supabase/transactions.ts` (신규)
- `src/hooks/useAccounts.ts` (신규)
- `src/hooks/useTransactions.ts` (신규)
- `src/components/input/ManualForm.tsx` (수정 — 스텁 → 구현 완료)
- `src/app/(dashboard)/transactions/page.tsx` (수정 — 스텁 → 구현 완료)
- `src/app/(dashboard)/transactions/new/page.tsx` (수정 — 스텁 → 구현 완료)
- `src/app/(dashboard)/accounts/page.tsx` (수정 — 스텁 → 구현 완료)
- `src/app/(dashboard)/page.tsx` (수정 — 스텁 → 구현 완료)
- `.eslintrc.json` (신규)
- `src/app/(dashboard)/ai-query/page.tsx` (수정 — ESLint 수정)

### 의사결정
- **client component 전략**: `output: 'export'` 정적 앱이므로 데이터 페칭 페이지는 모두 `'use client'` + TanStack Query. `metadata` export는 client component와 공존 불가하므로 삭제
- **ManualForm 금액**: 천 단위 comma 자동 포맷 적용, 저장 시 comma 제거 후 Number 변환
- **Ctrl+S 단축키**: `useRef`로 최신 form 값 참조 → stale closure 방지
- **에러 상태 UX**: Supabase schema 미노출 시 안내 메시지 포함 (`accounting` Exposed schemas 추가 안내)

### 다음 세션에서 이어서 할 일
- `npm run dev` 실행 후 실제 화면 동작 확인
- Supabase `accounting` Exposed schemas 추가 여부 확인
- Phase 2: OCR 영수증 입력 (ReceiptOCR.tsx)
- Phase 2: 은행 CSV 업로드 (BankCSVUpload.tsx)
- 예산 관리 페이지 (budgets/page.tsx)
- GitHub push

### 차단 사항 / 원장님 확인 필요
- **[필수] Supabase Dashboard → Settings → API → Exposed schemas에 `accounting` 추가** (미설정 시 모든 DB 쿼리 실패)

### 박경원 장로 리뷰 요청 사항
- Phase 1 완료 후 PR 생성 예정 — ManualForm 입력 검증 로직, RLS 정책 적용 여부 확인 요청

---

## 2026-05-23 (세션 #2)

**Phase**: Phase 0 — 사전 준비 (마무리)
**작업자**: Claude Code (모델: claude-sonnet-4-6)
**브랜치**: master

### 작업한 것
- Supabase `accounting` 스키마 및 테이블 7개 생성 (마이그레이션 적용)
- 이음 플랫폼 스텁 테이블 생성 (`public.members`, `public.cells`, `public.missions`)
- audit_logs 자동 기록 트리거 (`fn_audit_log`) 4개 테이블에 적용
- RLS 정책 전체 테이블에 설정 (역할별 접근 제어)
- 계정과목 시드 데이터 31개 삽입 (수입 9개, 지출 22개)
- 관리자 계정 (`penielclinic@naver.com`) user_roles 등록
- `.env.local` 환경변수 완성 (URL, anon key, service role key)
- `npm run dev` 정상 실행 확인 (Phase 0 완료 조건 달성)
- `AccountType` 타입 수정 (`'income' | 'expense'`) — DB와 일치

### 변경된 파일
- `docs/PHASES.md` (체크리스트 업데이트)
- `src/types/index.ts` (AccountType 수정)
- `supabase/seed.sql` (실제 적용된 데이터로 업데이트)
- `package.json` (dev:electron 스크립트 수정)
- `electron/main.ts` (GPU 크래시 방지 플래그 추가)

### 의사결정
- **이음 플랫폼 스텁**: `public.members/cells/missions`가 아직 없어 스텁으로 생성. 실제 이음 플랫폼 연동 시 DROP 후 실제 테이블로 교체
- **계정과목 코드 체계**: 4xxx = 수입, 5xxx = 지출 (표준 교회 회계 코드 기준)

### 다음 세션에서 이어서 할 일
- **Phase 1 시작**: GitHub repo 생성 → `git remote add origin` → push
- 계정과목 표준안 재무 담당자 검토 (현재 초안 31개)
- Phase 1 첫 기능: 사이드바 네비게이션 + 거래 수동 입력 폼 (`ManualForm.tsx`)

### 차단 사항 / 원장님 확인 필요
- 계정과목 코드/이름 최종 확정 필요 (현재 초안)
- GitHub 조직/개인 계정 이름 확인 필요 (`electron-builder.yml` owner 수정)

### 박경원 장로 리뷰 요청 사항
- 없음 (Phase 0 완료, Phase 1 PR부터 리뷰 요청 예정)

---

## 2026-05-22 (세션 #1)

**Phase**: Phase 0 — 사전 준비
**작업자**: Claude Code (모델: claude-sonnet-4-6)
**브랜치**: master (git init 직후)

### 작업한 것
- `git init` 및 프로젝트 스캐폴드 전체 생성
- 기획 문서 6개를 루트 → `docs/` 디렉토리로 이동
- npm install 완료 (911 패키지, Node 22 기준)
- 첫 커밋: `043d9b1` "chore: initial project scaffold"

### 생성된 파일 (59개)
- `package.json`, `tsconfig.json`, `tsconfig.electron.json`, `next.config.js`, `tailwind.config.ts`, `postcss.config.js`
- `electron-builder.yml`, `.gitignore`, `.env.local.example`
- `electron/main.ts`, `electron/preload.ts`, `electron/ipc-handlers.ts`
- `src/app/layout.tsx`, `src/app/globals.css`
- `src/app/(auth)/login/page.tsx`
- `src/app/(dashboard)/layout.tsx`, `page.tsx` + 7개 서브페이지 (transactions, analytics, reports, budgets, accounts, ai-query, settings)
- `src/types/index.ts`, `src/types/electron.d.ts`
- `src/stores/auth.ts`, `src/stores/ui.ts`
- `src/lib/supabase/client.ts`
- `src/lib/claude/ocr.ts`, `nlq.ts`, `classify.ts`, `sql-validator.ts`
- `src/lib/eum/members.ts`, `cells.ts`, `missions.ts`
- `src/lib/utils/index.ts`
- `src/components/providers.tsx`, `src/components/layout/Sidebar.tsx`
- `src/components/input/` — 5개 입력 컴포넌트 스텁
- `supabase/seed.sql` (계정과목 20개 초안)
- `.github/workflows/build.yml`

### 의사결정
- **Next.js App Router 라우팅**: `(dashboard)/page.tsx` → `/` (루트가 대시보드), `(auth)/login/page.tsx` → `/login/`. `src/app/page.tsx`는 생성하지 않음 (충돌 방지)
- **Electron 개발 모드**: `concurrently`로 `next dev -p 3001` + `electronmon` 동시 실행. dev 시 `http://localhost:3001`, 프로덕션 시 `file://out/index.html` 로드
- **TailwindCSS v3.4**: v4 미사용 (이음 플랫폼 타 모듈 버전 통일 원칙)

### 다음 세션에서 이어서 할 일
1. `npm run dev` 실행 → Electron 창 열리는지 확인 (Phase 0 완료 조건)
2. Supabase 프로젝트 ID + anon key 발급 후 `.env.local` 생성
3. Supabase에 `accounting` 스키마 생성 (첫 마이그레이션 작성)
4. GitHub repo `eum-accounting` 생성 후 push

### 차단 사항 / 원장님 확인 필요
- **Supabase 환경변수 미설정**: `.env.local`이 없으면 `npm run dev` 시 Next.js 빌드는 되나 런타임에서 Supabase 연결 실패. 먼저 환경변수 세팅 필요
- **계정과목 표준안**: `supabase/seed.sql` 초안은 일반적인 교회 회계 기준으로 작성됨. 재무 담당자 + 시무장로 검토 후 확정 필요 (PHASES.md Phase 0 항목)
- **GitHub org 이름**: `electron-builder.yml`의 `owner: haeundae-church` — 실제 org명으로 수정 필요

### 박경원 장로 리뷰 요청 사항
- 없음 (스캐폴드 단계, 다음 PR부터 리뷰 요청 예정)

---

## 예시 (실제 사용 전 삭제)

## 2026-04-15 14:30 (세션 #1)

**Phase**: Phase 0 — 사전 준비
**작업자**: Claude Code (모델: claude-opus-4-7)
**브랜치**: main

### 작업한 것
- 프로젝트 초기 스캐폴드 생성
- `package.json` 의존성 설치 (Next.js 14, Electron 30, Supabase, TailwindCSS)
- `electron/main.ts` 기본 BrowserWindow 설정
- `next.config.js`에 `output: 'export'` 적용
- `tailwind.config.ts`에 이음 디자인 토큰 import

### 변경된 파일
- `package.json` (신규)
- `tsconfig.json` (신규)
- `next.config.js` (신규)
- `electron/main.ts` (신규)
- `electron/preload.ts` (신규)
- `src/app/layout.tsx` (신규)
- `src/app/page.tsx` (신규)
- `tailwind.config.ts` (신규)

### 의사결정
- Tailwind v4가 아닌 v3.4 사용 — 이음 플랫폼 다른 모듈과 동일 버전 유지
- electron-builder의 `appId`는 `church.haeundae.eum.accounting`으로 결정

### 다음 세션에서 이어서 할 일
- Supabase에 `accounting` 스키마 생성
- 환경변수 설정 (.env.local)
- 첫 마이그레이션 작성: `accounting.transactions`

### 차단 사항 / 원장님 확인 필요
- 계정과목 표준안 확정 필요 — 기획서 4.2절 그대로 사용해도 되는지 확인
- 코드사이닝 인증서 구매 여부

### 박경원 장로 리뷰 요청 사항
- 없음 (초기 스캐폴드 단계, 다음 PR부터 리뷰 요청 예정)
