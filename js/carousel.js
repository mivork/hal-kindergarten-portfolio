"use strict";

/* ==========================================================
   メインビジュアルのカルーセル（WD27_05 carousel.js の書き方）
   5秒ごとに写真を切り替える。切り替えの見た目は CSS のフェード
========================================================== */
Vue.createApp({
  // Vue 3 では data は関数にしてオブジェクトを return する
  data() {
    return {
      currentSlide: 0,
      slides: [
        { img: "images/photo-16.webp", alt: "おいもほりで大きなおいもを持って笑う子どもたち", width: 1600, height: 1200 },
        { img: "images/photo-12.webp", alt: "原っぱをいっせいに走る子どもたち", width: 1600, height: 600 },
        { img: "images/photo-13.webp", alt: "ネット遊具にのぼって笑う子どもたち", width: 1600, height: 1067 },
      ],
    };
  },
  mounted() {
    // 動きを減らす設定のときは切り替えない
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;

    setInterval(() => {
      this.currentSlide = this.currentSlide < this.slides.length - 1 ? this.currentSlide + 1 : 0;
    }, 5000);
  },
}).mount("#mv-slider");
