import { createElement, icons } from 'lucide';

export function renderIntro(onStart: () => void): HTMLElement {
  const el = document.createElement('div');
  el.className = 'screen screen-intro';
  el.innerHTML = `
    <div class="intro-content">
      <div class="intro-illustration" id="intro-illustration">
        <div class="illust-sparkle-wrap">
          <img class="intro-cover-img" src="/assets/cover.png" alt="나에게 맞는 AI 찾기">
          <span class="sparkle s1"></span>
          <span class="sparkle s2"></span>
          <span class="sparkle s3"></span>
          <span class="sparkle s4"></span>
          <span class="sparkle s5"></span>
        </div>
      </div>
      <div class="intro-text">
        <h1 class="intro-title">나에게 딱 맞는<br/><span class="highlight">AI</span>는?</h1>
        <p class="intro-subtitle">간단한 심리 테스트로<br/>나만의 AI 소울메이트를 찾아보세요</p>
        <p class="intro-meta">질문 12개 · 약 1분</p>
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
