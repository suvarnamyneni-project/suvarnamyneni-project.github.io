/**
 * Laptop glass as fractions of the painting (0–1), not pixels.
 * Wide is the 16:9 desk. Stack is the 9:16 phone painting.
 * The panel is a child of the same transformed scene as the image,
 * placed with these fractions of the rendered cover box.
 */
const GLASS_WIDE = { x: 0.46, y: 0.436, w: 0.108, h: 0.138 };
const GLASS_STACK = { x: 0.33, y: 0.54, w: 0.34, h: 0.075 };
const SCREEN_TOP_WIDE = GLASS_WIDE.y;
const SCREEN_TOP_STACK = GLASS_STACK.y;

const ZOOM_SCREENS = { desktop: 1.35, mobile: 0.85 };
const MOBILE_QUERY = "(max-width: 759px)";

const reduceMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;

function clamp01(t) {
  return t < 0 ? 0 : t > 1 ? 1 : t;
}

function smoothstep(edge0, edge1, value) {
  const t = clamp01((value - edge0) / (edge1 - edge0));
  return t * t * (3 - 2 * t);
}

function initLenis() {
  if (reduceMotion || !window.Lenis || !window.gsap) return null;
  const lenis = new window.Lenis({
    autoRaf: false,
    lerp: 0.1,
    smoothWheel: true,
    syncTouch: false,
    anchors: false,
    wheelMultiplier: 0.8,
  });
  lenis.on("scroll", window.ScrollTrigger.update);
  if (window.ScrollTrigger && window.ScrollTrigger.scrollerProxy) {
    window.ScrollTrigger.scrollerProxy(document.documentElement, {
      scrollTop(value) {
        if (arguments.length) lenis.scrollTo(value, { immediate: true });
        return lenis.scroll;
      },
      getBoundingClientRect() {
        return { top: 0, left: 0, width: window.innerWidth, height: window.innerHeight };
      },
    });
  }
  window.gsap.ticker.add((time) => {
    lenis.raf(time * 1000);
  });
  window.gsap.ticker.lagSmoothing(0);
  window.deskLenis = lenis;
  return lenis;
}

function initReveals() {
  if (reduceMotion || !("IntersectionObserver" in window)) {
    document.querySelectorAll(".reveal").forEach((el) => el.classList.add("is-visible"));
    return;
  }

  const observer = new IntersectionObserver(
    (entries) => {
      entries.forEach((entry) => {
        if (!entry.isIntersecting) return;
        entry.target.classList.add("is-visible");
        observer.unobserve(entry.target);
      });
    },
    { threshold: 0.16, rootMargin: "0px 0px -8% 0px" }
  );

  document.querySelectorAll(".reveal").forEach((el) => observer.observe(el));
}

function initTilt() {
  const fine = window.matchMedia("(hover: hover) and (pointer: fine)").matches;
  if (!fine || reduceMotion) return;

  document.querySelectorAll("#work .project").forEach((card) => {
    let frame = 0;
    let point = null;

    const paint = (px, py) => {
      const rise = getComputedStyle(card).getPropertyValue("--rise").trim() || "0px";
      const lift = getComputedStyle(card).getPropertyValue("--lift").trim() || "0px";
      card.style.transform = `perspective(900px) rotateX(${(-py * 3.2).toFixed(2)}deg) rotateY(${(px * 4.2).toFixed(2)}deg) translateY(calc(-6px + ${rise} + ${lift}))`;
    };

    card.addEventListener("pointermove", (event) => {
      point = { x: event.clientX, y: event.clientY };
      if (frame) return;
      frame = requestAnimationFrame(() => {
        frame = 0;
        if (!point) return;
        const rect = card.getBoundingClientRect();
        const px = (point.x - rect.left) / rect.width - 0.5;
        const py = (point.y - rect.top) / rect.height - 0.5;
        paint(px, py);
      });
    });

    card.addEventListener("pointerleave", () => {
      point = null;
      card.style.transform = "";
    });
  });
}

function initNavState() {
  const links = [...document.querySelectorAll(".nav-menu a, .nav-contact")];
  const sections = links
    .map((link) => {
      const href = link.getAttribute("href") || "";
      if (!href.startsWith("#")) return null;
      return document.querySelector(href);
    })
    .filter(Boolean);

  if (!("IntersectionObserver" in window)) return;

  const visible = new Map();
  const observer = new IntersectionObserver(
    (entries) => {
      entries.forEach((entry) => {
        visible.set(entry.target.id, entry.isIntersecting ? entry.intersectionRatio : 0);
      });
      let current = "";
      let best = 0;
      visible.forEach((ratio, id) => {
        if (ratio > best) {
          best = ratio;
          current = id;
        }
      });
      links.forEach((link) => {
        const on = link.getAttribute("href") === `#${current}`;
        if (on) link.setAttribute("aria-current", "true");
        else link.removeAttribute("aria-current");
      });
    },
    { threshold: [0.25, 0.5, 0.75], rootMargin: "-20% 0px -40% 0px" }
  );

  sections.forEach((section) => observer.observe(section));
}

