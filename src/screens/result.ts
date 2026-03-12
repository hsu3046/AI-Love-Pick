import { createElement, icons } from 'lucide';
import { type QuizResult, type Reasoning } from '../engine/scoring';
import { type PlanTier, freeEnoughItems } from '../data/plans';
import { aiServices } from '../data/results';

function toPascalCase(name: string): string {
  return name
    .split('-')
    .map((part) => part.charAt(0).toUpperCase() + part.slice(1))
    .join('');
}

export function renderResult(result: QuizResult, onRestart: () => void): HTMLElement {
  const el = document.createElement('div');
  el.className = 'screen screen-result';

  const { type, scores, plans, recommendedTier, reasonings, insightSummary } = result;

  el.innerHTML = `
    <div class="result-content">
      <!-- Hero -->
      <div class="result-hero" style="--accent: ${type.color}">
        <div class="result-illustration" id="result-illustration">
          <div class="illustration-placeholder result-illust">
            <span class="illustration-label">일러스트 영역</span>
          </div>
        </div>
        <h1 class="result-type-name">${type.name}</h1>
        <p class="result-type-desc">${type.description}</p>
        <div class="result-percentage">
          <span class="percentage-icon" id="percentage-icon"></span>
          <span>전체 사용자의 <strong>${type.percentage}%</strong>가 이 유형</span>
        </div>
      </div>

      <!-- Trait Chart -->
      <div class="result-chart-section">
        <h2 class="section-title">나의 AI 성향</h2>
        <div class="trait-bars">
          ${renderTraitBar('속도', '깊이', scores.speed_depth)}
          ${renderTraitBar('현실', '창작', scores.real_creative)}
          ${renderTraitBar('논리', '감성', scores.logic_visual)}
          ${renderTraitBar('체계', '즉흥', scores.plan_flow)}
        </div>
      </div>

      <!-- Insight Summary -->
      <div class="insight-banner">
        <span class="insight-icon" id="insight-icon"></span>
        <p class="insight-text">${insightSummary}</p>
      </div>

      <!-- Personalized Reasoning Cards -->
      <div class="reasoning-section">
        <h2 class="section-title">당신을 위한 AI 조합</h2>
        <div class="reasoning-cards">
          ${reasonings.map((r, i) => renderReasoningCard(r, i)).join('')}
        </div>
      </div>

      <!-- 3-Tier Plan Comparison -->
      <div class="result-plans">
        <h2 class="section-title">맞춤 AI 플랜</h2>
        <div class="plan-cards">
          ${plans.map((plan) => renderPlanCard(plan, plan.id === recommendedTier)).join('')}
        </div>
      </div>

      <!-- Free-enough Section -->
      <div class="result-free-section">
        <h2 class="section-title">💡 무료로도 충분한 것들</h2>
        <div class="free-items">
          ${freeEnoughItems.map((item, i) => `
            <div class="free-item">
              <span class="free-item-icon" id="free-icon-${i}"></span>
              <div class="free-item-info">
                <span class="free-item-name">${item.name}</span>
                <span class="free-item-reason">${item.reason}</span>
              </div>
            </div>
          `).join('')}
        </div>
      </div>

      <!-- Actions -->
      <div class="result-actions">
        <button class="btn-share" id="btn-share">
          <span>결과 공유하기</span>
        </button>
        <button class="btn-restart" id="btn-restart">
          <span>다시 하기</span>
        </button>
      </div>
    </div>
  `;

  requestAnimationFrame(() => {
    injectIcon(el, 'percentage-icon', 'users');
    injectIcon(el, 'insight-icon', 'sparkles');

    // Reasoning card icons
    reasonings.forEach((r, i) => {
      injectIcon(el, `rc-icon-${i}`, r.serviceIcon);
      injectIcon(el, `rc-tag-icon-${i}`, r.tagIcon);
    });

    // Plan icons
    plans.forEach((plan, pi) => {
      injectIcon(el, `plan-llm-icon-${pi}`, aiServices[plan.mainLLM]?.icon || 'bot');
      plan.extras.forEach((_extra, ei) => {
        injectIcon(el, `plan-extra-icon-${pi}-${ei}`, aiServices[_extra.serviceKey]?.icon || 'circle');
      });
    });

    // Free section icons
    freeEnoughItems.forEach((item, i) => {
      injectIcon(el, `free-icon-${i}`, item.icon);
    });

    // Share
    const shareBtn = el.querySelector('#btn-share');
    if (shareBtn) {
      const shareIcon = createElement(icons.Share2);
      shareIcon.classList.add('btn-icon');
      shareBtn.prepend(shareIcon);
      shareBtn.addEventListener('click', () => handleShare(type.name, type.description));
    }

    // Restart
    const restartBtn = el.querySelector('#btn-restart');
    if (restartBtn) {
      const restartIcon = createElement(icons.RotateCcw);
      restartIcon.classList.add('btn-icon');
      restartBtn.prepend(restartIcon);
      restartBtn.addEventListener('click', onRestart);
    }
  });

  return el;
}

