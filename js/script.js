"use strict";

// 動きを減らす設定のときはアニメーションを止める
const reduceMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;

/* ==========================================================
   SPメニュー：リンクを押したら閉じる
========================================================== */
function initNav() {
  const check = document.getElementById("nav-toggle");
  // メニューが開いている間は、うしろのページをスクロールさせない
  const sync = () => document.documentElement.classList.toggle("is-menu-open", check.checked);
  check.addEventListener("change", sync);
  document.querySelectorAll(".nav a").forEach((link) => {
    link.addEventListener("click", () => {
      check.checked = false;
      sync();
    });
  });
}

/* ==========================================================
   スクロールでふわっと表示
========================================================== */
function initFadeIn() {
  const targets = document.querySelectorAll(".heading, .about__item, .building__points, .si__text, .lesson, .lessons__extra, .numbers__item, .numbers__bus, .cta-band__inner, .support__item, .contact__item, .access__inner");
  if (reduceMotion || !("IntersectionObserver" in window)) return;

  const observer = new IntersectionObserver((entries) => {
    entries.forEach((entry) => {
      if (entry.isIntersecting) {
        entry.target.classList.add("is-show");
        observer.unobserve(entry.target);
      }
    });
  }, { rootMargin: "0px 0px -10% 0px" });

  targets.forEach((el) => {
    el.classList.add("js-fade");
    observer.observe(el);
  });
}

/* ==========================================================
   ページトップボタン：少しスクロールしたら出す
========================================================== */
function initPagetop() {
  const button = document.querySelector(".pagetop");
  window.addEventListener("scroll", () => {
    button.classList.toggle("is-show", window.scrollY > 600);
  }, { passive: true });
}

/* ==========================================================
   Googleマップの誤操作対策（WD27_03 main.js の書き方）
   スクロール中に地図が勝手にズームしないよう、最初は操作できなくしておく
========================================================== */
function initMap() {
  const frame = document.getElementById("access-map");
  const map = document.getElementById("map-iframe");
  if (!frame || !map) return;

  const lock = () => frame.classList.add("is-locked");

  // クリック（タップ）したら地図を操作できるように
  frame.addEventListener("click", () => frame.classList.remove("is-locked"));

  // PC：地図から離れたら、SP：タッチが終わったら、また操作できなくする
  frame.addEventListener("mouseleave", lock);
  map.addEventListener("touchend", lock);
}

/* ==========================================================
   数字のカウントアップ：見えたら 0 から数字が増える
========================================================== */
function initCountUp() {
  const counters = document.querySelectorAll(".js-count");
  if (reduceMotion || !("IntersectionObserver" in window)) return;

  const run = (el) => {
    const to = Number(el.dataset.to);
    const duration = 1200;
    const start = performance.now();
    const step = (now) => {
      const progress = Math.min((now - start) / duration, 1);
      // 最後にゆっくり止まるように
      el.textContent = Math.round(to * (1 - Math.pow(1 - progress, 3)));
      if (progress < 1) requestAnimationFrame(step);
    };
    requestAnimationFrame(step);
  };

  const observer = new IntersectionObserver((entries) => {
    entries.forEach((entry) => {
      if (entry.isIntersecting) {
        run(entry.target);
        observer.unobserve(entry.target);
      }
    });
  }, { threshold: 0.6 });

  counters.forEach((el) => observer.observe(el));
}

/* 保存よけ
   ・ページ全体で右クリックメニューを出さない
   ・写真はドラッグで持ち出せないようにする
   ・開発者ツール／ソース表示／保存／印刷のショートカットキーを止める
   ※ブラウザのメニューから開く開発者ツールや、OSのスクリーンショットは
     Webページからは止められない（気軽に保存されないようにするための対策） */
function initGuard() {
  document.addEventListener("contextmenu", (event) => event.preventDefault());

  document.addEventListener("dragstart", (event) => {
    if (event.target.closest("img")) event.preventDefault();
  });

  document.addEventListener("keydown", (event) => {
    const key = event.key.toLowerCase();
    const ctrl = event.ctrlKey || event.metaKey; // Windows は Ctrl、Mac は ⌘
    const blocked =
      key === "f12" ||
      (ctrl && event.shiftKey && ["i", "j", "c"].includes(key)) || // 開発者ツール・コンソール・要素の検証
      (ctrl && event.altKey && ["i", "j", "c"].includes(key)) ||   // Mac の ⌘⌥I など
      (ctrl && ["u", "s", "p"].includes(key));                      // ソース表示・保存・印刷
    if (blocked) event.preventDefault();
  });

  // PrintScreen キーを押したら、クリップボードの中身を空にする（Windows のブラウザで効くことがある）
  document.addEventListener("keyup", (event) => {
    if (event.key === "PrintScreen") navigator.clipboard?.writeText("").catch(() => {});
  });
}

document.addEventListener("DOMContentLoaded", () => {
  initGuard();
  initNav();
  initCountUp();
  initMap();
  initFadeIn();
  initPagetop();
});
