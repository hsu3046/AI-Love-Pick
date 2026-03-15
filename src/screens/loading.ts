export function renderLoading(onDone: () => void): HTMLElement {
  const el = document.createElement('div');
  el.className = 'screen screen-loading';

  el.innerHTML = `
    <div class="loading-content">
      <div class="loading-spinner">
        <div class="spinner-ring"></div>
        <div class="spinner-ring"></div>
        <div class="spinner-ring"></div>
      </div>
      <p class="loading-text" id="loading-text">당신의 AI 성향을 분석 중...</p>
    </div>
  `;

  const messages = [
    '당신의 AI 성향을 분석 중...',
    '12가지 질문을 바탕으로 딱 맞는 AI를 찾고 있어요...',
    '당신의 소울메이트 AI를 찾았어요!',
  ];

  let step = 0;
  const interval = setInterval(() => {
    step++;
    const textEl = el.querySelector('#loading-text');
    if (textEl && step < messages.length) {
      textEl.textContent = messages[step];
    }
    if (step >= messages.length) {
      clearInterval(interval);
      setTimeout(onDone, 500);
    }
  }, 1000);

  return el;
}