function renderReasoningCard(r: Reasoning, index: number): string {
  const tagColors: Record<string, string> = {
    '성향 매치': '#FF8C6B',
    '용도 매치': '#667EEA',
    '예산 최적': '#43E97B',
    '보조 AI': '#A18CD1',
  };
  const tagColor = tagColors[r.tag] || '#FF8C6B';

  return `
    <div class="reasoning-card" style="--tag-color: ${tagColor}; animation-delay: ${index * 0.1}s">
      <div class="rc-tag">
        <span class="rc-tag-icon" id="rc-tag-icon-${index}"></span>
        <span>${r.tag}</span>
        ${r.traitMatch ? `<span class="rc-trait-badge">${r.traitMatch}</span>` : ''}
      </div>
      <div class="rc-body">
        <div class="rc-service">
          <span class="rc-service-icon" id="rc-icon-${index}"></span>
          <span class="rc-service-name">${r.serviceName}</span>
        </div>
        <p class="rc-headline">${r.headline}</p>
        <p class="rc-reason">${r.reason}</p>
      </div>
      <div class="rc-footer">
        <span class="rc-price">${r.price}</span>
      </div>
    </div>
  `;
}

function renderPlanCard(plan: PlanTier, isRecommended: boolean): string {
  const llm = aiServices[plan.mainLLM];
  const tierLabel = { free: '무료', standard: '스탠다드', pro: '프로' }[plan.id];

  return `
    <div class="plan-card ${plan.id}${isRecommended ? ' recommended' : ''}">
      ${isRecommended ? '<div class="plan-badge">⭐ 추천</div>' : ''}
      <div class="plan-header">
        <span class="plan-tier-name">${tierLabel}</span>
        <span class="plan-price">${plan.priceLabel}</span>
        <span class="plan-price-sub">/월</span>
      </div>
      <div class="plan-body">
        <div class="plan-llm">
          <span class="plan-llm-icon" id="plan-llm-icon-${['free', 'standard', 'pro'].indexOf(plan.id)}"></span>
          <div class="plan-llm-info">
            <span class="plan-llm-name">${llm?.name || plan.mainLLM}</span>
            <span class="plan-llm-tier">${plan.mainLLMTier}</span>
          </div>
        </div>
        ${plan.extras.length > 0 ? `
          <div class="plan-extras">
            ${plan.extras.slice(0, 3).map((extra, ei) => {
              const svc = aiServices[extra.serviceKey];
              return `
                <div class="plan-extra-item">
                  <span class="plan-extra-icon" id="plan-extra-icon-${['free', 'standard', 'pro'].indexOf(plan.id)}-${ei}"></span>
                  <span class="plan-extra-name">${svc?.name || extra.serviceKey}</span>
                </div>
              `;
            }).join('')}
            ${plan.extras.length > 3 ? `<span class="plan-extra-more">+${plan.extras.length - 3}개 더</span>` : ''}
          </div>
        ` : ''}
        <p class="plan-target">${plan.targetUser}</p>
      </div>
    </div>
  `;
}

function renderTraitBar(labelLeft: string, labelRight: string, value: number): string {
  const percent = ((value + 1) / 2) * 100;
  return `
    <div class="trait-bar">
      <span class="trait-label left">${labelLeft}</span>
      <div class="trait-track">
        <div class="trait-indicator" style="left: ${percent}%"></div>
      </div>
      <span class="trait-label right">${labelRight}</span>
    </div>
  `;
}

function injectIcon(root: HTMLElement, id: string, iconName: string): void {
  const container = root.querySelector(`#${id}`);
  if (!container) return;
  const pascalName = toPascalCase(iconName);
  const iconNode = icons[pascalName as keyof typeof icons];
  if (iconNode) {
    const svg = createElement(iconNode);
    container.appendChild(svg);
  }
}

async function handleShare(typeName: string, description: string): Promise<void> {
  const shareText = `나의 AI 유형: "${typeName}" — ${description}\n\n나에게 맞는 AI는? 테스트 해보기 👉`;
  if (navigator.share) {
    try {
      await navigator.share({ title: '나에게 맞는 AI는?', text: shareText, url: window.location.href });
    } catch { /* cancelled */ }
  } else {
    await navigator.clipboard.writeText(shareText + ' ' + window.location.href);
    alert('링크가 복사되었습니다!');
  }
}
