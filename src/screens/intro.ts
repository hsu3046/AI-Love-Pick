import { createElement, icons } from 'lucide';

export function renderIntro(onStart: () => void): HTMLElement {
  const el = document.createElement('div');
  el.className = 'screen screen-intro';
  el.innerHTML = `
    <div class="intro-content">
      <div class="intro-illustration" id="intro-illustration">
        <div class="illustration-placeholder">
          <span class="illustration-label">일러스트 영역</span>
        </div>
      </div>
      <div class="intro-text">
        <h1 class="intro-title">나에게 딱 맞는<br/><span class="highlight">AI</span>는?</h1>
        <p class="intro-subtitle">간단한 심리 테스트로<br/>나만의 AI 소울메이트를 찾아보세요</p>
        <p class="intro-meta">8개 질문 · 약 2분 소요</p>
      </div>
      <button class="btn-start" id="btn-start">
        <span>테스트 시작하기</span>
      </button>
    </div>
  `;

  requestAnimationFrame(() => {
    const btn = el.querySelector('#btn-start');
    if (btn) {
      const iconSvg = createElement(icons.Sparkles);
      iconSvg.classList.add('btn-icon');
      btn.prepend(iconSvg);
      btn.addEventListener('click', onStart);
    }
  });

  return el;
}
