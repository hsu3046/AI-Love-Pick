import { createElement, icons } from 'lucide';
import { allQuestions, type Question, type QuestionOption } from '../data/questions';
import { injectIcon } from '../utils/icons';

// Q1-Q6 illustration images (Phase 1 only)
const Q_IMAGE_MAP: Record<number, string> = {
  1: '/assets/q1message.jpg',
  2: '/assets/q2_cooking.jpg',
  3: '/assets/q3_present.jpg',
  4: '/assets/q4_cleaning.jpg',
  5: '/assets/q5_karaoke.jpg',
  6: '/assets/q6_youtube.jpg',
};



interface QuizCallbacks {
  onPhase1Complete: (answers: Map<number, string>) => void;
  onAllComplete: (answers: Map<number, string>, multiAnswers: Map<number, Set<string>>) => void;
}

export function renderQuiz(
  phase: 1 | 2,
  callbacks: QuizCallbacks,
): HTMLElement {
  const answers = new Map<number, string>();
  const multiAnswers = new Map<number, Set<string>>();
  const questions = allQuestions.filter((q) => q.phase === phase);
  let currentIndex = 0;

  const totalQuestions = 12;
  const phaseOffset = phase === 1 ? 0 : 6;

  const el = document.createElement('div');
  el.className = 'screen screen-quiz';

  el.innerHTML = `
    <div class="quiz-header">
      <div class="progress-bar">
        <div class="progress-fill" id="progress-fill"></div>
      </div>
      <div class="progress-text" id="progress-text"></div>
    </div>
    <div class="quiz-body" id="quiz-body"></div>
  `;

  function updateProgress(index: number): void {
    const globalIndex = phaseOffset + index;
    const fill = el.querySelector('#progress-fill') as HTMLElement;
    const text = el.querySelector('#progress-text') as HTMLElement;
    if (fill) fill.style.width = `${((globalIndex + 1) / totalQuestions) * 100}%`;
    if (text) text.textContent = `${globalIndex + 1} / ${totalQuestions}`;
  }

  function renderQuestion(index: number): void {
    const q = questions[index];
    const body = el.querySelector('#quiz-body') as HTMLElement;
    if (!body) return;

    updateProgress(index);

    if (q.type === 'multi' && q.multiOptions) {
      renderMultiQuestion(body, q);
    } else {
      renderSingleQuestion(body, q);
    }
  }

  function renderSingleQuestion(body: HTMLElement, q: Question): void {
    const card = document.createElement('div');
    card.className = 'question-card entering';

    const optionsHTML = [
      buildOption(q, 'A', q.optionA),
      buildOption(q, 'B', q.optionB),
      q.optionC ? buildOption(q, 'C', q.optionC) : '',
      q.optionD ? buildOption(q, 'D', q.optionD) : '',
    ].join('');

    card.innerHTML = `
      ${Q_IMAGE_MAP[q.id] ? `
        <div class="question-illust-wrap">
          <img class="question-illust-img" src="${Q_IMAGE_MAP[q.id]}" alt="Q${q.id} 일러스트">
        </div>` : `<div class="question-icon" id="q-icon-${q.id}"></div>`}
      <h2 class="question-text">${q.question}</h2>
      <div class="options">${optionsHTML}</div>
    `;

    body.innerHTML = '';
    body.appendChild(card);

    requestAnimationFrame(() => {
      injectIcon(card, `q-icon-${q.id}`, q.icon);
      injectIcon(card, `opt-icon-${q.id}-A`, q.optionA.icon);
      injectIcon(card, `opt-icon-${q.id}-B`, q.optionB.icon);
      if (q.optionC) injectIcon(card, `opt-icon-${q.id}-C`, q.optionC.icon);
      if (q.optionD) injectIcon(card, `opt-icon-${q.id}-D`, q.optionD.icon);

      requestAnimationFrame(() => card.classList.remove('entering'));

      card.querySelectorAll('.option-card').forEach((optEl) => {
        optEl.addEventListener('click', () => {
          const value = (optEl as HTMLElement).dataset.value!;
          answers.set(q.id, value);
          optEl.classList.add('selected');

          setTimeout(() => advanceQuestion(), 400);
        });
      });
    });
  }

  function renderMultiQuestion(body: HTMLElement, q: Question): void {
    const card = document.createElement('div');
    card.className = 'question-card entering';

    const optionsHTML = q.multiOptions!.map((opt) => `
      <button class="multi-option-card" data-key="${opt.key}" id="multi-opt-${opt.key}">
        <span class="multi-check" id="multi-check-${opt.key}"></span>
        <span class="multi-icon" id="multi-icon-${opt.key}"></span>
        <span class="multi-text">${opt.text}</span>
      </button>
    `).join('');

    card.innerHTML = `
      <div class="question-icon" id="q-icon-${q.id}"></div>
      <h2 class="question-text">${q.question}</h2>
      <p class="question-hint">여러 개 선택 가능!</p>
      <div class="multi-options">${optionsHTML}</div>
      <button class="btn-confirm" id="btn-confirm" disabled>
        <span>선택 완료</span>
      </button>
    `;

    body.innerHTML = '';
    body.appendChild(card);

    const selected = new Set<string>();

    requestAnimationFrame(() => {
      injectIcon(card, `q-icon-${q.id}`, q.icon);
      q.multiOptions!.forEach((opt) => {
        injectIcon(card, `multi-icon-${opt.key}`, opt.icon);
      });

      requestAnimationFrame(() => card.classList.remove('entering'));

      // Check icon placeholder
      card.querySelectorAll('.multi-check').forEach((checkEl) => {
        const svg = createElement(icons.Check);
        checkEl.appendChild(svg);
      });

      card.querySelectorAll('.multi-option-card').forEach((optEl) => {
        optEl.addEventListener('click', () => {
          const key = (optEl as HTMLElement).dataset.key!;
          if (selected.has(key)) {
            selected.delete(key);
            optEl.classList.remove('checked');
          } else {
            selected.add(key);
            optEl.classList.add('checked');
          }
          const confirmBtn = card.querySelector('#btn-confirm') as HTMLButtonElement;
          if (confirmBtn) confirmBtn.disabled = selected.size === 0;
        });
      });

      const confirmBtn = card.querySelector('#btn-confirm');
      if (confirmBtn) {
        const iconSvg = createElement(icons.ArrowRight);
        iconSvg.classList.add('btn-icon');
        confirmBtn.append(iconSvg);
        confirmBtn.addEventListener('click', () => {
          multiAnswers.set(q.id, new Set(selected));
          advanceQuestion();
        });
      }
    });
  }

  function advanceQuestion(): void {
    if (currentIndex < questions.length - 1) {
      currentIndex++;
      renderQuestion(currentIndex);
    } else {
      if (phase === 1) {
        callbacks.onPhase1Complete(answers);
      } else {
        callbacks.onAllComplete(answers, multiAnswers);
      }
    }
  }

  requestAnimationFrame(() => renderQuestion(0));
  return el;
}

function buildOption(_q: Question, value: string, opt: QuestionOption): string {
  return `
    <button class="option-card" data-value="${value}">
      <div class="option-icon" id="opt-icon-${_q.id}-${value}"></div>
      <div class="option-content">
        <span class="option-text">${opt.text}</span>
        <span class="option-sub">${opt.sub}</span>
      </div>
    </button>
  `;
}
