import html2canvas from 'html2canvas';
import { createElement, icons } from 'lucide';
import { type QuizResult } from '../engine/scoring';
import { aiServices } from '../data/results';

const SITE_URL = 'pick.knowai.app';

const LOGO_MAP: Record<string, string> = {
  chatgpt: '/assets/chatgpt.svg',
  gemini:  '/assets/gemini.svg.png',
  claude:  '/assets/claude.svg',
  grok:    '/assets/grok.svg',
};

// Inline Lucide SVG — call at runtime (DOM available)
function lucideHtml(iconName: string, size: number, color: string): string {
  const key = iconName
    .replace(/-([a-z0-9])/g, (_, c: string) => c.toUpperCase())
    .replace(/^([a-z])/, (_, c: string) => c.toUpperCase()) as keyof typeof icons;
  const iconFn = icons[key];
  if (!iconFn) return '';
  const el = createElement(iconFn);
  el.setAttribute('width', String(size));
  el.setAttribute('height', String(size));
  el.setAttribute('stroke', color);
  el.setAttribute('fill', 'none');
  el.setAttribute('stroke-width', '2');
  el.setAttribute('stroke-linecap', 'round');
  el.setAttribute('stroke-linejoin', 'round');
  return el.outerHTML;
}

// Header section icons (static paths — safe for html2canvas)
const SVG = (path: string, size = 15, color = '#999') =>
  `<svg xmlns="http://www.w3.org/2000/svg" width="${size}" height="${size}" viewBox="0 0 24 24" fill="none" stroke="${color}" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round">${path}</svg>`;
const ICON_BAR   = (c: string) => SVG('<line x1="18" y1="20" x2="18" y2="10"/><line x1="12" y1="20" x2="12" y2="4"/><line x1="6" y1="20" x2="6" y2="14"/>', 15, c);
const ICON_USERS = (c: string) => SVG('<path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/><path d="M23 21v-2a4 4 0 0 0-3-3.87"/><path d="M16 3.13a4 4 0 0 1 0 7.75"/>', 15, c);
const ICON_LINK  = (c: string) => SVG('<path d="M10 13a5 5 0 0 0 7.54.54l3-3a5 5 0 0 0-7.07-7.07l-1.72 1.71"/><path d="M14 11a5 5 0 0 0-7.54-.54l-3 3a5 5 0 0 0 7.07 7.07l1.71-1.71"/>', 14, c);
const ICON_STAR  = (c: string) => SVG('<polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2"/>', 18, c);

function hexToRgb(hex: string): [number, number, number] {
  const h = hex.replace('#', '');
  const v = parseInt(h.length === 3 ? h.split('').map(c => c + c).join('') : h, 16);
  return [(v >> 16) & 255, (v >> 8) & 255, v & 255];
}
function mix(hex: string, op: number): string {
  const [r, g, b] = hexToRgb(hex);
  return `rgb(${Math.round(r*op+255*(1-op))},${Math.round(g*op+255*(1-op))},${Math.round(b*op+255*(1-op))})`;
}

// Convert logo to PNG data URL for html2canvas compatibility.
// SVG cannot be rendered by html2canvas even as base64 — must rasterize via Canvas.
async function logoToDataUrl(src: string, size = 44): Promise<string | null> {
  try {
    const res = await fetch(src);
    if (!res.ok) return null;

    const contentType = res.headers.get('content-type') || '';

    // Raster image (PNG/JPEG/WEBP) — fast path: direct FileReader base64
    if (!contentType.includes('svg')) {
      const blob = await res.blob();
      return await new Promise<string>((resolve, reject) => {
        const reader = new FileReader();
        reader.onload = () => resolve(reader.result as string);
        reader.onerror = reject;
        reader.readAsDataURL(blob);
      });
    }

    // SVG — render to off-screen canvas at target size, return as PNG data URL
    const svgText = await res.text();
    const svgBlob = new Blob([svgText], { type: 'image/svg+xml' });
    const blobUrl = URL.createObjectURL(svgBlob);

    return await new Promise<string | null>((resolve) => {
      const img = new Image();
      img.onload = () => {
        const canvas = document.createElement('canvas');
        canvas.width = size;
        canvas.height = size;
        const ctx = canvas.getContext('2d');
        if (!ctx) { URL.revokeObjectURL(blobUrl); resolve(null); return; }
        ctx.drawImage(img, 0, 0, size, size);
        URL.revokeObjectURL(blobUrl);
        resolve(canvas.toDataURL('image/png'));
      };
      img.onerror = () => { URL.revokeObjectURL(blobUrl); resolve(null); };
      img.src = blobUrl;
    });
  } catch {
    return null;
  }
}

