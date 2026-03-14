import { aiServices } from './results';

export interface PlanTier {
  id: 'free' | 'standard' | 'pro';
  name: string;
  priceLabel: string;
  priceRange: string;
  description: string;
  targetUser: string;
  mainLLM: string;
  mainLLMTier: string;
  extras: PlanExtra[];
  freeAlternatives: string[];
  costKRW: number;  // 실제 계산된 월 비용 (KRW)
  budgetHint: string;  // 예산 대비 힌트 메시지
}

export interface PlanExtra {
  serviceKey: string;
  tier: 'free' | 'paid';
  note: string;
}

const USD_TO_KRW = 1400;

/**
 * Build 3-tier plans based on recommended LLM, extras, and budget.
 */
export function buildPlans(
  mainLLMKey: string,
  extraKeys: string[],
  usageNeeds: Set<string>,
  budgetKRW: number,
): PlanTier[] {
  const mainLLM = aiServices[mainLLMKey];

  // Free tier: same soulmate LLM, free tier
  const freePlan: PlanTier = {
    id: 'free',
    name: '무료',
    priceLabel: '₩0',
    priceRange: '₩0/월',
    description: '무료로 시작하기',
    targetUser: '가끔 쓰는 일반 사용자, AI를 처음 써보는 분',
    mainLLM: mainLLMKey,
    mainLLMTier: mainLLM.priceFree,
    extras: buildFreeExtras(usageNeeds),
    freeAlternatives: [],
    costKRW: 0,
    budgetHint: '완전 무료',
  };

  // Standard tier: main LLM paid + free extras
  const standardExtras = buildStandardExtras(extraKeys, usageNeeds);
  const standardCostRaw = calcCostKRW(mainLLMKey, standardExtras);

  // 예산 초과 시 extras 삭감 (Standard만 적용)
  const trimmedStdExtras = budgetKRW > 0
    ? trimExtrasToFitBudget(mainLLMKey, standardExtras, budgetKRW)
    : standardExtras;
  const standardCost = budgetKRW > 0
    ? calcCostKRW(mainLLMKey, trimmedStdExtras)
    : standardCostRaw;

  const standardPlan: PlanTier = {
    id: 'standard',
    name: '스탠다드',
    priceLabel: formatKRW(standardCost),
    priceRange: `${formatKRW(standardCost)}/월`,
    description: `${mainLLM.name} 유료 + 무료 옵션`,
    targetUser: '매일 쓰는 일반 사용자, 시간 절약이 중요한 분',
    mainLLM: mainLLMKey,
    mainLLMTier: mainLLM.priceLabel,
    extras: trimmedStdExtras,
    freeAlternatives: getFreeAlternatives(trimmedStdExtras),
    costKRW: standardCost,
    budgetHint: getBudgetHint(standardCost, budgetKRW),
  };

  // Pro tier: main LLM paid + paid extras
  const proExtras = buildProExtras(extraKeys, usageNeeds);
  const proCost = calcCostKRW(mainLLMKey, proExtras);

  const proPlan: PlanTier = {
    id: 'pro',
    name: '프로',
    priceLabel: formatKRW(proCost),
    priceRange: `${formatKRW(proCost)}/월`,
    description: `${mainLLM.name} + 전문 도구들`,
    targetUser: '전문적 활용, 크리에이터, 개발자',
    mainLLM: mainLLMKey,
    mainLLMTier: mainLLM.priceLabel,
    extras: proExtras,
    freeAlternatives: getFreeAlternatives(proExtras),
    costKRW: proCost,
    budgetHint: getBudgetHint(proCost, budgetKRW),
  };

  return [freePlan, standardPlan, proPlan];
}


function buildFreeExtras(usageNeeds: Set<string>): PlanExtra[] {
  const extras: PlanExtra[] = [];
  if (usageNeeds.has('image')) {
    extras.push({ serviceKey: 'gemini_image', tier: 'free', note: '무료 이미지 생성' });
  }
  if (usageNeeds.has('research')) {
    extras.push({ serviceKey: 'notebooklm', tier: 'free', note: '무료 문서 분석' });
    extras.push({ serviceKey: 'perplexity', tier: 'free', note: '무료 AI 검색' });
  }
  if (usageNeeds.has('media')) {
    extras.push({ serviceKey: 'suno', tier: 'free', note: '무료 음악 생성 (제한)' });
  }
  if (usageNeeds.has('coding')) {
    extras.push({ serviceKey: 'antigravity', tier: 'free', note: '무료 AI 코딩' });
  }
  if (usageNeeds.has('automation')) {
    extras.push({ serviceKey: 'google_opal', tier: 'free', note: '무료 자동화' });
  }
  return extras;
}

function buildStandardExtras(extraKeys: string[], usageNeeds: Set<string>): PlanExtra[] {
  const extras: PlanExtra[] = [];

  // Add free versions of what user needs
  for (const key of extraKeys) {
    const svc = aiServices[key];
    if (!svc) continue;
    if (svc.priceFree !== '없음' && svc.priceFree !== '유료 전용') {
      extras.push({ serviceKey: key, tier: 'free', note: svc.priceFree });
    }
  }

  // Fill gaps from usage needs
  if (usageNeeds.has('research') && !extras.some((e) => e.serviceKey === 'perplexity')) {
    extras.push({ serviceKey: 'perplexity', tier: 'free', note: '무료 AI 검색' });
  }

  return extras;
}

