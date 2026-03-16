# AI Love Pick

## Tagline-en

Say goodbye to wandering lost among countless AIs!
Discover your **'AI Soulmate'** — one that fits your taste and your wallet. Ready to see the optimized AI setup that 'AI Love Pick' has crafted just for you?

## Tagline-ko

수많은 AI 사이에서 방황하던 유목민 시절은 이제 안녕!
당신의 취향과 지갑 사정까지 배려한 **'AI 소울메이트'**를 찾아보세요. 'AI Love Pick'이 제안하는 당신만의 최적화된 AI 셋업, 지금 확인해보실래요?

## Tagline-ja

数えきれないAIの間で迷子になっていた遊牧民時代はもう終わり！
あなたの好みもお財布事情もしっかり考慮した**「AIソウルメイト」**を見つけましょう。「AI Love Pick」が提案する、あなただけの最適化されたAIセットアップ、今すぐチェックしてみませんか？

---

## Summary-en

ChatGPT, Claude, Gemini… too many AIs and no idea which one to pick? You're in the right place. AI Love Pick analyzes your personality through a fun 12-question quiz and recommends the perfect combination from over 20 AI services. From everyday questions like "What do you do when 100 messages pile up?" to practical ones about budget, devices, and use cases — it covers everything. On the results screen you'll see your main AI Soulmate, a backup AI, and curated tools for every need, plus subscription plans matched to your budget — all at a glance.

## Summary-ko

ChatGPT, Claude, Gemini… AI가 너무 많아서 뭘 써야 할지 모르겠다면, 여기가 딱이에요. 'AI Love Pick'은 재미있는 12문항 심리 테스트로 당신의 성향을 분석하고, 20개 이상의 AI 서비스 중에서 나에게 맞는 조합을 추천해드립니다. "카톡이 100개 쌓이면 어떻게 해요?" 같은 일상 질문부터, 예산·기기·용도 같은 실전 질문까지 모두 담았어요. 결과 화면에서는 메인 AI 소울메이트와 보조 AI, 용도별 추천 도구는 물론, 예산에 맞는 구독 플랜까지 한눈에 확인할 수 있습니다.

## Summary-ja

ChatGPT、Claude、Gemini… AIが多すぎて何を使えばいいか分からない？ここがぴったりの場所です。AI Love Pickは12問の楽しい心理テストであなたの性格を分析し、20以上のAIサービスからあなたに合った組み合わせをおすすめします。「LINEが100件溜まったらどうする？」のような日常の質問から、予算・デバイス・用途などの実践的な質問まで、すべて網羅しています。結果画面ではメインAIソウルメイトとサブAI、用途別おすすめツールはもちろん、予算に合ったサブスクプランまで一目で確認できます。

---

## ✨ What It Does

- **Matches your AI soulmate** — A 4-axis personality scoring engine (speed↔depth, real↔creative, logic↔visual, plan↔flow) finds the LLM that fits your thinking style.
- **Recommends tools you actually need** — Fitness-based scoring uses ALL 12 answers to pick one best tool per category — no spammy recommendation lists.
- **Builds a budget in real time** — An interactive service picker with tier toggles and a live cost bar lets you mix free and paid plans within your budget.
- **Groups shared subscriptions** — Services that share a plan (e.g., ChatGPT + GPT Image) are linked so you never double-count costs.
- **Delivers personalized reasoning** — Every recommendation shows WHY it was picked, tied to your specific personality traits.
- **Runs 100 % client-side** — Zero API calls, zero backend. A single static HTML/JS bundle under 100 KB gzipped.
- **Feels like a personality quiz, not a spreadsheet** — Warm pastel design, micro-animations, and a playful tone keep it fun.

---

## 🛠 Tech Stack

| Layer | Technology |
|-------|------------|
| Build | Vite 7 |
| Language | TypeScript (Strict) |
| Runtime deps | Lucide icons (only dependency) |
| Framework | None — Vanilla TS + DOM API |
| Styling | Vanilla CSS (Custom Properties) |
| Font | Pretendard Variable (CDN) |
| Design | Mobile-first (430 px), pastel warm palette |

---

## 📦 Installation

```bash
git clone https://github.com/knowai/MatchMakerAI.git
cd MatchMakerAI
npm install
npm run dev
```

Open [http://localhost:5173](http://localhost:5173)

---

## 📁 Project Structure

```
MatchMakerAI/
├── src/
│   ├── main.ts             # App entry — screen orchestrator
│   ├── style.css           # Full design system (~1,500 lines)
│   ├── data/
│   │   ├── questions.ts    # 12 quiz questions (Phase 1 + Phase 2)
│   │   ├── results.ts      # 20 AI services + 8 personality types + fitness profiles
│   │   └── plans.ts        # 3-tier plan builder with budget calculation
│   ├── engine/
│   │   └── scoring.ts      # Scoring engine — fitness-based service matching
│   ├── screens/
│   │   ├── intro.ts        # Landing screen
│   │   ├── quiz.ts         # Quiz screen (single / multi-select)
│   │   ├── transition.ts   # Phase 1→2 transition
│   │   ├── loading.ts      # Loading animation
│   │   └── result.ts       # Results — soulmate card + interactive picker
│   └── utils/
│       └── icons.ts        # Lucide icon injection helper
├── docs/
│   ├── ARCHITECTURE.md     # System architecture
│   ├── API.md              # Data model reference
│   ├── DECISIONS.md        # Technical decision records
│   ├── MEMORY.md           # Project memory
│   └── SETUP.md            # Dev environment setup
├── index.html              # Entry HTML (SEO meta, CDN fonts)
├── package.json
├── tsconfig.json
└── LICENSE                 # GNU GPL v3
```

---

## 🗺 Roadmap

- [ ] AI-powered recommendation explanations (Gemini API supplement)
- [ ] Result sharing via image card (html2canvas)
- [ ] Multi-language support (EN / JA)
- [ ] Service catalog auto-update from pricing APIs
- [ ] Dark mode

---

## 🤝 Contributing

Contributions are welcome! Please follow these steps:

1. Fork the repository
2. Create a feature branch (`git checkout -b feat/amazing-feature`)
3. Commit your changes (`git commit -m 'feat(scope): add amazing feature'`)
4. Push to the branch (`git push origin feat/amazing-feature`)
5. Open a Pull Request

---

## 📄 License

This project is licensed under the [GNU General Public License v3.0](https://www.gnu.org/licenses/gpl-3.0.html).

---

*Built by [KnowAI](https://knowai.space) · © 2026 KnowAI*
