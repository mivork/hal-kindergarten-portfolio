"use strict";

/* ==========================================================
   効果音（Web Audio API で音を作るので、音のファイルはいらない）
   ・最初は OFF。左下の「おと」ボタンで ON にしたときだけ鳴らす
   ・音はオルゴール風の「ポロン」（デザインの、やさしい黄緑・オレンジの雰囲気に合わせた音）
   ・ボタンを押したときだけ鳴る。カーソルを合わせただけでは鳴らない
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

  // やさしいオルゴール風の「ポロン」（1音）：基音＋倍音を入れて、ぽろっと減衰する
  pluck({ freq = 659, volume = 0.12, delay = 0, length = 0.9 } = {}) {
    if (!this.enabled) return;
    const ctx = this.getContext();
    if (!ctx) return;

    const start = ctx.currentTime + delay;
    const master = ctx.createGain();
    master.gain.setValueAtTime(0.0001, start);
    master.gain.exponentialRampToValueAtTime(volume, start + 0.01);
    master.gain.exponentialRampToValueAtTime(0.0001, start + length);
    master.connect(ctx.destination);

    // 基音（やさしい音）と2倍音（少しきらっとした音）
    [[1, 1], [2, 0.25]].forEach(([ratio, level]) => {
      const osc = ctx.createOscillator();
      const g = ctx.createGain();
      osc.type = "sine";
      osc.frequency.setValueAtTime(freq * ratio, start);
      g.gain.setValueAtTime(level, start);
      osc.connect(g).connect(master);
      osc.start(start);
      osc.stop(start + length + 0.05);
    });
  },

  // 音階：ドレミソラ（ペンタトニック）。やさしい響きで、どの組み合わせでも外れにくい
  notes: [523.25, 587.33, 659.25, 783.99, 880.0], // C5 D5 E5 G5 A5

  // ボタンを押したとき：オルゴールの「ポロン」。音階の中からランダムに選ぶので、同じ音の繰り返しになりにくい
  pop() {
    const freq = this.notes[Math.floor(Math.random() * this.notes.length)];
    this.pluck({ freq, volume: 0.12 });
  },

  // ON にしたとき：オルゴールの分散和音（ドミソド・上がっていく）
  chime() {
    [523.25, 659.25, 783.99, 1046.5].forEach((freq, i) => {
      this.pluck({ freq, volume: 0.11, delay: i * 0.13, length: 1.1 });
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
