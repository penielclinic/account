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

<!-- ⚠️ 새 세션은 이 줄 바로 아래에 추가하세요 -->

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
