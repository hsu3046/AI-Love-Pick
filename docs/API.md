# MatchMakerAI — API & 데이터 모델 문서

> **Version:** 1.0.0 | **Updated:** 2026-03-12

---

## 1. 데이터 모델 (TypeScript Interfaces)

### 1.1 질문 관련 (`src/data/questions.ts`)

```typescript
// ── 질문 선택지 ──
interface QuestionOption {
  text: string;    // 메인 텍스트
  sub: string;     // 부가 설명
  icon: string;    // Lucide 아이콘 이름 (kebab-case)
}

// ── 스코어링 규칙 ──
interface QuestionScoring {
  axis: 'speed_depth' | 'real_creative' | 'logic_visual' | 'plan_flow';
  values: [string, string];  // A 선택 시 → values[0], B 선택 시 → values[1]
}

// ── 특수 플래그 ──
interface SpecialFlag {
  option: 'A' | 'B' | 'C';
  flag: string;  // 'music' | 'coding' | 'image' | 'research'
}

// ── 질문 ──
interface Question {
  id: number;
  phase: 1 | 2;
  type: 'single' | 'multi';
  question: string;
  icon: string;
  optionA: QuestionOption;
  optionB: QuestionOption;
  optionC?: QuestionOption;
  optionD?: QuestionOption;
  multiOptions?: { key: string; text: string; icon: string }[];  // multi 전용
  scoring?: QuestionScoring;
  flags?: SpecialFlag[];
  practicalField?: 'usage' | 'frequency' | 'priority' | 'device' | 'collaboration' | 'budget';
}
```

### 1.2 AI 서비스 & 결과 유형 (`src/data/results.ts`)

```typescript
// ── AI 강점 ──
interface AIStrengths {
  speed?: string;     // 속도 관련 강점
  depth?: string;     // 깊이 관련 강점
  creative?: string;  // 창작 관련 강점
  real?: string;      // 현실/정보 관련 강점
  logic?: string;     // 논리 관련 강점
  visual?: string;    // 시각/감성 관련 강점
  plan?: string;      // 체계 관련 강점
  flow?: string;      // 즉흥/유연성 관련 강점
}

// ── AI 서비스 ──
interface AIService {
  name: string;
  category: 'llm' | 'image' | 'music' | 'video' | 'coding' | 'research' | 'voice' | 'automation';
  description: string;
  priceFree: string;   // 무료 티어 설명
  priceLabel: string;  // 유료 가격 표시
  icon: string;
  strengths: AIStrengths;
}

// ── 유형별 인사이트 ──
interface TypeInsight {
  summary: string;           // 개인화 요약
  mainLLMReason: string;     // 메인 LLM 추천 이유
  secondaryLLMReason: string; // 보조 LLM 추천 이유
}

// ── 결과 유형 (8개) ──
interface ResultType {
  id: string;
  name: string;
  description: string;
  percentage: number;        // 전체 사용자 중 비율 (표시용)
  mainLLM: string;           // aiServices 키
  secondaryLLM: string;
  traits: {                  // 이상 좌표 (-1 ~ +1)
    speed_depth: number;
    real_creative: number;
    logic_visual: number;
    plan_flow: number;
  };
  insights: TypeInsight;
  recommendedExtras: Record<string, string[]>;  // 카테고리 → 서비스 키 배열
  color: string;             // 유형 대표 색상 (HEX)
}
```

### 1.3 플랜 관련 (`src/data/plans.ts`)

```typescript
// ── 플랜 추가 서비스 ──
interface PlanExtra {
  serviceKey: string;
  tier: 'free' | 'paid';
  note: string;
}

// ── 3-Tier 플랜 ──
interface PlanTier {
  id: 'free' | 'standard' | 'pro';
  name: string;
  priceLabel: string;        // 예: '~₩3만'
  priceRange: string;        // 예: '~₩3만/월'
  description: string;
  targetUser: string;        // 대상 사용자 설명
  mainLLM: string;
  mainLLMTier: string;       // LLM 티어 설명
  extras: PlanExtra[];
  freeAlternatives: string[];
}
```

### 1.4 스코어링 엔진 (`src/engine/scoring.ts`)

```typescript
// ── 4축 스코어 ──
interface Scores {
  speed_depth: number;      // -1(속도) ~ +1(깊이)
  real_creative: number;    // -1(현실) ~ +1(창작)
  logic_visual: number;     // -1(논리) ~ +1(감성)
  plan_flow: number;        // -1(체계) ~ +1(즉흥)
}

// ── 실전 프로필 ──
interface PracticalProfile {
  usageNeeds: Set<string>;
  frequency: 'occasional' | 'daily' | 'heavy';
  priority: 'cost' | 'time' | 'quality';
  device: 'mobile' | 'desktop' | 'both';
  collaboration: 'solo' | 'team';
  budget: 'free' | 'low' | 'mid' | 'high';
}

// ── 추론(Reasoning) ──
interface Reasoning {
  serviceKey: string;
  serviceName: string;
  serviceIcon: string;
  tag: '성향 매치' | '용도 매치' | '예산 최적' | '보조 AI';
  tagIcon: string;
  headline: string;
  reason: string;
  traitMatch?: string;
  price: string;
}

// ── 최종 결과 ──
interface QuizResult {
  type: ResultType;
  scores: Scores;
  flags: Set<string>;
  practical: PracticalProfile;
  plans: PlanTier[];
  recommendedTier: 'free' | 'standard' | 'pro';
  reasonings: Reasoning[];
  insightSummary: string;
}
```

