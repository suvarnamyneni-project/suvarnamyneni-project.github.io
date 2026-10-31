/**
 * Site interactions that do not own the laptop zoom.
 * Catalog: cursor, captions, hints, glass menu, day colour,
 * copy button, glides, parallax, seeds, headline words, hotspots.
 * Skill names stay empty until a real list is passed to
 * window.deskSeeds.setSkills. This file never draws those names.
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

  function initModeDock() {
    const dock = document.querySelector(".mode-switch-dock");
    if (!dock) return;
    const obstacles = [document.querySelector(".scroll-pill"), document.querySelector(".contact-scene .email-bar")].filter(Boolean);
    const credit = document.querySelector(".contact-credit");
    if (credit) {
      obstacles.push({
        getBoundingClientRect() {
          const range = document.createRange();
          range.selectNodeContents(credit);
          return range.getBoundingClientRect();
        },
      });
    }
    const place = () => {
      dock.style.bottom = "calc(18px + env(safe-area-inset-bottom))";
      const dockRect = dock.getBoundingClientRect();
      let lift = 0;
      obstacles.forEach((el) => {
        const rect = el.getBoundingClientRect();
        const overlapX = Math.min(dockRect.right, rect.right) - Math.max(dockRect.left, rect.left);
        const overlapY = Math.min(dockRect.bottom, rect.bottom) - Math.max(dockRect.top, rect.top);
        if (overlapX > 4 && overlapY > 4) lift = Math.max(lift, dockRect.bottom - rect.top + 12);
      });
      if (lift) dock.style.bottom = `calc(${18 + lift}px + env(safe-area-inset-bottom))`;
    };
    place();
    window.addEventListener("scroll", place, { passive: true });
    window.addEventListener("resize", place);
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
      button.classList.toggle("is-copied", ok);
      if (!ok) showToast("Could not copy the email address.");
      window.clearTimeout(timer);
      timer = window.setTimeout(() => {
        button.textContent = "Copy";
        button.classList.remove("is-copied");
      }, 1600);
    });
  }

  // Image fractions [left, top, width, height] of the current painting.
  // Wide is the 16:9 desk. Stack is the 9:16 desk. Screen matches the inner-glass AABB.
  const SPOTS_WIDE = {
    screen: [46.13, 44.26, 10.17, 11.86],
    plane: [12.6, 69.3, 14.0, 7.6],
    coffee: [37.6, 54.4, 5.0, 7.8],
    sketch: [35.1, 61.8, 9.9, 12.0],
    keys: [43.0, 59.8, 14.1, 8.0],
    notebook: [45.4, 68.0, 11.0, 6.2],
    kit: [57.3, 46.9, 8.5, 15.3],
    glass: [56.4, 62.6, 7.0, 10.3],
    phone: [63.1, 57.6, 5.1, 12.2],
    plant: [65.6, 52.4, 5.1, 12.0],
  };
  // The 9:16 crop leaves the paper plane outside the frame, so it has no stack box.
  const SPOTS_STACK = {
    screen: [40.85, 52.85, 19.64, 7.69],
    coffee: [24.0, 58.0, 12.0, 6.5],
    sketch: [19.0, 65.6, 20.2, 5.9],
    keys: [42.6, 62.8, 22.8, 5.2],
    notebook: [39.7, 68.2, 21.9, 4.3],
    kit: [61.6, 55.2, 13.9, 8.3],
    glass: [61.4, 64.2, 14.1, 7.2],
    phone: [72.5, 59.7, 10.3, 9.1],
    plant: [76.1, 57.8, 12.0, 7.5],
  };
  const NARROW_ART = "(max-width: 600px)";
  function spotBoxes() {
    return window.matchMedia(NARROW_ART).matches ? SPOTS_STACK : SPOTS_WIDE;
  }

  function coverBox(img) {
    const elW = img.offsetWidth || 1;
    const elH = img.offsetHeight || 1;
    const nw = img.naturalWidth || 2400;
    const nh = img.naturalHeight || 1350;
    const scale = Math.max(elW / nw, elH / nh);
    return {
      elW,
      elH,
      ox: (elW - nw * scale) / 2,
      oy: (elH - nh * scale) / 2,
      drawW: nw * scale,
      drawH: nh * scale,
    };
  }

  function mapSpot(box, x, y, w, h) {
    return {
      left: ((box.ox + box.drawW * x / 100) / box.elW) * 100,
      top: ((box.oy + box.drawH * y / 100) / box.elH) * 100,
      width: (box.drawW * w / 100 / box.elW) * 100,
      height: (box.drawH * h / 100 / box.elH) * 100,
    };
  }

  function placeHeroSpots() {
    const img = document.querySelector(".scene img");
    if (!img) return;
    const box = coverBox(img);
    document.querySelectorAll(".hotspot").forEach((spot) => {
      const named = [...spot.classList].find((item) => item.indexOf("hotspot-") === 0);
      const name = named ? named.slice("hotspot-".length) : "";
      if (!name) return;
      const frac = spotBoxes()[name];
      if (!frac) {
        spot.hidden = true;
        spot.dataset.unplaced = "1";
        return;
      }
      delete spot.dataset.unplaced;
      const placed = mapSpot(box, ...frac);
      spot.style.left = `${placed.left}%`;
      spot.style.top = `${placed.top}%`;
      spot.style.width = `${placed.width}%`;
      spot.style.height = `${placed.height}%`;
    });
    const glow = document.querySelector(".screen-glow");
    if (glow) {
      const screen = spotBoxes().screen;
      const placed = mapSpot(box, screen[0], screen[1], screen[2], screen[3]);
      glow.style.left = `${placed.left}%`;
      glow.style.top = `${placed.top}%`;
      glow.style.width = `${placed.width}%`;
      glow.style.height = `${placed.height}%`;
    }
    const steam = document.querySelector(".steam");
    if (steam) {
      const [x, y, w] = spotBoxes().coffee;
      const placed = mapSpot(box, x + w * 0.42, y - 1.6, 0, 0);
      steam.style.left = `${placed.left}%`;
      steam.style.top = `${placed.top}%`;
    }
    requestAnimationFrame(() => {
      const hero = document.querySelector(".hero-stage");
      const zooming = root.classList.contains("is-zooming") || (hero && hero.classList.contains("is-unfolding"));
      document.querySelectorAll(".hotspot").forEach((spot) => {
        if (spot.dataset.unplaced) {
          spot.hidden = true;
          spot.tabIndex = -1;
          return;
        }
        /* hidden collapses the box to 0, so a spot cropped during the
           laptop zoom could never measure as visible again. Clear it
           before reading geometry. While the scene is scaled, boxes
           sit offscreen on purpose; CSS already ignores them. */
        spot.hidden = false;
        if (zooming) {
          spot.removeAttribute("tabindex");
          return;
        }
        const rect = spot.getBoundingClientRect();
        const seenW = Math.max(0, Math.min(rect.right, window.innerWidth) - Math.max(rect.left, 0));
        const seenH = Math.max(0, Math.min(rect.bottom, window.innerHeight) - Math.max(rect.top, 0));
        const cropped = rect.width < 2 || seenW * seenH < rect.width * rect.height * 0.5;
        spot.hidden = cropped;
        if (cropped) spot.tabIndex = -1;
        else spot.removeAttribute("tabindex");
      });
    });
  }

  window.placeHeroSpots = placeHeroSpots;

  function initHotspots() {
    placeHeroSpots();
    window.addEventListener("resize", placeHeroSpots);
    const heroImg = document.querySelector(".scene img");
    if (heroImg && !heroImg.complete) heroImg.addEventListener("load", placeHeroSpots);
    const spots = [...document.querySelectorAll(".hotspot")];
    const box = document.getElementById("select-box");
    const card = document.getElementById("spot-card");
    const hint = document.getElementById("hover-hint");
    const hero = document.querySelector(".hero-stage");
    if (!spots.length || !box || !card || !hero) return;

    root.classList.add("has-spots");
    const labelEl = card.querySelector(".spot-label");
    const storyEl = card.querySelector(".spot-story");
    const screenSpot = document.querySelector(".hotspot-screen");
    let target = null;
    let running = false;
    let pointerKind = "mouse";
    const pos = { x: 0, y: 0, w: 80, h: 48, vx: 0, vy: 0, vw: 0, vh: 0, ready: false };

    const phoneHint = window.matchMedia("(max-width: 900px)").matches;
    if (hint && phoneHint) hint.textContent = "Tap an object";

    function springTo(current, velocity, dest) {
      if (!motion) return [dest, 0];
      const velocityNext = (velocity + (dest - current) * 0.22) * 0.66;
      return [current + velocityNext, velocityNext];
    }

    function placeCard(rect) {
      const width = card.offsetWidth || 250;
      const height = card.offsetHeight || 78;
      let x = rect.right + 14;
      let y = rect.top - 6;
      if (x + width > window.innerWidth - 12) x = rect.left - 14 - width;
      if (x < 8) x = Math.min(window.innerWidth - width - 8, rect.left);
      if (y + height > window.innerHeight - 12) y = window.innerHeight - height - 12;
      if (y < 8) y = 8;
      card.style.left = `${x}px`;
      card.style.top = `${y}px`;
    }

    function frame() {
      const zooming = root.classList.contains("is-zooming") || hero.classList.contains("is-unfolding");
      if (!target || zooming) {
        box.hidden = true;
        card.classList.remove("is-on");
        hero.classList.remove("is-laptop");
        running = false;
        return;
      }
      const rect = target.getBoundingClientRect();
      if (rect.width < 2) {
        running = false;
        return;
      }
      if (!pos.ready) {
        pos.x = rect.left;
        pos.y = rect.top;
        pos.w = rect.width;
        pos.h = rect.height;
        pos.vx = pos.vy = pos.vw = pos.vh = 0;
        pos.ready = true;
      } else {
        [pos.x, pos.vx] = springTo(pos.x, pos.vx, rect.left);
        [pos.y, pos.vy] = springTo(pos.y, pos.vy, rect.top);
        [pos.w, pos.vw] = springTo(pos.w, pos.vw, rect.width);
        [pos.h, pos.vh] = springTo(pos.h, pos.vh, rect.height);
      }
      box.hidden = false;
      box.style.left = `${pos.x}px`;
      box.style.top = `${pos.y}px`;
      box.style.width = `${pos.w}px`;
      box.style.height = `${pos.h}px`;
      placeCard({ left: pos.x, top: pos.y, right: pos.x + pos.w, width: pos.w, height: pos.h });
      requestAnimationFrame(frame);
    }

    function showSpot(spot) {
      if (hint && !window.matchMedia("(max-width: 900px)").matches) hint.classList.add("is-done");
      if (screenSpot) screenSpot.classList.remove("is-hinting");
      const changed = target !== spot;
      target = spot;
      labelEl.textContent = spot.dataset.label || "";
      storyEl.textContent = spot.dataset.story || "";
      card.classList.add("is-on");
      hero.classList.toggle("is-laptop", spot.classList.contains("hotspot-screen"));
      if (changed && !running) {
        running = true;
        requestAnimationFrame(frame);
      }
    }

    function clearSpot(spot) {
      if (spot && target !== spot) return;
      target = null;
      hero.classList.remove("is-laptop");
      card.classList.remove("is-on");
    }

    function activate(spot, event) {
      const cardId = spot.dataset.card;
      const pathId = spot.dataset.path;
      const href = spot.getAttribute("href") || "";
      if (cardId && window.scrollToCard) {
        event.preventDefault();
        window.scrollToCard(cardId);
        return;
      }
      if (pathId && window.openPathStop) {
        event.preventDefault();
        window.openPathStop(pathId);
        return;
      }
      if (href.startsWith("#")) {
        const dest = document.querySelector(href);
        if (!dest) return;
        event.preventDefault();
        glideTo(dest, href);
      }
    }

    spots.forEach((spot) => {
      spot.addEventListener("pointerdown", (event) => {
        pointerKind = event.pointerType || "mouse";
      });
      spot.addEventListener("pointerenter", (event) => {
        if (event.pointerType === "touch") return;
        showSpot(spot);
      });
      spot.addEventListener("pointerleave", (event) => {
        if (event.pointerType === "touch") return;
        if (document.activeElement === spot) return;
        clearSpot(spot);
      });
      spot.addEventListener("focus", () => showSpot(spot));
      spot.addEventListener("blur", () => clearSpot(spot));
      spot.addEventListener("click", (event) => {
        if (pointerKind === "touch") {
          if (spot.dataset.armed !== "true") {
            event.preventDefault();
            spots.forEach((item) => {
              delete item.dataset.armed;
            });
            spot.dataset.armed = "true";
            showSpot(spot);
            return;
          }
        }
        activate(spot, event);
      });
    });

    document.addEventListener("keydown", () => {
      pointerKind = "key";
    });
    document.addEventListener("pointerdown", (event) => {
      if (event.target.closest(".hotspot")) return;
      spots.forEach((spot) => {
        delete spot.dataset.armed;
      });
      if (document.activeElement && document.activeElement.classList && document.activeElement.classList.contains("hotspot")) return;
      clearSpot();
    });
  }

  function initDayAndFade() {
    const work = document.getElementById("work");
    let lastStep = -1;
    const phoneQuery = window.matchMedia("(max-width: 759px)");
    function paint() {
      const max = document.documentElement.scrollHeight - window.innerHeight;
      const t = max > 0 ? clamp01(window.scrollY / max) : 0;
      const step = Math.round(t * 24);
      if (step !== lastStep) {
        lastStep = step;
        const tone = step / 24;
        root.style.setProperty("--bg", mixHex("#fdf0e2", "#f6e0cc", tone));
        root.style.setProperty("--paper", mixHex("#fdf0e2", "#f8e6d4", tone));
      }
      if (work && phoneQuery.matches) {
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
    root.classList.add("ready");
  }

  function initCaptions() {
    document.querySelectorAll(".project").forEach((card) => {
      const title = card.querySelector("h3");
      if (title) card.setAttribute("data-caption", title.textContent.trim());
    });
    const linkedin = document.querySelector(".email-bar a[href*='linkedin'], .contact-links a[href*='linkedin']");
    const wix = document.querySelector(".contact-links a[href*='wixsite']");
    if (linkedin) linkedin.setAttribute("data-caption", "LinkedIn");
    if (wix) wix.setAttribute("data-caption", "Wix portfolio");
  }

  function initCursor() {
    if (!motion || !finePointer) return;
    const cursor = document.getElementById("cursor");
    const bubble = cursor ? cursor.querySelector(".cursor-bubble") : null;
    if (!cursor || !bubble) return;

    root.classList.add("has-fine-cursor");
    let clientX = window.innerWidth * 0.46;
    let clientY = window.innerHeight * 0.42;
    let caption = "";

    function renderBubble() {
      const text = caption;
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

    document.addEventListener("pointermove", (event) => {
      if (event.pointerType && event.pointerType !== "mouse") return;
      cursor.hidden = false;
      placed = true;
      place(event.clientX, event.clientY);
      const hot = event.target.closest("a, button, [data-caption]");
      cursor.classList.toggle("is-hot", Boolean(hot));
      const cap = event.target.closest("[data-caption]");
      caption = cap ? cap.getAttribute("data-caption") || "" : "";
      renderBubble();
    });

    document.addEventListener("pointerdown", (event) => {
      if (event.pointerType && event.pointerType !== "mouse") return;
      cursor.classList.add("is-down");
    });
    document.addEventListener("pointerup", () => cursor.classList.remove("is-down"));
    document.addEventListener("pointerout", (event) => {
      if (!event.relatedTarget) cursor.hidden = true;
    });

  }

  function initParallax() {
    if (!motion || !finePointer) return;
    const sky = document.querySelector(".sky-wash");
    const tilt = document.querySelector(".scene-tilt");
    if (!sky || !tilt) return;
    let tx = 0;
    let ty = 0;
    let cx = 0;
    let cy = 0;
    let raf = 0;
    let heroOn = true;
    const hero = document.querySelector(".hero-stage");
    if (hero && "IntersectionObserver" in window) {
      const watch = new IntersectionObserver((entries) => {
        heroOn = entries.some((entry) => entry.isIntersecting);
        if (!heroOn && raf) {
          cancelAnimationFrame(raf);
          raf = 0;
        }
      });
      watch.observe(hero);
    }
    function frame() {
      raf = 0;
      if (!heroOn) return;
      tx += (cx - tx) * 0.08;
      ty += (cy - ty) * 0.08;
      const zooming = root.classList.contains("is-zooming");
      sky.style.transform = `translate3d(${(-tx * 22).toFixed(2)}px, ${(-ty * 12).toFixed(2)}px, 0)`;
      tilt.style.transform = zooming
        ? ""
        : `rotateX(${(-ty * 1.15).toFixed(3)}deg) rotateY(${(tx * 1.5).toFixed(3)}deg)`;
      if (Math.abs(cx - tx) > 0.001 || Math.abs(cy - ty) > 0.001) raf = requestAnimationFrame(frame);
    }
    window.addEventListener("pointermove", (event) => {
      if (event.pointerType && event.pointerType !== "mouse") return;
      cx = event.clientX / window.innerWidth - 0.5;
      cy = event.clientY / window.innerHeight - 0.5;
      if (!raf && heroOn) raf = requestAnimationFrame(frame);
    });
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
    const cursor = document.getElementById("cursor");
    const phone = window.matchMedia("(max-width: 900px)");
    const seeds = [];
    const obstacles = [];
    let width = 0;
    let height = 0;
    let gustX = 0;
    let gustY = 0;
    let last = null;
    let running = true;
    let onScreen = true;
    let compact = phone.matches;
    let nearSeed = false;
    let obstacleFrame = 0;

    function resize() {
      const rect = canvas.getBoundingClientRect();
      const dpr = Math.min(window.devicePixelRatio || 1, 1.5);
      width = Math.max(1, rect.width);
      height = Math.max(1, rect.height);
      canvas.width = Math.round(width * dpr);
      canvas.height = Math.round(height * dpr);
      context.setTransform(dpr, 0, 0, dpr, 0, 0);
    }

    function readObstacles() {
      const canvasRect = canvas.getBoundingClientRect();
      const specs = [
        [".hero-copy h1, .hero-desk-title", 24],
        [".hero-sub", 24],
        [".site-nav", 12],
        [".brand-chip", 12],
        [".scroll-pill", 12],
      ];
      obstacles.length = 0;
      specs.forEach(([selector, pad]) => {
        document.querySelectorAll(selector).forEach((el) => {
          if (el.closest("[hidden]")) return;
          const rect = el.getBoundingClientRect();
          if (rect.width < 2 || rect.height < 2) return;
          obstacles.push({
            l: rect.left - canvasRect.left - pad,
            t: rect.top - canvasRect.top - pad,
            r: rect.right - canvasRect.left + pad,
            b: rect.bottom - canvasRect.top + pad,
          });
        });
      });
    }

    function bodyOf(seed) {
      const h = seed.height;
      return {
        l: seed.x - h * 0.4,
        t: seed.y - h * 0.55,
        r: seed.x + h * 0.4,
        b: seed.y + h * 0.5,
      };
    }

    function pressure(box) {
      let fade = 1;
      let x = 0;
      let y = 0;
      obstacles.forEach((zone) => {
        const dxOut = Math.max(zone.l - box.r, box.l - zone.r, 0);
        const dyOut = Math.max(zone.t - box.b, box.t - zone.b, 0);
        const dist = dxOut === 0 && dyOut === 0 ? 0 : Math.hypot(dxOut, dyOut);
        if (dist === 0) fade = 0;
        else if (dist < 10) fade = Math.min(fade, dist / 10);
        if (dist >= 10) return;
        const cx = (box.l + box.r) * 0.5 - (zone.l + zone.r) * 0.5;
        const cy = (box.t + box.b) * 0.5 - (zone.t + zone.b) * 0.5;
        const len = Math.hypot(cx, cy);
        const px = len < 0.5 ? 1 : cx / len;
        const py = len < 0.5 ? -0.25 : cy / len;
        x += px * 1.35;
        y += py * 1.35;
      });
      return { fade, x, y };
    }

    function blocked(seed) {
      const box = bodyOf(seed);
      return obstacles.some((zone) => box.r > zone.l && box.l < zone.r && box.b > zone.t && box.t < zone.b);
    }

    function seedHeight() {
      return compact ? 11 + Math.random() * 4 : 14 + Math.random() * 6;
    }

    function resetSeed(seed) {
      seed.phase = Math.random() * Math.PI * 2;
      seed.height = seedHeight();
      seed.filaments = 6 + Math.floor(Math.random() * 5);
      seed.flare = Array.from({ length: seed.filaments }, () => Math.random() * 0.08);
      seed.drift = 0.12 + Math.random() * 0.08;
      seed.heading = Math.random() * Math.PI * 2;
      seed.gustX = 0;
      seed.gustY = 0;
      let placed = false;
      for (let attempt = 0; attempt < 16; attempt += 1) {
        seed.x = 28 + Math.random() * Math.max(1, width - 56);
        seed.y = 28 + Math.random() * Math.max(1, height - 56);
        if (!blocked(seed)) {
          placed = true;
          break;
        }
      }
      if (!placed) {
        seed.x = Math.random() < 0.5 ? width * 0.08 : width * 0.92;
        seed.y = height * 0.16;
      }
    }

    function layout() {
      resize();
      readObstacles();
      const next = phone.matches;
      const crossed = next !== compact;
      compact = next;
      if (crossed) seeds.forEach((seed) => { seed.height = seedHeight(); });
      const want = compact ? 4 : 6;
      while (seeds.length > want) seeds.pop();
      while (seeds.length < want) {
        const seed = {};
        resetSeed(seed);
        seeds.push(seed);
      }
    }

    function drawSeed(seed, alpha, near) {
      const h = seed.height;
      const hub = -h * 0.18;
      const seedY = h * 0.38;
      const filamentLen = h * 0.34;
      const sway = Math.sin(time * 0.55 + seed.phase) * 0.18;
      context.save();
      context.translate(seed.x, seed.y);
      context.rotate(sway);
      context.globalAlpha = alpha;

      const glowR = h * 0.5;
      const peak = near ? 0.78 : 0.42;
      const glow = context.createRadialGradient(0, hub, 0, 0, hub, glowR);
      glow.addColorStop(0, `rgba(255, 252, 247, ${peak})`);
      glow.addColorStop(0.55, `rgba(255, 250, 242, ${peak * 0.35})`);
      glow.addColorStop(1, "rgba(255, 250, 242, 0)");
      context.fillStyle = glow;
      context.beginPath();
      context.arc(0, hub, glowR, 0, Math.PI * 2);
      context.fill();

      context.strokeStyle = "rgba(255, 252, 248, 0.94)";
      context.lineWidth = Math.max(1, h * 0.065);
      context.lineCap = "round";
      for (let i = 0; i < seed.filaments; i += 1) {
        const t = seed.filaments === 1 ? 0.5 : i / (seed.filaments - 1);
        const ang = -Math.PI * 0.92 + Math.PI * 0.84 * t;
        const len = filamentLen * (1 + seed.flare[i]);
        const tipX = Math.cos(ang) * len;
        const tipY = hub + Math.sin(ang) * len;
        const bend = Math.sin(ang + seed.phase) * h * 0.035;
        context.beginPath();
        context.moveTo(0, hub);
        context.quadraticCurveTo(tipX * 0.55 + bend, hub + (tipY - hub) * 0.55, tipX, tipY);
        context.stroke();
      }

      context.beginPath();
      context.arc(0, hub, Math.max(0.9, h * 0.04), 0, Math.PI * 2);
      context.fillStyle = "rgba(255, 252, 247, 0.96)";
      context.fill();

      context.beginPath();
      context.moveTo(0, hub + 1);
      context.quadraticCurveTo(h * 0.05, h * 0.08, 0, seedY - h * 0.08);
      context.strokeStyle = "rgba(92, 64, 48, 0.78)";
      context.lineWidth = Math.max(0.9, h * 0.05);
      context.stroke();

      context.beginPath();
      context.ellipse(0, seedY, Math.max(1.1, h * 0.055), Math.max(1.8, h * 0.1), 0.25, 0, Math.PI * 2);
      context.fillStyle = "rgba(48, 32, 24, 0.94)";
      context.fill();
      context.restore();
    }

    layout();
    window.addEventListener("resize", layout);
    if (typeof phone.addEventListener === "function") phone.addEventListener("change", layout);
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
      if (running && onScreen) startSeeds();
    });

    let time = 0;
    let pointer = null;
    const skillNode = document.getElementById("seed-skill");
    window.addEventListener("pointermove", (event) => {
      const rect = canvas.getBoundingClientRect();
      pointer = { x: event.clientX - rect.left, y: event.clientY - rect.top, v: Math.hypot(gustX, gustY) };
    }, { passive: true });

    let seedFrame = 0;
    function startSeeds() {
      if (seedFrame || !running || !onScreen) return;
      seedFrame = requestAnimationFrame(frame);
    }

    function clearNear() {
      if (!nearSeed) return;
      nearSeed = false;
      if (cursor) cursor.classList.remove("is-seed");
    }

    const heroStage = document.querySelector(".hero-stage");
    if (heroStage && "IntersectionObserver" in window) {
      const watch = new IntersectionObserver((entries) => {
        onScreen = entries.some((entry) => entry.isIntersecting);
        if (onScreen) startSeeds();
        else clearNear();
      });
      watch.observe(heroStage);
    }

    function frame() {
      seedFrame = 0;
      if (!running || !onScreen) return;
      seedFrame = requestAnimationFrame(frame);
      if (root.classList.contains("is-zooming") && window.deskZoom > 0.82) return;
      time += 0.016;
      if (obstacleFrame % 15 === 0) readObstacles();
      obstacleFrame += 1;
      context.clearRect(0, 0, width, height);
      gustX *= 0.92;
      gustY *= 0.92;
      const slow = !pointer || pointer.v < 18;
      let nextCaught = -1;
      let best = 34 * 34;
      if (pointer && slow) {
        seeds.forEach((seed, index) => {
          const dx = pointer.x - seed.x;
          const dy = pointer.y - seed.y;
          const dist = dx * dx + dy * dy;
          if (dist < best) {
            best = dist;
            nextCaught = index;
          }
        });
      }
      let anyNear = false;
      seeds.forEach((seed, index) => {
        const caught = nextCaught === index && pointer;
        if (caught) {
          seed.x += (pointer.x - seed.x) * 0.18;
          seed.y += (pointer.y - 18 - seed.y) * 0.18;
        } else {
          seed.heading += Math.sin(time * 0.15 + seed.phase) * 0.003;
          seed.gustX = (seed.gustX + gustX * 0.04) * 0.96;
          seed.gustY = (seed.gustY + gustY * 0.04) * 0.96;
          let vx = Math.cos(seed.heading) * seed.drift + seed.gustX;
          let vy = Math.sin(seed.heading) * seed.drift * 0.72 + seed.gustY;
          const push = pressure(bodyOf(seed));
          if (push.fade === 0) {
            vx += push.x * 1.6;
            vy += push.y * 1.6;
          } else if (push.fade < 1) {
            vx += push.x;
            vy += push.y;
          }
          seed.x += vx;
          seed.y += vy;
        }
        const margin = seed.height + 8;
        if (seed.x < -margin) seed.x = width + margin;
        if (seed.x > width + margin) seed.x = -margin;
        if (seed.y < -margin) seed.y = height + margin;
        if (seed.y > height + margin) seed.y = -margin;
        let near = false;
        if (pointer) {
          const dx = pointer.x - seed.x;
          const dy = pointer.y - seed.y;
          near = dx * dx + dy * dy < 70 * 70;
          if (near) anyNear = true;
        }
        const fade = pressure(bodyOf(seed)).fade;
        if (fade > 0.02) drawSeed(seed, fade, near);
      });
      if (cursor && anyNear !== nearSeed) {
        nearSeed = anyNear;
        cursor.classList.toggle("is-seed", anyNear);
      }
      if (skillNode) {
        const show = nextCaught > -1 && api.skills.length && pointer;
        skillNode.hidden = !show;
        if (show) {
          skillNode.textContent = api.skills[nextCaught % api.skills.length];
          skillNode.style.left = `${pointer.x + 16}px`;
          skillNode.style.top = `${pointer.y - 28}px`;
        }
      }
    }
    startSeeds();
  }

  function initFieldTags() {
    const tags = [...document.querySelectorAll("#about .float-tag")];
    const shapes = [...document.querySelectorAll("#about .orbit-shape")];
    const about = document.getElementById("about");
    const portrait = document.querySelector("#about .portrait");
    if (!tags.length || !about || !portrait) return;
    const reduce = window.matchMedia("(prefers-reduced-motion: reduce)").matches;

    const reveal = () => about.classList.add("tags-in");
    if (reduce || !("IntersectionObserver" in window)) reveal();
    else {
      const observer = new IntersectionObserver((entries) => {
        if (!entries.some((entry) => entry.isIntersecting)) return;
        reveal();
        observer.disconnect();
      }, { threshold: 0.2 });
      observer.observe(about);
    }

    let dragging = false;
    if (!reduce) {
      about.addEventListener("pointermove", (event) => {
        if (dragging || (event.pointerType && event.pointerType !== "mouse")) return;
        const rect = portrait.getBoundingClientRect();
        const nx = (event.clientX - rect.left - rect.width / 2) / Math.max(1, rect.width);
        const ny = (event.clientY - rect.top - rect.height / 2) / Math.max(1, rect.height);
        portrait.style.setProperty("--tag-x", Math.max(-1, Math.min(1, nx)).toFixed(3));
        portrait.style.setProperty("--tag-y", Math.max(-1, Math.min(1, ny)).toFixed(3));
      }, { passive: true });
      about.addEventListener("pointerleave", () => {
        if (dragging) return;
        portrait.style.setProperty("--tag-x", "0");
        portrait.style.setProperty("--tag-y", "0");
      });
    }

    tags.forEach((tag) => {
      let drag = null;
      let x = 0;
      let y = 0;
      let vx = 0;
      let vy = 0;
      let frame = 0;
      const place = (px, py) => {
        tag.style.setProperty("--drag-x", `${px.toFixed(1)}px`);
        tag.style.setProperty("--drag-y", `${py.toFixed(1)}px`);
      };
      const rest = () => {
        const tx = parseFloat(portrait.style.getPropertyValue("--tag-x") || "0") * 16;
        const ty = parseFloat(portrait.style.getPropertyValue("--tag-y") || "0") * 12;
        return [Number.isFinite(tx) ? tx : 0, Number.isFinite(ty) ? ty : 0];
      };
      const settle = () => {
        if (frame) cancelAnimationFrame(frame);
        if (reduce) {
          x = 0;
          y = 0;
          place(0, 0);
          tag.classList.remove("is-drag", "is-held");
          dragging = tags.some((node) => node.classList.contains("is-drag"));
          return;
        }
        const step = () => {
          const [tx, ty] = rest();
          vx = (vx + (tx - x) * 0.16) * 0.74;
          vy = (vy + (ty - y) * 0.16) * 0.74;
          x += vx;
          y += vy;
          if (Math.hypot(x - tx, y - ty) < 0.6 && Math.hypot(vx, vy) < 0.6) {
            x = 0;
            y = 0;
            vx = 0;
            vy = 0;
            place(0, 0);
            tag.classList.remove("is-drag", "is-held");
            dragging = tags.some((node) => node.classList.contains("is-drag"));
            return;
          }
          place(x, y);
          frame = requestAnimationFrame(step);
        };
        frame = requestAnimationFrame(step);
      };
      tag.addEventListener("pointerdown", (event) => {
        if (event.button != null && event.button !== 0) return;
        if (event.pointerType === "touch") return;
        if (frame) cancelAnimationFrame(frame);
        const [tx, ty] = rest();
        x = tx;
        y = ty;
        place(x, y);
        dragging = true;
        tag.classList.add("is-drag", "is-held");
        tag.setPointerCapture(event.pointerId);
        drag = { id: event.pointerId, lx: event.clientX, ly: event.clientY, t: performance.now() };
      });
      tag.addEventListener("pointermove", (event) => {
        if (!drag || event.pointerId !== drag.id) return;
        const dx = event.clientX - drag.lx;
        const dy = event.clientY - drag.ly;
        const dt = Math.max(16, performance.now() - drag.t);
        vx = (dx / dt) * 16;
        vy = (dy / dt) * 16;
        x += dx;
        y += dy;
        drag.lx = event.clientX;
        drag.ly = event.clientY;
        drag.t = performance.now();
        place(x, y);
      });
      const end = (event) => {
        if (!drag || event.pointerId !== drag.id) return;
        drag = null;
        tag.classList.remove("is-held");
        settle();
      };
      tag.addEventListener("pointerup", end);
      tag.addEventListener("pointercancel", end);
    });

    if (reduce || !shapes.length) return;
    const orbit = shapes.map((shape, index) => ({
      shape,
      angle: index * 1.5 + 0.4,
      speed: 0.34 + (index % 3) * 0.08,
      rx: 0.4 + (index % 2) * 0.05,
      ry: 0.36 + ((index + 1) % 2) * 0.06,
      bob: index * 1.3,
    }));
    let last = performance.now();
    let seen = false;
    let flying = false;
    const fly = (now) => {
      if (!seen) {
        flying = false;
        return;
      }
      const dt = Math.min(0.05, (now - last) / 1000);
      last = now;
      const width = portrait.clientWidth;
      const height = portrait.clientHeight;
      orbit.forEach((item) => {
        item.angle += dt * item.speed;
        const px = width * (0.5 + Math.cos(item.angle) * item.rx) - item.shape.offsetWidth / 2;
        const py = height * (0.46 + Math.sin(item.angle) * item.ry) - item.shape.offsetHeight / 2 + Math.sin(now / 680 + item.bob) * 10;
        const tilt = Math.sin(item.angle * 2) * 14;
        item.shape.style.transform = `translate(${px.toFixed(1)}px, ${py.toFixed(1)}px) rotate(${tilt.toFixed(1)}deg)`;
      });
      requestAnimationFrame(fly);
    };
    const startFly = () => {
      if (flying || !seen) return;
      flying = true;
      last = performance.now();
      requestAnimationFrame(fly);
    };
    if ("IntersectionObserver" in window) {
      const watch = new IntersectionObserver((entries) => {
        seen = entries.some((entry) => entry.isIntersecting);
        if (seen) startFly();
      }, { rootMargin: "120px" });
      watch.observe(portrait);
    } else {
      seen = true;
      startFly();
    }
  }

  window.deskCopy = copyEmail;
  window.deskToast = showToast;

  initMenu();
  initModeDock();
  initFieldTags();
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
