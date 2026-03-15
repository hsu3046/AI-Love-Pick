import { createElement, icons } from 'lucide';

export function renderTransition(typeName: string, onContinue: () => void): HTMLElement {
  const el = document.createElement('div');
  el.className = 'screen screen-transition';

  el.innerHTML = `
    <div class="transition-content">
      <div class="transition-badge">
        <span class="transition-badge-icon" id="transition-badge-icon"></span>
      </div>
      <h2 class="transition-title">당신은<br/><span class="highlight">${typeName}</span> 유형!</h2>
      <p class="transition-subtitle">성향 분석 완료!</p>
      <div class="transition-divider"></div>
      <p class="transition-next">이제 딱 맞는 AI 플랜을<br/>추천해 드릴게요</p>
      <p class="transition-meta">실전 질문 6개 · 약 1분 소요</p>
      <button class="btn-continue" id="btn-continue">
        <span>맞춤 추천 받기</span>
      </button>
    </div>
  `;

  requestAnimationFrame(() => {
    const badgeIcon = el.querySelector('#transition-badge-icon');
    if (badgeIcon) {
      const svg = createElement(icons.Sparkles);
      badgeIcon.appendChild(svg);
    }

    const btn = el.querySelector('#btn-continue');
    if (btn) {
      const iconSvg = createElement(icons.ArrowRight);
      iconSvg.classList.add('btn-icon');
      btn.append(iconSvg);
      btn.addEventListener('click', onContinue);
    }
  });

  return el;
}
