/**
 * Laptop screen as percentages of assets/hero-desk.jpg.
 * Retune this one box when the final illustration replaces the placeholder.
 * The placeholder is framed so the screen sits at about x 40–57, y 32–50.
 */
const LAPTOP_SCREEN = { x: 40, y: 32, w: 17, h: 18 };

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

  document.querySelectorAll(".project").forEach((card) => {
    let frame = 0;
    let point = null;

    card.addEventListener("pointermove", (event) => {
      point = { x: event.clientX, y: event.clientY };
      if (frame) return;
      frame = requestAnimationFrame(() => {
        frame = 0;
        if (!point) return;
        const rect = card.getBoundingClientRect();
        const px = (point.x - rect.left) / rect.width - 0.5;
        const py = (point.y - rect.top) / rect.height - 0.5;
        card.style.transform = `perspective(900px) rotateX(${(-py * 3.2).toFixed(2)}deg) rotateY(${(px * 4.2).toFixed(2)}deg) translateY(-6px)`;
      });
    });

    card.addEventListener("pointerleave", () => {
      point = null;
      card.style.transform = "";
    });
  });
}

function initNavState() {
  const header = document.querySelector(".site-header");
  const links = [...document.querySelectorAll(".site-nav a")];
  const sections = links
    .map((link) => document.querySelector(link.getAttribute("href")))
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

  return header;
}

function initZoom() {
  const hero = document.querySelector(".hero-stage");
  const scene = document.querySelector(".scene");
  const heroImg = document.querySelector(".scene img");
  const copy = document.querySelector(".hero-copy");
  const pill = document.querySelector(".scroll-pill");
  const veil = document.querySelector(".veil");
  const spacer = document.querySelector(".hero-spacer");
  const header = document.querySelector(".site-header");

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
      ),
      screens,
    };

    scene.style.width = `${imageWidth}px`;
    scene.style.height = `${imageHeight}px`;
  }

  function applyZoom(amount) {
    if (!metrics) return;
    progress = amount;
    hero.dataset.zoom = amount.toFixed(3);

    const mobile = isMobile();
    const eased = smoothstep(0, 1, amount);
    const target = mobile ? Math.min(metrics.scaleToFill, 1.45) : metrics.scaleToFill;
    const scale = 1 + (target - 1) * eased;
    const startX = metrics.baseX + metrics.screenX;
    const startY = metrics.baseY + metrics.screenY;
    const centerX = startX + (metrics.width / 2 - startX) * eased;
    const centerY = startY + (metrics.height / 2 - startY) * eased;
    let x = centerX - metrics.screenX * scale;
    let y = centerY - metrics.screenY * scale;
    const minX = metrics.width - metrics.imageWidth * scale;
    const minY = metrics.height - metrics.imageHeight * scale;
    x = Math.min(0, Math.max(minX, x));
    y = Math.min(0, Math.max(minY, y));

    scene.style.transform = `translate3d(${x.toFixed(2)}px, ${y.toFixed(2)}px, 0) scale(${scale.toFixed(4)})`;
    const copyFade = 1 - smoothstep(0.05, mobile ? 0.34 : 0.24, amount);
    const pillFade = 1 - smoothstep(0, 0.16, amount);
    copy.style.opacity = String(copyFade);
    copy.style.pointerEvents = copyFade < 0.15 ? "none" : "";
    pill.style.opacity = String(pillFade);
    pill.style.pointerEvents = pillFade < 0.15 ? "none" : "";
    veil.style.opacity = String(mobile ? smoothstep(0.34, 0.92, amount) : smoothstep(0.62, 0.92, amount));
    scene.style.opacity = mobile ? String(1 - smoothstep(0.45, 0.95, amount) * 0.55) : "1";

    zoomLight = mobile ? amount > 0.5 : amount > 0.74;
    syncHeader();
  }

  function readAspect() {
    if (heroImg.naturalWidth && heroImg.naturalHeight) {
      imageAspect = heroImg.naturalWidth / heroImg.naturalHeight;
    }
  }

  readAspect();
  measure();
  applyZoom(0);

  window.ScrollTrigger.create({
    trigger: spacer,
    start: "top top",
    end: "bottom top",
    scrub: 0.45,
    invalidateOnRefresh: true,
    onUpdate: (self) => {
      const zoomPortion = metrics.screens / (metrics.screens + 1);
      applyZoom(Math.min(1, self.progress / zoomPortion));
    },
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

  if (location.hash) {
    const target = document.querySelector(location.hash);
    if (target) {
      requestAnimationFrame(() => target.scrollIntoView());
    }
  }
}

initReveals();
initTilt();
initNavState();

if (!reduceMotion && document.documentElement.classList.contains("has-zoom")) {
  initZoom();
}
