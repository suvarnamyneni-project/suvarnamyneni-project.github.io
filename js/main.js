/**
 * Display glass on assets/art/hero, as percentages of the painting.
 * Corners run clockwise from the top left and follow the painted perspective.
 * At rest the painting fills the hero from the top and the headline sits in its sky.
 */
const SCREEN_CORNERS = [
  { x: 42.5, y: 19.44 },
  { x: 57.42, y: 20.51 },
  { x: 57.11, y: 36.67 },
  { x: 42.24, y: 35.05 },
];
const LAPTOP_SCREEN = { x: 42.5, y: 20.51, w: 14.61, h: 14.54 };

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
    lerp: 0.06,
    smoothWheel: true,
    syncTouch: false,
    anchors: false,
    wheelMultiplier: 0.8,
  });
  lenis.on("scroll", window.ScrollTrigger.update);
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
  const links = [...document.querySelectorAll(".site-nav a")];
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
  const num = (value) => Number(value.toFixed(8));
  return `matrix3d(${num(a)}, ${num(d)}, 0, ${num(g)}, ${num(b)}, ${num(e)}, 0, ${num(hh)}, 0, 0, 1, 0, ${num(c)}, ${num(f)}, 0, 1)`;
}

function buildUnfold() {
  const work = document.getElementById("work");
  const plane = document.getElementById("unfold-plane");
  if (!work || !plane || plane.childElementCount) return;
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
  plane.appendChild(clone);
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
  const spacer = document.querySelector(".hero-spacer");
  const header = document.querySelector(".site-header");
  const work = document.getElementById("work");

  if (!hero || !window.gsap || !window.ScrollTrigger) return;

  const gsap = window.gsap;
  gsap.registerPlugin(window.ScrollTrigger);
  buildUnfold();

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

    const screen = LAPTOP_SCREEN;
    metrics = {
      width,
      height,
      imageWidth,
      imageHeight,
      baseX: (width - imageWidth) / 2,
      baseY: (height - imageHeight) / 2,
      screenX: imageWidth * (screen.x + screen.w / 2) / 100,
      screenY: imageHeight * (screen.y + screen.h / 2) / 100,
      scaleToFill: Math.max(
        width / (imageWidth * screen.w / 100),
        height / (imageHeight * screen.h / 100)
      ) * 1.04,
      screens,
    };

    scene.style.width = `${imageWidth}px`;
    scene.style.height = `${imageHeight}px`;
  }

  function renderedScreenQuad() {
    const rect = heroImg.getBoundingClientRect();
    const nw = heroImg.naturalWidth;
    const nh = heroImg.naturalHeight;
    let left = rect.left;
    let top = rect.top;
    let drawW = rect.width;
    let drawH = rect.height;
    if (nw && nh && rect.width && rect.height) {
      const cover = Math.max(rect.width / nw, rect.height / nh);
      drawW = nw * cover;
      drawH = nh * cover;
      left = rect.left + (rect.width - drawW) / 2;
      top = rect.top + (rect.height - drawH) / 2;
    }
    const origin = hero.getBoundingClientRect();
    return SCREEN_CORNERS.map((corner) => ({
      x: left + drawW * (corner.x / 100) - origin.left,
      y: top + drawH * (corner.y / 100) - origin.top,
    }));
  }

  function applyUnfold(amount) {
    if (!plane || !metrics) return;
    const reveal = smoothstep(0.1, 0.28, amount);
    const quad = renderedScreenQuad();
    const planeW = plane.offsetWidth || metrics.width;
    const planeH = plane.offsetHeight || metrics.height;
    plane.style.transform = matrix3dFromQuad(planeW, planeH, quad);

    let handoff = 1;
    const workTop = work ? work.getBoundingClientRect().top : metrics.height;
    const covered = Boolean(work) && workTop < metrics.height * 0.62;
    hero.classList.toggle("is-handed", covered && amount > 0.2);
    if (covered && amount > 0.2) {
      plane.style.opacity = "0";
      plane.style.visibility = "hidden";
      return;
    }
    if (amount > 0.94 && work) {
      handoff = smoothstep(metrics.height * 0.7, metrics.height * 0.95, workTop);
    }
    const opacity = reveal * handoff;
    plane.style.opacity = opacity.toFixed(3);
    plane.style.visibility = opacity < 0.02 ? "hidden" : "visible";
  }

  function applyZoom(amount) {
    if (!metrics) return;
    progress = amount;
    window.deskZoom = amount;
    hero.dataset.zoom = amount.toFixed(3);
    document.documentElement.classList.toggle("is-zooming", amount > 0.04);
    hero.classList.toggle("is-unfolding", amount > 0.22);

    const mobile = isMobile();
    const eased = smoothstep(0, 1, amount);
    const target = mobile ? Math.min(metrics.scaleToFill, 1.45) : metrics.scaleToFill;
    /* The painting covers the hero from the top. Scale only enough that the
       headline sits in the painted sky, and stop before the desk objects
       fall off the left and right edges. */
    const copyBottom = copy.getBoundingClientRect().bottom - hero.getBoundingClientRect().top;
    const skyLine = SCREEN_CORNERS[0].y / 100;
    const skyScale = (copyBottom + 12) / (metrics.imageHeight * skyLine);
    const objectSpan = (77.6 - 22.5) / 100;
    const fitScale = metrics.width / (metrics.imageWidth * objectSpan);
    const restScale = Math.max(1, Math.min(skyScale, fitScale));
    const scale = restScale + (target - restScale) * eased;
    const restX = (metrics.width - metrics.imageWidth * restScale) / 2;
    const restY = 0;
    const zoomX = metrics.width / 2 - metrics.screenX * target;
    const zoomY = metrics.height / 2 - metrics.screenY * target;
    let x = restX + (zoomX - restX) * eased;
    let y = restY + (zoomY - restY) * eased;
    const minX = metrics.width - metrics.imageWidth * scale;
    const minY = metrics.height - metrics.imageHeight * scale;
    x = Math.min(0, Math.max(minX, x));
    y = Math.min(restY, Math.max(minY, y));

    scene.style.transform = `translate3d(${x.toFixed(2)}px, ${y.toFixed(2)}px, 0) scale(${scale.toFixed(4)})`;

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

    const sceneFade = 1 - smoothstep(0.78, 1, amount);
    scene.style.opacity = String(sceneFade);
    applyUnfold(amount);
    if (work) settleCards(work.getBoundingClientRect().top, metrics.height);

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

initLenis();
if (window.mountRound2) window.mountRound2();
initReveals();
initTilt();
initNavState();

if (!reduceMotion && document.documentElement.classList.contains("has-zoom")) {
  initZoom();
}
if (window.bindRound2) window.bindRound2();
