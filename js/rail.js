/**
 * Round 2: pinned work rail and path timeline.
 * Phone, tablet, coarse pointers, and reduced motion stay vertical.
 */
(function () {
  const STACK_QUERY = "(max-width: 900px), (pointer: coarse)";
  const ANIMS = ["sway", "hop", "swipe", "snap"];
  const PLANE = `<svg viewBox="0 0 64 64" aria-hidden="true"><path d="M6 34 L58 8 L36 58 L28 36 Z" fill="#FFFDFB" stroke="#2B3236" stroke-width="2.5" stroke-linejoin="round"/><path d="M28 36 L58 8" fill="none" stroke="#A34728" stroke-width="2"/></svg>`;
  const ICONS = [
    `<svg viewBox="0 0 64 64" aria-hidden="true"><rect x="8" y="16" width="48" height="30" rx="4" fill="none" stroke="#0B1F3A" stroke-width="2.4"/><path d="M22 46 h20 M32 46 v8" stroke="#2F6FED" stroke-width="2.4" stroke-linecap="round"/></svg>`,
    `<svg viewBox="0 0 64 64" aria-hidden="true"><path d="M10 24 32 14 54 24 32 34 Z" fill="none" stroke="#0B1F3A" stroke-width="2.4"/><path d="M10 24 v16 l22 10 22-10 V24" fill="none" stroke="#0B1F3A" stroke-width="2.4"/><path d="M32 34 v16" stroke="#2F6FED" stroke-width="2.4"/></svg>`,
    `<svg viewBox="0 0 64 64" aria-hidden="true"><rect x="10" y="18" width="44" height="28" rx="4" fill="none" stroke="#0B1F3A" stroke-width="2.4"/><path d="M10 28 h44" stroke="#2F6FED" stroke-width="2.4"/></svg>`,
    `<svg viewBox="0 0 64 64" aria-hidden="true"><path d="M18 14 h14 v36 H18 a8 8 0 0 1-8-8 V22 a8 8 0 0 1 8-8z" fill="none" stroke="#0B1F3A" stroke-width="2.4"/><path d="M46 14 H32 v36 h14 a8 8 0 0 0 8-8 V22 a8 8 0 0 0-8-8z" fill="none" stroke="#0B1F3A" stroke-width="2.4"/></svg>`,
    `<svg viewBox="0 0 64 64" aria-hidden="true"><path d="M6 28 32 14 58 28 32 42 Z" fill="none" stroke="#0B1F3A" stroke-width="2.4" stroke-linejoin="round"/><path d="M18 34 v8 c0 8 28 8 28 0 v-8" fill="none" stroke="#0B1F3A" stroke-width="2.4"/><path d="M58 28 v16" stroke="#2F6FED" stroke-width="2.4" stroke-linecap="round"/></svg>`,
  ];
  const PATH_STOPS = [
    { year: "2023", rail: "2023", label: "eXp Realty, February 2023 to present" },
    { year: "2020", rail: "2020", label: "Amazon, July 2020 to 2023" },
    { year: "2018", rail: "ICICI", label: "ICICI Bank, October 2018 to June 2020" },
    { year: "2018", rail: "Manipal", label: "Manipal Academy of Higher Education, PG Diploma in Design, 2018" },
    { year: "2017", rail: "2017", label: "Osmania University, M.C.A., 2017" },
    { year: "2014", rail: "2014", label: "Andhra University, B.Sc Computers, 2014" },
  ];

  const reduceMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  const motion = document.documentElement.classList.contains("has-motion");

  function clamp01(t) {
    return t < 0 ? 0 : t > 1 ? 1 : t;
  }

  function smootherstep(t) {
    const x = clamp01(t);
    return x * x * x * (x * (x * 6 - 15) + 10);
  }

  function isStack() {
    return reduceMotion || window.matchMedia(STACK_QUERY).matches;
  }

  function yearFor(card) {
    return card.dataset.stamp || "";
  }

  function smoothPath(points) {
    if (!points.length) return "";
    let d = `M ${points[0].x.toFixed(1)} ${points[0].y.toFixed(1)}`;
    for (let i = 0; i < points.length - 1; i += 1) {
      const a = points[i];
      const b = points[i + 1];
      const mx = (a.x + b.x) / 2;
      d += ` C ${mx.toFixed(1)} ${a.y.toFixed(1)}, ${mx.toFixed(1)} ${b.y.toFixed(1)}, ${b.x.toFixed(1)} ${b.y.toFixed(1)}`;
    }
    return d;
  }

  function routeSvg() {
    const svg = document.createElementNS("http://www.w3.org/2000/svg", "svg");
    svg.setAttribute("aria-hidden", "true");
    svg.setAttribute("preserveAspectRatio", "none");
    const ghost = document.createElementNS("http://www.w3.org/2000/svg", "path");
    const hot = document.createElementNS("http://www.w3.org/2000/svg", "path");
    ghost.setAttribute("class", "route-ghost");
    hot.setAttribute("class", "route-hot");
    svg.append(ghost, hot);
    return { svg, ghost, hot };
  }

  function planeEl(className) {
    const el = document.createElement("div");
    el.className = className;
    el.setAttribute("aria-hidden", "true");
    el.innerHTML = PLANE;
    return el;
  }

  let cards = [];
  let rail = null;
  let pathUI = null;
  let railTrigger = null;
  let pathTrigger = null;
  let cardObserver = null;
  let snapTimer = 0;
  let snapLock = false;

  function mountRound2() {
    mountRail();
    mountPath();
    mountPathBoard();
  }

  function mountPathBoard() {
    const section = document.getElementById("path");
    const scroller = section && section.querySelector(".path-scroller");
    if (!scroller || scroller.dataset.ready === "true") return;
    const stops = [...scroller.querySelectorAll(".path-stop")];
    const buttons = [...section.querySelectorAll(".path-nav button")];
    const plane = section.querySelector(".path-plane");
    const stage = section.querySelector(".path-stage");
    const visibleRoute = () => {
      const paths = [...section.querySelectorAll(".path-route path")];
      return paths.find((path) => getComputedStyle(path).display !== "none") || paths[0];
    };
    if (!stops.length) return;
    scroller.dataset.ready = "true";

    const setActive = (index) => {
      buttons.forEach((button, buttonIndex) => {
        if (buttonIndex === index) button.setAttribute("aria-current", "true");
        else button.removeAttribute("aria-current");
      });
    };

    const activeIndex = () => {
      const viewLeft = scroller.scrollLeft;
      const viewRight = viewLeft + scroller.clientWidth;
      let best = 0;
      let bestVisible = -1;
      stops.forEach((stop, index) => {
        const left = stop.offsetLeft;
        const right = left + stop.offsetWidth;
        const visible = Math.min(right, viewRight) - Math.max(left, viewLeft);
        if (visible > bestVisible) {
          bestVisible = visible;
          best = index;
        }
      });
      return best;
    };

    const placePlane = () => {
      const route = visibleRoute();
      if (!plane || !route || !stage) return;
      const max = scroller.scrollWidth - scroller.clientWidth;
      const t = max <= 1 ? 0 : scroller.scrollLeft / max;
      const length = route.getTotalLength() || 1;
      const point = route.getPointAtLength(length * t);
      const ahead = route.getPointAtLength(Math.min(length, length * t + 12));
      const box = route.ownerSVGElement.viewBox.baseVal;
      const width = stage.clientWidth || 1;
      const height = stage.clientHeight || 1;
      const x = (point.x / box.width) * width;
      const y = (point.y / box.height) * height;
      const ax = (ahead.x / box.width) * width;
      const ay = (ahead.y / box.height) * height;
      const angle = Math.atan2(ay - y, ax - x) * (180 / Math.PI);
      plane.style.transform = `translate(${(x - 23).toFixed(1)}px, ${(y - 23).toFixed(1)}px) rotate(${angle.toFixed(1)}deg)`;
    };

    const scrollToIndex = (index) => {
      const stop = stops[index];
      if (!stop) return;
      scroller.scrollTo({
        left: stop.offsetLeft,
        behavior: reduceMotion ? "auto" : "smooth",
      });
    };

    scroller.addEventListener("scroll", () => {
      setActive(activeIndex());
      placePlane();
    }, { passive: true });

    scroller.addEventListener("wheel", (event) => {
      if (Math.abs(event.deltaX) > Math.abs(event.deltaY)) return;
      const max = scroller.scrollWidth - scroller.clientWidth;
      if (max <= 1) return;
      const next = scroller.scrollLeft + event.deltaY;
      if (next < 0 || next > max) return;
      event.preventDefault();
      event.stopPropagation();
      scroller.scrollLeft = next;
    }, { passive: false });

    scroller.addEventListener("keydown", (event) => {
      if (event.key !== "ArrowRight" && event.key !== "ArrowLeft") return;
      event.preventDefault();
      const current = activeIndex();
      const next = event.key === "ArrowRight"
        ? Math.min(stops.length - 1, current + 1)
        : Math.max(0, current - 1);
      scrollToIndex(next);
    });

    buttons.forEach((button, index) => {
      button.addEventListener("click", () => scrollToIndex(index));
    });

    setActive(0);
    placePlane();
    window.addEventListener("resize", () => placePlane());
  }

  function mountRail() {
    const work = document.getElementById("work");
    if (!work || work.querySelector(".rail-stage")) return;
    const head = work.querySelector(".section-head");
    cards = [...work.querySelectorAll(".project")];
    const stage = document.createElement("div");
    stage.className = "rail-stage";
    const sticky = document.createElement("div");
    sticky.className = "rail-sticky";
    const headWrap = document.createElement("div");
    headWrap.className = "wrap";
    if (head) headWrap.appendChild(head);
    const viewport = document.createElement("div");
    viewport.className = "rail-viewport";
    const track = document.createElement("div");
    track.className = "rail-track";
    const route = routeSvg();
    route.svg.classList.add("rail-route");
    const plane = planeEl("rail-plane");

    cards.forEach((card, index) => {
      card.style.setProperty("--i", String(index));
      const featured = card.classList.contains("feature") || card.classList.contains("feature-lead") || card.classList.contains("rail-end");
      if (!featured) {
        card.classList.add("rail-more");
        card.dataset.anim = ANIMS[index % ANIMS.length];
        const thumb = card.querySelector(".thumb");
        if (thumb) {
          [18, 62, 78].forEach((left, dot) => {
            const spark = document.createElement("i");
            spark.className = "twinkle";
            spark.setAttribute("aria-hidden", "true");
            spark.style.left = `${left}%`;
            spark.style.top = `${20 + dot * 18}%`;
            spark.style.animationDelay = `${dot * 0.2}s`;
            thumb.appendChild(spark);
          });
        }
      }
      const year = yearFor(card);
      const thumb = card.querySelector(".thumb");
      const stamp = document.createElement("span");
      stamp.className = "year-stamp";
      stamp.setAttribute("aria-hidden", "true");
      if (year) stamp.textContent = year;
      else stamp.hidden = true;
      if (thumb) thumb.appendChild(stamp);
      const numeral = card.querySelector(".thumb-index");
      if (numeral) numeral.dataset.value = String(index + 1);
      track.appendChild(card);
    });

    track.append(route.svg, plane);
    viewport.appendChild(track);
    sticky.append(headWrap, viewport);
    stage.appendChild(sticky);
    work.replaceChildren(stage);
    rail = { stage, sticky, viewport, track, route, plane, distance: 1 };
  }

  function mountPath() {
    const section = document.getElementById("path");
    if (!section || section.querySelector(".tl-stage")) return;
    const heading = section.querySelector("h2");
    const sub = section.querySelector(".section-sub");
    const list = section.querySelector(".timeline");
    if (!list) return;
    const items = [...list.children];
    items.forEach((item, index) => {
      item.style.position = "relative";
      const year = document.createElement("span");
      year.className = "tl-year";
      year.setAttribute("aria-hidden", "true");
      year.textContent = PATH_STOPS[index].year;
      const when = item.querySelector(".when");
      const body = item.querySelector(":scope > div:not(.marker)");
      const copy = document.createElement("div");
      copy.className = "tl-copy";
      if (when) copy.appendChild(when);
      if (body) copy.appendChild(body);
      item.append(year, copy);
      const art = item.querySelector(".tl-art");
      if (art) {
        art.classList.add("tl-icon");
        item.insertBefore(art, copy);
      } else {
        const icon = document.createElement("div");
        icon.className = "tl-icon";
        icon.setAttribute("aria-hidden", "true");
        icon.innerHTML = ICONS[index] || ICONS[0];
        (body || copy).appendChild(icon);
      }
    });

    const stage = document.createElement("div");
    stage.className = "tl-stage";
    const sticky = document.createElement("div");
    sticky.className = "tl-sticky";
    const headWrap = document.createElement("div");
    headWrap.className = "wrap";
    if (heading) headWrap.appendChild(heading);
    if (sub) headWrap.appendChild(sub);
    const viewport = document.createElement("div");
    viewport.className = "tl-viewport";
    const track = document.createElement("div");
    track.className = "tl-track";
    const route = routeSvg();
    route.svg.classList.add("tl-route");
    const plane = planeEl("tl-plane");
    track.append(route.svg, list, plane);
    viewport.appendChild(track);

    const nav = document.createElement("nav");
    nav.className = "tl-rail";
    nav.setAttribute("aria-label", "Path years");
    const line = document.createElement("div");
    line.className = "tl-rail-line";
    line.setAttribute("aria-hidden", "true");
    const fill = document.createElement("span");
    line.appendChild(fill);
    nav.appendChild(line);
    const buttons = PATH_STOPS.map((stop, index) => {
      const button = document.createElement("button");
      button.type = "button";
      button.textContent = stop.rail || stop.year;
      button.setAttribute("aria-label", stop.label);
      button.addEventListener("click", () => scrollToStop(index));
      nav.appendChild(button);
      return button;
    });

    sticky.append(headWrap, viewport, nav);
    stage.appendChild(sticky);
    section.replaceChildren(stage);
    pathUI = { stage, sticky, viewport, track, list, items, route, plane, nav, fill, buttons, marks: [] };
  }

  function scrollTo(target, options) {
    if (window.deskLenis) window.deskLenis.scrollTo(target, options);
    else if (typeof target === "number") window.scrollTo(0, target);
    else target.scrollIntoView();
  }

  function holdMap(progress, count) {
    const holdShare = 0.46;
    const hold = holdShare / count;
    const glide = count === 1 ? 0 : (1 - holdShare) / (count - 1);
    let cursor = 0;
    for (let i = 0; i < count; i += 1) {
      const holdEnd = cursor + hold;
      if (progress <= holdEnd || i === count - 1) return i;
      cursor = holdEnd;
      const glideEnd = cursor + glide;
      if (progress <= glideEnd) {
        const t = glide === 0 ? 0 : (progress - cursor) / glide;
        const s = t * t * (3 - 2 * t);
        return i + s;
      }
      cursor = glideEnd;
    }
    return count - 1;
  }

  function stopProgress(index, count) {
    const holdShare = 0.46;
    const hold = holdShare / count;
    const glide = count === 1 ? 0 : (1 - holdShare) / (count - 1);
    return index * (hold + glide) + hold * 0.5;
  }

  function scrollToStop(index) {
    if (!pathUI) return;
    if (document.documentElement.classList.contains("has-rail") && pathTrigger) {
      const progress = stopProgress(index, pathUI.items.length);
      const y = pathTrigger.start + (pathTrigger.end - pathTrigger.start) * progress;
      scrollTo(y, { duration: 1.6, easing: smootherstep });
      return;
    }
    const item = pathUI.items[index];
    if (item) scrollTo(item, { offset: -96, duration: reduceMotion ? 0 : 1.1, easing: smootherstep });
  }

  function runCount(el, target) {
    const token = String(Number(el.dataset.token || "0") + 1);
    el.dataset.token = token;
    const started = performance.now();
    const step = (now) => {
      if (el.dataset.token !== token) return;
      const t = Math.min(1, (now - started) / 680);
      const eased = 1 - (1 - t) ** 3;
      el.textContent = String(Math.round(eased * target)).padStart(2, "0");
      if (t < 1) requestAnimationFrame(step);
    };
    requestAnimationFrame(step);
  }

  function setLit(card, on) {
    const was = card.classList.contains("is-lit");
    card.classList.toggle("is-lit", on);
    if (on) card.style.setProperty("--lift", "-8px");
    else card.style.removeProperty("--lift");
    if (on && !was) animateMetrics(card);
  }

  function animateMetrics(card) {
    if (!motion) return;
    card.querySelectorAll(".metric-num").forEach((el) => {
      const target = Number(el.dataset.value);
      if (!Number.isFinite(target)) return;
      const prefix = el.dataset.prefix || "";
      const suffix = el.dataset.suffix || "";
      const token = String(Number(el.dataset.token || "0") + 1);
      el.dataset.token = token;
      const started = performance.now();
      const step = (now) => {
        if (el.dataset.token !== token) return;
        const t = Math.min(1, (now - started) / 680);
        const eased = 1 - (1 - t) ** 3;
        el.textContent = `${prefix}${Math.round(eased * target)}${suffix}`;
        if (t < 1) requestAnimationFrame(step);
      };
      requestAnimationFrame(step);
    });
  }

  function sizeRoute(route, width, height) {
    const w = Math.max(1, Math.round(width));
    const h = Math.max(1, Math.round(height));
    const svg = route.svg;
    svg.setAttribute("viewBox", `0 0 ${w} ${h}`);
    svg.style.left = "0";
    svg.style.top = "0";
    svg.style.right = "auto";
    svg.style.bottom = "auto";
    svg.style.width = `${w}px`;
    svg.style.height = `${h}px`;
  }

  function dottedRevealArray(length) {
    const dash = 1.6;
    const hole = 7.4;
    const pair = dash + hole;
    const pairs = Math.max(1, Math.floor(length / pair));
    const parts = [];
    for (let i = 0; i < pairs; i += 1) parts.push(dash, hole);
    const rest = Math.max(0, length - pairs * pair);
    parts.push(rest > 0.4 ? Number(rest.toFixed(2)) : 0, Number(length.toFixed(2)));
    return parts.join(" ");
  }

  function paintRoute(route, points) {
    const d = smoothPath(points);
    route.ghost.setAttribute("d", d);
    route.hot.setAttribute("d", d);
    const length = route.hot.getTotalLength ? route.hot.getTotalLength() : 0;
    route.hot.style.setProperty("stroke-dasharray", dottedRevealArray(length), "important");
    route.hot.style.strokeDashoffset = String(length);
    route.length = length;
    return length;
  }

  function placePlane(el, x, y, angle) {
    el.style.transform = `translate3d(${x - 18}px, ${y - 18}px, 0) rotate(${angle}deg)`;
  }

  function buildRailPath() {
    if (!rail) return;
    const height = rail.viewport.clientHeight || rail.track.clientHeight || 400;
    const points = cards.map((card, index) => ({
      x: card.offsetLeft + card.offsetWidth * 0.55,
      y: index % 2 === 0 ? height * 0.1 : height * 0.9,
    }));
    if (cards.length) {
      const first = cards[0];
      const last = cards[cards.length - 1];
      points.unshift({
        x: Math.max(8, first.offsetLeft - 36),
        y: height * 0.46,
      });
      points.push({
        x: last.offsetLeft + last.offsetWidth + 28,
        y: height * 0.4,
      });
    }
    sizeRoute(rail.route, rail.track.scrollWidth, height);
    paintRoute(rail.route, points);
    rail.points = points;
    rail.distance = Math.max(1, rail.track.scrollWidth - rail.viewport.clientWidth);
  }

  function applyRail(progress) {
    if (!rail) return;
    const shift = -progress * rail.distance;
    rail.track.style.transform = `translate3d(${shift.toFixed(2)}px, 0, 0)`;
    const length = rail.route.length || 0;
    const hot = rail.route.hot;
    if (length) {
      hot.style.strokeDashoffset = String(length * (1 - progress));
      const current = hot.getPointAtLength(length * progress);
      const next = hot.getPointAtLength(Math.min(length, length * progress + 12));
      const angle = Math.atan2(next.y - current.y, next.x - current.x) * (180 / Math.PI);
      placePlane(rail.plane, current.x, current.y, angle);
      cards.forEach((card) => {
        const gate = card.offsetLeft + card.offsetWidth * 0.42;
        setLit(card, current.x >= gate);
      });
    }
  }

  function buildPathCurve() {
    if (!pathUI) return;
    const items = pathUI.items;
    const points = items.map((item, index) => {
      const year = item.querySelector(".tl-year");
      const copy = item.querySelector(".tl-copy");
      const gapTop = item.offsetTop + (year ? year.offsetTop + year.offsetHeight : 0) + 8;
      const gapBottom = item.offsetTop + (copy ? copy.offsetTop : item.offsetHeight * 0.7) - 16;
      const span = Math.max(12, gapBottom - gapTop);
      const along = index % 2 === 0 ? 0.28 : 0.72;
      return {
        x: item.offsetLeft + item.offsetWidth * 0.42,
        y: Math.min(gapBottom, gapTop + span * along),
      };
    });
    const height = pathUI.viewport.clientHeight || pathUI.track.clientHeight || 420;
    sizeRoute(pathUI.route, pathUI.track.scrollWidth, height);
    paintRoute(pathUI.route, points);
    pathUI.points = points;
    const total = pathUI.route.length || 1;
    const marks = [];
    let cursor = 0;
    points.forEach((point) => {
      let best = cursor;
      let bestDist = Infinity;
      for (let step = cursor; step <= total; step += 6) {
        const sample = pathUI.route.hot.getPointAtLength(step);
        const dist = (sample.x - point.x) ** 2 + (sample.y - point.y) ** 2;
        if (dist < bestDist) {
          bestDist = dist;
          best = step;
        }
      }
      marks.push(best / total);
      cursor = best;
    });
    pathUI.marks = marks;
  }

  function applyPath(progress) {
    if (!pathUI) return;
    const count = pathUI.items.length;
    const pos = holdMap(progress, count);
    const centers = pathUI.items.map((item) => item.offsetLeft + item.offsetWidth / 2);
    const index = Math.max(0, Math.min(count - 1, Math.floor(pos)));
    const frac = pos - index;
    const next = Math.min(count - 1, index + 1);
    const center = centers[index] + (centers[next] - centers[index]) * frac;
    const shift = pathUI.viewport.clientWidth / 2 - center;
    pathUI.track.style.transform = `translate3d(${shift.toFixed(2)}px, 0, 0)`;
    const marks = pathUI.marks;
    const t = marks.length
      ? marks[index] + ((marks[next] ?? marks[index]) - marks[index]) * frac
      : pos / Math.max(1, count - 1);
    const length = pathUI.route.length || 0;
    if (length) {
      pathUI.route.hot.style.strokeDashoffset = String(length * (1 - t));
      const current = pathUI.route.hot.getPointAtLength(length * t);
      const ahead = pathUI.route.hot.getPointAtLength(Math.min(length, length * t + 14));
      const angle = Math.atan2(ahead.y - current.y, ahead.x - current.x) * (180 / Math.PI);
      placePlane(pathUI.plane, current.x, current.y, angle);
    }
    pathUI.items.forEach((item, itemIndex) => {
      const rect = item.getBoundingClientRect();
      const passed = pos > itemIndex + 0.15;
      const icon = item.querySelector(".tl-icon");
      if (icon) {
        const dx = (rect.left + rect.width / 2 - window.innerWidth / 2) / window.innerWidth;
        const scale = 1 - Math.min(0.18, Math.abs(dx) * 0.36);
        icon.style.transform = `translate3d(${(-dx * 56).toFixed(1)}px, 0, 0) rotate(${(dx * 10).toFixed(2)}deg) scale(${scale.toFixed(3)})`;
      }
      const fade = pos > itemIndex + 0.85 ? Math.max(0.38, 1 - (pos - itemIndex - 0.85)) : 1;
      item.style.opacity = String(fade);
      item.classList.toggle("is-passed", passed);
    });
    pathUI.fill.style.width = `${clamp01(pos / Math.max(1, count - 1)) * 100}%`;
    pathUI.buttons.forEach((button, buttonIndex) => {
      const on = Math.round(pos) === buttonIndex;
      button.classList.toggle("is-on", on);
      button.classList.toggle("is-passed", pos >= buttonIndex);
      if (on) button.setAttribute("aria-current", "true");
      else button.removeAttribute("aria-current");
    });
  }

  function applyStackPath() {
    if (!pathUI) return;
    pathUI.track.style.transform = "";
    pathUI.items.forEach((item) => {
      item.style.opacity = "";
    });
    let active = 0;
    pathUI.items.forEach((item, index) => {
      const rect = item.getBoundingClientRect();
      if (rect.top < window.innerHeight * 0.62) active = index;
      const icon = item.querySelector(".tl-icon");
      if (!icon || !motion) return;
      const dx = (rect.left + rect.width / 2 - window.innerWidth / 2) / window.innerWidth;
      const dy = (rect.top + rect.height / 2 - window.innerHeight / 2) / window.innerHeight;
      const scale = 1 - Math.min(0.16, Math.abs(dy) * 0.22);
      icon.style.transform = `translate3d(${(-dx * 18).toFixed(1)}px, 0, 0) rotate(${(dy * 8).toFixed(2)}deg) scale(${scale.toFixed(3)})`;
    });
    const count = pathUI.items.length;
    pathUI.fill.style.width = `${clamp01(active / Math.max(1, count - 1)) * 100}%`;
    pathUI.buttons.forEach((button, index) => {
      const on = index === active;
      button.classList.toggle("is-on", on);
      button.classList.toggle("is-passed", index <= active);
      if (on) button.setAttribute("aria-current", "true");
      else button.removeAttribute("aria-current");
    });
  }

  function fitCards() {
    if (!cards.length) return;
    const stack = document.documentElement.classList.contains("is-stack");
    const limit = stack
      ? window.innerHeight - 32
      : (rail && rail.viewport.clientHeight) || window.innerHeight;
    const levels = ["f1", "f2", "f3", "f4"];
    cards.forEach((card) => card.classList.remove("f1", "f2", "f3", "f4"));
    const tooTall = () => cards.some((card) => card.scrollHeight > limit + 2);
    if (!tooTall()) return;
    levels.forEach((level) => {
      if (!tooTall()) return;
      cards.forEach((card) => card.classList.add(level));
    });
  }

  function armStackObserver() {
    if (cardObserver) cardObserver.disconnect();
    cardObserver = null;
    if (!document.documentElement.classList.contains("is-stack")) return;
    if (!("IntersectionObserver" in window)) {
      cards.forEach((card) => setLit(card, true));
      return;
    }
    cardObserver = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => setLit(entry.target, entry.isIntersecting));
      },
      { threshold: 0.42 }
    );
    cards.forEach((card) => cardObserver.observe(card));
  }

  function zeroNumerals() {
    if (!motion) return;
    cards.forEach((card) => {
      const numeral = card.querySelector(".thumb-index");
      if (!numeral) return;
      numeral.dataset.token = String(Number(numeral.dataset.token || "0") + 1);
      numeral.textContent = String(numeral.dataset.value || "").padStart(2, "0");
      card.classList.remove("is-lit");
      card.style.removeProperty("--lift");
    });
  }

  function bindDrag() {
    if (!rail || rail.dragReady) return;
    rail.dragReady = true;
    let active = false;
    let startX = 0;
    let startScroll = 0;
    let suppress = false;
    rail.viewport.addEventListener("pointerdown", (event) => {
      if (!document.documentElement.classList.contains("has-rail")) return;
      if (event.pointerType && event.pointerType !== "mouse") return;
      if (event.button !== 0) return;
      active = true;
      suppress = false;
      startX = event.clientX;
      startScroll = window.deskLenis ? window.deskLenis.scroll : window.scrollY;
      rail.viewport.classList.add("is-grabbing");
      rail.viewport.setPointerCapture(event.pointerId);
    });
    rail.viewport.addEventListener("pointermove", (event) => {
      if (!active) return;
      const delta = event.clientX - startX;
      if (Math.abs(delta) < 8) return;
      suppress = true;
      const next = startScroll - delta * 1.4;
      scrollTo(next, { immediate: true });
    });
    const end = () => {
      active = false;
      rail.viewport.classList.remove("is-grabbing");
    };
    rail.viewport.addEventListener("pointerup", end);
    rail.viewport.addEventListener("pointercancel", end);
    rail.viewport.addEventListener("click", (event) => {
      if (!suppress) return;
      event.preventDefault();
      event.stopPropagation();
      suppress = false;
    }, true);
    rail.track.addEventListener("focusin", (event) => {
      if (!document.documentElement.classList.contains("has-rail") || !railTrigger) return;
      const card = event.target.closest(".project");
      if (!card) return;
      const center = card.offsetLeft + card.offsetWidth / 2 - rail.viewport.clientWidth * 0.5;
      const progress = clamp01(center / rail.distance);
      const y = railTrigger.start + (railTrigger.end - railTrigger.start) * progress;
      const place = () => {
        rail.viewport.scrollLeft = 0;
        scrollTo(y, { immediate: true, force: true });
      };
      place();
      requestAnimationFrame(place);
    });
  }

  function snapCards() {
    if (!document.documentElement.classList.contains("is-stack") || !motion || snapLock) return;
    const line = 92;
    let best = null;
    let bestDist = Infinity;
    cards.forEach((card) => {
      const dist = Math.abs(card.getBoundingClientRect().top - line);
      if (dist < bestDist) {
        bestDist = dist;
        best = card;
      }
    });
    if (!best || bestDist < 36 || bestDist > window.innerHeight * 0.46) return;
    snapLock = true;
    const y = window.scrollY + best.getBoundingClientRect().top - line;
    scrollTo(y, { duration: 0.55, easing: smootherstep });
    window.setTimeout(() => {
      snapLock = false;
    }, 700);
  }

  function onScroll() {
    if (document.documentElement.classList.contains("is-stack")) applyStackPath();
    if (!motion || !document.documentElement.classList.contains("is-stack")) return;
    window.clearTimeout(snapTimer);
    snapTimer = window.setTimeout(snapCards, 170);
  }

  function bindRound2() {
    const root = document.documentElement;
    const stack = isStack();
    root.classList.toggle("is-stack", stack);
    root.classList.toggle("has-rail", !stack);
    if (railTrigger) {
      railTrigger.kill(true);
      railTrigger = null;
    }
    if (pathTrigger) {
      pathTrigger.kill(true);
      pathTrigger = null;
    }
    fitCards();
    zeroNumerals();
    armStackObserver();
    bindDrag();

    if (!stack && window.ScrollTrigger && rail) {
      buildRailPath();
      railTrigger = window.ScrollTrigger.create({
        trigger: rail.stage,
        pin: rail.sticky,
        start: "top top",
        end: () => `+=${Math.max(rail.distance, 1)}`,
        scrub: true,
        invalidateOnRefresh: true,
        anticipatePin: 1,
        onRefresh: () => {
          buildRailPath();
        },
        onUpdate: (self) => applyRail(self.progress),
      });
      applyRail(0);
      if (pathUI) {
        buildPathCurve();
        const travel = Math.round(window.innerHeight * pathUI.items.length * 0.9);
        pathTrigger = window.ScrollTrigger.create({
          trigger: pathUI.stage,
          pin: pathUI.sticky,
          start: "top top",
          end: () => `+=${travel}`,
          scrub: true,
          invalidateOnRefresh: true,
          anticipatePin: 1,
          onRefresh: () => buildPathCurve(),
          onUpdate: (self) => applyPath(self.progress),
        });
        applyPath(0);
      }
    } else {
      if (rail) rail.track.style.transform = "";
      applyStackPath();
    }

    window.ScrollTrigger && window.ScrollTrigger.refresh();
  }

  let resizeTick = 0;
  window.addEventListener("resize", () => {
    window.clearTimeout(resizeTick);
    resizeTick = window.setTimeout(() => {
      if (window.bindRound2) window.bindRound2();
    }, 150);
  });
  window.addEventListener("scroll", onScroll, { passive: true });

  window.mountRound2 = mountRound2;
  window.bindRound2 = bindRound2;
})();
