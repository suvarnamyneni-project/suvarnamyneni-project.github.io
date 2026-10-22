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

  const SPOT_BOXES = {
    plane: [23.0, 14.0, 9.2, 7.6],
    screen: [42.24, 19.44, 15.18, 17.23],
    laptop: [37.6, 36.0, 22.0, 5.4],
    keys: [38.4, 41.2, 19.6, 6.6],
    coffee: [30.0, 33.4, 6.8, 10.4],
    sketch: [26.0, 46.2, 13.6, 13.2],
    notebook: [41.6, 48.4, 16.4, 12.8],
    glass: [58.2, 44.0, 9.4, 17.0],
    kit: [59.2, 22.4, 14.2, 19.0],
    phone: [68.0, 38.8, 6.0, 16.0],
    plant: [71.6, 30.0, 7.6, 16.4],
  };

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
      const placed = mapSpot(box, ...SPOT_BOXES[name]);
      spot.style.left = `${placed.left}%`;
      spot.style.top = `${placed.top}%`;
      spot.style.width = `${placed.width}%`;
      spot.style.height = `${placed.height}%`;
    });
    const glow = document.querySelector(".screen-glow");
    if (glow) {
      const placed = mapSpot(box, 42.24, 19.44, 15.18, 17.23);
      glow.style.left = `${placed.left}%`;
      glow.style.top = `${placed.top}%`;
      glow.style.width = `${placed.width}%`;
      glow.style.height = `${placed.height}%`;
    }
    const steam = document.querySelector(".steam");
    if (steam) {
      const [x, y, w] = SPOT_BOXES.coffee;
      const placed = mapSpot(box, x + w * 0.42, y - 1.6, 0, 0);
      steam.style.left = `${placed.left}%`;
      steam.style.top = `${placed.top}%`;
    }
    requestAnimationFrame(() => {
      document.querySelectorAll(".hotspot").forEach((spot) => {
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

    if (hint && window.matchMedia("(hover: none)").matches) hint.textContent = "Tap an object";
    if (screenSpot && motion) screenSpot.classList.add("is-hinting");
    window.setTimeout(() => {
      if (screenSpot) screenSpot.classList.remove("is-hinting");
    }, 3400);

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
      if (hint) hint.classList.add("is-done");
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
    function paint() {
      const max = document.documentElement.scrollHeight - window.innerHeight;
      const t = max > 0 ? clamp01(window.scrollY / max) : 0;
      root.style.setProperty("--bg", mixHex("#fdf0e2", "#f6e0cc", t));
      root.style.setProperty("--paper", mixHex("#fdf0e2", "#f8e6d4", t));
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
    window.addEventListener("pointermove", (event) => {
      if (event.pointerType && event.pointerType !== "mouse") return;
      cx = event.clientX / window.innerWidth - 0.5;
      cy = event.clientY / window.innerHeight - 0.5;
    });
    function frame() {
      tx += (cx - tx) * 0.08;
      ty += (cy - ty) * 0.08;
      const zooming = root.classList.contains("is-zooming");
      sky.style.transform = `translate3d(${(-tx * 22).toFixed(2)}px, ${(-ty * 12).toFixed(2)}px, 0)`;
      tilt.style.transform = zooming
        ? ""
        : `rotateX(${(-ty * 1.15).toFixed(3)}deg) rotateY(${(tx * 1.5).toFixed(3)}deg)`;
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
    let pointer = null;
    let caught = -1;
    const skillNode = document.getElementById("seed-skill");
    window.addEventListener("pointermove", (event) => {
      const rect = canvas.getBoundingClientRect();
      pointer = { x: event.clientX - rect.left, y: event.clientY - rect.top, v: Math.hypot(gustX, gustY) };
    }, { passive: true });

    function frame() {
      requestAnimationFrame(frame);
      if (!running || root.classList.contains("is-zooming") && window.deskZoom > 0.82) return;
      time += 0.016;
      context.clearRect(0, 0, width, height);
      gustX *= 0.92;
      gustY *= 0.92;
      const slow = !pointer || pointer.v < 18;
      let nextCaught = -1;
      seeds.forEach((seed, index) => {
        const homeX = seed.vx + Math.sin(time * 0.7 + seed.phase) * 0.18;
        const homeY = seed.vy + Math.cos(time * 0.55 + seed.phase) * 0.12;
        seed.vx = (seed.vx + gustX * 0.04) * 0.96;
        seed.vy = (seed.vy + gustY * 0.04) * 0.96;
        if (pointer && slow) {
          const dx = pointer.x - seed.x;
          const dy = pointer.y - seed.y;
          if (dx * dx + dy * dy < 34 * 34) nextCaught = index;
        }
        if (nextCaught === index && pointer) {
          seed.x += (pointer.x - seed.x) * 0.18;
          seed.y += (pointer.y - 18 - seed.y) * 0.18;
        } else {
          seed.x += homeX;
          seed.y += homeY;
        }
        if (seed.x < -20) seed.x = width + 20;
        if (seed.x > width + 20) seed.x = -20;
        if (seed.y < -20) seed.y = height + 20;
        if (seed.y > height + 20) seed.y = -20;
        context.save();
        context.translate(seed.x, seed.y);
        context.rotate(Math.sin(time + seed.phase) * 0.4);
        context.beginPath();
        context.moveTo(0, 8);
        context.quadraticCurveTo(1.4, 1, 0, -2);
        context.strokeStyle = "#5c4a3a";
        context.lineWidth = 1.15;
        context.stroke();
        context.beginPath();
        context.ellipse(0, -4, seed.size * 0.7, seed.size * 0.42, -0.5, 0, Math.PI * 2);
        context.fillStyle = "#fff8ef";
        context.fill();
        context.strokeStyle = "#a34728";
        context.stroke();
        context.restore();
      });
      if (skillNode) {
        const show = nextCaught > -1 && api.skills.length && pointer;
        skillNode.hidden = !show;
        if (show) {
          skillNode.textContent = api.skills[nextCaught % api.skills.length];
          skillNode.style.left = `${pointer.x + 16}px`;
          skillNode.style.top = `${pointer.y - 28}px`;
        }
      }
      caught = nextCaught;
    }
    frame();
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
    let seen = true;
    if ("IntersectionObserver" in window) {
      const watch = new IntersectionObserver((entries) => {
        seen = entries.some((entry) => entry.isIntersecting);
      }, { rootMargin: "120px" });
      watch.observe(portrait);
    }
    const fly = (now) => {
      const dt = Math.min(0.05, (now - last) / 1000);
      last = now;
      if (seen) {
        const width = portrait.clientWidth;
        const height = portrait.clientHeight;
        orbit.forEach((item) => {
          item.angle += dt * item.speed;
          const px = width * (0.5 + Math.cos(item.angle) * item.rx) - item.shape.offsetWidth / 2;
          const py = height * (0.46 + Math.sin(item.angle) * item.ry) - item.shape.offsetHeight / 2 + Math.sin(now / 680 + item.bob) * 10;
          const tilt = Math.sin(item.angle * 2) * 14;
          item.shape.style.transform = `translate(${px.toFixed(1)}px, ${py.toFixed(1)}px) rotate(${tilt.toFixed(1)}deg)`;
        });
      }
      requestAnimationFrame(fly);
    };
    requestAnimationFrame(fly);
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
