'use strict';

const reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

/* ---------------------------------------------
   1. メインビジュアルのスライダー（5秒ごとにフェード）
--------------------------------------------- */
const slides = document.querySelectorAll('.mv__slide');
const dots = document.querySelectorAll('.mv__dots button');
let current = 0;
let timer;

function showSlide(index) {
    slides[current].classList.remove('is-active');
    dots[current].classList.remove('is-active');
    current = index;
    slides[current].classList.add('is-active');
    dots[current].classList.add('is-active');
}

function startSlider() {
    timer = setInterval(() => {
        showSlide((current + 1) % slides.length);
    }, 5000);
}

dots.forEach((dot, i) => {
    dot.addEventListener('click', () => {
        clearInterval(timer);
        showSlide(i);
        startSlider();
    });
});

startSlider();

/* ---------------------------------------------
   2. スマホメニュー：リンクを押したら閉じる
--------------------------------------------- */
const navToggle = document.getElementById('nav-toggle');

document.querySelectorAll('.gnav a').forEach((link) => {
    link.addEventListener('click', () => {
        navToggle.checked = false;
    });
});

/* ---------------------------------------------
   3. 先生紹介のカルーセル
   SP：1人ずつ真ん中に／タブレット：2人表示／PC：3人表示で2人ずつ進む
   6秒ごとに自動で進み、指でスワイプ・矢印・ドットでも動かせる
--------------------------------------------- */
const viewport = document.querySelector('.staff__viewport');
const cards = [...document.querySelectorAll('.staff__list li')];
const dotsBox = document.querySelector('.staff__dots');
const prevBtn = document.querySelector('.staff__arrow--prev');
const nextBtn = document.querySelector('.staff__arrow--next');
let staffIndex = 0;
let staffTimer;

// 画面幅ごとの「一度に見える人数」と「進む人数」
function staffSetting() {
    if (window.matchMedia('(min-width: 960px)').matches) {
        return { show: 3, step: 2 };
    }
    if (window.matchMedia('(min-width: 600px)').matches) {
        return { show: 2, step: 2 };
    }
    return { show: 1, step: 1 };
}

// 止まれる位置（左端に来る先生の番号）の一覧
function stops() {
    const { show, step } = staffSetting();
    const last = cards.length - show;
    const list = [];
    for (let i = 0; i < last; i += step) {
        list.push(i);
    }
    list.push(last);
    return list;
}

function makeDots() {
    dotsBox.innerHTML = '';
    stops().forEach((stop, i) => {
        const dot = document.createElement('button');
        dot.setAttribute('aria-label', `${i + 1}つ目へ`);
        dot.addEventListener('click', () => goTo(stop));
        dotsBox.appendChild(dot);
    });
}

function scrollLeftFor(index) {
    const card = cards[index];
    if (staffSetting().show === 1) {
        // SPはカードを真ん中に
        return card.offsetLeft - (viewport.clientWidth - card.offsetWidth) / 2;
    }
    return card.offsetLeft - cards[0].offsetLeft;
}

// ゆっくり（0.9秒かけて）横に動かす
function goTo(index) {
    const start = viewport.scrollLeft;
    const end = Math.min(scrollLeftFor(index), viewport.scrollWidth - viewport.clientWidth);
    if (reduceMotion) {
        viewport.scrollLeft = end;
        return;
    }
    const duration = 900;
    const startTime = performance.now();
    viewport.style.scrollSnapType = 'none';

    function step(now) {
        const t = Math.min((now - startTime) / duration, 1);
        const ease = t < 0.5 ? 2 * t * t : 1 - Math.pow(-2 * t + 2, 2) / 2;
        viewport.scrollLeft = start + (end - start) * ease;
        if (t < 1) {
            requestAnimationFrame(step);
        } else {
            viewport.style.scrollSnapType = '';
        }
    }
    requestAnimationFrame(step);
}

// スクロール位置から、今どの先生が見えているかを調べて表示を更新
function updateStaff() {
    let nearest = 0;
    cards.forEach((card, i) => {
        if (Math.abs(scrollLeftFor(i) - viewport.scrollLeft) < Math.abs(scrollLeftFor(nearest) - viewport.scrollLeft)) {
            nearest = i;
        }
    });
    staffIndex = nearest;
    cards.forEach((card, i) => card.classList.toggle('is-current', i === nearest));

    const list = stops();
    let active = 0;
    list.forEach((stop, i) => {
        if (stop <= nearest) {
            active = i;
        }
    });
    [...dotsBox.children].forEach((dot, i) => dot.classList.toggle('is-active', i === active));
}

function nextStaff() {
    const list = stops();
    const next = list.find((stop) => stop > staffIndex);
    goTo(next === undefined ? 0 : next);
}

function prevStaff() {
    const list = stops();
    const prev = [...list].reverse().find((stop) => stop < staffIndex);
    goTo(prev === undefined ? list[list.length - 1] : prev);
}

function startStaff() {
    stopStaff();
    if (!reduceMotion) {
        staffTimer = setInterval(nextStaff, 6000);
    }
}

function stopStaff() {
    clearInterval(staffTimer);
}


nextBtn.addEventListener('click', () => { nextStaff(); startStaff(); });
prevBtn.addEventListener('click', () => { prevStaff(); startStaff(); });
viewport.addEventListener('scroll', updateStaff, { passive: true });

// 触っている間・マウスが乗っている間は自動で進まない
viewport.addEventListener('pointerenter', stopStaff);
viewport.addEventListener('pointerleave', startStaff);
viewport.addEventListener('touchstart', stopStaff, { passive: true });
viewport.addEventListener('touchend', startStaff);

// 画面に見えている間だけ自動で進める
new IntersectionObserver((entries) => {
    entries[0].isIntersecting ? startStaff() : stopStaff();
}).observe(viewport);

window.addEventListener('resize', () => {
    makeDots();
    updateStaff();
});

makeDots();
updateStaff();

/* ---------------------------------------------
   4. スクロールで下からふわっと表示
--------------------------------------------- */
if (!reduceMotion) {
    document.documentElement.classList.add('js-anim');

    const targets = document.querySelectorAll(
        '.hd, .new-school__main, .about__main, .si__main, .si__note, .count, .bus, .access__wrap, ' +
        '.policy li, .lesson__list li, .timeline li, .season li, .gallery li, .service__list li, .contact__item, .topics__list li'
    );

    const fadeObserver = new IntersectionObserver((entries) => {
        entries.forEach((entry) => {
            if (entry.isIntersecting) {
                entry.target.classList.add('is-show');
                fadeObserver.unobserve(entry.target);
            }
        });
    }, { rootMargin: '0px 0px -10% 0px' });

    targets.forEach((target) => {
        // 並んでいるカードは少しずつ遅らせて順番に出す
        const index = [...target.parentElement.children].indexOf(target);
        if (target.tagName === 'LI') {
            target.style.transitionDelay = `${(index % 4) * 0.1}s`;
        }
        target.classList.add('fade');
        fadeObserver.observe(target);
    });
}