function traitRow(left: string, right: string, value: number, accent: string): string {
  const pct = Math.round(((value + 1) / 2) * 100);
  return `
    <div style="display:flex;align-items:center;gap:10px;margin-bottom:9px">
      <span style="font-size:13px;color:#bbb;width:36px;flex-shrink:0;font-weight:600;text-align:right">${left}</span>
      <div style="flex:1;height:6px;background:linear-gradient(90deg,#84fab0,#8fd3f4,#f6d365,#fbc2eb);border-radius:99px;position:relative">
        <div style="position:absolute;top:50%;transform:translate(-50%,-50%);width:14px;height:14px;background:white;border:2.5px solid ${accent};border-radius:50%;left:${pct}%"></div>
      </div>
      <span style="font-size:13px;color:#bbb;width:36px;flex-shrink:0;font-weight:600">${right}</span>
    </div>`;
}

export async function generateShareCard(result: QuizResult, selectedKeys: string[]): Promise<Blob> {
  const { type, scores, reasonings } = result;
  const mainKey = reasonings[0]?.serviceKey || type.mainLLM;
  const mainSvc = aiServices[mainKey];
  const accent  = type.color;
  const soft    = mix(accent, 0.15);

  // Pre-fetch logos as data URLs (fixes html2canvas SVG issue)
  const logoDataUrl = LOGO_MAP[mainKey] ? await logoToDataUrl(LOGO_MAP[mainKey], 44) : null;

  const friendSvcs = selectedKeys
    .filter(k => k !== mainKey)
    .slice(0, 6)
    .map(k => ({ key: k, svc: aiServices[k] }))
    .filter(x => x.svc);

  const friendLogoUrls: Record<string, string | null> = {};
  await Promise.all(friendSvcs.map(async ({ key }) => {
    friendLogoUrls[key] = LOGO_MAP[key] ? await logoToDataUrl(LOGO_MAP[key], 36) : null;
  }));

  // Lucide SVG for each service icon (2 per row)
  const friendHtml = friendSvcs.length > 0 ? `
    <div style="width:calc(100% - 48px);margin-top:14px">
      <div style="display:flex;align-items:center;gap:6px;margin-bottom:10px">
        ${ICON_USERS(accent)}
        <span style="font-size:13px;font-weight:700;color:#888;letter-spacing:0.04em">같이 놀면 좋은 AI 친구들</span>
      </div>
      <div style="display:flex;flex-wrap:wrap;gap:8px">
        ${friendSvcs.map(({ key, svc }) => {
          const dUrl = friendLogoUrls[key];
          const iconHtml = dUrl
            ? `<img src="${dUrl}" style="width:20px;height:20px;flex-shrink:0;">`
            : `<span style="display:flex;align-items:center;flex-shrink:0;color:${accent}">${lucideHtml(svc.icon, 20, accent)}</span>`;
          return `<div style="display:flex;align-items:center;gap:9px;background:white;border-radius:14px;padding:11px 16px;box-shadow:0 2px 10px rgba(0,0,0,0.07);width:calc(50% - 4px);box-sizing:border-box;text-align:left">
            ${iconHtml}
            <span style="font-size:13px;font-weight:700;color:#222;white-space:nowrap;overflow:hidden;text-overflow:ellipsis">${svc.name}</span>
          </div>`;
        }).join('')}
      </div>
    </div>` : '';

  const wrap = document.createElement('div');
  wrap.style.cssText = 'position:fixed;left:-9999px;top:0;width:540px;height:960px;overflow:hidden;z-index:-1;';

  wrap.innerHTML = `
  <div style="
    position:relative;width:540px;height:960px;
    display:flex;flex-direction:column;align-items:center;
    padding:0 0 28px;box-sizing:border-box;
    background:linear-gradient(165deg,${mix(accent,0.12)} 0%,#fffaf7 35%,${mix(accent,0.06)} 100%);
    font-family:Pretendard,'Apple SD Gothic Neo','Noto Sans KR',sans-serif;
    overflow:hidden;
  ">
    <!-- Blobs -->
    <div style="position:absolute;width:400px;height:400px;border-radius:50%;background:${accent};opacity:0.07;filter:blur(90px);top:-120px;right:-100px;pointer-events:none"></div>
    <div style="position:absolute;width:260px;height:260px;border-radius:50%;background:#fbc2eb;opacity:0.09;filter:blur(80px);bottom:60px;left:-70px;pointer-events:none"></div>

    <!-- TITLE BAND -->
    <div style="width:100%;padding:34px 36px 18px;box-sizing:border-box;text-align:center">
      <div style="font-size:13px;font-weight:700;letter-spacing:0.14em;color:${accent};text-transform:uppercase;margin-bottom:6px">AI Match Result</div>
      <div style="font-size:40px;font-weight:900;letter-spacing:-0.03em;color:#1a1a1a;line-height:1.1">나의 소울메이트 AI</div>
    </div>

    <!-- SOULMATE CARD -->
    <div style="width:calc(100% - 48px);background:white;border-radius:24px;box-shadow:0 8px 32px rgba(0,0,0,0.10);border:2px solid ${soft};overflow:hidden">
      <div style="height:5px;background:linear-gradient(90deg,${accent},#fbc2eb,${accent})"></div>
      <div style="padding:18px 18px 0 18px">
        <div style="display:flex;align-items:center;gap:12px;margin-bottom:14px">
          ${logoDataUrl
            ? `<img src="${logoDataUrl}" style="width:44px;height:44px;padding:7px;background:${soft};border-radius:13px;flex-shrink:0;box-sizing:border-box">`
            : `<span style="display:flex;color:${accent}">${lucideHtml('bot', 28, accent)}</span>`}
          <div style="flex:1">
            <div style="font-size:26px;font-weight:900;letter-spacing:-0.02em;color:#1a1a1a">${mainSvc.name}</div>
            <div style="font-size:12px;color:#aaa;margin-top:2px">${mainSvc.description}</div>
          </div>
          ${ICON_STAR(accent)}
        </div>
      </div>
      <!-- Character image (absolute centering — no object-fit:cover) -->
      <div style="position:relative;width:100%;height:280px;overflow:hidden">
        <img src="/assets/${type.id}.jpg" crossorigin="anonymous" alt="${type.name}"
          style="position:absolute;top:50%;left:50%;transform:translate(-50%,-50%);width:100%;height:auto;min-height:200px;display:block">
        <div style="position:absolute;bottom:0;left:0;right:0;height:80px;background:linear-gradient(transparent,rgba(0,0,0,0.6))"></div>
        <div style="position:absolute;bottom:12px;left:16px;right:16px">
          <div style="font-size:22px;font-weight:800;color:white;letter-spacing:-0.01em">${type.name}</div>
          <div style="font-size:12px;color:rgba(255,255,255,0.75);margin-top:2px">전체 사용자의 ${type.percentage}%</div>
        </div>
      </div>
      <div style="padding:14px 18px 18px 18px">
        <div style="font-size:13px;color:#666;line-height:1.65">${type.description}</div>
      </div>
    </div>

    <!-- TRAITS -->
    <div style="width:calc(100% - 48px);margin-top:12px">
      <div style="display:flex;align-items:center;gap:6px;margin-bottom:8px">
        ${ICON_BAR(accent)}
        <span style="font-size:13px;font-weight:700;color:#888;letter-spacing:0.04em">나의 AI 성향</span>
      </div>
      <div style="background:rgba(255,255,255,0.75);border-radius:16px;padding:14px 18px">
        ${traitRow('속도','깊이', scores.speed_depth,  accent)}
        ${traitRow('현실','창작', scores.real_creative, accent)}
        ${traitRow('논리','감성', scores.logic_visual,  accent)}
        ${traitRow('체계','즉흥', scores.plan_flow,     accent)}
      </div>
    </div>

    <!-- FRIEND SERVICES -->
    ${friendHtml}

    <!-- FOOTER -->
    <div style="margin-top:auto;padding-top:16px;display:flex;flex-direction:column;align-items:center;gap:4px">
      <div style="display:flex;align-items:center;gap:5px">
        ${ICON_LINK(accent)}
        <span style="font-size:15px;font-weight:800;color:${accent};letter-spacing:0.02em">${SITE_URL}</span>
      </div>
      <span style="font-size:11px;color:#ccc;letter-spacing:0.04em">나에게 맞는 AI 찾기</span>
    </div>
  </div>`;

  document.body.appendChild(wrap);

  // Wait for all img elements to load
  await Promise.all(
    Array.from(wrap.querySelectorAll('img')).map(
      img => img.complete
        ? Promise.resolve()
        : new Promise<void>(res => { img.onload = () => res(); img.onerror = () => res(); })
    )
  );

  const cardEl = wrap.querySelector('div > div') as HTMLElement;
  const canvas = await html2canvas(cardEl, {
    scale: 2,
    useCORS: true,
    allowTaint: true,   // allow data: URLs
    backgroundColor: '#fffaf7',
    width: 540,
    height: 960,
    logging: false,
    imageTimeout: 10000,
  });

  document.body.removeChild(wrap);

  return new Promise((resolve, reject) => {
    canvas.toBlob(
      blob => blob ? resolve(blob) : reject(new Error('toBlob failed')),
      'image/png', 1.0
    );
  });
}

export async function handleShareCard(result: QuizResult, selectedKeys: string[] = []): Promise<void> {
  try {
    const blob = await generateShareCard(result, selectedKeys);
    const file = new File([blob], `ai-match-${result.type.id}.png`, { type: 'image/png' });

    if (navigator.canShare && navigator.canShare({ files: [file] })) {
      await navigator.share({
        files: [file],
        title: `나의 소울메이트 AI: ${aiServices[result.reasonings[0]?.serviceKey || result.type.mainLLM].name}`,
        text: `나는 "${result.type.name}" 유형! 👉 ${SITE_URL}`,
      });
      return;
    }

    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `ai-match-${result.type.id}.png`;
    a.click();
    URL.revokeObjectURL(url);
  } catch (err) {
    console.error('[ShareCard]', err);
    const text = `나의 소울메이트 AI: "${result.type.name}"\n👉 ${SITE_URL}`;
    await navigator.clipboard.writeText(text).catch(() => {});
    alert('이미지 생성에 실패했어요. 텍스트가 복사되었습니다!');
  }
}
