/**
 * Inner glass of the painted laptop, clockwise from the top left,
 * as fractions of the image (0–1). Wide is the 16:9 desk. Stack is
 * the 9:16 phone painting. The quad is slightly skewed, so the panel
 * is mapped onto it with a perspective matrix in the painting's own
 * coordinate space, then the scene's one scale moves both together.
 */
const GLASS_WIDE = [
  { x: 0.4638, y: 0.4426 },
  { x: 0.563, y: 0.4513 },
  { x: 0.5603, y: 0.5612 },
  { x: 0.4613, y: 0.5471 },
];
const GLASS_STACK = [
  { x: 0.412, y: 0.5285 },
  { x: 0.6049, y: 0.5372 },
  { x: 0.5986, y: 0.6054 },
  { x: 0.4085, y: 0.5967 },
];
const SCREEN_TOP_WIDE = 0.4426;
const SCREEN_TOP_STACK = 0.5285;

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

function solveHomography(src, dst) {
  const rows = [];
  for (let i = 0; i < 4; i += 1) {
    const { x, y } = src[i];
    const X = dst[i].x;
    const Y = dst[i].y;
    rows.push([x, y, 1, 0, 0, 0, -x * X, -y * X, X]);
    rows.push([0, 0, 0, x, y, 1, -x * Y, -y * Y, Y]);
  }
  const n = 8;
  for (let col = 0; col < n; col += 1) {
    let pivot = col;
    for (let r = col + 1; r < n; r += 1) {
      if (Math.abs(rows[r][col]) > Math.abs(rows[pivot][col])) pivot = r;
    }
    if (Math.abs(rows[pivot][col]) < 1e-8) return null;
    const swap = rows[col];
    rows[col] = rows[pivot];
    rows[pivot] = swap;
    const div = rows[col][col];
    for (let c = col; c <= n; c += 1) rows[col][c] /= div;
    for (let r = 0; r < n; r += 1) {
      if (r === col) continue;
      const factor = rows[r][col];
      if (!factor) continue;
      for (let c = col; c <= n; c += 1) rows[r][c] -= factor * rows[col][c];
    }
  }
  return rows.map((row) => row[n]);
}

function matrix3dFromQuad(width, height, quad) {
  const src = [
    { x: 0, y: 0 },
    { x: width, y: 0 },
    { x: width, y: height },
    { x: 0, y: height },
  ];
  const h = solveHomography(src, quad);
  if (!h) return "none";
  const [a, b, c, d, e, f, g, hh] = h;
  /* Perspective terms are ~1e-5. Five decimals zeroes them and
     shifts the far corners by a couple of pixels. */
  const num = (value) => {
    const digits = Math.abs(value) > 0 && Math.abs(value) < 0.01 ? 9 : 6;
    return value.toFixed(digits);
  };
  return `matrix3d(${num(a)}, ${num(d)}, 0, ${num(g)}, ${num(b)}, ${num(e)}, 0, ${num(hh)}, 0, 0, 1, 0, ${num(c)}, ${num(f)}, 0, 1)`;
}

function glassCornersFor(img) {
  if (img && img.naturalWidth && img.naturalHeight) {
    return img.naturalHeight > img.naturalWidth ? GLASS_STACK : GLASS_WIDE;
  }
  return window.matchMedia("(max-width: 600px)").matches ? GLASS_STACK : GLASS_WIDE;
}

function coverQuad(img, elW, elH) {
  const nw = (img && img.naturalWidth) || elW || 1;
  const nh = (img && img.naturalHeight) || elH || 1;
  const corners = glassCornersFor(img);
  const cover = Math.max(elW / nw, elH / nh);
  const drawW = nw * cover;
  const drawH = nh * cover;
  const ox = (elW - drawW) / 2;
  const oy = (elH - drawH) / 2;
  return {
    corners,
    quad: corners.map((corner) => ({
      x: ox + drawW * corner.x,
      y: oy + drawH * corner.y,
    })),
  };
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

    const { corners, quad } = coverQuad(heroImg, imageWidth, imageHeight);
    const xs = quad.map((point) => point.x);
    const ys = quad.map((point) => point.y);
    const screenX = Math.min(...xs);
    const screenY = Math.min(...ys);
    const screenW = Math.max(...xs) - screenX;
    const screenH = Math.max(...ys) - screenY;
    metrics = {
      width,
      height,
      imageWidth,
      imageHeight,
      corners,
      quad,
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
    if (!plane || !metrics) return;
    const slot = plane.parentElement;
    slot.style.left = "0px";
    slot.style.top = "0px";
    slot.style.right = "auto";
    slot.style.bottom = "auto";
    slot.style.width = `${metrics.width}px`;
    slot.style.height = `${metrics.height}px`;
    slot.style.transformOrigin = "0 0";
    slot.style.transform = matrix3dFromQuad(metrics.width, metrics.height, metrics.quad);
    plane.style.transform = "none";
    plane.dataset.glass = metrics.corners.map((corner) => `${corner.x},${corner.y}`).join(" ");
    if (fit) {
      fit.style.width = "100%";
      fit.style.height = "100%";
      fit.style.transform = "none";
      if (!fit.childElementCount) buildUnfold();
    }
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
  if (document.documentElement.classList.contains("is-editorial")) return;
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

function initRestGlass() {
  const hero = document.querySelector(".hero-stage");
  const img = document.querySelector(".scene img");
  const plane = document.getElementById("unfold-plane");
  const fit = document.getElementById("unfold-fit");
  if (!hero || !img || !plane) return;

  const place = () => {
    const elW = img.offsetWidth || hero.clientWidth;
    const elH = img.offsetHeight || hero.clientHeight;
    if (!elW || !elH) return;
    const { corners, quad } = coverQuad(img, elW, elH);
    const slot = plane.parentElement;
    slot.style.left = "0px";
    slot.style.top = "0px";
    slot.style.right = "auto";
    slot.style.bottom = "auto";
    slot.style.width = `${elW}px`;
    slot.style.height = `${elH}px`;
    slot.style.transformOrigin = "0 0";
    slot.style.transform = matrix3dFromQuad(elW, elH, quad);
    plane.style.transform = "none";
    plane.style.opacity = "1";
    plane.style.visibility = "visible";
    plane.dataset.glass = corners.map((corner) => `${corner.x},${corner.y}`).join(" ");
    if (fit) {
      fit.style.width = "100%";
      fit.style.height = "100%";
      fit.style.transform = "none";
      if (!fit.childElementCount) buildUnfold();
    }
  };

  place();
  img.addEventListener("load", place);
  window.addEventListener("resize", () => requestAnimationFrame(place));
  if (document.fonts && document.fonts.ready) document.fonts.ready.then(place);
}

if (!document.documentElement.classList.contains("is-editorial") && !reduceMotion && document.documentElement.classList.contains("has-zoom")) {
  initZoom();
} else if (!document.documentElement.classList.contains("is-editorial")) {
  initRestGlass();
}
if (window.bindRound2) window.bindRound2();
