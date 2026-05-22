# 이음(Eum) 회계 모듈

해운대순복음교회 이음 통합 플랫폼의 회계 관리 모듈입니다.
AI 기반 영수증 자동 입력, 자연어 질의응답, 주/월/연 비교 대시보드를 제공하는 데스크탑 앱입니다.

---

## ✨ 주요 기능

- **5가지 입력 방식**: 영수증 사진 OCR, 은행 CSV, 음성 입력, 수동 입력, PDF
- **AI 자연어 질의**: "이번 달 선교비 얼마야?" 같은 자연어 질문에 답변 + 차트
- **주/월/연 비교 대시보드**: 전년 동기 대비, 예산 대비 집행률
- **자동 보고서 생성**: 주간/월간/연간 보고서 PDF·Word 출력
- **이음 플랫폼 연동**: 성도·순·선교회 데이터와 연결된 거래 추적

---

## 🛠️ 기술 스택

- **데스크탑**: Electron 30 + Next.js 14
- **UI**: TailwindCSS + shadcn/ui + Recharts
- **백엔드**: Supabase (PostgreSQL + Auth + Storage)
- **AI**: Claude API (`claude-opus-4-7`, `claude-sonnet-4-6`)
- **언어**: TypeScript 5 (strict)

---

## 📦 설치 및 실행 (개발자용)

### 사전 요구사항
- Node.js 22+
- npm 또는 pnpm
- Supabase 프로젝트 접근 권한 (이음 플랫폼 공유 프로젝트)
- Claude API Key

### 설치
```bash
git clone https://github.com/[org]/eum-accounting.git
cd eum-accounting
npm install
```

### 환경변수 설정
`.env.local` 파일 생성:
```bash
NEXT_PUBLIC_SUPABASE_URL=https://xxxxx.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJ...
SUPABASE_SERVICE_ROLE_KEY=eyJ...
SUPABASE_READONLY_KEY=eyJ...
ANTHROPIC_API_KEY=sk-ant-...
```

### 개발 서버 실행
```bash
npm run dev          # Next.js + Electron 동시 실행
```

### 빌드 (Windows 설치파일 생성)
```bash
npm run build:win    # dist/ 폴더에 .exe 생성
```

---

## 👥 사용자 역할

| 역할 | 권한 |
|---|---|
| **재무 담당자** | 거래 입력·수정·삭제, 보고서 생성 |
| **담임목사 / 시무장로** | 전체 열람, AI 질의, 결재 승인 |
| **감사위원** | 열람 전용, 감사 코멘트 |

---

## 📚 개발자 문서

- [`CLAUDE.md`](./CLAUDE.md) — Claude Code용 메인 컨텍스트 (가장 먼저 읽기)
- [`docs/PHASES.md`](./docs/PHASES.md) — 단계별 개발 계획
- [`docs/SESSIONS.md`](./docs/SESSIONS.md) — 세션별 작업 로그
- [`docs/ARCHITECTURE.md`](./docs/ARCHITECTURE.md) — 상세 아키텍처
- [`docs/DATA_MODEL.md`](./docs/DATA_MODEL.md) — DB 스키마
- [`docs/EUM_INTEGRATION.md`](./docs/EUM_INTEGRATION.md) — 이음 플랫폼 통합 가이드
- [`docs/REVIEW_CHECKLIST.md`](./docs/REVIEW_CHECKLIST.md) — 코드 리뷰 체크리스트

---

## 🔐 보안 정책

- 모든 변경은 `audit_logs`에 자동 기록
- AI 자연어 질의는 SELECT만 허용 (read-only role)
- Supabase RLS로 행 단위 권한 강제
- 민감 데이터 (주민번호 등) 입력 차단

---

## 🤝 기여

- **개발자**: 원장님 + 박경원 장로
- 모든 PR은 박경원 장로의 리뷰 필수
- PR 작성 전 [`docs/REVIEW_CHECKLIST.md`](./docs/REVIEW_CHECKLIST.md) 통과 확인

---

## 📄 라이선스

내부 사용 전용 (해운대순복음교회)

---

## 🙏 문의

- **기술 문의**: 박경원 장로
- **기능 요청 / 운영 문의**: 원장님
