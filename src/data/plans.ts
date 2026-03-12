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
}

export interface PlanExtra {
  serviceKey: string;
  tier: 'free' | 'paid';
  note: string;
}

/**
 * Build 3-tier plans based on recommended LLM and extras.
 */
export function buildPlans(
  mainLLMKey: string,
  secondaryLLMKey: string,
  extraKeys: string[],
  usageNeeds: Set<string>,
): PlanTier[] {
  const mainLLM = aiServices[mainLLMKey];

  // Free tier: use best free option
  const freeLLMKey = getBestFreeLLM(mainLLMKey, secondaryLLMKey);
  const freeLLM = aiServices[freeLLMKey];

  const freePlan: PlanTier = {
    id: 'free',
    name: '무료',
    priceLabel: '₩0',
    priceRange: '₩0/월',
    description: '무료로 시작하기',
    targetUser: '가끔 쓰는 일반 사용자, AI를 처음 써보는 분',
    mainLLM: freeLLMKey,
    mainLLMTier: freeLLM.priceFree,
    extras: buildFreeExtras(usageNeeds),
    freeAlternatives: [],
  };

  // Standard tier: main LLM paid + free extras
  const standardExtras = buildStandardExtras(extraKeys, usageNeeds);
  const standardCost = estimateTierCost(mainLLMKey, 'paid', standardExtras);

  const standardPlan: PlanTier = {
    id: 'standard',
    name: '스탠다드',
    priceLabel: standardCost,
    priceRange: `${standardCost}/월`,
    description: `${mainLLM.name} 유료 + 무료 옵션`,
    targetUser: '매일 쓰는 일반 사용자, 시간 절약이 중요한 분',
    mainLLM: mainLLMKey,
    mainLLMTier: mainLLM.priceLabel,
    extras: standardExtras,
    freeAlternatives: getFreeAlternatives(standardExtras),
  };

  // Pro tier: main LLM paid + paid extras
  const proExtras = buildProExtras(extraKeys, usageNeeds);
  const proCost = estimateTierCost(mainLLMKey, 'paid', proExtras);

  const proPlan: PlanTier = {
    id: 'pro',
    name: '프로',
    priceLabel: proCost,
    priceRange: `${proCost}/월`,
    description: `${mainLLM.name} + 전문 도구들`,
    targetUser: '전문적 활용, 크리에이터, 개발자',
    mainLLM: mainLLMKey,
    mainLLMTier: mainLLM.priceLabel,
    extras: proExtras,
    freeAlternatives: getFreeAlternatives(proExtras),
  };

  return [freePlan, standardPlan, proPlan];
}

function getBestFreeLLM(main: string, secondary: string): string {
  // Gemini has the best free tier
  if (main === 'gemini' || secondary === 'gemini') return 'gemini';
  if (main === 'chatgpt' || secondary === 'chatgpt') return 'chatgpt';
  return main;
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

function estimateTierCost(llmKey: string, _llmTier: string, extras: PlanExtra[]): string {
  let total = 0;

  // LLM base cost
  const llm = aiServices[llmKey];
  if (llm) {
    const match = llm.priceLabel.match(/\$(\d+)/);
    if (match) total += parseInt(match[1], 10);
  }

  // Extra costs (paid only)
  for (const extra of extras) {
    if (extra.tier === 'paid') {
      const svc = aiServices[extra.serviceKey];
      if (svc) {
        const match = svc.priceLabel.match(/\$(\d+)/);
        if (match) total += parseInt(match[1], 10);
      }
    }
  }

  // Convert to KRW (rough)
  const krw = total * 1400;
  if (krw === 0) return '₩0';
  if (krw < 10000) return `~₩${Math.round(krw / 1000) * 1000}`;
  return `~₩${Math.round(krw / 10000)}만`;
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
