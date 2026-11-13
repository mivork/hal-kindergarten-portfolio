"use strict";

/* ==========================================================
   読み上げ（音声ガイド）
   ・最初は OFF。右下（左下の効果音ボタンの上）の「読み上げ」で ON/OFF
   ・ON のとき、リンクやボタンにフォーカスしたりタップしたりすると、その名前を声で読む
   ・画面が見えにくい方・キーボードで操作する方向け
   ・ブラウザが読み上げに対応していなければボタンを出さない
========================================================== */
(() => {
  if (!("speechSynthesis" in window) || !("SpeechSynthesisUtterance" in window)) return;

  const toggle = document.querySelector(".speech-toggle");
  if (!toggle) return;
  const icon = toggle.querySelector(".material-symbols-rounded");
  const text = toggle.querySelector(".speech-toggle__text");

  let enabled = false;
  try {
    enabled = localStorage.getItem("haru-speech") === "on";
  } catch (e) {
    enabled = false;
  }

  const render = () => {
    toggle.setAttribute("aria-pressed", String(enabled));
    icon.textContent = enabled ? "record_voice_over" : "voice_over_off";
    text.textContent = enabled ? "読み上げ ON" : "読み上げ OFF";
  };

  // 読む内容：aria-label があればそれ、なければ表示されている文字
  const labelOf = (el) => {
    const label = el.getAttribute("aria-label") || el.textContent || "";
    const clean = label.replace(/\s+/g, " ").trim();
    if (el.matches('[href^="tel:"]')) return `${clean}、電話をかける リンク`;
    if (el.tagName === "A") return `${clean}、リンク`;
    return `${clean}、ボタン`;
  };

  const speak = (message) => {
    if (!message.trim()) return;
    window.speechSynthesis.cancel(); // 前の読み上げを止めてから読む
    const utterance = new SpeechSynthesisUtterance(message);
    utterance.lang = "ja-JP";
    utterance.rate = 1;
    window.speechSynthesis.speak(utterance);
  };

  const INTERACTIVE = "a[href], button, [role='button']";
  let lastRead = null;

  const readElement = (el) => {
    if (!enabled || !el || el === lastRead) return;
    if (el.closest(".speech-toggle")) return;
    lastRead = el;
    speak(labelOf(el));
  };

  // キーボードで移動したとき
  document.addEventListener("focusin", (event) => {
    const el = event.target instanceof Element ? event.target.closest(INTERACTIVE) : null;
    readElement(el);
  });

  // マウス・タッチで押したとき（同じものを続けて押しても読む）
  document.addEventListener("click", (event) => {
    if (!enabled) return;
    const el = event.target instanceof Element ? event.target.closest(INTERACTIVE) : null;
    if (!el || el.closest(".speech-toggle")) return;
    lastRead = null;
    speak(labelOf(el));
  });

  toggle.addEventListener("click", () => {
    enabled = !enabled;
    try {
      localStorage.setItem("haru-speech", enabled ? "on" : "off");
    } catch (e) {
      /* 保存できなくても ON/OFF はできる */
    }
    render();
    if (enabled) {
      speak("読み上げを開始します。リンクやボタンに触れると、その内容を読みます。");
    } else {
      window.speechSynthesis.cancel();
    }
  });

  toggle.hidden = false;
  render();
})();