---

## 2. 핵심 함수 레퍼런스

### 2.1 스코어링 엔진 (`src/engine/scoring.ts`)

| 함수 | 입력 | 출력 | 설명 |
|------|------|------|------|
| `calculatePhase1` | `Map<number, string>` | `{ scores, flags }` | Phase 1 점수 계산, 4축 점수를 `-1~+1` 범위로 clamp |
| `calculatePhase2` | `answers, multiAnswers` | `PracticalProfile` | Phase 2 실전 프로필 추출 |
| `calculateResult` | `answers, multiAnswers` | `QuizResult` | Phase 1 + Phase 2 통합, 추론 생성, 플랜 빌드 |

#### 내부 함수

| 함수 | 역할 |
|------|------|
| `applyScoring` | 각 질문의 스코어링 규칙에 따라 축 점수 ±1 |
| `applyFlags` | 특정 답변 선택 시 플래그 설정 |
| `findBestMatch` | 유클리드 거리 기반 최적 유형 매칭 |
| `generateReasonings` | 5단계 개인화 추론 생성 |
| `getDominantTraits` | 4축 중 가장 강한 성향 추출 |
| `findTraitMatch` | AI 서비스 강점과 사용자 성향 매칭 |
| `determineRecommendedTier` | 예산/빈도/우선순위 기반 추천 티어 결정 |

### 2.2 플랜 빌더 (`src/data/plans.ts`)

| 함수 | 역할 |
|------|------|
| `buildPlans` | 3-tier 플랜 배열 생성 (free/standard/pro) |
| `getBestFreeLLM` | 무료 티어용 최적 LLM 선택 (Gemini 우선) |
| `buildFreeExtras` | 무료 추가 도구 목록 생성 |
| `buildStandardExtras` | 스탠다드 추가 도구 (무료 버전 우선) |
| `buildProExtras` | 프로 추가 도구 (유료 포함) |
| `estimateTierCost` | USD→KRW 대략적 비용 추정 (×1,400) |

### 2.3 화면 렌더러 (`src/screens/`)

| 함수 | 파일 | 역할 |
|------|------|------|
| `renderIntro` | `intro.ts` | 시작 화면: 일러스트 + CTA 버튼 |
| `renderQuiz` | `quiz.ts` | 퀴즈 화면: 진행 바, 단일/멀티 질문 렌더링 |
| `renderTransition` | `transition.ts` | Phase 1 결과 미리보기 + Phase 2 안내 |
| `renderLoading` | `loading.ts` | 3단계 로딩 메시지 (각 1초 간격) |
| `renderResult` | `result.ts` | 전체 결과: 유형/차트/추론/플랜/무료섹션/공유 |

---

## 3. 데이터 흐름

```
Phase 1 답변 (Map<id, 'A'|'B'|'C'>)
     │
     ├── calculatePhase1() → Scores (4축) + Flags
     │
     ├── findBestType() → 유형 미리보기 (transition 화면용)
     │
Phase 2 답변 (Map<id, 'A'|'B'|'C'|'D'> + Map<id, Set<string>>)
     │
     ├── calculatePhase2() → PracticalProfile
     │
     └── calculateResult():
         ├── Phase1 scores + Phase2 practical 통합
         ├── flags → usageNeeds 자동 추가
         ├── findBestMatch() → 최종 유형
         ├── generateReasonings() → 개인화 추론 배열
         ├── buildPlans() → 3-tier 플랜
         └── determineRecommendedTier() → 추천 티어
```

---

## 4. 질문 목록 (Quick Reference)

### Phase 1: 성향 질문 (6개)

| ID | 질문 | 축 | 선택지 수 | 플래그 |
|----|------|-----|-----------|--------|
| 1 | 카톡이 100개 쌓였다! | speed_depth | 2 | — |
| 2 | 새로운 요리를 할 때 나는? | real_creative | 2 | — |
| 3 | 친구 생일 선물 고를 때 | logic_visual | 2 | — |
| 4 | 방 정리 스타일은? | plan_flow | 2 | — |
| 5 | 노래방에서 나는? | real_creative | 2 | A→music |
| 6 | 유튜브 알고리즘이 추천해주는 건? | plan_flow | 3 | A→coding, B→image, C→research |

### Phase 2: 실전 질문 (6개)

| ID | 질문 | 필드 | 타입 | 선택지 수 |
|----|------|------|------|-----------|
| 7 | AI를 어디에 쓰고 싶어요? | usage | multi | 7 |
| 8 | AI를 얼마나 자주 쓸 것 같아요? | frequency | single | 3 |
| 9 | 가장 중요한 건 뭐예요? | priority | single | 3 |
| 10 | AI를 주로 어디서 써요? | device | single | 3 |
| 11 | 혼자 쓸 건가요, 같이? | collaboration | single | 2 |
| 12 | 월 AI 구독 예산은? | budget | single | 4 |
