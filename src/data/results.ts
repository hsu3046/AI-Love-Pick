export interface AIStrengths {
  speed?: string;
  depth?: string;
  creative?: string;
  real?: string;
  logic?: string;
  visual?: string;
  plan?: string;
  flow?: string;
}

export interface AIService {
  name: string;
  category: 'llm' | 'image' | 'music' | 'video' | 'coding' | 'research' | 'voice' | 'automation';
  description: string;
  priceFree: string;
  priceLabel: string;
  icon: string;
  strengths: AIStrengths;
}

export const aiServices: Record<string, AIService> = {
  chatgpt: {
    name: 'ChatGPT',
    category: 'llm',
    description: '만능 선생님 — 뭐든 잘하는 올라운더',
    priceFree: '무료 (제한적)',
    priceLabel: '$20/월 (Plus)',
    icon: 'bot',
    strengths: {
      speed: '빠르고 자연스러운 대화',
      creative: '글쓰기·브레인스토밍에 강함',
      plan: '체계적인 단계별 설명',
    },
  },
  gemini: {
    name: 'Gemini',
    category: 'llm',
    description: '구글 마스터 — 검색과 멀티미디어의 강자',
    priceFree: '무료 (넉넉)',
    priceLabel: '$20/월 (Advanced)',
    icon: 'sparkles',
    strengths: {
      real: '구글 연동, 최신 정보 검색',
      creative: '이미지 생성 내장 (무료!)',
      flow: '다양한 형식 자유롭게 활용',
    },
  },
  claude: {
    name: 'Claude',
    category: 'llm',
    description: '깊은 사색가 — 긴 글과 정밀 분석의 달인',
    priceFree: '무료 (제한적)',
    priceLabel: '$20/월 (Pro)',
    icon: 'brain',
    strengths: {
      depth: '긴 문서도 정밀하게 분석',
      logic: '논리적이고 구조화된 답변',
      plan: '복잡한 작업을 단계별로 분해',
    },
  },
  grok: {
    name: 'Grok',
    category: 'llm',
    description: '트렌드 헌터 — 실시간 정보의 최전선',
    priceFree: 'X 프리미엄',
    priceLabel: '$8~16/월',
    icon: 'zap',
    strengths: {
      speed: '가장 빠른 실시간 정보 반영',
      flow: '가볍고 즉흥적인 대화에 강함',
      real: 'X(트위터) 실시간 트렌드 연동',
    },
  },
  gemini_image: {
    name: 'Gemini 이미지 (나노 바나나)',
    category: 'image',
    description: 'Google 생태계 내 무료 이미지 생성',
    priceFree: '무료',
    priceLabel: '$20/월',
    icon: 'image',
    strengths: { creative: '대화 중 바로 생성', flow: '무료로 부담 없이' },
  },
  gpt_image: {
    name: 'GPT 이미지',
    category: 'image',
    description: '대화하면서 바로 이미지 생성',
    priceFree: '유료 전용',
    priceLabel: '$20/월',
    icon: 'image-plus',
    strengths: { creative: '자연스러운 묘사 → 이미지', plan: '수정 요청이 편리' },
  },
  midjourney: {
    name: 'Midjourney',
    category: 'image',
    description: '최고 퀄리티 아트워크, 스타일 다양',
    priceFree: '없음',
    priceLabel: '$10~30/월',
    icon: 'palette',
    strengths: { visual: '최고 수준의 아트 퀄리티', depth: '스타일 세밀 조정 가능' },
  },
  seedream: {
    name: 'Seedream (ByteDance)',
    category: 'image',
    description: '빠른 생성, 아시아 스타일 강점',
    priceFree: '무료 가능',
    priceLabel: '무료~유료',
    icon: 'wand-2',
    strengths: { speed: '빠른 이미지 생성', visual: '아시아 스타일에 강함' },
  },
  suno: {
    name: 'Suno',
    category: 'music',
    description: '텍스트로 보컬 포함 완성곡 생성',
    priceFree: '무료 (제한)',
    priceLabel: '$10/월',
    icon: 'music',
    strengths: { creative: '텍스트만으로 완성곡', flow: '즉흥적 영감을 바로 음악으로' },
  },
  veo: {
    name: 'Veo (Google)',
    category: 'video',
    description: '고품질 영상 생성, Gemini 연동',
    priceFree: '제한적',
    priceLabel: '$20/월~',
    icon: 'video',
    strengths: { creative: '텍스트→고품질 영상', plan: 'Gemini와 연동' },
  },
  kling: {
    name: 'Kling',
    category: 'video',
    description: '영상 AI, 가성비 좋음',
    priceFree: '무료 가능',
    priceLabel: '무료~유료',
    icon: 'film',
    strengths: { speed: '빠른 영상 생성', flow: '무료로 시작 가능' },
  },
  runway: {
    name: 'Runway',
    category: 'video',
    description: '영상 편집 + 생성 종합 플랫폼',
    priceFree: '제한적',
    priceLabel: '$12~28/월',
    icon: 'clapperboard',
    strengths: { depth: '편집+생성 올인원', plan: '영상 워크플로우 체계적' },
  },
  antigravity: {
    name: 'Google Antigravity',
    category: 'coding',
    description: 'AI 에이전트 코딩, Google 생태계',
    priceFree: '무료~',
    priceLabel: '무료~유료',
    icon: 'rocket',
    strengths: { logic: '에이전트 기반 자동 코딩', flow: '무료로 시작 가능' },
  },
  cursor: {
    name: 'Cursor',
    category: 'coding',
    description: 'VS Code 기반 AI 코드 에디터',
    priceFree: '무료 (제한)',
    priceLabel: '$20/월',
    icon: 'terminal',
    strengths: { logic: 'VS Code에서 바로 AI 코딩', plan: '기존 프로젝트에 쉽게 통합' },
  },
  claude_code: {
    name: 'Claude Code',
    category: 'coding',
    description: '터미널 기반, 정밀한 코딩 에이전트',
    priceFree: '유료 전용',
    priceLabel: '$20/월 (Pro)',
    icon: 'code',
    strengths: { depth: '복잡한 코드 정밀 분석', logic: '터미널에서 직접 코딩' },
  },
  perplexity: {
    name: 'Perplexity',
    category: 'research',
    description: 'AI 검색엔진, 출처 표시',
    priceFree: '무료',
    priceLabel: '$20/월 (Pro)',
    icon: 'search',
    strengths: { real: '출처 포함 팩트 기반 검색', speed: '빠른 정보 취합' },
  },
  notebooklm: {
    name: 'NotebookLM',
    category: 'research',
    description: '문서 분석·요약, 팟캐스트 생성',
    priceFree: '무료',
    priceLabel: '무료',
    icon: 'book-open',
    strengths: { depth: '문서를 깊이 있게 분석', real: '원본 기반 정확한 답변' },
  },
  consensus: {
    name: 'Consensus',
    category: 'research',
    description: '학술 논문 검색 특화',
    priceFree: '무료 (제한)',
    priceLabel: '무료~유료',
    icon: 'graduation-cap',
    strengths: { depth: '학술 논문 전문 검색', logic: '근거 기반 분석' },
  },
  elevenlabs: {
    name: 'ElevenLabs',
    category: 'voice',
    description: '자연스러운 음성 복제, 다국어',
    priceFree: '무료 (제한)',
    priceLabel: '$5/월~',
    icon: 'audio-lines',
    strengths: { creative: '자연스러운 음성 합성', visual: '감정 표현이 풍부' },
  },
  google_opal: {
    name: 'Google Opal',
    category: 'automation',
    description: '쉬운 노코드 업무 자동화',
    priceFree: '무료~',
    priceLabel: '무료~유료',
    icon: 'workflow',
    strengths: { plan: '업무 자동화 체계적 설정', real: '실무 효율 극대화' },
  },
};

