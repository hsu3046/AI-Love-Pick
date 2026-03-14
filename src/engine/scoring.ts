import { phase1Questions, type Question } from '../data/questions';
import { resultTypes, aiServices, usageToCategoryMap, type ResultType } from '../data/results';
import { buildPlans, type PlanTier } from '../data/plans';

export interface Scores {
  speed_depth: number;
  real_creative: number;
  logic_visual: number;
  plan_flow: number;
}

export interface PracticalProfile {
  usageNeeds: Set<string>;
  frequency: 'occasional' | 'daily' | 'heavy';
  priority: 'cost' | 'time' | 'quality';
  device: 'mobile' | 'desktop' | 'both';
  infoStyle: 'trending' | 'verified' | 'creative';
  budget: 'free' | 'low' | 'mid' | 'high';
  budgetKRW: number;  // 월 예산 한도 (원)
}

export interface Reasoning {
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

export interface QuizResult {
  type: ResultType;
  scores: Scores;
  flags: Set<string>;
  practical: PracticalProfile;
  plans: PlanTier[];
  recommendedTier: 'free' | 'standard' | 'pro';
  reasonings: Reasoning[];
  insightSummary: string;
}

const traitLabels: Record<string, [string, string]> = {
  speed_depth: ['속도 중시', '깊이 중시'],
  real_creative: ['현실 중시', '창작 중시'],
  logic_visual: ['논리 중시', '감성 중시'],
  plan_flow: ['체계 중시', '즉흥 중시'],
};

/**
 * Phase 1: personality scoring → type matching
 */
export function calculatePhase1(answers: Map<number, string>): { scores: Scores; flags: Set<string> } {
  const scores: Scores = {
    speed_depth: 0,
    real_creative: 0,
    logic_visual: 0,
    plan_flow: 0,
  };
  const flags = new Set<string>();

  for (const q of phase1Questions) {
    const answer = answers.get(q.id);
    if (!answer) continue;
    if (q.scoring) applyScoring(scores, q, answer);
    applyFlags(flags, q, answer);
  }

  scores.speed_depth = clamp(scores.speed_depth, -1, 1);
  scores.real_creative = clamp(scores.real_creative, -1, 1);
  scores.logic_visual = clamp(scores.logic_visual, -1, 1);
  scores.plan_flow = clamp(scores.plan_flow, -1, 1);

  return { scores, flags };
}

/**
 * Phase 2: practical profile extraction
 */
export function calculatePhase2(
  answers: Map<number, string>,
  multiAnswers: Map<number, Set<string>>,
): PracticalProfile {
  const usageNeeds = multiAnswers.get(7) ?? new Set<string>();

  const freqMap: Record<string, PracticalProfile['frequency']> = { A: 'occasional', B: 'daily', C: 'heavy' };
  const prioMap: Record<string, PracticalProfile['priority']> = { A: 'cost', B: 'time', C: 'quality' };
  const deviceMap: Record<string, PracticalProfile['device']> = { A: 'mobile', B: 'desktop', C: 'both' };
  const infoMap: Record<string, PracticalProfile['infoStyle']> = { A: 'trending', B: 'verified', C: 'creative' };
  const budgetMap: Record<string, PracticalProfile['budget']> = { A: 'free', B: 'low', C: 'mid', D: 'high' };
  const budgetKRWMap: Record<string, number> = { A: 0, B: 15000, C: 30000, D: 0 };

  const budgetAnswer = answers.get(12) ?? 'A';

  return {
    usageNeeds,
    frequency: freqMap[answers.get(8) ?? 'A'] ?? 'occasional',
    priority: prioMap[answers.get(9) ?? 'A'] ?? 'cost',
    device: deviceMap[answers.get(10) ?? 'C'] ?? 'both',
    infoStyle: infoMap[answers.get(11) ?? 'B'] ?? 'verified',
    budget: budgetMap[budgetAnswer] ?? 'free',
    budgetKRW: budgetKRWMap[budgetAnswer] ?? 0,
  };
}

/**
 * Full result: combine Phase 1 + Phase 2
 */
export function calculateResult(
  answers: Map<number, string>,
  multiAnswers: Map<number, Set<string>>,
): QuizResult {
  const { scores, flags } = calculatePhase1(answers);
  const practical = calculatePhase2(answers, multiAnswers);

  if (flags.has('music')) practical.usageNeeds.add('media');
  if (flags.has('image')) practical.usageNeeds.add('image');
  if (flags.has('coding')) practical.usageNeeds.add('coding');
  if (flags.has('research')) practical.usageNeeds.add('research');

  // 유형은 재미 라벨용으로 유지
  const type = findBestMatch(scores);

  // ★ 새 로직: 적합도 기반 서비스 선택
  const selectedServices = selectRecommendedServices(scores, practical);
  const mainLLMKey = selectedServices.mainLLM;
  const extraKeys = selectedServices.extras.map(s => s.key);

  const reasonings = generateReasonings(selectedServices, scores, practical);

  // Build insight that bridges personality → actual mainLLM (prevents message mismatch)
  const mainReasoning = reasonings[0];
  const mainSvc = aiServices[mainLLMKey];
  const insightSummary = mainReasoning?.traitMatch
    ? `${mainReasoning.traitMatch} 성향인 당신에게는 ${mainSvc?.name}이(가) 딱 맞아요. ${mainReasoning.headline}`
    : mainReasoning?.headline
    ? `당신의 소울메이트 AI는 ${mainSvc?.name}이에요. ${mainReasoning.headline}`
    : type.insights.summary;

  const plans = buildPlans(
    mainLLMKey,
    extraKeys,
    practical.usageNeeds,
    practical.budgetKRW,
  );

  const recommendedTier = determineRecommendedTier(practical, plans);

  return {
    type,
    scores,
    flags,
    practical,
    plans,
    recommendedTier,
    reasonings,
    insightSummary,
  };
}

/**
 * ★ 핵심: 적합도 기반 서비스 선택
 */
interface ServiceScore { key: string; score: number; }
interface SelectedServices {
  mainLLM: string;
  secondaryLLM: string;
  extras: ServiceScore[];
}

function computeServiceFitness(
  serviceKey: string,
  scores: Scores,
  practical: PracticalProfile,
): number {
  const svc = aiServices[serviceKey];
  if (!svc) return -Infinity;
  const fp = svc.fitProfile;

  // 1. 성향 매치: 4축 내적 (코사인 유사도 근사)
  let traitScore =
    scores.speed_depth * fp.speed_depth +
    scores.real_creative * fp.real_creative +
    scores.logic_visual * fp.logic_visual +
    scores.plan_flow * fp.plan_flow;

  // 2. 예산 적합도 — soft penalty + hard block based on actual KRW cost
  const USD_TO_KRW = 1400;
  const minCostKRW = Math.min(...svc.tiers.map(t => t.priceUSD)) * USD_TO_KRW;
  const userBudgetKRW = practical.budgetKRW;  // 0 means no budget set

  const budgetOrder = { free: 0, budget: 1, premium: 2 };
  const userBudgetLevel = practical.budget === 'free' ? 0 : practical.budget === 'low' ? 1 : practical.budget === 'mid' ? 1 : 2;
  if (budgetOrder[fp.budgetTier] > userBudgetLevel) {
    traitScore -= 0.5; // soft penalty
  }
  // Hard penalty: if cheapest tier exceeds user's KRW budget, this service is effectively unaffordable
  if (userBudgetKRW > 0 && minCostKRW > userBudgetKRW) {
    traitScore -= 1.5;
  }
  if (practical.budget === 'free' && fp.budgetTier === 'free') {
    traitScore += 0.2; // 무료 보너스
  }

  // 3. 우선순위 보정 (Q9)
  if (practical.priority === 'cost' && fp.budgetTier === 'free') traitScore += 0.15;
  if (practical.priority === 'quality' && fp.budgetTier === 'premium') traitScore += 0.15;
  if (practical.priority === 'time' && scores.speed_depth < 0) traitScore += 0.1;

  // 4. 빈도 보정 (Q8)
  if (practical.frequency === 'heavy' && fp.budgetTier !== 'free') traitScore += 0.1;
  if (practical.frequency === 'occasional' && fp.budgetTier === 'free') traitScore += 0.1;

  // 5. 기기 적합도 (Q10)
  if (practical.device === 'mobile' && fp.deviceFit === 'desktop') traitScore -= 0.15;
  if (practical.device === 'desktop' && fp.deviceFit === 'mobile') traitScore -= 0.1;

  // 6. 정보 신선도 (Q11)
  if (practical.infoStyle === 'trending' && fp.infoFreshness === 'trending') traitScore += 0.2;
  if (practical.infoStyle === 'verified' && fp.infoFreshness === 'verified') traitScore += 0.2;
  if (practical.infoStyle === 'creative' && fp.infoFreshness === 'creative') traitScore += 0.2;
  // 불일치 페널티
  if (practical.infoStyle !== 'creative' && fp.infoFreshness !== 'neutral' && practical.infoStyle !== fp.infoFreshness) traitScore -= 0.1;
  if (practical.infoStyle === 'creative' && (fp.infoFreshness === 'trending' || fp.infoFreshness === 'verified')) traitScore -= 0.05;

  return traitScore;
}

function selectRecommendedServices(
  scores: Scores,
  practical: PracticalProfile,
): SelectedServices {
  // 모든 서비스의 적합도 계산
  const allScores: ServiceScore[] = Object.keys(aiServices).map(key => ({
    key,
    score: computeServiceFitness(key, scores, practical),
  }));

  // LLM 선택: LLM 카테고리에서 top 2
  const llmScores = allScores
    .filter(s => aiServices[s.key].category === 'llm')
    .sort((a, b) => b.score - a.score);
  const mainLLM = llmScores[0]?.key || 'chatgpt';
  const secondaryLLM = llmScores[1]?.key || 'gemini';

  // Q7 usageNeeds → 허용 카테고리 집합 (LLM 제외)
  const allowedCategories = new Set<string>();
  for (const need of practical.usageNeeds) {
    const cats = usageToCategoryMap[need];
    if (cats) cats.forEach(c => allowedCategories.add(c));
  }
  // LLM 카테고리는 별도로 처리했으므로 제거
  allowedCategories.delete('llm');

  // 비-LLM 서비스: 허용 카테고리에 해당하는 것만 → 카테고리별 top 1
  const categoryBest = new Map<string, ServiceScore>();
  for (const s of allScores) {
    const svc = aiServices[s.key];
    if (svc.category === 'llm') continue;
    if (!allowedCategories.has(svc.category)) continue;
    // usageCategories가 사용자의 usageNeeds와 교집합이 있어야 함
    const hasMatchingNeed = svc.usageCategories.some(uc => practical.usageNeeds.has(uc));
    if (!hasMatchingNeed) continue;

    const existing = categoryBest.get(svc.category);
    if (!existing || s.score > existing.score) {
      categoryBest.set(svc.category, s);
    }
  }

  // Hard budget accumulator: only recommend extras that fit within remaining budget
  const USD_TO_KRW_SELECT = 1400;
  const getMinCostKRW = (key: string): number => {
    const s = aiServices[key];
    if (!s) return 0;
    return Math.round(Math.min(...s.tiers.map(t => t.priceUSD)) * USD_TO_KRW_SELECT);
  };

  let remainingBudget = practical.budgetKRW > 0
    ? practical.budgetKRW - getMinCostKRW(mainLLM) - getMinCostKRW(secondaryLLM)
    : Infinity;

  const budgetedExtras: ServiceScore[] = [];
  const sortedExtras = [...categoryBest.values()].sort((a, b) => b.score - a.score);
  for (const extra of sortedExtras) {
    const cost = getMinCostKRW(extra.key);
    if (cost <= remainingBudget) {
      budgetedExtras.push(extra);
      remainingBudget -= cost;
    }
    // over-budget extras are silently dropped from recommendations
  }

  return { mainLLM, secondaryLLM, extras: budgetedExtras };
}

/**
 * Generate personalized reasoning for fitness-selected services
 */
function generateReasonings(
  selected: SelectedServices,
  scores: Scores,
  practical: PracticalProfile,
): Reasoning[] {
  const reasonings: Reasoning[] = [];
  const dominantTraits = getDominantTraits(scores);

  // 1. Main LLM
  const mainSvc = aiServices[selected.mainLLM];
  const mainTraitMatch = findTraitMatch(selected.mainLLM, dominantTraits);
  reasonings.push({
    serviceKey: selected.mainLLM,
    serviceName: mainSvc.name,
    serviceIcon: mainSvc.icon,
    tag: '성향 매치',
    tagIcon: 'heart',
    headline: mainTraitMatch.reason || mainSvc.description,
    reason: `당신의 성향에 가장 잘 맞는 AI`,
    traitMatch: mainTraitMatch.label,
    price: mainSvc.priceLabel,
  });

  // 2. Secondary LLM
  const secSvc = aiServices[selected.secondaryLLM];
  reasonings.push({
    serviceKey: selected.secondaryLLM,
    serviceName: secSvc.name,
    serviceIcon: secSvc.icon,
    tag: '보조 AI',
    tagIcon: 'plus-circle',
    headline: getSecondaryReason(selected.secondaryLLM, practical),
    reason: `메인 AI의 부족한 부분을 보완`,
    price: secSvc.priceLabel,
  });

  // 3. Extras — 적합도 순 (이미 카테고리별 top 1만)
  const needLabels: Record<string, string> = {
    writing: '글쓰기·번역',
    image: '이미지 생성',
    coding: '코딩·개발',
    research: '리서치·검색',
    media: '영상·음악',
    automation: '업무 자동화',
  };

  for (const extra of selected.extras) {
    const svc = aiServices[extra.key];
    if (!svc) continue;
    // 해당 서비스가 응답하는 usage need 중 사용자가 선택한 것
    const matchedNeed = svc.usageCategories.find(uc => practical.usageNeeds.has(uc));
    const label = matchedNeed ? (needLabels[matchedNeed] || matchedNeed) : svc.category;
    const strengthText = Object.values(svc.strengths)[0] || svc.description;

    reasonings.push({
      serviceKey: extra.key,
      serviceName: svc.name,
      serviceIcon: svc.icon,
      tag: '용도 매치',
      tagIcon: 'target',
      headline: `${label}에 관심 있다고 했죠?`,
      reason: strengthText,
      price: svc.priceLabel,
    });
  }

  return reasonings;
}

function getDominantTraits(scores: Scores): { axis: string; direction: string; strength: number; value: number }[] {
  const traits: { axis: string; direction: string; strength: number; value: number }[] = [];
  for (const [axis, value] of Object.entries(scores)) {
    const labels = traitLabels[axis];
    if (!labels) continue;
    const direction = value < 0 ? labels[0].split(' ')[0] : labels[1].split(' ')[0];
    traits.push({ axis, direction, strength: Math.abs(value), value });
  }
  return traits.sort((a, b) => b.strength - a.strength);
}

function findTraitMatch(serviceKey: string, dominantTraits: { axis: string; direction: string; strength: number; value: number }[]): { reason: string; label: string } {
  const svc = aiServices[serviceKey];
  if (!svc) return { reason: '', label: '' };

  for (const trait of dominantTraits) {
    const strengthKeys = Object.keys(svc.strengths);
    const axisKeys = trait.axis.split('_');

    for (const sk of strengthKeys) {
      if (axisKeys.includes(sk)) {
        const pct = Math.round(trait.strength * 100);
        const labels = traitLabels[trait.axis];
        const dirLabel = labels ? (trait.value < 0 ? labels[0] : labels[1]) : trait.direction;
        const matchText = svc.strengths[sk as keyof typeof svc.strengths];
        return {
          reason: matchText || '',
          label: `${dirLabel} ${pct}%`,
        };
      }
    }
  }

  const firstStrength = Object.values(svc.strengths)[0];
  return { reason: firstStrength || svc.description, label: '' };
}

function getSecondaryReason(serviceKey: string, practical: PracticalProfile): string {
  const svc = aiServices[serviceKey];
  if (!svc) return '';

  if (practical.budget === 'free' && svc.priceFree.includes('무료')) {
    return `무료 티어가 넉넉해서 부담 없이 사용 가능`;
  }
  if (practical.priority === 'time') {
    return `${svc.name}을(를) 보조로 쓰면 답변 비교로 시간 절약`;
  }
  const firstStrength = Object.values(svc.strengths)[0];
  return firstStrength || svc.description;
}

function determineRecommendedTier(p: PracticalProfile, plans: PlanTier[]): 'free' | 'standard' | 'pro' {
  if (p.budgetKRW === 0) return 'free';

  const planCosts = new Map<string, number>();
  for (const plan of plans) {
    planCosts.set(plan.id, plan.costKRW);
  }

  const stdCost = planCosts.get('standard') ?? Infinity;
  const proCost = planCosts.get('pro') ?? Infinity;

  if (proCost <= p.budgetKRW && (p.frequency === 'heavy' || p.priority === 'quality')) {
    return 'pro';
  }
  if (stdCost <= p.budgetKRW) {
    return 'standard';
  }
  return 'free';
}

function applyScoring(scores: Scores, q: Question, answer: string): void {
  if (!q.scoring) return;
  const { axis, values } = q.scoring;
  if (answer === 'A') {
    scores[axis] += (values[0] === 'speed' || values[0] === 'real' || values[0] === 'logic' || values[0] === 'plan') ? -1 : 1;
  } else if (answer === 'B') {
    scores[axis] += (values[1] === 'speed' || values[1] === 'real' || values[1] === 'logic' || values[1] === 'plan') ? -1 : 1;
  }
}

function applyFlags(flags: Set<string>, q: Question, answer: string): void {
  if (!q.flags) return;
  for (const f of q.flags) {
    if (f.option === answer) flags.add(f.flag);
  }
}

function findBestMatch(scores: Scores): ResultType {
  let bestType = resultTypes[0];
  let bestDistance = Infinity;

  for (const rt of resultTypes) {
    const d =
      Math.pow(scores.speed_depth - rt.traits.speed_depth, 2) +
      Math.pow(scores.real_creative - rt.traits.real_creative, 2) +
      Math.pow(scores.logic_visual - rt.traits.logic_visual, 2) +
      Math.pow(scores.plan_flow - rt.traits.plan_flow, 2);
    if (d < bestDistance) {
      bestDistance = d;
      bestType = rt;
    }
  }
  return bestType;
}

function clamp(v: number, min: number, max: number): number {
  return Math.max(min, Math.min(max, v));
}
