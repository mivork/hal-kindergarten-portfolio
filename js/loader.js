"use strict";

/* ==========================================================
   ローディング画面
   ・％とバーは、表示してからの時間に合わせて 0 → 100 に進む
     （実際のダウンロード量ではなく、時間で進む表示）
   ・ページの読み込みが終わり、3秒たったら 100％ にして消す
   ・読み込みが長引くときは 90％ で止まって待つ
   ・止まってしまったときの保険として、15秒たったら消す
========================================================== */
(() => {
  const loader = document.getElementById("loader");
  if (!loader) return;

  const num = loader.querySelector(".loader__num");
  const SHOW = 3000;      // ms：表示する時間（この時間で 100％ に届く）
  const MAX_SHOW = 15000; // ms：止まってしまったときの保険
  const WAIT_CAP = 90;    // ％：読み込みが終わるまでは、ここで止まる

  const start = performance.now();
  let loaded = document.readyState === "complete";
  if (!loaded) {
    window.addEventListener("load", () => { loaded = true; }, { once: true });
  }

  const setPercent = (pct) => {
    const value = Math.max(0, Math.min(100, Math.round(pct)));
    loader.style.setProperty("--p", `${value}%`);
    if (num) num.textContent = String(value);
  };

  const tick = () => {
    const elapsed = performance.now() - start;
    const cap = loaded ? 100 : WAIT_CAP;
    setPercent(Math.min(cap, (elapsed / SHOW) * 100));

    const done = loaded && elapsed >= SHOW;
    if (done || elapsed >= MAX_SHOW) {
      setPercent(100);
      loader.classList.add("is-done");
      loader.setAttribute("aria-hidden", "true");
      return;
    }
    window.setTimeout(tick, 50);
  };

  tick();
})();
