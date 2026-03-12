import './style.css';
import { renderIntro } from './screens/intro';
import { renderQuiz } from './screens/quiz';
import { renderTransition } from './screens/transition';
import { renderLoading } from './screens/loading';
import { renderResult } from './screens/result';
import { calculatePhase1, calculateResult } from './engine/scoring';
import { resultTypes } from './data/results';

const app = document.querySelector<HTMLDivElement>('#app')!;

function showScreen(screen: HTMLElement): void {
  const current = app.firstElementChild;
  if (current) {
    current.classList.add('exiting');
    setTimeout(() => {
      app.innerHTML = '';
      app.appendChild(screen);
      screen.classList.add('active');
    }, 300);
  } else {
    app.appendChild(screen);
    screen.classList.add('active');
  }
}

function startApp(): void {
  // Phase 1 answers stored across phases
  let phase1Answers: Map<number, string>;

  const intro = renderIntro(() => {
    // Phase 1: Personality quiz
    const quiz1 = renderQuiz(1, {
      onPhase1Complete: (answers) => {
        phase1Answers = answers;

        // Quick phase1 calc to get type name for transition
        const { scores } = calculatePhase1(answers);
        const bestType = findBestType(scores);

        // Show transition screen
        const transition = renderTransition(bestType.name, () => {
          // Phase 2: Practical quiz
          const quiz2 = renderQuiz(2, {
            onPhase1Complete: () => {},
            onAllComplete: (p2Answers, multiAnswers) => {
              // Merge all answers
              const allAnswers = new Map([...phase1Answers, ...p2Answers]);

              const loading = renderLoading(() => {
                const result = calculateResult(allAnswers, multiAnswers);
                const resultScreen = renderResult(result, startApp);
                showScreen(resultScreen);
              });
              showScreen(loading);
            },
          });
          showScreen(quiz2);
        });
        showScreen(transition);
      },
      onAllComplete: () => {},
    });
    showScreen(quiz1);
  });
  showScreen(intro);
}

function findBestType(scores: { speed_depth: number; real_creative: number; logic_visual: number; plan_flow: number }) {
  let best = resultTypes[0];
  let bestD = Infinity;
  for (const rt of resultTypes) {
    const d =
      Math.pow(scores.speed_depth - rt.traits.speed_depth, 2) +
      Math.pow(scores.real_creative - rt.traits.real_creative, 2) +
      Math.pow(scores.logic_visual - rt.traits.logic_visual, 2) +
      Math.pow(scores.plan_flow - rt.traits.plan_flow, 2);
    if (d < bestD) { bestD = d; best = rt; }
  }
  return best;
}

startApp();
