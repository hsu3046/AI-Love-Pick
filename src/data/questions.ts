export interface QuestionOption {
  text: string;
  sub: string;
  icon: string;
}

export interface QuestionScoring {
  axis: 'speed_depth' | 'real_creative' | 'logic_visual' | 'plan_flow';
  /** A → first value, B → second value */
  values: [string, string];
}

export interface SpecialFlag {
  option: 'A' | 'B' | 'C';
  flag: string;
}

export interface Question {
  id: number;
  phase: 1 | 2;
  type: 'single' | 'multi';
  question: string;
  icon: string;
  optionA: QuestionOption;
  optionB: QuestionOption;
  optionC?: QuestionOption;
  optionD?: QuestionOption;
  /** Multi-select options (for type: 'multi') */
  multiOptions?: { key: string; text: string; icon: string }[];
  scoring?: QuestionScoring;
  flags?: SpecialFlag[];
  /** Which practical field this question determines */
  practicalField?: 'usage' | 'frequency' | 'priority' | 'experience' | 'infoStyle' | 'budget';
}

// ===== Phase 1: 성향 질문 (6개) =====

export const phase1Questions: Question[] = [
  {
    id: 1,
    phase: 1,
    type: 'single',
    question: '카톡이 100개 쌓였다!',
    icon: 'message-circle',
    optionA: {
      text: '빠르게 훑어본다',
      sub: '중요한 것만 골라서 답장',
      icon: 'zap',
    },
    optionB: {
      text: '하나하나 정성껏',
      sub: '다 읽고 차근차근 답장',
      icon: 'book-open',
    },
    scoring: { axis: 'speed_depth', values: ['speed', 'depth'] },
  },
  {
    id: 2,
    phase: 1,
    type: 'single',
    question: '새로운 요리를 할 때 나는?',
    icon: 'chef-hat',
    optionA: {
      text: '레시피 정확히 따라한다',
      sub: '계량 스푼은 필수!',
      icon: 'clipboard-list',
    },
    optionB: {
      text: '감으로 즉흥 실험',
      sub: '"이거 넣으면 맛있지 않을까?"',
      icon: 'sparkles',
    },
    scoring: { axis: 'real_creative', values: ['real', 'creative'] },
  },
  {
    id: 3,
    phase: 1,
    type: 'single',
    question: '친구 생일 선물 고를 때',
    icon: 'gift',
    optionA: {
      text: '리뷰 분석 & 가성비 비교',
      sub: '비교표까지 만드는 편',
      icon: 'bar-chart-3',
    },
    optionB: {
      text: '"이거 예쁘다!" 직감 선택',
      sub: '첫눈에 반한 걸로!',
      icon: 'heart',
    },
    scoring: { axis: 'logic_visual', values: ['logic', 'visual'] },
  },
  {
    id: 4,
    phase: 1,
    type: 'single',
    question: '방 정리 스타일은?',
    icon: 'home',
    optionA: {
      text: '구역별로 체계적으로',
      sub: '순서와 분류가 중요',
      icon: 'layout-grid',
    },
    optionB: {
      text: '눈에 보이는 것부터',
      sub: '기분 가는 대로~',
      icon: 'wind',
    },
    scoring: { axis: 'plan_flow', values: ['plan', 'flow'] },
  },
  {
    id: 5,
    phase: 1,
    type: 'single',
    question: '노래방에서 나는?',
    icon: 'mic',
    optionA: {
      text: '마이크 독차지!',
      sub: '신청곡이 10개는 기본',
      icon: 'mic',
    },
    optionB: {
      text: '듣는 게 더 좋아',
      sub: '분위기 즐기는 타입',
      icon: 'headphones',
    },
    scoring: { axis: 'real_creative', values: ['creative', 'real'] },
    flags: [{ option: 'A', flag: 'music' }],
  },
  {
    id: 6,
    phase: 1,
    type: 'single',
    question: '유튜브 알고리즘이 추천해주는 건?',
    icon: 'tv',
    optionA: {
      text: '테크·과학·IT',
      sub: '새로운 기술이 궁금해',
      icon: 'cpu',
    },
    optionB: {
      text: '디자인·예술·브이로그',
      sub: '감성 자극 콘텐츠',
      icon: 'palette',
    },
    optionC: {
      text: '재테크·자기계발',
      sub: '성장하는 게 좋아',
      icon: 'trending-up',
    },
    scoring: { axis: 'plan_flow', values: ['plan', 'flow'] },
    flags: [
      { option: 'A', flag: 'coding' },
      { option: 'B', flag: 'image' },
      { option: 'C', flag: 'research' },
    ],
  },
];

