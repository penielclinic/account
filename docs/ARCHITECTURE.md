# ARCHITECTURE.md — 상세 아키텍처

> 이 문서는 회계 모듈의 기술 구조를 상세히 설명합니다.
> 새 기능을 추가할 때 어느 레이어에 어떤 책임을 둘지 결정할 때 참조하세요.

---

## 1. 레이어 구조

```
┌─────────────────────────────────────────────────┐
│  Electron Main Process (electron/main.ts)       │
│  - BrowserWindow 생성                            │
│  - IPC 핸들러 (파일 시스템, 시스템 트레이)        │
│  - Auto-updater                                  │
└──────────────────┬──────────────────────────────┘
                   │ IPC
┌──────────────────▼──────────────────────────────┐
│  Next.js Renderer (src/app/)                    │
│  - React 컴포넌트                                │
│  - App Router (정적 빌드 모드)                   │
└──────────────────┬──────────────────────────────┘
                   │
        ┌──────────┼──────────┐
        ▼          ▼          ▼
   ┌────────┐ ┌────────┐ ┌─────────┐
   │ Stores │ │ Hooks  │ │  Lib    │
   │Zustand │ │Custom  │ │Supabase │
   └────────┘ └────────┘ │Claude   │
                         │Eum      │
                         └────┬────┘
                              │
        ┌─────────────────────┼─────────────────────┐
        ▼                     ▼                     ▼
   ┌─────────┐          ┌──────────┐          ┌─────────┐
   │Supabase │          │Claude API│          │ Local FS│
   │ Cloud   │          │Anthropic │          │ (Electron)│
   └─────────┘          └──────────┘          └─────────┘
```

---

## 2. 데이터 흐름 (5가지 입력 방식)

### 영수증 사진 OCR
```
사용자가 영수증 사진 업로드
  → ReceiptOCR.tsx (base64 인코딩)
  → lib/claude/ocr.ts (Vision API 호출, claude-sonnet-4-6)
  → 추출 결과 검토 UI
  → 사용자 확정 후 lib/supabase로 INSERT
  → Storage에 원본 이미지 업로드
  → attachments 테이블에 file_url 저장
```

### 은행 CSV
```
사용자가 CSV 파일 드래그앤드롭
  → BankCSVUpload.tsx (papaparse로 파싱)
  → lib/claude/classify.ts (각 거래 계정과목 자동 추천)
  → 중복 감지 (date + amount + account 매칭)
  → 검토 화면 (사용자가 일괄 확정)
  → 일괄 INSERT
```

### 음성 입력
```
사용자가 마이크 버튼 클릭
  → Web Speech API (브라우저 내장)
  → 텍스트 변환
  → lib/claude/parse-voice.ts ("오늘 꽃 5만원" → {date, account, amount})
  → 폼 자동 채움
  → 사용자 확정 후 저장
```

### 수동 입력
```
사용자가 폼에 직접 입력
  → ManualForm.tsx (Zod 검증)
  → lib/supabase INSERT
```

### PDF 입력
```
사용자가 PDF 업로드
  → PDFUpload.tsx (base64 인코딩)
  → lib/claude/ocr.ts (document content type, claude-sonnet-4-6)
  → 여러 거래가 있으면 배열로 추출
  → 일괄 검토·확정
```

---

## 3. AI 자연어 질의 흐름

```
사용자: "이번 달 선교비 얼마야?"
  ↓
lib/claude/nlq.ts
  ↓
  [1] 시스템 프롬프트에 스키마 정보 주입
  [2] Claude API 호출 (claude-opus-4-7)
  [3] 응답 JSON 파싱: { sql, chart_type, explanation }
  ↓
SQL 검증 (lib/claude/sql-validator.ts)
  - SELECT로 시작하는지 정규식 체크
  - 금지어 (INSERT/UPDATE/DELETE/DROP/ALTER) 체크
  ↓
Supabase 실행 (read-only role)
  ↓
결과를 차트 + 텍스트로 변환
  ↓
ai_queries 테이블에 로그 저장
  ↓
사용자에게 반환
```

---

## 4. Electron ↔ Next.js IPC

Next.js는 정적 빌드(`output: 'export'`)로 동작하므로 서버 사이드 API가 없습니다.
대신 Electron 메인 프로세스에 IPC 핸들러를 둡니다.

