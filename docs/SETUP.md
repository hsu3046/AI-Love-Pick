# MatchMakerAI — 개발 환경 설정

> **Version:** 1.0.0 | **Updated:** 2026-03-12

---

## 1. 필수 요구사항

| 항목 | 최소 버전 |
|------|-----------|
| **Node.js** | v18+ (LTS 권장) |
| **npm** | v9+ |

---

## 2. 설치 및 실행

```bash
# 1. 리포지토리 클론
git clone <repository-url>
cd MatchMakerAI

# 2. 의존성 설치
npm install

# 3. 개발 서버 실행
npm run dev
# → http://localhost:5173

# 4. 프로덕션 빌드
npm run build
# → dist/ 폴더에 빌드 결과물 생성

# 5. 빌드 미리보기
npm run preview
# → 빌드 결과물을 로컬에서 미리보기
```

---

## 3. 프로젝트 의존성

### devDependencies

| 패키지 | 버전 | 역할 |
|--------|------|------|
| `typescript` | ~5.9.3 | TypeScript 컴파일러 |
| `vite` | ^7.3.1 | 빌드 도구 + 개발 서버 |

### dependencies

| 패키지 | 버전 | 역할 |
|--------|------|------|
| `lucide` | ^0.577.0 | SVG 아이콘 라이브러리 |

---

## 4. TypeScript 설정

`tsconfig.json`의 주요 설정:

| 옵션 | 값 | 설명 |
|------|-----|------|
| `target` | ES2022 | 최신 JS 문법 활용 |
| `strict` | true | 엄격 타입 검사 |
| `noUnusedLocals` | true | 미사용 변수 금지 |
| `noUnusedParameters` | true | 미사용 매개변수 금지 |
| `erasableSyntaxOnly` | true | 삭제 가능한 TS 구문만 허용 |
| `moduleResolution` | bundler | Vite 번들러 모드 |
| `verbatimModuleSyntax` | true | import type 구문 강제 |

---

## 5. 외부 CDN

| 리소스 | CDN 주소 |
|--------|----------|
| **Pretendard Variable 폰트** | `cdn.jsdelivr.net/gh/orioncactus/pretendard@v1.3.9` |

> HTML `<head>`에서 `<link>` 태그로 로드됩니다. 오프라인 환경에서는 대체 폰트(`-apple-system, BlinkMacSystemFont, sans-serif`)가 적용됩니다.

---

## 6. 빌드 출력

```bash
npm run build

# ── 프로세스 ──
# 1. tsc: TypeScript 타입 체크 (noEmit)
# 2. vite build: 번들링 + 최적화

# ── 결과 ──
# dist/
# ├── index.html
# └── assets/
#     ├── index-[hash].js
#     └── index-[hash].css
```

---

## 7. 주의사항

- **프레임워크 없음**: React/Vue/Angular를 사용하지 않습니다. DOM 직접 조작 코드입니다.
- **API 서버 없음**: 순수 클라이언트 사이드 앱, 백엔드 통신 없음
- **모바일 퍼스트**: `max-width: 430px` 기준으로 디자인되어 있으며, PC에서는 중앙 정렬로 표시
- **user-scalable=no**: 모바일에서 핀치 줌이 비활성화되어 있습니다