// ===== Phase 2: 실전 질문 (6개) =====

export const phase2Questions: Question[] = [
  {
    id: 7,
    phase: 2,
    type: 'multi',
    question: 'AI를 어디에 쓰고 싶어요?',
    icon: 'layers',
    optionA: { text: '', sub: '', icon: '' },
    optionB: { text: '', sub: '', icon: '' },
    multiOptions: [
      { key: 'writing', text: '글쓰기 · 번역 · 요약', icon: 'pen-line' },
      { key: 'image', text: '이미지 · 디자인', icon: 'image' },
      { key: 'coding', text: '코딩 · 개발', icon: 'code' },
      { key: 'research', text: '정보 검색 · 리서치', icon: 'search' },
      { key: 'media', text: '영상 · 음악 만들기', icon: 'film' },
      { key: 'learning', text: '학습 · 공부', icon: 'book-open' },
      { key: 'automation', text: '업무 자동화', icon: 'workflow' },
      { key: 'casual', text: '궁금한 거 질문', icon: 'message-circle' },
    ],
    practicalField: 'usage',
  },
  {
    id: 8,
    phase: 2,
    type: 'single',
    question: 'AI를 얼마나 자주 쓸 것 같아요?',
    icon: 'clock',
    optionA: {
      text: '가끔',
      sub: '주 1~2회 정도',
      icon: 'coffee',
    },
    optionB: {
      text: '자주',
      sub: '거의 매일 쓸 것 같아',
      icon: 'repeat',
    },
    optionC: {
      text: '업무 필수',
      sub: '하루에도 수십 번!',
      icon: 'flame',
    },
    practicalField: 'frequency',
  },
  {
    id: 9,
    phase: 2,
    type: 'single',
    question: '가장 중요한 건 뭐예요?',
    icon: 'star',
    optionA: {
      text: '비용 절약',
      sub: '무료가 최고!',
      icon: 'piggy-bank',
    },
    optionB: {
      text: '시간 절약',
      sub: '빠르고 편하게',
      icon: 'timer',
    },
    optionC: {
      text: '결과물 품질',
      sub: '퀄리티가 생명',
      icon: 'crown',
    },
    practicalField: 'priority',
  },
  {
    id: 10,
    phase: 2,
    type: 'single',
    question: 'AI를 얼마나 써봤어요?',
    icon: 'bot',
    optionA: {
      text: '거의 처음',
      sub: '이제 막 시작하는 단계',
      icon: 'sprout',
    },
    optionB: {
      text: '좀 써봤어요',
      sub: '기본 활용은 익숙해요',
      icon: 'laptop',
    },
    optionC: {
      text: '파워 유저',
      sub: '프롬프트 엔지니어링까지',
      icon: 'zap',
    },
    practicalField: 'experience',
  },
  {
    id: 11,
    phase: 2,
    type: 'single',
    question: 'AI에게 원하는 정보는?',
    icon: 'search',
    optionA: {
      text: '최신 뉴스 · 트렌드',
      sub: '실시간 핫한 정보!',
      icon: 'trending-up',
    },
    optionB: {
      text: '검증된 정확한 답변',
      sub: '출처와 근거가 중요',
      icon: 'shield-check',
    },
    optionC: {
      text: '독창적 기획 · 아이디어',
      sub: '창의적 브레인스토밍',
      icon: 'lightbulb',
    },
    practicalField: 'infoStyle',
  },
  {
    id: 12,
    phase: 2,
    type: 'single',
    question: '월 AI 구독 예산은?',
    icon: 'wallet',
    optionA: {
      text: '₩0',
      sub: '무료만 쓸래요',
      icon: 'badge-cent',
    },
    optionB: {
      text: '~₩15,000',
      sub: '커피 3잔 정도',
      icon: 'coins',
    },
    optionC: {
      text: '~₩30,000',
      sub: '제대로 투자할게',
      icon: 'banknote',
    },
    optionD: {
      text: '그 이상',
      sub: '좋으면 OK',
      icon: 'gem',
    },
    practicalField: 'budget',
  },
];

export const allQuestions: Question[] = [...phase1Questions, ...phase2Questions];
