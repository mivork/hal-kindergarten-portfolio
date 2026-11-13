"use strict";

/* ==========================================================
   効果音（Web Audio API で音を作るので、音のファイルはいらない）
   ・最初は OFF。左下の「おと」ボタンで ON にしたときだけ鳴らす
   ・音はひよこ：ボタンを押したときだけ「ぴよ」。カーソルを合わせただけでは鳴らない
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

  // ボタンを押したとき：「ぴよ」（2音・毎回ほんの少しだけ高さを変えて、同じ音の繰り返しに聞こえないようにする）
  pop() {
    const wobble = () => 1 + (Math.random() - 0.5) * 0.08; // ±4%
    const a = wobble();
    const b = wobble();
    this.chirp({ base: 2300 * a, peak: 3300 * a, time: 0.09, volume: 0.13, delay: 0 });
    this.chirp({ base: 2900 * b, peak: 4000 * b, time: 0.12, volume: 0.1, delay: 0.09 });
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

  // ボタンを押したときだけ「ぴよ」（カーソルを合わせただけでは鳴らさない）
  document.addEventListener("click", (event) => {
    if (event.target.closest(".sound-toggle")) return;
    if (event.target.closest(".button, .header__cta, .fixed-cta__link, .side-tab, .header__toggle, .pagetop")) {
      sound.pop();
    }
  });
}

document.addEventListener("DOMContentLoaded", initSound);