function buildUnfold() {
  const work = document.getElementById("work");
  const fit = document.getElementById("unfold-fit");
  if (!work || !fit || fit.childElementCount) return;
  const clone = work.cloneNode(true);
  clone.removeAttribute("id");
  clone.querySelectorAll("[id]").forEach((el) => {
    el.id = `unfold-${el.id}`;
  });
  if (clone.hasAttribute("aria-labelledby")) {
    clone.setAttribute("aria-labelledby", "unfold-work-heading");
  }
  clone.querySelectorAll(".reveal").forEach((el) => el.classList.add("is-visible"));
  clone.querySelectorAll("a, button").forEach((el) => {
    el.setAttribute("tabindex", "-1");
  });
  fit.appendChild(clone);
}

function riseFor(settle, index, total) {
  const lag = total <= 1 ? 0 : (index / (total - 1)) * 0.45;
  const span = Math.max(0.2, 1 - lag);
  const local = clamp01((settle - lag) / span);
  const eased = 1 - (1 - local) ** 3;
  return (1 - eased) * 40;
}

function settleCards(workTop, viewport) {
  const settle = clamp01((viewport * 1.35 - workTop) / (viewport * 1.2));
  const cards = [...document.querySelectorAll("#work .project")];
  cards.forEach((card, index) => {
    card.style.setProperty("--rise", `${riseFor(settle, index, cards.length).toFixed(2)}px`);
  });
  document.querySelectorAll("#unfold-plane .project").forEach((card) => {
    card.style.setProperty("--rise", "0px");
  });
}