### IPC 채널 목록
| 채널명 | 방향 | 용도 |
|---|---|---|
| `file:open-receipt` | Renderer→Main | 영수증 파일 선택 다이얼로그 |
| `file:save-report` | Renderer→Main | 보고서 파일 저장 다이얼로그 |
| `db:backup` | Renderer→Main | 로컬 .sql 백업 다운로드 |
| `app:check-update` | Renderer→Main | 업데이트 확인 |
| `app:quit` | Renderer→Main | 종료 |

### Preload 스크립트로 안전 노출
```typescript
// electron/preload.ts
contextBridge.exposeInMainWorld('electronAPI', {
  openReceipt: () => ipcRenderer.invoke('file:open-receipt'),
  saveReport: (data, filename) => ipcRenderer.invoke('file:save-report', data, filename),
  // ...
});
```

---

## 5. 상태 관리 전략

### Zustand (클라이언트 상태)
- 로그인 사용자 정보
- 현재 선택된 계정과목
- UI 상태 (사이드바 접힘 등)
- 입력 폼 임시 데이터

### TanStack Query (서버 상태)
- Supabase 조회 결과
- 자동 캐싱 (staleTime: 5분)
- 거래 변경 시 invalidate
- 백그라운드 refetch

### Local State (useState)
- 단일 컴포넌트 내부 상태만

**중요**: 절대 Zustand에 거래 데이터를 캐싱하지 마세요. TanStack Query만 사용.

---

## 6. 보안 설계

### 입력 검증 (Zod)
모든 사용자 입력은 Zod로 런타임 검증.
```typescript
const TransactionInput = z.object({
  transaction_date: z.string().date(),
  type: z.enum(['income', 'expense']),
  account_id: z.string().uuid(),
  amount: z.number().positive().max(1_000_000_000),
  description: z.string().min(1).max(500),
  // ...
});
```

### SQL 인젝션 방지
- Supabase 클라이언트의 매개변수화 쿼리만 사용
- 직접 SQL 작성 금지 (자연어 질의 제외)
- 자연어 질의는 read-only role + SELECT 화이트리스트

### XSS 방지
- React 기본 escaping 사용
- `dangerouslySetInnerHTML` 사용 금지
- 사용자 입력은 영수증 OCR 결과도 텍스트로만 표시

### 민감 데이터 차단
- 입력 폼에서 주민번호 패턴 정규식으로 자동 차단
- Claude API 호출 전 PII 마스킹 체크

---

## 7. 성능 최적화

### 대시보드 쿼리
- 거래 집계는 Postgres `MATERIALIZED VIEW` 활용
- `monthly_summary` 뷰: 매일 새벽 3시 자동 REFRESH
- 실시간 정확도가 필요한 경우만 직접 쿼리

### 이미지 처리
- 영수증 업로드 시 클라이언트에서 sharp로 리사이즈 (최대 2MB)
- WebP 변환으로 Storage 비용 절감

### Claude API 호출
- 동일 OCR 결과는 24시간 캐싱 (hash 기반)
- 자연어 질의는 캐싱하지 않음 (시점 의존적)

---

## 8. 에러 처리

### 사용자 표시 에러
- `react-hot-toast` 사용
- 한국어 메시지 (영문 원본은 console에 로그)

### 에러 추적
- Sentry 도입 검토 (Phase 5)
- 현재는 console.error + 로컬 로그 파일

### Claude API 실패 시
- 자동 재시도 (지수 백오프, 최대 3회)
- 실패 시 수동 입력으로 fallback 안내

---

## 9. 테스트 전략

### 단위 테스트 (Vitest)
- `lib/` 아래 모든 유틸 함수
- Zod 스키마
- Claude API 응답 파싱

### 통합 테스트 (Vitest)
- Supabase 클라이언트 함수
- IPC 핸들러

### E2E 테스트 (Playwright)
- 로그인 → 거래 입력 → 목록 확인
- 영수증 OCR 전체 플로우
- AI 질의 응답
- 보고서 생성

**커버리지 목표**: 단위·통합 합쳐서 70% 이상

---

## 10. 배포 아키텍처

```
GitHub Push (main 브랜치)
  ↓
GitHub Actions
  ↓
  [1] Lint + Type Check
  [2] Vitest 단위 테스트
  [3] Playwright E2E 테스트
  [4] electron-builder 빌드 (Windows .exe)
  [5] GitHub Releases에 자동 업로드
  ↓
사용자 PC의 auto-updater가 감지
  ↓
백그라운드 다운로드 + 다음 실행 시 적용
```