export interface TypeInsight {
  summary: string;
  mainLLMReason: string;
  secondaryLLMReason: string;
}

export interface ResultType {
  id: string;
  name: string;
  description: string;
  percentage: number;
  mainLLM: string;
  secondaryLLM: string;
  traits: {
    speed_depth: number;
    real_creative: number;
    logic_visual: number;
    plan_flow: number;
  };
  insights: TypeInsight;
  recommendedExtras: Record<string, string[]>;
  color: string;
}

export const resultTypes: ResultType[] = [
  {
    id: 'explorer',
    name: '감성 탐험가',
    description: '빠르게 돌아다니며 예쁜 것에 끌리는 자유로운 영혼. 새로운 걸 발견하는 게 즐거워요!',
    percentage: 12,
    mainLLM: 'gemini',
    secondaryLLM: 'grok',
    traits: { speed_depth: -0.7, real_creative: 0.6, logic_visual: 0.8, plan_flow: 0.7 },
    insights: {
      summary: '빠르고 감성적인 당신에게는 멀티미디어에 강한 AI가 필요해요',
      mainLLMReason: '이미지 생성이 무료로 내장되어 있어서 감성 탐험에 딱',
      secondaryLLMReason: '실시간 트렌드를 빠르게 캐치할 수 있어요',
    },
    recommendedExtras: {
      image: ['gpt_image', 'seedream'],
      music: ['suno'],
      video: ['kling'],
    },
    color: '#FF9A9E',
  },
  {
    id: 'strategist',
    name: '전략적 크리에이터',
    description: '깊이 파고들어 체계적으로 창작하는 마스터 플래너. 완성도에 집착해요!',
    percentage: 8,
    mainLLM: 'claude',
    secondaryLLM: 'chatgpt',
    traits: { speed_depth: 0.8, real_creative: 0.5, logic_visual: -0.3, plan_flow: -0.8 },
    insights: {
      summary: '깊이와 체계를 중시하는 당신에게는 정밀한 AI가 필요해요',
      mainLLMReason: '긴 문서 분석과 체계적 구조화에 최강이에요',
      secondaryLLMReason: '다양한 창작 작업을 자연스럽게 서포트해요',
    },
    recommendedExtras: {
      image: ['midjourney'],
      coding: ['cursor', 'claude_code'],
      research: ['perplexity'],
    },
    color: '#A18CD1',
  },
  {
    id: 'optimizer',
    name: '효율의 마법사',
    description: '현실적으로 빠르게 최적화하는 시스템 사고가. 시간 낭비가 제일 싫어요!',
    percentage: 15,
    mainLLM: 'chatgpt',
    secondaryLLM: 'gemini',
    traits: { speed_depth: -0.5, real_creative: -0.7, logic_visual: -0.8, plan_flow: -0.6 },
    insights: {
      summary: '시간 절약과 실용성을 원하는 당신에게는 만능형 AI가 필요해요',
      mainLLMReason: '빠르고 정확한 답변, 실무에 바로 적용 가능',
      secondaryLLMReason: '구글 연동으로 검색·문서·일정까지 한 번에',
    },
    recommendedExtras: {
      research: ['perplexity', 'notebooklm'],
      automation: ['google_opal'],
      coding: ['antigravity'],
    },
    color: '#84FAB0',
  },
  {
    id: 'analyst',
    name: '논리의 탐구자',
    description: '정확한 데이터와 깊은 분석을 사랑하는 지식인. 팩트 체크는 기본이에요!',
    percentage: 10,
    mainLLM: 'claude',
    secondaryLLM: 'chatgpt',
    traits: { speed_depth: 0.9, real_creative: -0.6, logic_visual: -0.9, plan_flow: -0.4 },
    insights: {
      summary: '깊이 있는 분석과 논리를 중시하는 당신에게는 사고형 AI가 필요해요',
      mainLLMReason: '긴 맥락도 놓치지 않는 정밀한 논리 분석력',
      secondaryLLMReason: '다양한 관점으로 보충 분석을 해줘요',
    },
    recommendedExtras: {
      research: ['perplexity', 'consensus', 'notebooklm'],
      coding: ['claude_code'],
    },
    color: '#667EEA',
  },
  {
    id: 'trendsetter',
    name: '실시간 트렌드세터',
    description: '지금 이 순간의 이슈를 가장 빠르게 캐치하는 감각파. 뉴스와 밈의 최전선!',
    percentage: 14,
    mainLLM: 'grok',
    secondaryLLM: 'gemini',
    traits: { speed_depth: -0.9, real_creative: -0.3, logic_visual: 0.2, plan_flow: 0.6 },
    insights: {
      summary: '속도와 최신 정보를 중시하는 당신에게는 실시간형 AI가 필요해요',
      mainLLMReason: 'X(트위터) 연동으로 실시간 트렌드를 가장 빠르게 반영',
      secondaryLLMReason: '구글 검색 연동으로 정보를 교차 확인할 수 있어요',
    },
    recommendedExtras: {
      image: ['seedream'],
      research: ['perplexity'],
    },
    color: '#F6D365',
  },
  {
    id: 'artist',
    name: '디지털 아티스트',
    description: '상상을 현실로 만드는 비주얼 크리에이터. 머릿속 그림을 AI로 구현해요!',
    percentage: 11,
    mainLLM: 'gemini',
    secondaryLLM: 'chatgpt',
    traits: { speed_depth: 0.2, real_creative: 0.9, logic_visual: 0.9, plan_flow: 0.3 },
    insights: {
      summary: '창작과 비주얼을 사랑하는 당신에게는 멀티미디어형 AI가 필요해요',
      mainLLMReason: '이미지·영상 생성이 내장, 창작 워크플로우 일체형',
      secondaryLLMReason: 'GPT 이미지로 세밀한 이미지 수정이 가능',
    },
    recommendedExtras: {
      image: ['midjourney', 'gpt_image'],
      video: ['runway', 'veo'],
      music: ['suno'],
      voice: ['elevenlabs'],
    },
    color: '#FBC2EB',
  },
  {
    id: 'builder',
    name: '코드 빌더',
    description: '아이디어를 코드로 만드는 엔지니어. AI와 함께 뭐든 만들어내요!',
    percentage: 9,
    mainLLM: 'claude',
    secondaryLLM: 'gemini',
    traits: { speed_depth: 0.6, real_creative: 0.3, logic_visual: -0.7, plan_flow: -0.5 },
    insights: {
      summary: '논리적 사고와 코딩을 좋아하는 당신에게는 개발형 AI가 필요해요',
      mainLLMReason: '코드 분석·리팩토링에 가장 정밀한 AI',
      secondaryLLMReason: '구글 생태계 연동으로 문서·검색 보조',
    },
    recommendedExtras: {
      coding: ['cursor', 'antigravity', 'claude_code'],
      research: ['perplexity'],
    },
    color: '#4FACFE',
  },
  {
    id: 'multitasker',
    name: '만능 멀티태스커',
    description: '이것저것 다 해보고 싶은 호기심 대장. 하나로는 부족해요!',
    percentage: 21,
    mainLLM: 'chatgpt',
    secondaryLLM: 'gemini',
    traits: { speed_depth: -0.2, real_creative: 0.2, logic_visual: 0.1, plan_flow: 0.2 },
    insights: {
      summary: '다양한 관심사를 가진 당신에게는 올라운더 AI가 필요해요',
      mainLLMReason: '글, 이미지, 코드 등 뭐든 잘하는 만능형',
      secondaryLLMReason: '무료 티어가 넉넉해서 부담 없이 병행 사용',
    },
    recommendedExtras: {
      image: ['gpt_image', 'gemini_image'],
      music: ['suno'],
      research: ['notebooklm'],
      automation: ['google_opal'],
    },
    color: '#43E97B',
  },
];
