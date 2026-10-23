/* Case pages: the same Lenis feel as the desk, plus a quiet reveal.
   Phones and reduced motion keep native scroll, matching the home page. */
(function () {
  const root = document.documentElement;
  const reduce = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  const stack = root.classList.contains("is-stack");

  if (!reduce && !stack && window.Lenis) {
    window.deskLenis = new window.Lenis({
      lerp: 0.1,
      smoothWheel: true,
      syncTouch: false,
      wheelMultiplier: 0.8,
      autoRaf: true,
    });
  }

  const nodes = document.querySelectorAll(".case-reveal");
  if (reduce || !("IntersectionObserver" in window)) {
    nodes.forEach((node) => node.classList.add("is-in"));
    return;
  }
  const watch = new IntersectionObserver((entries) => {
    entries.forEach((entry) => {
      if (!entry.isIntersecting) return;
      entry.target.classList.add("is-in");
      watch.unobserve(entry.target);
    });
  }, { threshold: 0.12, rootMargin: "0px 0px -8% 0px" });
  nodes.forEach((node) => watch.observe(node));
})();
