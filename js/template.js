"use strict";

/* ==========================================================
   ナビゲーション・コピーライト一括管理（WD27_05 template.js の書き方）
   ヘッダー・SPメニュー・フッターで同じリンクを使うので、
   データを1か所にまとめ、Vue のコンポーネントで書き出す
========================================================== */

// ■ メインコンテンツ（オリエンテーションシートのナビゲーション）
const mainLinks = [
  { href: "#", label: "園からのお知らせ" },
  { href: "#", label: "新園舎ニュース" },
  { href: "#", label: "今日の幼稚園" },
  { href: "#", label: "幼稚園での生活" },
  { href: "#", label: "展覧会・コンクール作品紹介" },
  { href: "#", label: "ハル幼稚園の教育" },
  { href: "#", label: "ハル幼稚園について" },
];

// ■ サブコンテンツ（入園のご案内・資料請求は課題の指定どおり外部ページへ別タブ）
const subLinks = [
  { href: "https://www.hal.ac.jp/tokyo", label: "入園のご案内", external: true },
  { href: "#", label: "求人情報" },
  { href: "https://www.hal.ac.jp/tokyo", label: "資料請求", external: true },
  { href: "#", label: "2才英才教育のご案内" },
];

// ■ サブナビ：置く場所ごとに class と「出さない項目」を変えられる
const subNavigation = {
  props: {
    listClass: { type: String, default: "" },
    linkClass: { type: String, default: "" },
    skip: { type: String, default: "" },
  },
  computed: {
    links() {
      return subLinks.filter((link) => link.label !== this.skip);
    },
  },
  template: `
<ul :class="listClass">
  <li v-for="link in links" :key="link.label">
    <a :href="link.href" :class="linkClass" :target="link.external ? '_blank' : null" :rel="link.external ? 'noopener' : null">{{ link.label }}</a>
  </li>
</ul>
  `,
};

// ■ ヘッダー上の帯
const utilApp = Vue.createApp({});
utilApp.component("sub-navigation-template", subNavigation);
utilApp.mount("#util-navigation");

// ■ ヘッダーナビゲーション（SPではメニューの中）
const headerApp = Vue.createApp({});
headerApp.component("header-navigation-template", {
  data() {
    return { links: mainLinks };
  },
  template: `
<ul class="nav__list">
  <li class="nav__item" v-for="link in links" :key="link.label">
    <a :href="link.href" class="nav__link">{{ link.label }}</a>
  </li>
</ul>
  `,
});
headerApp.component("sub-navigation-template", subNavigation);
headerApp.mount("#main-navigation");

// ■ フッターナビゲーション
const footerApp = Vue.createApp({});
footerApp.component("footer-navigation-template", {
  data() {
    return { links: mainLinks };
  },
  template: `
<ul class="footer__list">
  <li v-for="link in links" :key="link.label">
    <a :href="link.href">{{ link.label }}</a>
  </li>
</ul>
  `,
});
footerApp.component("sub-navigation-template", subNavigation);
footerApp.mount("#footer-navigation");

// ■ コピーライト（年は自動で今年に）
Vue.createApp({
  data() {
    return { year: new Date().getFullYear() };
  },
}).mount("#copyright");
