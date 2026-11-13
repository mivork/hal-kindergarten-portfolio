"use strict";

/* ==========================================================
   効果音（Web Audio API で音を作るので、音のファイルはいらない）
   ・最初は OFF。左下の「おと」ボタンで ON にしたときだけ鳴らす
   ・音はひよこ：ボタンを押すと「ぴよぴよ」、カードにのると「ぴっ」
========================================================== */
const sound = {
  enabled: false,
  context: null,

  // ブラウザは「人が操作したあと」でないと音を出せないので、ON にしたときに準備する
  getContext() {
    if (!this.context) {
      const AudioContext = window.AudioContext || window.webkitAudioContext;
      if (!AudioContext) return null;
      this.context = new AudioContext();
    }
    return this.context;
  },

  // ひよこの「ぴよっ」：高い音をすばやく上げてから下げる（1回分）
  chirp({ base = 2400, peak = 3600, time = 0.1, volume = 0.12, delay = 0 } = {}) {
    if (!this.enabled) return;
    const ctx = this.getContext();
    if (!ctx) return;

    const start = ctx.currentTime + delay;
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();

    osc.type = "sine";
    osc.frequency.setValueAtTime(base, start);
    osc.frequency.linearRampToValueAtTime(peak, start + time * 0.3);       // 「ぴ」で上がって
    osc.frequency.exponentialRampToValueAtTime(base * 0.9, start + time); // 「よ」で下がる

    gain.gain.setValueAtTime(0.0001, start);
    gain.gain.exponentialRampToValueAtTime(volume, start + 0.012);
    gain.gain.setValueAtTime(volume, start + time * 0.6);
    gain.gain.exponentialRampToValueAtTime(0.0001, start + time);

    osc.connect(gain).connect(ctx.destination);
    osc.start(start);
    osc.stop(start + time + 0.02);
  },

  // ボタンを押したとき：「ぴよぴよ」
  pop() {
    this.chirp({ delay: 0 });
    this.chirp({ base: 2600, peak: 3800, delay: 0.13 });
  },

  // カードにのったとき：小さく「ぴっ」
  piko() {
    this.chirp({ base: 2800, peak: 3600, time: 0.06, volume: 0.05 });
  },

  // ON にしたとき：「ぴよぴよぴよ♪」（だんだん高く）
  chime() {
    [2200, 2500, 2850].forEach((hz, i) => {
      this.chirp({ base: hz, peak: hz * 1.45, time: 0.11, volume: 0.11, delay: i * 0.15 });
    });
  },
};

function initSound() {
  const toggle = document.querySelector(".sound-toggle");
  if (!toggle) return;
  const icon = toggle.querySelector(".material-symbols-rounded");
  const text = toggle.querySelector(".sound-toggle__text");

  const render = () => {
    toggle.setAttribute("aria-pressed", String(sound.enabled));
    icon.textContent = sound.enabled ? "volume_up" : "volume_off";
    text.textContent = sound.enabled ? "おと ON" : "おと OFF";
  };

  // 前に ON にしていたら、その設定を覚えておく（使えないブラウザでも動くように try）
  try {
    sound.enabled = localStorage.getItem("haru-sound") === "on";
  } catch (e) {
    sound.enabled = false;
  }
  render();

  toggle.addEventListener("click", () => {
    sound.enabled = !sound.enabled;
    try {
      localStorage.setItem("haru-sound", sound.enabled ? "on" : "off");
    } catch (e) {
      /* 保存できなくても音の ON/OFF はできる */
    }
    render();
    if (sound.enabled) {
      sound.getContext()?.resume();
      sound.chime();
    }
  });

  // SPでは少しスクロールしてから出す（CSSで PC は常に表示）
  window.addEventListener("scroll", () => {
    toggle.classList.toggle("is-show", window.scrollY > 600);
  }, { passive: true });

  // ボタン・リンクを押したら「ぴよぴよ」
  document.addEventListener("click", (event) => {
    if (event.target.closest(".sound-toggle")) return;
    if (event.target.closest(".button, .more, .nav__link, .fixed-cta__link, .side-tab, .header__toggle, .pagetop, .card, .topics__link")) {
      sound.pop();
    }
  });

  // カードやアイコンにのったら「ぴっ」（マウスのときだけ）
  document.querySelectorAll(".lesson, .entry__item, .contact__item, .si__step, .point").forEach((el) => {
    el.addEventListener("pointerenter", (event) => {
      if (event.pointerType === "mouse") sound.piko();
    });
  });
}

document.addEventListener("DOMContentLoaded", initSound);
