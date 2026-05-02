# 러닝 커뮤니티 (Running Community)

러너를 위한 커뮤니티 웹앱: 자유게시판, 훈련방법 게시판, 대회 일정, 러닝 용어 사전.

## 기술 스택

- **Next.js 15** (App Router) + **TypeScript**
- **SQLite** (`better-sqlite3`) — 단일 파일 DB
- **iron-session** + **bcryptjs** — 세션/비밀번호 해시
- **zod** — 입력 검증
- **Vitest** — 테스트

## 빠른 시작

```bash
# 1. 의존성 설치
npm install

# 2. 환경변수 설정 (.env.example을 참고)
cp .env.example .env.local
# SESSION_PASSWORD를 32자 이상의 강한 시크릿으로 변경

# 3. 개발 서버 실행
npm run dev
# → http://localhost:3000

# 4. 테스트
npm test

# 5. 프로덕션 빌드
npm run build
npm start
```

## 기능

| 메뉴 | 경로 | 설명 |
|------|------|------|
| 자유게시판 | `/posts/free` | 자유 주제 글, 댓글 |
| 훈련방법 | `/posts/training` | 인터벌, LSD, 템포런 등 노하우 |
| 대회 일정 | `/races` | 다가오는/지난 대회 분리 표시 |
| 러닝 용어 사전 | `/glossary` | 용어 검색 + 등록 |

## API 개요

OpenAPI 스펙: `specs/001-running-community/contracts/openapi.yaml`

- `POST /api/auth/{signup,login,logout}`
- `GET|POST /api/posts`, `GET|PATCH|DELETE /api/posts/[id]`
- `GET|POST /api/posts/[id]/comments`
- `GET|POST /api/races`, `GET /api/races/[id]`
- `GET|POST /api/glossary` (`?q=` 검색)

## 디렉토리 구조

```
app/                    # Next.js App Router (UI + API)
  api/                  # REST 엔드포인트
  posts/                # 게시판 페이지
  races/                # 대회 페이지
  glossary/             # 용어 사전
lib/
  db.ts                 # SQLite 연결 + 스키마
  auth.ts               # bcrypt 해시
  session.ts            # iron-session
  schemas.ts            # zod 검증 스키마
  repositories/         # 데이터 접근 계층
tests/                  # Vitest 단위 테스트
specs/001-running-community/
  spec.md, plan.md, tasks.md, data-model.md, contracts/openapi.yaml
```

## MVP 범위 / 비범위

**포함**: 이메일 가입/로그인, 두 카테고리 게시판 + 댓글, 대회 등록/조회, 용어 사전 등록/검색.
**제외 (v1 out of scope)**: 이미지 업로드, 이메일 인증, 소셜 로그인, 다국어, 외부 대회 API 연동, 모바일 앱.
