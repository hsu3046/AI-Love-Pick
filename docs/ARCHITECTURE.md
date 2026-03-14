# MatchMakerAI — Architecture Document

> **Version:** 1.0.0 | **Updated:** 2026-03-12  
> **License:** GNU GPL v3 © KnowAI (https://knowai.space)

---

## 1. 프로젝트 개요

**MatchMakerAI**는 사용자의 성향과 실제 용도를 분석하여 최적의 AI 서비스 조합을 추천하는 **심리 테스트형 SPA(Single Page Application)** 입니다.

- **컨셉:** 12개 질문 (성향 6개 + 실전 6개)을 통해 8가지 AI 유형 중 하나를 매칭
- **핵심 가치:** "어떤 AI를 써야 할지 모르겠는 사람"에게 개인화된 AI 조합 추천
- **타겟 사용자:** AI 초보자부터 파워 유저까지

---

## 2. 기술 스택

| 구분 | 기술 | 버전 |
|------|------|------|
| **빌드 도구** | Vite | ^7.3.1 |
| **언어** | TypeScript (strict mode) | ~5.9.3 |
| **아이콘** | Lucide (SVG icons) | ^0.577.0 |
| **폰트** | Pretendard Variable | v1.3.9 (CDN) |
| **프레임워크** | Vanilla TypeScript (프레임워크 없음) | — |
| **스타일링** | Vanilla CSS (CSS Custom Properties) | — |

### 특이사항
- **React/Vue/Angular 없음** — 순수 TypeScript DOM 조작으로 구현
- **번들 의존성 최소화** — 런타임 의존성은 `lucide` 아이콘 라이브러리 1개뿐
- **모바일 퍼스트** — `max-width: 430px` 기준, 데스크탑은 중앙 정렬

---

## 3. 디렉토리 구조

```
MatchMakerAI/
├── index.html              # Entry HTML (한국어, Pretendard CDN, SEO 메타)
├── package.json            # 프로젝트 설정 (v1.0.0)
├── tsconfig.json           # TS strict mode, ES2022 타겟
├── LICENSE                 # GNU GPL v3
├── public/
│   └── vite.svg            # Favicon
├── src/
│   ├── main.ts             # 앱 진입점, 화면 전환 오케스트레이터
│   ├── style.css           # 전체 디자인 시스템 (1,323 lines)
│   ├── data/
│   │   ├── questions.ts    # 질문 데이터 (Phase 1: 6개 + Phase 2: 6개)
│   │   ├── results.ts      # AI 서비스 카탈로그 (20개) + 유형 정의 (8개)
│   │   └── plans.ts        # 3-tier 플랜 빌더 (무료/스탠다드/프로)
│   ├── engine/
│   │   └── scoring.ts      # 스코어링 엔진 (성향 + 실전 + 추론 생성)
│   └── screens/
│       ├── intro.ts        # 시작 화면
│       ├── quiz.ts         # 퀴즈 화면 (단일/멀티 선택 지원)
│       ├── transition.ts   # 전환 화면 (Phase 1→2 사이)
│       ├── loading.ts      # 로딩 화면 (단계별 메시지)
│       └── result.ts       # 결과 화면 (유형 + 추천 + 플랜)
└── docs/
    ├── ARCHITECTURE.md     # 이 파일
    ├── API.md              # 데이터 모델 & 인터페이스
    ├── SETUP.md            # 개발 환경 설정
    ├── DECISIONS.md        # 기술 결정 기록
    └── MEMORY.md           # 프로젝트 메모리
```

---

## 4. 앱 흐름 (User Flow)

```
┌─────────┐    ┌──────────┐    ┌────────────┐    ┌──────────┐    ┌─────────┐    ┌──────────┐
│  Intro   │ →  │  Quiz    │ →  │ Transition │ →  │  Quiz    │ →  │ Loading │ →  │  Result  │
│  Screen  │    │  Phase 1 │    │   Screen   │    │  Phase 2 │    │  Screen │    │  Screen  │
│          │    │ (6문항)  │    │            │    │ (6문항)  │    │         │    │          │
│ ·시작 CTA│    │ ·성향분석│    │ ·유형 미리│    │ ·실전정보│    │ ·3단계  │    │ ·유형 표시│
│          │    │ ·4축 점수│    │  보기      │    │ ·용도/예산│    │  메시지 │    │ ·성향 차트│
│          │    │          │    │ ·Phase2 안│    │ ·AI 선택 │    │ ·비동기 │    │ ·AI 추천 │
│          │    │          │    │  내        │    │          │    │  처리   │    │ ·3-tier  │
│          │    │          │    │            │    │          │    │         │    │  플랜    │
│          │    │          │    │            │    │          │    │         │    │ ·공유/재│
│          │    │          │    │            │    │          │    │         │    │  시작    │
└─────────┘    └──────────┘    └────────────┘    └──────────┘    └─────────┘    └──────────┘
```

### 화면 전환 메커니즘 (`main.ts`)

```
showScreen(screen):
  1. 현재 화면에 .exiting 클래스 추가 (300ms 페이드아웃)
  2. setTimeout 후 DOM 교체
  3. 새 화면에 .active 클래스 추가 (400ms 페이드인)
```

---

## 5. 핵심 아키텍처: 2-Phase 스코어링 시스템

### Phase 1: 성향 분석

**4개 축(Axis)에 대해 -1 ~ +1 범위로 스코어링:**

| 축 | 음수 (-1) | 양수 (+1) |
|----|-----------|-----------|
| `speed_depth` | 속도 중시 | 깊이 중시 |
| `real_creative` | 현실 중시 | 창작 중시 |
| `logic_visual` | 논리 중시 | 감성 중시 |
| `plan_flow` | 체계 중시 | 즉흥 중시 |

**특수 플래그(Flags):** 일부 질문은 추가적인 `flags` (`music`, `coding`, `image`, `research`)를 설정하여 Phase 2의 `usageNeeds`에 자동 반영합니다.

### Phase 2: 실전 프로필

| 필드 | 선택지 | 비고 |
|------|--------|------|
| `usageNeeds` | 글쓰기/이미지/코딩/검색/영상·음악/자동화/질문 | 멀티셀렉트 |
| `frequency` | 가끔/자주/업무필수 | |
| `priority` | 비용절약/시간절약/품질 | |
| `device` | 모바일/PC/둘다 | |
| `collaboration` | 혼자/팀 | |
| `budget` | ₩0 / ~₩15,000 / ~₩30,000 / 그 이상 | |

### 유형 매칭 알고리즘

```
유클리드 거리(Euclidean Distance) 최소화:

d = √(Σ (user_score[axis] - type_trait[axis])²)

→ 8개 유형 중 거리가 가장 가까운 유형 선택
```

---

## 6. 8가지 AI 유형

| ID | 이름 | 메인 LLM | 보조 LLM | 비율 | 색상 |
|----|------|----------|----------|------|------|
| `explorer` | 감성 탐험가 | Gemini | Grok | 12% | #FF9A9E |
| `strategist` | 전략적 크리에이터 | Claude | ChatGPT | 8% | #A18CD1 |
| `optimizer` | 효율의 마법사 | ChatGPT | Gemini | 15% | #84FAB0 |
| `analyst` | 논리의 탐구자 | Claude | ChatGPT | 10% | #667EEA |
| `trendsetter` | 실시간 트렌드세터 | Grok | Gemini | 14% | #F6D365 |
| `artist` | 디지털 아티스트 | Gemini | ChatGPT | 11% | #FBC2EB |
| `builder` | 코드 빌더 | Claude | Gemini | 9% | #4FACFE |
| `multitasker` | 만능 멀티태스커 | ChatGPT | Gemini | 21% | #43E97B |

---

## 7. AI 서비스 카탈로그 (20개)

### 카테고리별 분류

| 카테고리 | 서비스 |
|----------|--------|
| **LLM** | ChatGPT, Gemini, Claude, Grok |
| **이미지** | Gemini 이미지, GPT 이미지, Midjourney, Seedream |
| **음악** | Suno |
| **영상** | Veo, Kling, Runway |
| **코딩** | Antigravity, Cursor, Claude Code |
| **리서치** | Perplexity, NotebookLM, Consensus |
| **음성** | ElevenLabs |
| **자동화** | Google Opal |

---

## 8. 3-Tier 플랜 시스템

각 유형에 대해 3가지 플랜을 자동 생성합니다:

| 티어 | 구성 | 대상 |
|------|------|------|
| **무료** | 최적 무료 LLM + 무료 도구 | AI 입문자, 가끔 사용자 |
| **스탠다드** | 메인 LLM 유료 + 무료 보조 도구 | 매일 사용, 시간 절약 |
| **프로** | 메인 LLM 유료 + 전문 유료 도구 | 크리에이터, 개발자 |

### 추천 티어 결정 로직

```
budget === 'free'              → 무료
frequency === 'heavy' && quality → 프로
budget === 'high'              → 프로
frequency === 'daily' || time   → 스탠다드
budget === 'mid'               → 스탠다드
기본                           → 스탠다드
```

---

## 9. 개인화 추론(Reasoning) 시스템

결과 화면에서 각 AI 추천에 대해 **"왜 이 AI인지"** 개인화된 이유를 제시합니다:

| 태그 | 설명 | 아이콘색 |
|------|------|----------|
| **성향 매치** | 사용자 성향 축과 AI 강점 매칭 | #FF8C6B |
| **용도 매치** | 선택한 용도와 AI 카테고리 매칭 | #667EEA |
| **예산 최적** | 예산 조건에 맞는 팁 | #43E97B |
| **보조 AI** | 주 LLM 보완용 보조 AI | #A18CD1 |

---

## 10. 디자인 시스템

### 색상 토큰

```css
--bg: #FFF8F0            /* 배경 (웜 크림) */
--accent: #FF8C6B        /* 액센트 (코럴 오렌지) */
--pastel-pink: #FFB5C2   /* 파스텔 핑크 */
--pastel-purple: #C3AED6 /* 파스텔 퍼플 */
--pastel-blue: #A8D8F0   /* 파스텔 블루 */
--pastel-mint: #B5EAD7   /* 파스텔 민트 */
```

### 레이아웃

- **모바일 퍼스트:** `max-width: 430px`, `100dvh` 높이
- **데스크탑:** 중앙 정렬 + `box-shadow`로 카드 느낌
- **라운드 코너:** `12px ~ 32px` 스케일 시스템

### 애니메이션

| 이름 | 용도 | 시간 |
|------|------|------|
| `fadeInUp` | 카드 등장 | 0.4s ease |
| `spin` | 로딩 스피너 (3중 링) | 1.2s~2s linear |
| `pulse` | 로딩 텍스트 | 1.5s ease-in-out |
| `badgePop` | 전환 화면 배지 | 0.6s bounce |
| 화면 전환 | enter/exit | 0.3~0.4s ease |
