"use strict";

/* ==========================================================
   読み上げ（音声ガイド）
   ・最初は OFF。左下の効果音ボタンの上の「読み上げ」で ON/OFF
   ・ON のとき、次のものを声で読む
     - リンク・ボタン：カーソルを合わせて少し止めたとき／キーボードで移ったとき／押したとき
     - 文章・見出し・項目（段落・見出し・リスト など）：カーソルを合わせて少し止めたとき
   ・アイコンの名前（arrow_forward など）は読まない
   ・声の調子は VOICE の数字で変えられる
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

  // ナレーションの声の調整（数字を変えると声の雰囲気が変わる）
  const VOICE = {
    lang: "ja-JP",
    rate: 0.95,  // 速さ（1が標準・小さいほどゆっくり）
    pitch: 1.2,  // 高さ（1が標準・大きいほど高い声）
    volume: 1,   // 音量（0〜1）
  };

  // 日本語の声があれば、その中から使う（端末によって無いこともある）
  let japaneseVoice = null;
  const pickVoice = () => {
    const voices = window.speechSynthesis.getVoices();
    japaneseVoice = voices.find((v) => v.lang === VOICE.lang) || voices.find((v) => v.lang.startsWith("ja")) || null;
  };
  pickVoice();
  window.speechSynthesis.addEventListener?.("voiceschanged", pickVoice);

  const speak = (message) => {
    if (!message.trim()) return;
    window.speechSynthesis.cancel(); // 前の読み上げを止めてから読む
    const utterance = new SpeechSynthesisUtterance(message);
    utterance.lang = VOICE.lang;
    utterance.rate = VOICE.rate;
    utterance.pitch = VOICE.pitch;
    utterance.volume = VOICE.volume;
    if (japaneseVoice) utterance.voice = japaneseVoice;
    window.speechSynthesis.speak(utterance);
  };

  // 読む対象：リンク・ボタン
  const INTERACTIVE = "a[href], button, [role='button']";
  // 読む対象：文章のかたまり（見出し・段落・リストの項目 など）
  const READABLE = "h1, h2, h3, h4, h5, h6, p, li, dt, dd, figcaption, blockquote, th, td, caption, summary";

  // 読み上げる文字：アイコンの名前（arrow_forward など）と、隠れている部分は除く
  const textOf = (el) => {
    const copy = el.cloneNode(true);
    copy.querySelectorAll('[aria-hidden="true"], .material-symbols-rounded, script, style, .speech-toggle').forEach((node) => node.remove());
    return copy.textContent.replace(/\s+/g, " ").trim();
  };

  const labelOf = (el) => {
    const label = el.getAttribute("aria-label");
    return (label || textOf(el)).replace(/\s+/g, " ").trim();
  };

  const isReadTarget = (el) => el && !el.closest(".speech-toggle, .sound-toggle");

  let lastRead = null;      // 最後に読んだ要素（同じものを続けて読まないため）
  let hoverTimer = null;
  let spokenHover = null;   // カーソルで読んだ要素

  const readElement = (el) => {
    if (!enabled || !isReadTarget(el) || el === lastRead) return;
    lastRead = el;
    speak(labelOf(el));
  };

  // キーボードで移動したとき（リンク・ボタン）
  document.addEventListener("focusin", (event) => {
    const el = event.target instanceof Element ? event.target.closest(INTERACTIVE) : null;
    readElement(el);
  });

  // カーソルを合わせたとき（少し止まってから読む。通り過ぎただけでは読まない）
  document.addEventListener("pointerover", (event) => {
    if (!enabled || event.pointerType !== "mouse") return;
    const target = event.target instanceof Element ? event.target : null;
    const el = target?.closest(`${INTERACTIVE}, ${READABLE}`);
    clearTimeout(hoverTimer);
    if (!isReadTarget(el) || el === spokenHover) return;
    hoverTimer = setTimeout(() => {
      spokenHover = el;
      lastRead = null;
      speak(labelOf(el));
    }, 400);
  });

  // カーソルが要素の外へ出たら、次に入ったときにまた読めるようにする
  document.addEventListener("pointerout", (event) => {
    if (event.pointerType !== "mouse") return;
    clearTimeout(hoverTimer);
    const next = event.relatedTarget instanceof Element ? event.relatedTarget : null;
    if (spokenHover && (!next || !spokenHover.contains(next))) {
      spokenHover = null;
    }
  });

  // 押したとき（同じものを続けて押しても読む）
  document.addEventListener("click", (event) => {
    if (!enabled) return;
    const el = event.target instanceof Element ? event.target.closest(INTERACTIVE) : null;
    if (!isReadTarget(el)) return;
    clearTimeout(hoverTimer);
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
      speak("読み上げ、オンです。");
    } else {
      clearTimeout(hoverTimer);
      window.speechSynthesis.cancel();
    }
  });

  toggle.hidden = false;
  render();
})();