function initZoom() {
  const hero = document.querySelector(".hero-stage");
  const scene = document.querySelector(".scene");
  const heroImg = document.querySelector(".scene img");
  const copy = document.querySelector(".hero-copy");
  const pill = document.querySelector(".scroll-pill");
  const plane = document.getElementById("unfold-plane");
  const fit = document.getElementById("unfold-fit");
  const picture = scene ? scene.querySelector("picture") : null;
  const spacer = document.querySelector(".hero-spacer");
  const header = document.querySelector(".site-header");
  const work = document.getElementById("work");

  if (!hero || !window.gsap || !window.ScrollTrigger) return;

  const gsap = window.gsap;
  gsap.registerPlugin(window.ScrollTrigger);

  let metrics = null;
  let zoomLight = false;
  let workSolid = false;
  let progress = 0;
  let imageAspect = 16 / 9;

  function isMobile() {
    return window.matchMedia(MOBILE_QUERY).matches;
  }

  function syncHeader() {
    header.classList.toggle("is-solid", zoomLight || workSolid);
  }

  function measure() {
    const mobile = isMobile();
    const screens = mobile ? ZOOM_SCREENS.mobile : ZOOM_SCREENS.desktop;
    document.documentElement.style.setProperty("--vh", `${window.innerHeight}px`);
    spacer.style.height = `${(screens + 1) * window.innerHeight}px`;

    const width = hero.clientWidth;
    const height = hero.clientHeight;
    let imageWidth;
    let imageHeight;
    if (width / height > imageAspect) {
      imageWidth = width;
      imageHeight = width / imageAspect;
    } else {
      imageHeight = height;
      imageWidth = height * imageAspect;
    }

    const frac = heroImg.naturalHeight > heroImg.naturalWidth ? GLASS_STACK : GLASS_WIDE;
    const nw = heroImg.naturalWidth || imageWidth;
    const nh = heroImg.naturalHeight || imageHeight;
    const cover = Math.max(imageWidth / nw, imageHeight / nh);
    const drawW = nw * cover;
    const drawH = nh * cover;
    const ox = (imageWidth - drawW) / 2;
    const oy = (imageHeight - drawH) / 2;
    const screenX = ox + drawW * frac.x;
    const screenY = oy + drawH * frac.y;
    const screenW = drawW * frac.w;
    const screenH = drawH * frac.h;
    metrics = {
      width,
      height,
      imageWidth,
      imageHeight,
      frac,
      screenX,
      screenY,
      screenW,
      screenH,
      scaleToFit: Math.min(width / screenW, height / screenH),
      screens,
      copyTop: copy.getBoundingClientRect().top - hero.getBoundingClientRect().top,
      copyBottom: copy.getBoundingClientRect().bottom - hero.getBoundingClientRect().top,
      copyLeft: copy.getBoundingClientRect().left - hero.getBoundingClientRect().left,
      pillTop: pill.getBoundingClientRect().top - hero.getBoundingClientRect().top,
    };

    scene.style.width = `${imageWidth}px`;
    scene.style.height = `${imageHeight}px`;
  }

  function placePanel() {
    if (!plane || !fit || !metrics) return;
    const slot = plane.parentElement;
    slot.style.left = `${metrics.screenX}px`;
    slot.style.top = `${metrics.screenY}px`;
    slot.style.width = `${metrics.screenW}px`;
    slot.style.height = `${metrics.screenH}px`;
    slot.style.right = "auto";
    slot.style.bottom = "auto";
    plane.style.transform = "none";
    plane.dataset.gx = String(metrics.frac.x);
    plane.dataset.gy = String(metrics.frac.y);
    plane.dataset.gw = String(metrics.frac.w);
    plane.dataset.gh = String(metrics.frac.h);
    if (!fit.childElementCount) buildUnfold();
    fit.style.width = `${metrics.width}px`;
    fit.style.height = `${metrics.height}px`;
    fit.style.transformOrigin = "0 0";
    fit.style.transform = `scale(${metrics.screenW / metrics.width}, ${metrics.screenH / metrics.height})`;
  }

  function applyUnfold(amount, workTop) {
    if (!plane || !metrics) return;
    placePanel();
    let handoff = 1;
    const covered = Boolean(work) && workTop < metrics.height * 0.62;
    hero.classList.toggle("is-handed", covered && amount > 0.2);
    if (covered && amount > 0.2) {
      plane.style.opacity = "0";
      plane.style.visibility = "hidden";
      return;
    }
    if (amount > 0.9 && work) {
      handoff = smoothstep(metrics.height * 0.72, metrics.height * 0.98, workTop);
    }
    plane.style.opacity = handoff.toFixed(3);
    plane.style.visibility = handoff < 0.02 ? "hidden" : "visible";
  }

  function applyZoom(amount) {
    if (!metrics) return;
    const workTop = work ? work.getBoundingClientRect().top : metrics.height;
    progress = amount;
    window.deskZoom = amount;
    hero.dataset.zoom = amount.toFixed(3);
    document.documentElement.classList.toggle("is-zooming", amount > 0.04);
    hero.classList.toggle("is-unfolding", amount > 0.22);

    const mobile = isMobile();
    const eased = 0.5 - Math.cos(Math.PI * clamp01(amount)) / 2;
    /* One transform on the scene. Origin stays at 0,0 so the glass
       fractions are not translated a second time. */
    const S = Math.max(metrics.scaleToFit, 1);
    const sc = Math.pow(S, eased);
    const restX = (metrics.width - metrics.imageWidth) / 2;
    const cx = metrics.screenX + metrics.screenW / 2;
    const cy = metrics.screenY + metrics.screenH / 2;
    const move = (sc - 1) / (S - 1 || 1);
    const panX = restX + (metrics.width / 2 - cx * S - restX) * move;
    const panY = (metrics.height / 2 - cy * S) * move;
    scene.style.transformOrigin = "0px 0px";
    scene.style.transform = `translate3d(${panX.toFixed(2)}px, ${panY.toFixed(2)}px, 0) scale(${sc.toFixed(4)})`;

    if (amount < 0.02) {
      copy.style.opacity = "";
      copy.style.pointerEvents = "";
      pill.style.opacity = "";
      pill.style.pointerEvents = "";
    } else {
      const copyFade = 1 - smoothstep(0.05, mobile ? 0.34 : 0.24, amount);
      const pillFade = 1 - smoothstep(0, 0.16, amount);
      copy.style.opacity = String(copyFade);
      copy.style.pointerEvents = copyFade < 0.15 ? "none" : "";
      pill.style.opacity = String(pillFade);
      pill.style.pointerEvents = pillFade < 0.15 ? "none" : "";
    }

    if (picture) picture.style.opacity = String(1 - smoothstep(0.88, 1, amount));
    applyUnfold(amount, workTop);
    if (work) settleCards(workTop, metrics.height);

    zoomLight = mobile ? amount > 0.5 : amount > 0.74;
    syncHeader();
    if (amount < 0.04 && window.placeHeroSpots) window.placeHeroSpots();
  }

  function readAspect() {
    if (heroImg.naturalWidth && heroImg.naturalHeight) {
      imageAspect = heroImg.naturalWidth / heroImg.naturalHeight;
    }
  }

  readAspect();
  measure();
  applyZoom(0);

  const syncZoom = (self) => {
    const zoomPortion = metrics.screens / (metrics.screens + 1);
    applyZoom(Math.min(1, self.progress / zoomPortion));
  };

  window.ScrollTrigger.create({
    trigger: spacer,
    start: "top top",
    end: "bottom top",
    scrub: true,
    invalidateOnRefresh: true,
    onUpdate: syncZoom,
    onRefresh: syncZoom,
  });

  window.ScrollTrigger.create({
    trigger: "#work",
    start: "top 70%",
    onEnter: () => {
      workSolid = true;
      syncHeader();
    },
    onLeaveBack: () => {
      workSolid = false;
      syncHeader();
    },
  });

  window.ScrollTrigger.create({
    trigger: "#work",
    start: "top 98%",
    onEnter: () => hero.setAttribute("inert", ""),
    onEnterBack: () => hero.setAttribute("inert", ""),
    onLeaveBack: () => hero.removeAttribute("inert"),
  });

  let resizeFrame = 0;
  window.addEventListener("resize", () => {
    if (resizeFrame) cancelAnimationFrame(resizeFrame);
    resizeFrame = requestAnimationFrame(() => {
      resizeFrame = 0;
      measure();
      applyZoom(progress);
      window.ScrollTrigger.refresh();
    });
  });

  heroImg.addEventListener("load", () => {
    readAspect();
    measure();
    applyZoom(progress);
    window.ScrollTrigger.refresh();
  });

  if (document.fonts && document.fonts.ready) {
    document.fonts.ready.then(() => {
      measure();
      applyZoom(progress);
      window.ScrollTrigger.refresh();
    });
  }

  if (location.hash) {
    const settleHash = () => {
      const target = document.querySelector(location.hash);
      if (!target && location.hash !== "#top") return;
      if (location.hash === "#top") window.scrollTo(0, 0);
      else if (window.deskLenis) window.deskLenis.scrollTo(target, { immediate: true, force: true });
      else target.scrollIntoView();
      if (window.ScrollTrigger) window.ScrollTrigger.update();
    };
    requestAnimationFrame(() => {
      settleHash();
      requestAnimationFrame(() => {
        if (window.ScrollTrigger) window.ScrollTrigger.refresh();
        settleHash();
      });
    });
  }
}

