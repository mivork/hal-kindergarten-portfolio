"use strict";

/* ==========================================================
   ローディング画面を、ページの読み込みが終わったら消す
   ・最低でも0.7秒は見せる（一瞬で消えて見えなくならないように）
   ・消し方は css/components/loader.css の 0.5 秒のフェード
========================================================== */
(() => {
  const loader = document.getElementById("loader");
  if (!loader) return;

  const start = performance.now();
  const hide = () => {
    const wait = Math.max(0, 700 - (performance.now() - start));
    window.setTimeout(() => {
      loader.classList.add("is-done");
      loader.setAttribute("aria-hidden", "true");
    }, wait);
  };

  if (document.readyState === "complete") {
    hide();
  } else {
    window.addEventListener("load", hide, { once: true });
  }
})();
