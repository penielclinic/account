# REVIEW_CHECKLIST.md — 코드 리뷰 체크리스트

> Claude Code가 PR을 만들기 전 **반드시 통과**해야 하는 체크리스트입니다.
> 박경원 장로(Lead Reviewer)의 리뷰 시간을 줄이기 위함입니다.

PR 본문 상단에 이 체크리스트를 복사해서 모든 항목에 ✅ 또는 N/A를 표시하세요.

---

## ✅ 공통 체크리스트 (모든 PR)

### 코드 품질
- [ ] TypeScript strict mode 통과 (`npm run type-check`)
- [ ] ESLint 통과 (`npm run lint`)
- [ ] Prettier 포맷 적용 (`npm run format`)
- [ ] `any` 타입 사용 없음 (불가피하면 `unknown` + 타입 가드)
- [ ] `console.log` 제거 (디버그 코드 잔존 금지)
- [ ] 주석은 한글, 변수/함수명은 영문

### 테스트
- [ ] 신규 함수에 단위 테스트 추가
- [ ] 기존 테스트 모두 통과 (`npm test`)
- [ ] E2E 테스트 영향 없음 확인

### 문서
- [ ] `docs/SESSIONS.md`에 이번 세션 내용 기록
- [ ] `docs/PHASES.md` 체크리스트 업데이트
- [ ] 신규 API/컴포넌트는 JSDoc 작성

### Git
- [ ] 커밋 메시지가 Conventional Commits 형식
- [ ] PR 제목이 명확하고 한 줄에 요약
- [ ] PR 본문에 변경 이유·테스트 방법 기재

---

## 🔒 보안 체크리스트 (회계 모듈 특화)

### 입력 검증
- [ ] 사용자 입력은 모두 Zod 스키마로 검증
- [ ] 숫자 입력은 음수·과대 금액 차단 (max 10억)
- [ ] 날짜는 미래 거래 차단 (선결제 제외)

### SQL & DB
- [ ] 매개변수화 쿼리만 사용 (문자열 concat 금지)
- [ ] AI 자연어 질의는 read-only role 사용 확인
- [ ] SELECT 외 SQL 차단 로직 통과
- [ ] RLS 정책 작성 시 `auth.uid()` 검증

### 권한
- [ ] 새 화면 추가 시 권한 가드 적용
- [ ] 재무 담당자만 가능한 액션은 UI + 서버 양쪽 차단
- [ ] 감사위원은 절대 쓰기 불가 확인

### 민감 데이터
- [ ] 주민번호·계좌번호 마지막 자리는 입력 차단
- [ ] Claude API 호출 시 PII 포함 여부 사전 체크
- [ ] 로그에 금액·메모 평문 노출 시 마스킹

---

## 🏛️ 회계 무결성 체크리스트

### 거래 데이터
- [ ] 거래 입력 후 즉시 `audit_logs`에 기록되는지 확인
- [ ] 거래 수정/삭제 시 이전 값이 audit_logs에 남는지 확인
- [ ] 결재 승인 후에는 수정 차단 또는 별도 정정 거래로 처리

### 금액 계산
- [ ] `NUMERIC(15, 2)` 사용 (부동소수점 금지)
- [ ] JavaScript Number 연산 시 `Decimal.js` 사용 권장
- [ ] 합계·평균 계산은 Postgres `SUM/AVG` 사용 (클라이언트 계산 금지)

### 첨부파일
- [ ] 영수증 원본은 절대 덮어쓰지 않음 (수정 시 새 파일로)
- [ ] 거래 삭제 시 첨부파일도 함께 삭제 (CASCADE)
- [ ] Storage 버킷 RLS 정책 확인

---

## 🌐 이음 통합 체크리스트

### 격리
- [ ] `accounting` 스키마에만 테이블 생성 (public 직접 수정 금지)
- [ ] `public.members` 등 이음 테이블에 INSERT/UPDATE/DELETE 없음

### 접근 방식
- [ ] 이음 데이터는 반드시 `src/lib/eum/` 통해 접근
- [ ] FK는 nullable + `ON DELETE SET NULL`

### 캐싱
- [ ] 이음 데이터는 TanStack Query staleTime 5분 이상
- [ ] Zustand에 캐싱 안 함

---

## 🤖 AI 사용 체크리스트

### Claude API 호출
- [ ] 적절한 모델 선택 (OCR=sonnet, NLQ=opus)
- [ ] `max_tokens` 명시
- [ ] 시스템 프롬프트가 SELECT-only 규칙 포함

### 비용 관리
- [ ] 동일 입력 캐싱 (가능한 경우)
- [ ] `ai_queries.tokens_used` 기록
- [ ] 월 비용 한도 초과 시 알림 로직 (Phase 5)

### Fallback
- [ ] AI 실패 시 수동 입력으로 자연스럽게 전환
- [ ] 사용자에게 적절한 한국어 에러 메시지

---

## 🎨 UI/UX 체크리스트

### 데스크탑 전용
- [ ] 모바일 반응형 분기 코드 없음 (Tailwind `md:`, `sm:` 사용 안 함)
- [ ] 최소 해상도 1280×720 가정
- [ ] 키보드 단축키 작동

### 한국어 UX
- [ ] 모든 UI 텍스트 한국어
- [ ] 금액은 한국식 표기 (1,234,567원)
- [ ] 날짜는 YYYY-MM-DD 또는 YYYY년 M월 D일

### 접근성
- [ ] 색상에만 의존하지 않음 (예산 초과는 색 + 아이콘)
- [ ] 모든 버튼에 aria-label
- [ ] 키보드만으로 모든 기능 사용 가능

---

## 📦 마이그레이션 체크리스트 (DB 변경 PR)

- [ ] 파일명이 시간순 prefix (`YYYYMMDD_NNN_*.sql`)
- [ ] 롤백 SQL 함께 작성 (`-- DOWN` 주석)
- [ ] 프로덕션 적용 전 staging branch에서 테스트
- [ ] `docs/DATA_MODEL.md` 업데이트
- [ ] RLS 정책 함께 작성/수정

---

## 🚀 출시 직전 체크리스트 (Phase 5 마지막 PR)

- [ ] Windows 10/11에서 설치 + 실행 검증
- [ ] 코드사이닝 (선택)
- [ ] auto-updater 작동 확인
- [ ] 사용 매뉴얼 PDF 첨부
- [ ] 백업/복구 시나리오 테스트 완료
- [ ] 재무 담당자 사전 교육 완료

---

## ❓ 박경원 장로 질문 응답 가이드

리뷰 중 박경원 장로가 질문하실 수 있는 항목들을 미리 정리:

| 예상 질문 | 답변 위치 |
|---|---|
| "왜 이 라이브러리 선택?" | PR 본문 또는 CLAUDE.md §2 |
| "이음 통합 영향은?" | docs/EUM_INTEGRATION.md |
| "RLS 정책 검증했나?" | 마이그레이션 PR에 테스트 결과 첨부 |
| "AI 비용 영향은?" | docs/CLAUDE.md §6.3 |
| "성능 영향은?" | 부하 테스트 결과 또는 N/A 표기 |
