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
    if (!rail) return;
    const max = document.documentElement.scrollHeight - window.innerHeight;
    const next = max > 0 ? Math.min(1, Math.max(0, window.scrollY / max)) : 0;
    if (Math.abs(next - lastProgress) < 0.0015) return;
    lastProgress = next;
    rail.style.setProperty("--p", next.toFixed(4));
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
      link.addEventListener("click", (event) => {
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
      });
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
