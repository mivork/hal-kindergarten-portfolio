"use strict";

/* ==========================================================
   読み上げ（音声ガイド）
   ・最初は OFF。右下（左下の効果音ボタンの上）の「読み上げ」で ON/OFF
   ・ON のとき、リンクやボタンにカーソルを合わせる（少し止める）・フォーカス・タップすると、その名前を声で読む
   ・読む前にひよこの「ぴっ」を鳴らす（効果音が ON のときだけ）
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

  // 読む内容：aria-label があればそれ、なければ表示されている文字
  const labelOf = (el) => {
    const label = el.getAttribute("aria-label") || el.textContent || "";
    const clean = label.replace(/\s+/g, " ").trim();
    if (el.matches('[href^="tel:"]')) return `${clean}、電話をかける リンク`;
    if (el.tagName === "A") return `${clean}、リンク`;
    return `${clean}、ボタン`;
  };

  // ナレーションの声の調整（数字を変えると声の雰囲気が変わる）
  const VOICE = {
    lang: "ja-JP",
    rate: 0.95,   // 速さ（1が標準・小さいほどゆっくり）
    pitch: 1.2,    // 高さ（1が標準・大きいほど高い声）
    volume: 1,     // 音量（0〜1）
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
    // 読み上げの前に、ひよこの「ぴっ」（効果音が ON のときだけ鳴る）
    sound.chirp({ base: 2800, peak: 3600, time: 0.06, volume: 0.06 });
    const utterance = new SpeechSynthesisUtterance(message);
    utterance.lang = VOICE.lang;
    utterance.rate = VOICE.rate;
    utterance.pitch = VOICE.pitch;
    utterance.volume = VOICE.volume;
    if (japaneseVoice) utterance.voice = japaneseVoice;
    window.speechSynthesis.speak(utterance);
  };

  const INTERACTIVE = "a[href], button, [role='button']";
  let lastRead = null;
  let hoverTimer = null;

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

  // カーソルを合わせたとき（少し止まってから読む。通り過ぎただけでは読まない）
  document.addEventListener("pointerover", (event) => {
    if (!enabled || event.pointerType !== "mouse") return;
    const el = event.target instanceof Element ? event.target.closest(INTERACTIVE) : null;
    clearTimeout(hoverTimer);
    if (!el || el.closest(".speech-toggle")) return;
    hoverTimer = setTimeout(() => {
      lastRead = null;
      speak(labelOf(el));
    }, 400);
  });

  document.addEventListener("pointerout", (event) => {
    if (event.pointerType !== "mouse") return;
    clearTimeout(hoverTimer);
  });

  // マウス・タッチで押したとき（同じものを続けて押しても読む）
  document.addEventListener("click", (event) => {
    if (!enabled) return;
    const el = event.target instanceof Element ? event.target.closest(INTERACTIVE) : null;
    if (!el || el.closest(".speech-toggle")) return;
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
      speak("読み上げを開始します。リンクやボタンに触れると、その内容を読みます。");
    } else {
      window.speechSynthesis.cancel();
    }
  });

  toggle.hidden = false;
  render();
})();
