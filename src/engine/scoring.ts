import { phase1Questions, type Question } from '../data/questions';
import { resultTypes, aiServices, type ResultType } from '../data/results';
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
  collaboration: 'solo' | 'team';
  budget: 'free' | 'low' | 'mid' | 'high';
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
  const collabMap: Record<string, PracticalProfile['collaboration']> = { A: 'solo', B: 'team' };
  const budgetMap: Record<string, PracticalProfile['budget']> = { A: 'free', B: 'low', C: 'mid', D: 'high' };

  return {
    usageNeeds,
    frequency: freqMap[answers.get(8) ?? 'A'] ?? 'occasional',
    priority: prioMap[answers.get(9) ?? 'A'] ?? 'cost',
    device: deviceMap[answers.get(10) ?? 'C'] ?? 'both',
    collaboration: collabMap[answers.get(11) ?? 'A'] ?? 'solo',
    budget: budgetMap[answers.get(12) ?? 'A'] ?? 'free',
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

  const type = findBestMatch(scores);
  const reasonings = generateReasonings(type, scores, practical, flags);
  const insightSummary = type.insights.summary;

  const plans = buildPlans(
    type.mainLLM,
    type.secondaryLLM,
    getExtraKeys(type, flags),
    practical.usageNeeds,
  );

  const recommendedTier = determineRecommendedTier(practical);

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
 * Generate personalized reasoning for each recommended AI
 */
function generateReasonings(
  type: ResultType,
  scores: Scores,
  practical: PracticalProfile,
  flags: Set<string>,
): Reasoning[] {
  const reasonings: Reasoning[] = [];
  const dominantTraits = getDominantTraits(scores);

  // 1. Main LLM — 성향 매치
  const mainSvc = aiServices[type.mainLLM];
  const mainTraitMatch = findTraitMatch(type.mainLLM, dominantTraits);
  reasonings.push({
    serviceKey: type.mainLLM,
    serviceName: mainSvc.name,
    serviceIcon: mainSvc.icon,
    tag: '성향 매치',
    tagIcon: 'heart',
    headline: type.insights.mainLLMReason,
    reason: mainTraitMatch.reason,
    traitMatch: mainTraitMatch.label,
    price: mainSvc.priceLabel,
  });

  // 2. Secondary LLM — 보조 AI
  const secSvc = aiServices[type.secondaryLLM];
  reasonings.push({
    serviceKey: type.secondaryLLM,
    serviceName: secSvc.name,
    serviceIcon: secSvc.icon,
    tag: '보조 AI',
    tagIcon: 'plus-circle',
    headline: type.insights.secondaryLLMReason,
    reason: getSecondaryReason(type.secondaryLLM, practical),
    price: secSvc.priceLabel,
  });

  // 3. Usage-based extras — 용도 매치
  const usageCategoryMap: Record<string, { cat: string; label: string }> = {
    writing: { cat: 'llm', label: '글쓰기 용도' },
    image: { cat: 'image', label: '이미지 만들기' },
    coding: { cat: 'coding', label: '코딩 용도' },
    research: { cat: 'research', label: '리서치 용도' },
    media: { cat: 'video', label: '영상/음악 만들기' },
    automation: { cat: 'automation', label: '자동화 용도' },
  };

  const addedKeys = new Set([type.mainLLM, type.secondaryLLM]);

  for (const [needKey, info] of Object.entries(usageCategoryMap)) {
    if (!practical.usageNeeds.has(needKey)) continue;
    const extrasInCat = type.recommendedExtras[info.cat];
    if (!extrasInCat || extrasInCat.length === 0) continue;

    for (const serviceKey of extrasInCat) {
      if (addedKeys.has(serviceKey)) continue;
      addedKeys.add(serviceKey);
      const svc = aiServices[serviceKey];
      if (!svc) continue;

      const usageReason = getUsageReason(serviceKey, needKey, practical);
      reasonings.push({
        serviceKey,
        serviceName: svc.name,
        serviceIcon: svc.icon,
        tag: '용도 매치',
        tagIcon: 'target',
        headline: `${info.label}에 관심 있다고 했죠?`,
        reason: usageReason,
        price: svc.priceLabel,
      });
    }
  }

  // 4. Flag-based extras not yet added
  if (flags.has('music') && !addedKeys.has('suno')) {
    addedKeys.add('suno');
    reasonings.push({
      serviceKey: 'suno',
      serviceName: aiServices.suno.name,
      serviceIcon: aiServices.suno.icon,
      tag: '성향 매치',
      tagIcon: 'heart',
      headline: '음악에 관심이 많은 당신에게',
      reason: '노래방 마이크를 독차지하는 당신, 나만의 곡을 만들어보세요',
      price: aiServices.suno.priceLabel,
    });
  }

  // 5. Budget-optimized suggestion
  if (practical.priority === 'cost' || practical.budget === 'free') {
    const freeLLM = type.mainLLM === 'gemini' ? 'gemini' : 'gemini';
    if (!addedKeys.has('budget_tip')) {
      reasonings.push({
        serviceKey: freeLLM,
        serviceName: '무료 조합 팁',
        serviceIcon: 'piggy-bank',
        tag: '예산 최적',
        tagIcon: 'coins',
        headline: '비용 절약을 원한다면?',
        reason: `${aiServices.gemini.name} 무료 티어로 시작하고, 부족할 때만 유료 전환!`,
        price: '₩0',
      });
    }
  }

  return reasonings;
}

function getDominantTraits(scores: Scores): { axis: string; direction: string; strength: number }[] {
  const traits: { axis: string; direction: string; strength: number }[] = [];
  for (const [axis, value] of Object.entries(scores)) {
    const labels = traitLabels[axis];
    if (!labels) continue;
    const direction = value < 0 ? labels[0].split(' ')[0] : labels[1].split(' ')[0];
    traits.push({ axis, direction, strength: Math.abs(value) });
  }
  return traits.sort((a, b) => b.strength - a.strength);
}

function findTraitMatch(serviceKey: string, dominantTraits: { axis: string; direction: string; strength: number }[]): { reason: string; label: string } {
  const svc = aiServices[serviceKey];
  if (!svc) return { reason: '', label: '' };

  for (const trait of dominantTraits) {
    const strengthKeys = Object.keys(svc.strengths);
    const axisKeys = trait.axis.split('_');

    for (const sk of strengthKeys) {
      if (axisKeys.includes(sk)) {
        const pct = Math.round(trait.strength * 100);
        const labels = traitLabels[trait.axis];
        const matchText = svc.strengths[sk as keyof typeof svc.strengths];
        return {
          reason: matchText || '',
          label: `${labels ? (trait.strength > 0 ? labels[1] : labels[0]) : trait.direction} ${pct}%`,
        };
      }
    }
  }

  // Fallback
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

function getUsageReason(serviceKey: string, _needKey: string, practical: PracticalProfile): string {
  const svc = aiServices[serviceKey];
  if (!svc) return '';

  const freqText = practical.frequency === 'heavy' ? '매일 쓴다면 유료가 효율적' :
    practical.frequency === 'daily' ? '자주 쓰면 유료도 고려해보세요' :
      '가끔 쓰면 무료로도 충분';

  const strengthText = Object.values(svc.strengths)[0] || svc.description;
  return `${strengthText} — ${freqText}`;
}

function determineRecommendedTier(p: PracticalProfile): 'free' | 'standard' | 'pro' {
  if (p.budget === 'free') return 'free';
  if (p.frequency === 'heavy' && p.priority === 'quality') return 'pro';
  if (p.budget === 'high') return 'pro';
  if (p.frequency === 'daily' || p.priority === 'time') return 'standard';
  if (p.budget === 'mid') return 'standard';
  if (p.frequency === 'occasional' && p.priority === 'cost') return 'free';
  return 'standard';
}

function getExtraKeys(type: ResultType, flags: Set<string>): string[] {
  const keys: string[] = [];
  for (const serviceKeys of Object.values(type.recommendedExtras)) {
    keys.push(...serviceKeys);
  }
  if (flags.has('music') && !keys.includes('suno')) keys.push('suno');
  if (flags.has('coding') && !keys.includes('cursor')) keys.push('cursor');
  return [...new Set(keys)];
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
