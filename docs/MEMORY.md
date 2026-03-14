# MatchMakerAI — 프로젝트 메모리

> **Version:** 1.0.0 | **Updated:** 2026-03-12

---

## 🔴 중요 결정 (Important Decisions)

### 프레임워크 미사용
- Vanilla TypeScript + Vite 조합
- DOM 직접 조작 (`innerHTML` + `requestAnimationFrame` 패턴)
- 상태 관리는 클로저(closure)와 `Map` 객체로 처리

### 스코어링 체계
- **4축 좌표계** (speed_depth, real_creative, logic_visual, plan_flow)
- **범위:** -1 ~ +1 (clamp 적용)
- **유형 매칭:** 유클리드 거리 최소화 (8개 유형의 이상 좌표와 비교)

---

## 🟡 반복 패턴 (Recurring Patterns)

### `toPascalCase` + `injectIcon` 공통 모듈
- ~~`quiz.ts`와 `result.ts`에서 동일한 함수가 각각 정의됨~~ → ✅ `src/utils/icons.ts`로 추출 완료
- 양쪽 화면에서 `import { injectIcon } from '../utils/icons'`로 사용

### DOM 렌더링 패턴
```
1. createElement('div') → className 설정
2. innerHTML로 HTML 문자열 삽입
3. requestAnimationFrame에서:
   - injectIcon으로 SVG 아이콘 삽입
   - 이벤트 리스너 바인딩
4. return HTMLElement
```

### 화면 전환 패턴
```
1. 현재 화면 .exiting (300ms 페이드 아웃)
2. setTimeout → DOM 교체
3. 새 화면 .active (400ms 페이드 인)
```

---

## ✅ 해결된 이슈 (Resolved Issues)

### 1. ~~`QuestionOption` 인터페이스 중복 정의~~ → 해결
- `quiz.ts`의 로컬 `QuestionOption` 제거, `questions.ts`에서 import

### 2. ~~`freeLLM` 변수 하드코딩~~ → 해결
- 무의미한 삼항 연산자 제거 → `const freeLLM = 'gemini'`로 단순화

### 3. ~~`_llmTier` 미사용 매개변수~~ → 해결
- `estimateTierCost`에서 매개변수 자체를 제거, 호출부도 함께 정리

### 4. ~~`_needKey` 미사용 매개변수~~ → 해결
- `getUsageReason`에서 `needKey`를 활용하여 카테고리별 맞춤 안내 메시지 생성

### 5. ~~`intro.ts` 질문 수 하드코딩~~ → 해결
- "8개 질문 · 약 2분 소요" → "12개 질문 · 약 3분 소요"로 수정

## 🟠 남은 이슈 (Remaining Issues)

### `icons` 전체 import로 번들 사이즈 증가
- **위치:** 모든 screen 파일 + `utils/icons.ts`에서 `import { createElement, icons } from 'lucide'`
- **영향:** 사용하지 않는 아이콘도 모두 번들에 포함
- **해결:** 필요한 아이콘만 개별 import하거나 Vite tree-shaking 최적화

---

## 🟢 향후 개선 가능 (Future Improvements)

- [ ] `toPascalCase`, `injectIcon` 유틸 함수 공통화 (`src/utils/` 추출)
- [ ] `QuestionOption` 타입 통합 (`quiz.ts`에서 `questions.ts` import)
- [ ] 일러스트 이미지 추가 (현재 placeholder 표시 중)
- [ ] 결과 공유 시 OG 이미지 생성 (SNS 미리보기용)
- [ ] 국제화(i18n) 지원 (현재 한국어 하드코딩)
- [ ] Lucide 아이콘 개별 import로 번들 사이즈 최적화
- [ ] 접근성(a11y) 개선 (ARIA labels, keyboard navigation)
- [ ] 오프라인 지원 (Service Worker + 폰트 로컬 번들링)

---

## 📊 프로젝트 통계

| 항목 | 값 |
|------|-----|
| **소스 파일 수** | 11개 (.ts + .css) |
| **TypeScript 총 라인** | ~2,200줄 |
| **CSS 총 라인** | 1,323줄 |
| **질문 수** | 12개 (Phase 1: 6, Phase 2: 6) |
| **AI 서비스 수** | 20개 |
| **유형 수** | 8개 |
| **런타임 의존성** | 1개 (lucide) |
| **빌드 의존성** | 2개 (typescript, vite) |