function buildProExtras(extraKeys: string[], usageNeeds: Set<string>): PlanExtra[] {
  const extras: PlanExtra[] = [];

  for (const key of extraKeys) {
    const svc = aiServices[key];
    if (!svc) continue;
    extras.push({ serviceKey: key, tier: 'paid', note: svc.priceLabel });
  }

  // Add paid options for usage needs not already covered
  if (usageNeeds.has('research') && !extras.some((e) => aiServices[e.serviceKey]?.category === 'research')) {
    extras.push({ serviceKey: 'perplexity', tier: 'paid', note: aiServices.perplexity.priceLabel });
  }

  return extras;
}

/**
 * 정확한 KRW 비용 계산 (priceUSD 기반)
 */
function calcCostKRW(llmKey: string, extras: PlanExtra[]): number {
  let totalUSD = 0;
  const countedGroups = new Set<string>();

  const llm = aiServices[llmKey];
  if (llm) {
    totalUSD += llm.priceUSD;
    if (llm.planGroup) countedGroups.add(llm.planGroup);
  }

  for (const extra of extras) {
    if (extra.tier === 'paid') {
      const svc = aiServices[extra.serviceKey];
      if (!svc) continue;
      // 같은 planGroup이면 중복 합산하지 않음
      if (svc.planGroup) {
        if (countedGroups.has(svc.planGroup)) continue;
        countedGroups.add(svc.planGroup);
      }
      totalUSD += svc.priceUSD;
    }
  }

  return Math.round(totalUSD * USD_TO_KRW);
}

/**
 * KRW 금액 포맷팅
 */
function formatKRW(krw: number): string {
  if (krw === 0) return '₩0';
  if (krw < 10000) return `~₩${Math.round(krw / 1000) * 1000}`;
  return `~₩${Math.round(krw / 10000)}만`;
}

/**
 * 예산 초과 시 extras를 낮은 비용부터 삭감
 */
function trimExtrasToFitBudget(
  llmKey: string,
  extras: PlanExtra[],
  budgetKRW: number,
): PlanExtra[] {
  const baseCostKRW = (aiServices[llmKey]?.priceUSD ?? 0) * USD_TO_KRW;
  if (baseCostKRW >= budgetKRW) return []; // LLM만으로도 초과

  const remaining = budgetKRW - baseCostKRW;
  const paidExtras = extras.filter(e => e.tier === 'paid');
  const freeExtras = extras.filter(e => e.tier === 'free');

  // 비용 낮은 순으로 정렬하여 예산 내에서 최대한 추가
  const sorted = [...paidExtras].sort((a, b) => {
    const costA = (aiServices[a.serviceKey]?.priceUSD ?? 0) * USD_TO_KRW;
    const costB = (aiServices[b.serviceKey]?.priceUSD ?? 0) * USD_TO_KRW;
    return costA - costB;
  });

  let used = 0;
  const kept: PlanExtra[] = [...freeExtras];
  for (const extra of sorted) {
    const cost = (aiServices[extra.serviceKey]?.priceUSD ?? 0) * USD_TO_KRW;
    if (used + cost <= remaining) {
      kept.push(extra);
      used += cost;
    }
  }

  return kept;
}

/**
 * 예산 대비 힌트 생성
 */
function getBudgetHint(costKRW: number, budgetKRW: number): string {
  if (budgetKRW === 0) return '';
  if (costKRW === 0) return '완전 무료';
  if (costKRW <= budgetKRW) {
    const pct = Math.round((costKRW / budgetKRW) * 100);
    return `예산 ${pct}% 사용 (₩${costKRW.toLocaleString()} / ₩${budgetKRW.toLocaleString()})`;
  }
  const over = costKRW - budgetKRW;
  return `예산 ₩${over.toLocaleString()} 초과`;
}

function getFreeAlternatives(extras: PlanExtra[]): string[] {
  const alts: string[] = [];
  for (const extra of extras) {
    if (extra.tier === 'paid') {
      const svc = aiServices[extra.serviceKey];
      if (svc && svc.priceFree !== '없음' && svc.priceFree !== '유료 전용') {
        alts.push(`${svc.name}: 무료로도 ${svc.priceFree} 가능`);
      }
    }
  }
  return alts;
}

/** Things that are free and good enough for most users */
export const freeEnoughItems = [
  { name: 'Gemini', reason: '무료 티어가 넉넉하고, 이미지 생성도 무료', icon: 'sparkles' },
  { name: 'NotebookLM', reason: '문서 분석·팟캐스트 변환이 완전 무료', icon: 'book-open' },
  { name: 'Perplexity', reason: '무료로도 AI 검색 충분히 활용 가능', icon: 'search' },
  { name: 'Suno', reason: '무료로 월 몇 곡은 만들 수 있음', icon: 'music' },
  { name: 'Google Opal', reason: '기본 자동화는 무료로 가능', icon: 'workflow' },
];