function fitStackSky() {
  if (!document.documentElement.classList.contains("is-stack")) return;
  const shift = document.querySelector(".scene-shift");
  const copy = document.querySelector(".hero-copy");
  const img = document.querySelector(".scene img");
  const hero = document.querySelector(".hero-stage");
  if (!shift || !copy || !img || !hero) return;
  shift.style.transform = "none";
  const heroRect = hero.getBoundingClientRect();
  const elW = img.offsetWidth || heroRect.width;
  const elH = img.offsetHeight || heroRect.height;
  const nw = img.naturalWidth || 2400;
  const nh = img.naturalHeight || 1350;
  const cover = Math.max(elW / nw, elH / nh);
  const drawH = nh * cover;
  const narrow = window.matchMedia("(max-width: 600px)").matches;
  const screenLine = narrow ? SCREEN_TOP_STACK : SCREEN_TOP_WIDE;
  const screenTop = (elH - drawH) / 2 + drawH * screenLine;
  const copyBottom = copy.getBoundingClientRect().bottom - heroRect.top;
  if (screenTop < 40) return;
  const gap = Math.max(10, heroRect.height * 0.02);
  const needed = (copyBottom + gap) / screenTop;
  const scale = Math.max(1, Math.min(needed, 1.8));
  shift.style.transformOrigin = "50% 0";
  shift.style.transform = `scale(${scale.toFixed(3)})`;
  if (window.placeHeroSpots) window.placeHeroSpots();
}

initLenis();
if (window.mountRound2) window.mountRound2();
initReveals();
initTilt();
initNavState();
let resizeSky = 0;
fitStackSky();
window.addEventListener("resize", () => {
  if (resizeSky) cancelAnimationFrame(resizeSky);
  resizeSky = requestAnimationFrame(fitStackSky);
});
if (document.fonts && document.fonts.ready) document.fonts.ready.then(fitStackSky);

if (!reduceMotion && document.documentElement.classList.contains("has-zoom")) {
  initZoom();
}
if (window.bindRound2) window.bindRound2();
