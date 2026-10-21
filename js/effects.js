/**
 * Site interactions that do not own the laptop zoom.
 * Catalog: cursor, captions, hints, glass menu, day colour,
 * copy button, glides, parallax, seeds, headline words, hotspots.
 * Round 3 can pass skill names through window.deskSeeds.setSkills.
 * This file never draws those names.
 */
(function () {
  const root = document.documentElement;
  const motion = root.classList.contains("has-motion");
  const finePointer = window.matchMedia("(hover: hover) and (pointer: fine)").matches;
  const EMAIL = "suvarnamyneni@gmail.com";
  const HINT_KEY = "suvarna-desk-hints-v1";

  const reduceMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;

  function clamp01(t) {
    return t < 0 ? 0 : t > 1 ? 1 : t;
  }

  function smootherstep(t) {
    const x = clamp01(t);
    return x * x * x * (x * (x * 6 - 15) + 10);
  }

  function hexToRgb(hex) {
    const n = parseInt(hex.slice(1), 16);
    return [(n >> 16) & 255, (n >> 8) & 255, n & 255];
  }

  function mixHex(a, b, t) {
    const pa = hexToRgb(a);
    const pb = hexToRgb(b);
    const c = pa.map((v, i) => Math.round(v + (pb[i] - v) * t));
    return `rgb(${c[0]}, ${c[1]}, ${c[2]})`;
  }

  function showToast(message) {
    const stack = document.getElementById("toast-stack");
    if (!stack) return;
    const item = document.createElement("p");
    item.className = "toast";
    item.textContent = message;
    stack.appendChild(item);
    window.setTimeout(() => item.remove(), 2200);
  }

  async function copyEmail() {
    try {
      if (navigator.clipboard && navigator.clipboard.writeText) {
        await navigator.clipboard.writeText(EMAIL);
        return true;
      }
    } catch (error) {
      /* fall through */
    }
    try {
      const field = document.createElement("textarea");
      field.value = EMAIL;
      field.setAttribute("readonly", "");
      field.style.position = "fixed";
      field.style.left = "-999px";
      document.body.appendChild(field);
      field.select();
      const ok = document.execCommand("copy");
      field.remove();
      return ok;
    } catch (error) {
      return false;
    }
  }

  function glideTo(target, hash) {
    const menu = document.querySelector(".site-nav");
    if (menu && menu.classList.contains("is-open")) {
      window.deskMenu.close();
    }
    if (!target && hash !== "#top") return;
    const instant = reduceMotion || !window.deskLenis;
    if (instant) {
      if (hash === "#top") window.scrollTo(0, 0);
      else target.scrollIntoView();
    } else {
      const duration = hash === "#work" || hash === "#top" ? 2.8 : 2.2;
      if (hash === "#top") window.deskLenis.scrollTo(0, { duration, easing: smootherstep });
      else window.deskLenis.scrollTo(target, { duration, easing: smootherstep, offset: 0 });
    }
    if (hash) history.pushState(null, "", hash);
  }

  window.deskGlide = glideTo;

  function initMenu() {
    const nav = document.querySelector(".site-nav");
    const toggle = document.querySelector(".nav-toggle");
    const menu = document.getElementById("nav-menu");
    const backdrop = document.querySelector(".nav-backdrop");
    if (!nav || !toggle || !menu || !backdrop) return;

    let returnFocus = null;

    function close() {
      const wasOpen = nav.classList.contains("is-open");
      nav.classList.remove("is-open");
      toggle.setAttribute("aria-expanded", "false");
      backdrop.hidden = true;
      if (wasOpen && returnFocus) {
        returnFocus.focus();
        returnFocus = null;
      }
    }

    function open() {
      returnFocus = toggle;
      nav.classList.add("is-open");
      toggle.setAttribute("aria-expanded", "true");
      backdrop.hidden = false;
      const first = menu.querySelector("a");
      if (first) first.focus();
    }

    toggle.addEventListener("click", () => {
      if (nav.classList.contains("is-open")) close();
      else open();
    });

    backdrop.addEventListener("click", close);

    document.addEventListener("keydown", (event) => {
      if (event.key === "Escape" && nav.classList.contains("is-open")) {
        event.preventDefault();
        close();
      }
    });

    window.deskMenu = { close, open };
  }

  function initGlides() {
    document.addEventListener("click", (event) => {
      const link = event.target.closest("a[href^='#']");
      if (!link) return;
      if (event.defaultPrevented) return;
      if (event.metaKey || event.ctrlKey || event.shiftKey || event.altKey || event.button !== 0) return;
      const hash = link.getAttribute("href");
      if (!hash || hash.length < 2) return;
      const target = document.querySelector(hash);
      if (!target && hash !== "#top") return;
      event.preventDefault();
      glideTo(target, hash);
    });
  }

  function initCopy() {
    const button = document.querySelector(".copy-email");
    if (!button) return;
    let timer = 0;
    button.addEventListener("click", async () => {
      const ok = await copyEmail();
      button.textContent = ok ? "Copied" : "Copy";
      if (!ok) showToast("Could not copy the email address.");
      window.clearTimeout(timer);
      timer = window.setTimeout(() => {
        button.textContent = "Copy";
      }, 1600);
    });
  }

  function initHotspots() {
    const plane = document.querySelector(".hotspot-plane");
    document.querySelectorAll(".hotspot").forEach((button) => {
      button.addEventListener("click", async () => {
        const kind = button.getAttribute("data-hotspot");
        if (kind === "lamp") {
          showToast("A lamp on the desk.");
          return;
        }
        if (kind === "plane") {
          if (motion && plane) {
            plane.classList.remove("is-away");
            void plane.offsetWidth;
            plane.classList.add("is-away");
            window.setTimeout(() => plane.classList.remove("is-away"), 950);
          }
          const ok = await copyEmail();
          showToast(ok ? "Copied" : "Could not copy the email address.");
          return;
        }
        if (kind === "work") {
          const work = document.getElementById("work");
          glideTo(work, "#work");
        }
      });
    });
  }

  function initDayAndFade() {
    const work = document.getElementById("work");
    function paint() {
      const max = document.documentElement.scrollHeight - window.innerHeight;
      const t = max > 0 ? clamp01(window.scrollY / max) : 0;
      root.style.setProperty("--bg", mixHex("#f4f7fb", "#e7d5de", t));
      root.style.setProperty("--paper", mixHex("#ffffff", "#f8f1f3", t));
      if (work && window.matchMedia("(max-width: 759px)").matches) {
        const top = work.getBoundingClientRect().top;
        root.classList.toggle("past-hero", top < window.innerHeight * 0.72);
      } else {
        root.classList.remove("past-hero");
      }
    }
    paint();
    window.addEventListener("scroll", paint, { passive: true });
    window.addEventListener("resize", paint);
  }

  function initWords() {
    if (!motion) {
      root.classList.add("ready");
      return;
    }
    const heading = document.querySelector(".hero-copy h1");
    if (!heading) {
      root.classList.add("ready");
      return;
    }
    const walker = document.createTreeWalker(heading, NodeFilter.SHOW_TEXT);
    const nodes = [];
    while (walker.nextNode()) nodes.push(walker.currentNode);
    let index = 0;
    nodes.forEach((node) => {
      const parts = node.textContent.split(/(\s+)/);
      const fragment = document.createDocumentFragment();
      parts.forEach((part) => {
        if (!part) return;
        if (/^\s+$/.test(part)) {
          fragment.appendChild(document.createTextNode(part));
          return;
        }
        const word = document.createElement("span");
        word.className = "word";
        word.style.setProperty("--d", `${index * 45}ms`);
        word.textContent = part;
        fragment.appendChild(word);
        index += 1;
      });
      node.parentNode.replaceChild(fragment, node);
    });
    requestAnimationFrame(() => {
      requestAnimationFrame(() => root.classList.add("ready"));
    });
  }

  function initCaptions() {
    document.querySelectorAll(".project").forEach((card) => {
      const title = card.querySelector("h3");
      if (title) card.setAttribute("data-caption", title.textContent.trim());
    });
    const linkedin = document.querySelector(".contact-links a[href*='linkedin']");
    const wix = document.querySelector(".contact-links a[href*='wixsite']");
    if (linkedin) linkedin.setAttribute("data-caption", "LinkedIn");
    if (wix) wix.setAttribute("data-caption", "Wix portfolio");
  }

  function initCursor() {
    if (!motion || !finePointer) return;
    const cursor = document.getElementById("cursor");
    const bubble = cursor ? cursor.querySelector(".cursor-bubble") : null;
    const box = document.getElementById("select-box");
    const sizeLabel = box ? box.querySelector(".select-size") : null;
    if (!cursor || !bubble) return;

    root.classList.add("has-fine-cursor");
    let clientX = window.innerWidth * 0.46;
    let clientY = window.innerHeight * 0.42;
    let caption = "";
    let hint = "";
    let hintTimer = 0;
    let activeHotspot = null;

    function renderBubble() {
      const text = caption || hint;
      bubble.textContent = text;
      cursor.classList.toggle("has-caption", Boolean(text));
      cursor.classList.toggle("flip", clientX > window.innerWidth - 260);
    }

    function place(x, y) {
      clientX = x;
      clientY = y;
      cursor.style.transform = `translate3d(${x}px, ${y}px, 0)`;
    }

    let placed = false;

    function showHint(text, life) {
      if (caption) return;
      hint = text;
      cursor.hidden = false;
      if (!placed) place(window.innerWidth * 0.42, window.innerHeight * 0.58);
      renderBubble();
      window.clearTimeout(hintTimer);
      hintTimer = window.setTimeout(() => {
        if (hint === text) {
          hint = "";
          renderBubble();
        }
      }, life);
    }

    document.addEventListener("pointermove", (event) => {
      if (event.pointerType && event.pointerType !== "mouse") return;
      cursor.hidden = false;
      placed = true;
      place(event.clientX, event.clientY);
      const hot = event.target.closest("a, button, [data-caption]");
      cursor.classList.toggle("is-hot", Boolean(hot));
      const cap = event.target.closest("[data-caption]");
      caption = cap ? cap.getAttribute("data-caption") || "" : "";
      if (caption) hint = "";
      renderBubble();
      const spot = event.target.closest(".hotspot");
      activeHotspot = spot || null;
    });

    document.addEventListener("pointerdown", (event) => {
      if (event.pointerType && event.pointerType !== "mouse") return;
      cursor.classList.add("is-down");
    });
    document.addEventListener("pointerup", () => cursor.classList.remove("is-down"));
    document.addEventListener("pointerout", (event) => {
      if (!event.relatedTarget) cursor.hidden = true;
    });

    function trackBox() {
      if (!box) return;
      const focus = document.activeElement;
      const target = activeHotspot || (focus && focus.classList && focus.classList.contains("hotspot") ? focus : null);
      const zooming = root.classList.contains("is-zooming");
      if (!target || zooming || target.closest(".hero-stage.is-unfolding")) {
        box.hidden = true;
        return;
      }
      const rect = target.getBoundingClientRect();
      if (rect.width < 2 || rect.height < 2) {
        box.hidden = true;
        return;
      }
      box.hidden = false;
      box.style.left = `${rect.left}px`;
      box.style.top = `${rect.top}px`;
      box.style.width = `${rect.width}px`;
      box.style.height = `${rect.height}px`;
      if (sizeLabel) sizeLabel.textContent = `${Math.round(rect.width)} × ${Math.round(rect.height)}`;
    }

    document.addEventListener("focusin", trackBox);
    document.addEventListener("focusout", () => {
      requestAnimationFrame(trackBox);
    });

    function frame() {
      trackBox();
      requestAnimationFrame(frame);
    }
    frame();

    try {
      if (!localStorage.getItem(HINT_KEY)) {
        localStorage.setItem(HINT_KEY, "1");
        window.setTimeout(() => {
          if (window.scrollY < window.innerHeight * 0.4) showHint("The desk objects respond.", 2600);
        }, 2800);
        window.setTimeout(() => {
          if (window.scrollY < window.innerHeight * 0.4) showHint("A fast swipe scatters the seeds.", 2600);
        }, 8000);
      }
    } catch (error) {
      /* storage unavailable: skip the once-only hints */
    }
  }

  function initParallax() {
    if (!motion || !finePointer) return;
    const sky = document.querySelector(".sky-wash");
    const shift = document.querySelector(".scene-shift");
    if (!sky || !shift) return;
    let tx = 0;
    let ty = 0;
    let cx = 0;
    let cy = 0;
    window.addEventListener("pointermove", (event) => {
      if (event.pointerType && event.pointerType !== "mouse") return;
      cx = event.clientX / window.innerWidth - 0.5;
      cy = event.clientY / window.innerHeight - 0.5;
    });
    function frame() {
      tx += (cx - tx) * 0.06;
      ty += (cy - ty) * 0.06;
      const damp = root.classList.contains("is-zooming") ? 0.15 : 1;
      sky.style.transform = `translate3d(${(-tx * 26 * damp).toFixed(2)}px, ${(-ty * 16 * damp).toFixed(2)}px, 0)`;
      shift.style.transform = `translate3d(${(tx * 12 * damp).toFixed(2)}px, ${(ty * 8 * damp).toFixed(2)}px, 0)`;
      requestAnimationFrame(frame);
    }
    frame();
  }

  function initSeeds() {
    const canvas = document.getElementById("seed-field");
    const api = {
      skills: [],
      setSkills(list) {
        this.skills = Array.isArray(list) ? list.map((item) => String(item)) : [];
      },
    };
    window.deskSeeds = api;
    if (!motion || !canvas) return;

    const context = canvas.getContext("2d");
    const seeds = [];
    const count = 9;
    let width = 0;
    let height = 0;
    let gustX = 0;
    let gustY = 0;
    let last = null;
    let running = true;

    function resize() {
      const rect = canvas.getBoundingClientRect();
      const dpr = Math.min(window.devicePixelRatio || 1, 1.5);
      width = Math.max(1, rect.width);
      height = Math.max(1, rect.height);
      canvas.width = Math.round(width * dpr);
      canvas.height = Math.round(height * dpr);
      context.setTransform(dpr, 0, 0, dpr, 0, 0);
    }

    function resetSeed(seed, scatter) {
      seed.x = Math.random() * width;
      seed.y = Math.random() * height;
      seed.vx = 0;
      seed.vy = 0;
      seed.phase = Math.random() * Math.PI * 2;
      seed.size = 3.2 + Math.random() * 3.4;
      seed.spin = (Math.random() - 0.5) * 0.4;
      if (scatter) {
        seed.x = Math.random() * width;
        seed.y = Math.random() * height;
      }
    }

    function layout() {
      resize();
      if (!seeds.length) {
        for (let i = 0; i < count; i += 1) {
          const seed = {};
          resetSeed(seed, false);
          seeds.push(seed);
        }
      }
    }

    layout();
    window.addEventListener("resize", layout);
    if ("ResizeObserver" in window) {
      const observer = new ResizeObserver(() => layout());
      observer.observe(canvas);
    }

    window.addEventListener("pointermove", (event) => {
      if (!last) {
        last = { x: event.clientX, y: event.clientY, t: event.timeStamp };
        return;
      }
      const dt = Math.max(16, event.timeStamp - last.t);
      const dx = event.clientX - last.x;
      const dy = event.clientY - last.y;
      const speed = Math.hypot(dx, dy) / dt;
      if (speed > 0.85) {
        gustX += dx * 0.35;
        gustY += dy * 0.35;
      }
      last = { x: event.clientX, y: event.clientY, t: event.timeStamp };
    });

    document.addEventListener("visibilitychange", () => {
      running = !document.hidden;
    });

    let time = 0;
    function frame() {
      requestAnimationFrame(frame);
      if (!running || root.classList.contains("is-zooming") && window.deskZoom > 0.82) return;
      time += 0.016;
      context.clearRect(0, 0, width, height);
      gustX *= 0.92;
      gustY *= 0.92;
      seeds.forEach((seed) => {
        seed.vx = (seed.vx + gustX * 0.04) * 0.96;
        seed.vy = (seed.vy + gustY * 0.04) * 0.96;
        seed.x += seed.vx + Math.sin(time * 0.7 + seed.phase) * 0.18;
        seed.y += seed.vy + Math.cos(time * 0.55 + seed.phase) * 0.12;
        if (seed.x < -20) seed.x = width + 20;
        if (seed.x > width + 20) seed.x = -20;
        if (seed.y < -20) seed.y = height + 20;
        if (seed.y > height + 20) seed.y = -20;
        context.save();
        context.translate(seed.x, seed.y);
        context.rotate(Math.sin(time + seed.phase) * seed.spin);
        context.beginPath();
        context.ellipse(0, 0, seed.size * 0.55, seed.size, 0, 0, Math.PI * 2);
        context.fillStyle = "#f4f7fb";
        context.fill();
        context.lineWidth = 1.2;
        context.strokeStyle = "#0b1f3a";
        context.stroke();
        context.beginPath();
        context.arc(seed.size * 0.15, 0, 1.1, 0, Math.PI * 2);
        context.fillStyle = "#2f6fed";
        context.fill();
        context.restore();
      });
    }
    frame();
  }

  initMenu();
  initGlides();
  initCopy();
  initHotspots();
  initDayAndFade();
  initCaptions();
  initWords();
  initCursor();
  initParallax();
  initSeeds();
})();
