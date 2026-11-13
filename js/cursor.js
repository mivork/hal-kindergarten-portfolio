/* ==========================================================
   cursor.js：オリジナルカーソル
   - マウス操作（pointer: fine）で、動きを減らす設定でないときだけ動く
   - 点はマウス位置ぴったり、輪は少し遅れて追いかける（requestAnimationFrame）
========================================================== */
(() => {
  const fine = window.matchMedia('(pointer: fine)').matches;
  const reduce = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  if (!fine || reduce) return;

  const cursor = document.createElement('div');
  cursor.className = 'cursor is-hidden';
  cursor.setAttribute('aria-hidden', 'true');
  cursor.innerHTML = '<span class="cursor__ring"></span><span class="cursor__dot"></span>';
  document.body.append(cursor);
  document.documentElement.classList.add('has-cursor');

  const dot = cursor.querySelector('.cursor__dot');
  const ring = cursor.querySelector('.cursor__ring');
  const mouse = { x: -100, y: -100 };
  const pos = { x: -100, y: -100 };

  // 電話・見学・資料請求につながるもの
  const ACCENT = '.button--accent, .button--outline, [href^="tel:"], [href*="hal.ac.jp"]';
  const LINK = 'a, button, label, summary, [role="button"], .access__frame.is-locked';

  document.addEventListener('pointermove', (e) => {
    mouse.x = e.clientX;
    mouse.y = e.clientY;
    dot.style.setProperty('--x', `${mouse.x}px`);
    dot.style.setProperty('--y', `${mouse.y}px`);
    cursor.classList.remove('is-hidden');

    const target = e.target instanceof Element ? e.target : null;
    const accent = target?.closest(ACCENT);
    cursor.classList.toggle('is-accent', Boolean(accent));
    cursor.classList.toggle('is-link', !accent && Boolean(target?.closest(LINK)));
  });

  document.addEventListener('pointerdown', () => cursor.classList.add('is-down'));
  document.addEventListener('pointerup', () => cursor.classList.remove('is-down'));
  document.documentElement.addEventListener('mouseleave', () => cursor.classList.add('is-hidden'));
  window.addEventListener('blur', () => cursor.classList.add('is-hidden'));

  const follow = () => {
    pos.x += (mouse.x - pos.x) * 0.2;
    pos.y += (mouse.y - pos.y) * 0.2;
    ring.style.setProperty('--x', `${pos.x}px`);
    ring.style.setProperty('--y', `${pos.y}px`);
    requestAnimationFrame(follow);
  };
  requestAnimationFrame(follow);
})();
