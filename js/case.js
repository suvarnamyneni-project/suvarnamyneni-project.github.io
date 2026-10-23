/* Case pages: Lenis on desktop, a chapter rail, and reveals that opt in. */
(function () {
  const root = document.documentElement;
  const reduce = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  const stack = root.classList.contains("is-stack");
  const motion = !reduce;
  const rail = document.querySelector(".case-rail");
  let queued = false;
  let lastProgress = -1;

  if (motion) root.classList.add("has-case-motion");

  const reveals = document.querySelectorAll(".case-reveal");
  if (!motion || !("IntersectionObserver" in window)) {
    reveals.forEach((node) => node.classList.add("is-in"));
  } else {
    const watch = new IntersectionObserver((entries) => {
      entries.forEach((entry) => {
        if (!entry.isIntersecting) return;
        entry.target.classList.add("is-in");
        watch.unobserve(entry.target);
      });
    }, { threshold: 0.08, rootMargin: "0px 0px -4% 0px" });
    const primed = [];
    reveals.forEach((node) => {
      const rect = node.getBoundingClientRect();
      if (rect.bottom > 48 && rect.top < window.innerHeight * 0.98) primed.push(node);
      else watch.observe(node);
    });
    requestAnimationFrame(() => primed.forEach((node) => node.classList.add("is-in")));
  }

  function writeProgress() {
    if (rail) {
      const max = document.documentElement.scrollHeight - window.innerHeight;
      const next = max > 0 ? Math.min(1, Math.max(0, window.scrollY / max)) : 0;
      if (Math.abs(next - lastProgress) >= 0.0015) {
        lastProgress = next;
        rail.style.setProperty("--p", next.toFixed(4));
      }
    }
    if (drawStory) drawStory();
  }

  function scrollToTarget(link, event) {
    const target = document.querySelector(link.getAttribute("href"));
    if (!target) return;
    event.preventDefault();
    const phone = window.matchMedia("(max-width: 1179px)").matches;
    if (window.deskLenis && typeof window.deskLenis.scrollTo === "function") {
      window.deskLenis.scrollTo(target, { offset: phone ? -136 : -120, force: true });
    } else {
      target.scrollIntoView({ behavior: reduce ? "auto" : "smooth", block: "start" });
    }
    if (history.pushState) history.pushState(null, "", link.getAttribute("href"));
  }

  function requestProgress() {
    if (queued) return;
    queued = true;
    requestAnimationFrame(() => {
      queued = false;
      writeProgress();
    });
  }

  window.addEventListener("scroll", requestProgress, { passive: true });
  requestProgress();

  window.initCaseScroll = function initCaseScroll() {
    if (reduce || stack || !window.Lenis || window.deskLenis) return;
    window.deskLenis = new window.Lenis({
      lerp: 0.1,
      smoothWheel: true,
      syncTouch: false,
      wheelMultiplier: 0.8,
      autoRaf: true,
    });
    if (window.deskLenis.on) window.deskLenis.on("scroll", requestProgress);
  };
  window.initCaseScroll();

  if (rail) initRail(rail);
  const drawStory = initStory();

  if (motion && "IntersectionObserver" in window) initCounts();

  function initRail(nav) {
    const links = [...nav.querySelectorAll("a")];
    const sections = links.map((link) => document.querySelector(link.getAttribute("href"))).filter(Boolean);
    if (!links.length || sections.length !== links.length) return;
    let active = -1;

    function place(index) {
      const link = links[index];
      const mark = nav.querySelector(".case-rail-mark");
      if (!link || !mark) return;
      const y = link.offsetTop + Math.max(0, (link.offsetHeight - 16) / 2);
      mark.style.transform = `translate3d(${link.offsetLeft}px, ${y}px, 0)`;
    }

    function nudge(link) {
      const scroller = nav.querySelector(".case-rail-list");
      if (!scroller || scroller.scrollWidth <= scroller.clientWidth + 4) return;
      scroller.scrollTo({
        left: Math.max(0, link.offsetLeft - 16),
        behavior: reduce ? "auto" : "smooth",
      });
    }

    function setActive(index) {
      if (index === active) return;
      active = index;
      links.forEach((link, i) => {
        const on = i === index;
        link.classList.toggle("is-current", on);
        if (on) link.setAttribute("aria-current", "location");
        else link.removeAttribute("aria-current");
      });
      place(index);
      nudge(links[index]);
    }

    links.forEach((link) => {
      link.addEventListener("click", (event) => scrollToTarget(link, event));
    });

    if ("IntersectionObserver" in window) {
      const visible = new Set();
      const chapters = new IntersectionObserver((entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) visible.add(entry.target);
          else visible.delete(entry.target);
        });
        let best = -1;
        sections.forEach((section, index) => {
          if (visible.has(section)) best = index;
        });
        if (best >= 0) setActive(best);
      }, { rootMargin: "-12% 0px -58% 0px", threshold: [0, 0.1, 0.25] });
      sections.forEach((section) => chapters.observe(section));
    }

    const hashed = links.findIndex((link) => link.getAttribute("href") === location.hash);
    setActive(hashed >= 0 ? hashed : 0);
    window.addEventListener("resize", () => place(active), { passive: true });
    if (document.fonts && document.fonts.ready) document.fonts.ready.then(() => place(active));
    if (window.ResizeObserver) new ResizeObserver(() => place(Math.max(active, 0))).observe(nav);
  }

  function initStory() {
    const board = document.querySelector(".story-board");
    if (!board) return null;
    const svg = board.querySelector(".story-svg");
    const grey = svg.querySelector(".route-grey");
    const rust = svg.querySelector(".route-rust");
    const maskPath = svg.querySelector(".route-mask");
    const plane = svg.querySelector(".story-plane");
    const beats = [...board.querySelectorAll(".beat")];
    const cards = [...board.querySelectorAll(".act-card")];
    const marks = beats.map((beat) => beat.querySelector(".beat-mark"));
    let metrics = null;
    let lastP = -1;
    let lastDot = -1;

    board.querySelectorAll("a").forEach((link) => {
      link.addEventListener("click", (event) => scrollToTarget(link, event));
    });

    function measure() {
      const rect = board.getBoundingClientRect();
      const width = Math.max(1, board.clientWidth);
      const height = Math.max(1, board.clientHeight);
      svg.setAttribute("viewBox", `0 0 ${width} ${height}`);
      const pts = marks.map((mark) => {
        const box = mark.getBoundingClientRect();
        return {
          x: box.left + box.width / 2 - rect.left,
          y: box.top + box.height / 2 - rect.top,
        };
      });
      if (pts.length < 2) return;
      const d = pts.map((pt, index) => `${index ? "L" : "M"}${pt.x.toFixed(1)} ${pt.y.toFixed(1)}`).join(" ");
      grey.setAttribute("d", d);
      rust.setAttribute("d", d);
      maskPath.setAttribute("d", d);
      const length = grey.getTotalLength() || 1;
      const fractions = [0];
      let walked = 0;
      for (let index = 1; index < pts.length; index += 1) {
        walked += Math.hypot(pts[index].x - pts[index - 1].x, pts[index].y - pts[index - 1].y);
        fractions.push(walked / length);
      }
      metrics = { top: rect.top + window.scrollY, height: rect.height, length, fractions };
      lastP = -1;
      lastDot = -1;
      draw();
    }

    function progress() {
      if (!motion || !metrics) return 1;
      const view = window.innerHeight || 1;
      const start = metrics.top - view * 0.72;
      const end = metrics.top + metrics.height * 0.62 - view * 0.2;
      return Math.min(1, Math.max(0, (window.scrollY - start) / Math.max(1, end - start)));
    }

    function draw() {
      if (!metrics) return;
      const p = progress();
      if (lastDot >= 0 && Math.abs(p - lastP) < 0.0008) return;
      lastP = p;
      if (motion) {
        svg.classList.add("is-scrub");
        maskPath.style.strokeDasharray = `${metrics.length}`;
        maskPath.style.strokeDashoffset = `${metrics.length * (1 - p)}`;
      }
      const at = metrics.length * p;
      const point = grey.getPointAtLength(at);
      const ahead = grey.getPointAtLength(Math.min(metrics.length, at + 14));
      const behind = grey.getPointAtLength(Math.max(0, at - 14));
      const angle = Math.atan2(ahead.y - behind.y, ahead.x - behind.x) * 180 / Math.PI;
      plane.setAttribute("transform", `translate(${point.x.toFixed(2)} ${point.y.toFixed(2)}) rotate(${(angle + 42).toFixed(2)})`);
      let dot = 0;
      metrics.fractions.forEach((fraction, index) => {
        if (fraction <= p + 0.015) dot = index;
      });
      if (dot === lastDot) return;
      lastDot = dot;
      beats.forEach((beat, index) => {
        beat.classList.toggle("is-passed", metrics.fractions[index] <= p + 0.015);
        beat.classList.toggle("is-now", index === dot);
        if (index === dot) beat.setAttribute("aria-current", "location");
        else beat.removeAttribute("aria-current");
      });
      const act = Math.min(cards.length - 1, Math.floor(dot / 3));
      cards.forEach((card, index) => card.classList.toggle("is-on", index === act));
    }

    measure();
    window.addEventListener("resize", measure, { passive: true });
    if (document.fonts && document.fonts.ready) document.fonts.ready.then(measure);
    if (window.ResizeObserver) new ResizeObserver(measure).observe(board);
    return draw;
  }

  function initCounts() {
    const nums = document.querySelectorAll(".case-count");
    if (!nums.length) return;
    const seen = new IntersectionObserver((entries) => {
      entries.forEach((entry) => {
        if (!entry.isIntersecting) return;
        seen.unobserve(entry.target);
        runCount(entry.target);
      });
    }, { threshold: 0.6 });
    nums.forEach((node) => seen.observe(node));
  }

  function runCount(node) {
    const target = Number(node.getAttribute("data-count"));
    if (!Number.isFinite(target)) return;
    const started = performance.now();
    const duration = 700;
    function frame(now) {
      const t = Math.min(1, (now - started) / duration);
      const eased = 1 - Math.pow(1 - t, 3);
      node.textContent = String(Math.round(target * eased));
      if (t < 1) requestAnimationFrame(frame);
      else node.textContent = String(target);
    }
    requestAnimationFrame(frame);
  }
})();
