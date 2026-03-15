/**
 * Motion-powered animations for result screen.
 * Uses motion/mini (lightweight DOM-only subset of motion v12).
 */
// eslint-disable-next-line @typescript-eslint/no-explicit-any
const motionImport = () => import('motion/mini') as Promise<{ animate: any; animateSequence: any }>;

let _animate: any;
async function getAnimate() {
  if (!_animate) {
    const m = await motionImport();
    _animate = m.animate;
  }
  return _animate;
}

/* ───── Result screen ───── */

/** Character image entrance — scale up + gentle float loop */
export async function animateCharacterEntrance(el: Element): Promise<void> {
  const animate = await getAnimate();
  await animate(
    el,
    { opacity: [0, 1], scale: [0.85, 1], y: [30, 0] },
    { duration: 0.7, ease: 'ease-out' },
  ).finished;
  animate(el, { y: [0, -10, 0] }, { duration: 3.6, ease: 'ease-in-out', repeat: Infinity });
}

/** Soulmate card entrance — slide up + fade */
export async function animateSoulmateCard(el: Element): Promise<void> {
  const animate = await getAnimate();
  animate(el, { opacity: [0, 1], y: [40, 0] }, { duration: 0.6, ease: [0.34, 1.56, 0.64, 1], delay: 0.3 });
}

/** Stagger entrance for picker items */
export async function animateSecondaryCards(els: NodeListOf<Element>): Promise<void> {
  const animate = await getAnimate();
  let d = 0.4;
  els.forEach((el) => {
    animate(el, { opacity: [0, 1], y: [20, 0] }, { duration: 0.35, ease: 'ease-out', delay: d });
    d += 0.06;
  });
}

/** Hero section text entrance */
export async function animateResultHero(container: Element): Promise<void> {
  const animate = await getAnimate();
  const name = container.querySelector('.result-type-name');
  const desc = container.querySelector('.result-type-desc');
  const pct = container.querySelector('.result-percentage');

  if (name) animate(name, { opacity: [0, 1], y: [20, 0] }, { duration: 0.5, delay: 0.3 });
  if (desc) animate(desc, { opacity: [0, 1], y: [15, 0] }, { duration: 0.5, delay: 0.45 });
  if (pct) animate(pct, { opacity: [0, 1], y: [10, 0] }, { duration: 0.4, delay: 0.6 });
}

/** Insight banner entrance — slide from left */
export async function animateInsightBanner(el: Element): Promise<void> {
  const animate = await getAnimate();
  animate(el, { opacity: [0, 1], x: [-30, 0] }, { duration: 0.5, ease: [0.34, 1.56, 0.64, 1], delay: 0.2 });
}

/* ───── Tilt card effect for character image ───── */

/** Attaches pointer-driven 3D tilt effect to an element */
export function attachTiltEffect(container: Element): void {
  const el = container as HTMLElement;
  el.style.perspective = '800px';
  el.style.transformStyle = 'preserve-3d';

  const img = el.querySelector('.result-illust-img') as HTMLElement;
  if (!img) return;

  img.style.transition = 'transform 0.15s ease-out';
  img.style.willChange = 'transform';

  const handleMove = (clientX: number, clientY: number) => {
    const rect = el.getBoundingClientRect();
    const x = clientX - rect.left;
    const y = clientY - rect.top;

    const normalX = (x / rect.width) * 2 - 1;
    const normalY = (y / rect.height) * 2 - 1;

    const rotateY = normalX * 12;
    const rotateX = -normalY * 12;

    img.style.transform = `rotateX(${rotateX}deg) rotateY(${rotateY}deg) scale3d(1.03, 1.03, 1.03)`;
  };

  el.addEventListener('pointermove', (e: PointerEvent) => {
    handleMove(e.clientX, e.clientY);
  });

  el.addEventListener('pointerleave', () => {
    img.style.transition = 'transform 0.5s ease-out';
    img.style.transform = 'rotateX(0deg) rotateY(0deg) scale3d(1, 1, 1)';
    setTimeout(() => { img.style.transition = 'transform 0.15s ease-out'; }, 500);
  });
}
