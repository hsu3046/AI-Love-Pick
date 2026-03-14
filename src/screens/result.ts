import { createElement, icons } from 'lucide';
import { type QuizResult } from '../engine/scoring';
import { aiServices } from '../data/results';
import { injectIcon } from '../utils/icons';
import { handleShareCard } from './share-card';

export function renderResult(result: QuizResult, onRestart: () => void): HTMLElement {
  const el = document.createElement('div');
  el.className = 'screen screen-result';

  const { type, scores, reasonings, insightSummary } = result;

  const mainReasoning = reasonings[0];
  const recommendedKeys = new Set(reasonings.map(r => r.serviceKey));
  const mainSvc = aiServices[mainReasoning?.serviceKey || type.mainLLM];


  el.innerHTML = `
    <div class="result-content">
      <!-- Hero (unchanged) -->
      <div class="result-hero" style="--accent: ${type.color}">
        <div class="result-illustration" id="result-illustration">
          <div class="illust-sparkle-wrap">
            <img
              class="result-illust-img"
              src="/assets/${type.id}.jpg"
              alt="${type.name} 캐릭터"
              onerror="this.style.display='none';this.nextElementSibling.style.display='flex'"
            >
            <div class="illustration-placeholder result-illust" style="display:none">
              <span class="illustration-label">일러스트 영역</span>
            </div>
            <span class="sparkle s1"></span>
            <span class="sparkle s2"></span>
            <span class="sparkle s3"></span>
            <span class="sparkle s4"></span>
            <span class="sparkle s5"></span>
          </div>
        </div>
        <h1 class="result-type-name">${type.name}</h1>
        <p class="result-type-desc">${type.description}</p>
        <div class="result-percentage">
          <span class="percentage-icon" id="percentage-icon"></span>
          <span>전체 사용자의 <strong>${type.percentage}%</strong>가 이 유형</span>
        </div>
      </div>

      <!-- Trait Chart (unchanged) -->
      <div class="result-chart-section">
        <h2 class="section-title">나의 AI 성향</h2>
        <div class="trait-bars">
          ${renderTraitBar('속도', '깊이', scores.speed_depth)}
          ${renderTraitBar('현실', '창작', scores.real_creative)}
          ${renderTraitBar('논리', '감성', scores.logic_visual)}
          ${renderTraitBar('체계', '즉흥', scores.plan_flow)}
        </div>
      </div>

      <!-- Insight (unchanged) -->
      <div class="insight-banner">
        <span class="insight-icon" id="insight-icon"></span>
        <p class="insight-text">${insightSummary}</p>
      </div>

      <!-- ★ NEW: AI Soulmate Section -->
      <div class="soulmate-section">
        <h2 class="section-title"><span class="section-icon" id="section-soulmate-icon"></span> 당신의 AI 소울메이트</h2>

        <!-- Main LLM — big hero card -->
        <div class="soulmate-main" id="soulmate-main-card"
          data-svc-key="${mainReasoning?.serviceKey || type.mainLLM}"
          data-selected-price="${mainSvc.tiers[0]?.priceUSD ?? 0}">
          <div class="soulmate-main-header">
          ${{chatgpt:'/assets/chatgpt.svg',gemini:'/assets/gemini.svg.png',claude:'/assets/claude.svg',grok:'/assets/grok.svg'}[mainReasoning?.serviceKey || ''] ?
             `<img class="soulmate-main-logo" src="${{chatgpt:'/assets/chatgpt.svg',gemini:'/assets/gemini.svg.png',claude:'/assets/claude.svg',grok:'/assets/grok.svg'}[mainReasoning?.serviceKey || '']}" alt="${mainSvc.name}">` :
             `<span class="soulmate-main-icon" id="soulmate-main-icon"></span>`}
            <div class="soulmate-main-info">
              <span class="soulmate-main-name">${mainSvc.name}</span>
              <span class="soulmate-main-desc">${mainSvc.description}</span>
            </div>
          </div>
          <p class="soulmate-main-reason">${mainReasoning?.headline || type.insights.mainLLMReason}</p>
          ${mainReasoning?.traitMatch ? `<span class="soulmate-trait-badge">${mainReasoning.traitMatch}</span>` : ''}
          <div class="soulmate-main-plan-row">
            ${mainSvc.tiers.length > 1 ? `
              <div class="soulmate-plan-tiers">
                ${mainSvc.tiers.map((t, ti) => {
                  const krw = t.priceUSD * 1400;
                  const label = t.priceUSD === 0 ? t.name : `${t.name} ₩${krw.toLocaleString()}`;
                  return `<button class="picker-tier-btn soulmate-tier-btn${ti === 0 ? ' active' : ''}" data-tier-price="${t.priceUSD}" data-tier-idx="${ti}" data-svc-key="${mainReasoning?.serviceKey || type.mainLLM}">${label}</button>`;
                }).join('')}
              </div>` : `<span class="picker-item-price">${mainSvc.tiers[0]?.priceUSD === 0 ? '무료' : `₩${(mainSvc.tiers[0].priceUSD * 1400).toLocaleString()}/월`}</span>`
            }
            ${mainSvc.pricingUrl ? `<a class="picker-pricing-link inline" href="${mainSvc.pricingUrl}" target="_blank" rel="noopener">가격표</a>` : ''}
          </div>
        </div>

        <!-- Secondary LLM label only — picker follows directly -->
        <div class="soulmate-secondary">
          <div class="soulmate-sec-label">+ 같이 쓰면 좋아요</div>
        </div>
      </div>

      <!-- ★ AI Service Picker — directly under label -->
      <div class="start-section">
        <div class="picker-grid" id="picker-grid">
          ${Object.entries(aiServices)
            // 1. 소울메이트(메인 LLM) 제외
            .filter(([key]) => key !== mainReasoning?.serviceKey)
            .sort(([keyA], [keyB]) => {
              const aRec = recommendedKeys.has(keyA) ? 1 : 0;
              const bRec = recommendedKeys.has(keyB) ? 1 : 0;
              return bRec - aRec;
            })
            .map(([key, svc], si) => {
            const isRecommended = recommendedKeys.has(key);
            const tiers = svc.tiers;
            const groupSiblings = svc.planGroup
              ? Object.entries(aiServices)
                  .filter(([k, s]) => s.planGroup === svc.planGroup && k !== key)
                  .map(([, s]) => s.name)
              : [];
            const groupNote = groupSiblings.length > 0
              ? `<span class="plan-group-note">${groupSiblings.join(' / ')} 포함</span>`
              : '';
            // 5. 공식 로고 (4대 LLM)
            const logoMap: Record<string, string> = {
              chatgpt: '/assets/chatgpt.svg',
              gemini: '/assets/gemini.svg.png',
              claude: '/assets/claude.svg',
              grok: '/assets/grok.svg',
            };
            const logoUrl = logoMap[key];
            const iconHtml = logoUrl
              ? `<img class="picker-item-logo" src="${logoUrl}" alt="${svc.name}">`
              : `<span class="picker-item-icon" id="picker-icon-${si}"></span>`;
            return `
              <div class="picker-item${isRecommended ? ' checked' : ''}" data-key="${key}" data-selected-price="0" data-plan-group="${svc.planGroup || ''}" data-bundle-note="${svc.bundleNote || ''}" style="animation-delay: ${si * 0.02}s">
                ${iconHtml}
                <div class="picker-item-info">
                  <div class="picker-item-name-row">
                    <span class="picker-item-name">${svc.name}</span>
                    ${(!svc.bundleNote && svc.pricingUrl) ? `<a class="picker-pricing-link inline" href="${svc.pricingUrl}" target="_blank" rel="noopener" title="가격표 보기">가격표</a>` : ''}
                  </div>
                  ${svc.bundleNote ? `
                    <span class="plan-group-note">${svc.bundleNote}</span>
                  ` : tiers.length > 1 ? `
                    <div class="picker-tier-toggle">
                      ${tiers.map((t, ti) => {
                        const krw = t.priceKRW ?? Math.round(t.priceUSD * 1400);
                        const label = krw === 0 ? t.name : `${t.name} ₩${krw.toLocaleString()}`;
                        const isDefault = ti === 0;
                        return `<button class="picker-tier-btn${isDefault ? ' active' : ''}" data-tier-price="${t.priceUSD}" data-tier-krw="${krw}" data-tier-idx="${ti}">${label}</button>`;
                      }).join('')}
                    </div>
                    ${groupNote}
                  ` : `
                    <span class="picker-item-price">${(() => { const krw = tiers[0]?.priceKRW ?? Math.round((tiers[0]?.priceUSD || 0) * 1400); return krw === 0 ? '무료' : `₩${krw.toLocaleString()}/월`; })()}</span>
                  `}
                </div>
                <span class="picker-check"></span>
              </div>
            `;
          }).join('')}
        </div>
      </div>



      <!-- 계산서 영역 (share 버튼 바로 위) -->
      <div class="budget-receipt" id="budget-receipt">
        <div class="receipt-title"><span class="receipt-title-icon" id="receipt-title-icon"></span> 예산 계산서</div>
        <div class="receipt-rows" id="receipt-rows"></div>
        <div class="receipt-divider"></div>
        <div class="receipt-total">
          <span class="receipt-total-label">합계</span>
          <span class="receipt-total-amount" id="receipt-total-amount">₩0</span>
        </div>
        ${result.practical.budgetKRW > 0 ? `
        <div class="receipt-budget-row">
          <span class="receipt-budget-label">예산</span>
          <span class="receipt-budget-amount">₩${result.practical.budgetKRW.toLocaleString()}</span>
        </div>
        <div class="picker-budget-track" style="margin-top:8px">
          <div class="picker-budget-fill" id="picker-budget-fill" style="width: 0%"></div>
        </div>
        <div class="receipt-status" id="receipt-status"></div>
        ` : ''}
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
    injectIcon(el, 'section-soulmate-icon', 'crosshair');
    injectIcon(el, 'insight-icon', 'sparkles');

    injectIcon(el, 'soulmate-main-icon', mainSvc.icon);
    injectIcon(el, 'receipt-title-icon', 'receipt');
    // secondary no longer rendered as a card

    // Picker service icons — MUST match exact filter+sort order as HTML rendering
    const mainSvcKey = mainReasoning?.serviceKey;
    const serviceEntries = Object.entries(aiServices)
      .filter(([key]) => key !== mainSvcKey)
      .sort(([keyA], [keyB]) => {
        const aRec = recommendedKeys.has(keyA) ? 1 : 0;
        const bRec = recommendedKeys.has(keyB) ? 1 : 0;
        return bRec - aRec;
      });
    serviceEntries.forEach(([, svc], si) => {
      injectIcon(el, `picker-icon-${si}`, svc.icon);
    });

    // Picker interactivity
    const budgetKRW = result.practical.budgetKRW;
    const USD_TO_KRW = 1400;
    const pickerGrid = el.querySelector('#picker-grid');
    if (pickerGrid) {
      // Initialize selected prices
      pickerGrid.querySelectorAll('.picker-item').forEach(item => {
        const el = item as HTMLElement;
        const activeBtn = el.querySelector('.picker-tier-btn.active') as HTMLElement;
        if (activeBtn) {
          el.dataset.selectedPrice = activeBtn.dataset.tierPrice || '0';
        } else {
          // Single-tier: use its price
          const svcKey = el.dataset.key || '';
          const svc = aiServices[svcKey];
          el.dataset.selectedPrice = svc?.tiers[0]?.priceUSD?.toString() || '0';
        }
      });

      // Helper: sync plan group siblings
      const syncPlanGroup = (sourceItem: HTMLElement, checked: boolean, tierIdx?: string) => {
        const group = sourceItem.dataset.planGroup;
        if (!group) return;
        pickerGrid.querySelectorAll(`.picker-item[data-plan-group="${group}"]`).forEach(sibling => {
          const sib = sibling as HTMLElement;
          if (sib === sourceItem) return;
          if (checked) {
            if (!sib.classList.contains('checked')) sib.classList.add('checked');
            // Sync tier selection if specified
            if (tierIdx !== undefined) {
              const sibBtn = sib.querySelector(`.picker-tier-btn[data-tier-idx="${tierIdx}"]`) as HTMLElement;
              if (sibBtn) {
                sib.querySelectorAll('.picker-tier-btn').forEach(b => b.classList.remove('active'));
                sibBtn.classList.add('active');
                sib.dataset.selectedPrice = sibBtn.dataset.tierPrice || '0';
              }
            }
          } else {
            sib.classList.remove('checked');
          }
        });
      };

      const recalc = () => {
        let totalUSD = 0;
        const countedGroups = new Set<string>();
        const checkedItems: { name: string; krw: number }[] = [];

        pickerGrid.querySelectorAll('.picker-item.checked').forEach(item => {
          const itemEl = item as HTMLElement;
          const price = parseFloat(itemEl.dataset.selectedPrice || '0');
          const group = itemEl.dataset.planGroup;
          const svcKey = itemEl.dataset.key || '';
          const svc = aiServices[svcKey];

          if (group) {
            if (!countedGroups.has(group)) {
              countedGroups.add(group);
              let maxPrice = price;
              pickerGrid.querySelectorAll(`.picker-item.checked[data-plan-group="${group}"]`).forEach(sib => {
                const sibPrice = parseFloat((sib as HTMLElement).dataset.selectedPrice || '0');
                if (sibPrice > maxPrice) maxPrice = sibPrice;
              });
              totalUSD += maxPrice;
              checkedItems.push({ name: svc?.name || svcKey, krw: Math.round(maxPrice * USD_TO_KRW) });
            }
          } else {
            totalUSD += price;
            checkedItems.push({ name: svc?.name || svcKey, krw: Math.round(price * USD_TO_KRW) });
          }
        });
        // Include soulmate in receipt calculation
        const soulmateCardEl = el.querySelector('#soulmate-main-card') as HTMLElement;
        if (soulmateCardEl) {
          const soulmateKey = soulmateCardEl.dataset.svcKey || '';
          const soulmateSvc = aiServices[soulmateKey];
          const soulmatePrice = parseFloat(soulmateCardEl.dataset.selectedPrice || '0');
          checkedItems.unshift({ name: soulmateSvc?.name || soulmateKey, krw: Math.round(soulmatePrice * USD_TO_KRW) });
          totalUSD += soulmatePrice;
        }

        const totalKRW = Math.round(totalUSD * USD_TO_KRW);

        // Update receipt rows
        const receiptRows = el.querySelector('#receipt-rows');
        if (receiptRows) {
          if (checkedItems.length === 0) {
            receiptRows.innerHTML = `<div class="receipt-empty">선택된 서비스가 없어요</div>`;
          } else {
            receiptRows.innerHTML = checkedItems.map(item =>
              `<div class="receipt-row">
                <span class="receipt-row-name">${item.name}</span>
                <span class="receipt-row-price${item.krw === 0 ? ' free' : ''}">${item.krw === 0 ? '무료' : `₩${item.krw.toLocaleString()}/월`}</span>
              </div>`
            ).join('');
          }
        }

        // Update total
        const totalEl = el.querySelector('#receipt-total-amount');
        if (totalEl) totalEl.textContent = `₩${totalKRW.toLocaleString()}/월`;

        // Update bar
        const fill = el.querySelector('#picker-budget-fill') as HTMLElement;
        if (fill && budgetKRW > 0) {
          const pct = Math.min((totalKRW / budgetKRW) * 100, 100);
          fill.style.width = `${pct}%`;
          fill.style.background = totalKRW > budgetKRW ? '#e85d75' : '#4a9e6b';
        }

        // Update status
        const statusEl = el.querySelector('#receipt-status');
        if (statusEl && budgetKRW > 0) {
          if (totalKRW > budgetKRW) {
            const over = totalKRW - budgetKRW;
            statusEl.textContent = `₩${over.toLocaleString()} 예산 초과`;
            statusEl.className = 'receipt-status over';
          } else if (totalKRW > 0) {
            const rem = budgetKRW - totalKRW;
            statusEl.textContent = `₩${rem.toLocaleString()} 여유`;
            statusEl.className = 'receipt-status under';
          } else {
            statusEl.textContent = '';
            statusEl.className = 'receipt-status';
          }
        }
      };

      // Sort via CSS order (no DOM reorder = no flicker)
      const sortItems = () => {
        let checkedIdx = 0;
        let uncheckedIdx = 100;
        pickerGrid.querySelectorAll('.picker-item').forEach(item => {
          const el = item as HTMLElement;
          el.style.order = item.classList.contains('checked') ? String(checkedIdx++) : String(uncheckedIdx++);
        });
      };

      // Click handler
      pickerGrid.addEventListener('click', (e) => {
        const target = e.target as HTMLElement;
        // Pricing link — let it navigate, don't toggle card
        if (target.closest('.picker-pricing-link')) return;
        const tierBtn = target.closest('.picker-tier-btn') as HTMLElement;
        if (tierBtn) {
          e.stopPropagation();
          const item = tierBtn.closest('.picker-item') as HTMLElement;
          if (!item) return;
          item.querySelectorAll('.picker-tier-btn').forEach(b => b.classList.remove('active'));
          tierBtn.classList.add('active');
          item.dataset.selectedPrice = tierBtn.dataset.tierPrice || '0';
          if (!item.classList.contains('checked')) item.classList.add('checked');
          // Auto-link plan group siblings
          syncPlanGroup(item, true, tierBtn.dataset.tierIdx);
          recalc();
          sortItems();
          return;
        }
        const item = target.closest('.picker-item') as HTMLElement;
        if (item) {
          const willBeChecked = !item.classList.contains('checked');
          item.classList.toggle('checked');

          // If a bundled service is checked → auto-upgrade planGroup parent to paid tier
          if (willBeChecked && item.dataset.bundleNote) {
            const group = item.dataset.planGroup;
            if (group) {
              const parent = pickerGrid.querySelector(
                `.picker-item[data-plan-group="${group}"][data-bundle-note=""]`
              ) as HTMLElement | null;
              if (parent) {
                parent.classList.add('checked');
                const activeBtn = parent.querySelector('.picker-tier-btn.active') as HTMLElement | null;
                const currentIdx = parseInt(activeBtn?.dataset.tierIdx || '0');
                if (currentIdx === 0) {
                  const paidBtn = parent.querySelector('.picker-tier-btn[data-tier-idx="1"]') as HTMLElement | null;
                  if (paidBtn) {
                    parent.querySelectorAll('.picker-tier-btn').forEach(b => b.classList.remove('active'));
                    paidBtn.classList.add('active');
                    parent.dataset.selectedPrice = paidBtn.dataset.tierPrice || '0';
                  }
                }
              }
            }
          }

          // Auto-link plan group siblings
          syncPlanGroup(item, willBeChecked);
          recalc();
          sortItems();
        }
      });

      sortItems();
      recalc();

      // Soulmate card tier buttons
      const soulmateCard = el.querySelector('#soulmate-main-card') as HTMLElement;
      if (soulmateCard) {
        soulmateCard.querySelectorAll('.soulmate-tier-btn').forEach(btn => {
          btn.addEventListener('click', (e) => {
            e.stopPropagation();
            soulmateCard.querySelectorAll('.soulmate-tier-btn').forEach(b => b.classList.remove('active'));
            btn.classList.add('active');
            soulmateCard.dataset.selectedPrice = (btn as HTMLElement).dataset.tierPrice || '0';
            recalc();
          });
        });
      }
    }


    // Share
    const shareBtn = el.querySelector('#btn-share');
    if (shareBtn) {
      const shareIcon = createElement(icons.Share2);
      shareIcon.classList.add('btn-icon');
      shareBtn.prepend(shareIcon);
      shareBtn.addEventListener('click', () => {
        // Collect currently checked service keys from the picker
        const selectedKeys: string[] = [];
        el.querySelectorAll('.picker-item.checked').forEach(item => {
          const key = (item as HTMLElement).dataset.key;
          if (key) selectedKeys.push(key);
        });
        handleShareCard(result, selectedKeys);
      });
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


