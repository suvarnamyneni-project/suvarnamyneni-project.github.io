/**
 * Remaining catalog effects: about portrait, facts, stacking toy,
 * hidden kudos, contact sky, stars, slingshot, and the hire dialog.
 * Skill names come from the CV. Quotes render only from data/kudos.json.
 */
(function () {
  const SKILLS = [
    "Journey Mapping",
    "Service Blueprinting",
    "Design Systems",
    "Accessibility (WCAG)",
    "Usability Testing",
    "User Research",
    "Figma",
    "Cursor",
    "Claude",
    "Lovable",
    "AI Workflow Automation",
    "Agent-Driven Prototyping",
    "HTML/CSS",
    "Stakeholder Management",
  ];
  const root = document.documentElement;
  const motion = root.classList.contains("has-motion");
  const fine = window.matchMedia("(hover: hover) and (pointer: fine)").matches;

  function clamp(value, min, max) {
    return Math.max(min, Math.min(max, value));
  }

  function whenNear(element, margin, onChange) {
    if (!element) return;
    if (!("IntersectionObserver" in window)) {
      onChange(true);
      return;
    }
    const observer = new IntersectionObserver((entries) => {
      onChange(entries.some((entry) => entry.isIntersecting));
    }, { rootMargin: margin });
    observer.observe(element);
  }

  function initLazyImages() {
    document.querySelectorAll("img").forEach((img) => {
      if (img.closest(".hero-stage") || img.getAttribute("fetchpriority") === "high") return;
      if (!img.hasAttribute("loading")) img.loading = "lazy";
      img.decoding = "async";
    });
    const pending = [...document.querySelectorAll("img[data-src]")];
    if (!pending.length) return;
    const reveal = (img) => {
      if (!img.dataset.src) return;
      img.src = img.dataset.src;
      img.removeAttribute("data-src");
      img.decoding = "async";
    };
    if (!("IntersectionObserver" in window)) {
      pending.forEach(reveal);
      return;
    }
    const observer = new IntersectionObserver((entries) => {
      entries.forEach((entry) => {
        if (!entry.isIntersecting) return;
        reveal(entry.target);
        observer.unobserve(entry.target);
      });
    }, { rootMargin: "150% 0px" });
    pending.forEach((img) => observer.observe(img));
  }

  function initCaseOpen() {
    document.addEventListener("click", (event) => {
      const node = event.target;
      if (!node || !node.closest) return;
      const link = node.closest("a.case-link");
      if (!link || !motion) return;
      if (event.defaultPrevented || event.metaKey || event.ctrlKey || event.shiftKey || event.altKey) return;
      if (event.button !== 0) return;
      const card = link.closest(".project");
      if (!card) return;
      card.classList.add("is-opening");
      window.setTimeout(() => card.classList.remove("is-opening"), 480);
    });
  }

  function initCursorIcons() {
    if (!root.classList.contains("has-fine-cursor")) return;
    const cursor = document.getElementById("cursor");
    if (!cursor) return;
    let current = "";
    document.addEventListener("pointermove", (event) => {
      if (event.pointerType && event.pointerType !== "mouse") return;
      const node = event.target;
      if (!node || !node.closest) return;
      const card = node.closest(".rail-track .project[data-cursor-icon]");
      const icon = card ? card.getAttribute("data-cursor-icon") || "" : "";
      if (icon === current) return;
      current = icon;
      if (icon) cursor.setAttribute("data-icon", icon);
      else cursor.removeAttribute("data-icon");
      cursor.classList.remove("is-spin");
      if (icon) {
        void cursor.offsetWidth;
        cursor.classList.add("is-spin");
      }
    });
  }

  function initPortrait() {
    const about = document.getElementById("about");
    const portrait = document.querySelector(".portrait");
    if (!about || !portrait) return;

    let aboutNear = false;
    whenNear(about, "120px", (near) => {
      aboutNear = near;
      about.classList.toggle("is-live", near);
    });

    if (motion && fine) {
      document.addEventListener("pointermove", (event) => {
        if (!aboutNear || (event.pointerType && event.pointerType !== "mouse")) return;
        const mx = event.clientX / window.innerWidth - 0.5;
        const my = event.clientY / window.innerHeight - 0.5;
        portrait.style.setProperty("--mx", mx.toFixed(3));
        portrait.style.setProperty("--my", my.toFixed(3));
      }, { passive: true });
    }
  }

  function initFacts() {
    const cards = [...document.querySelectorAll(".fact-card")];
    if (!cards.length) return;

    function paint(card, value) {
      const node = card.querySelector(".fact-num");
      if (!node) return;
      node.textContent = `${value}${card.dataset.suffix || ""}`;
    }

    function animate(card) {
      const target = Number(card.dataset.count);
      if (!Number.isFinite(target)) return;
      const start = performance.now();
      function tick(now) {
        const t = Math.min(1, (now - start) / 680);
        const eased = 1 - Math.pow(1 - t, 3);
        paint(card, Math.round(target * eased));
        if (t < 1) requestAnimationFrame(tick);
      }
      requestAnimationFrame(tick);
    }

    cards.forEach((card) => {
      card.addEventListener("click", () => {
        if (motion) animate(card);
      });
      if (motion && fine) {
        card.addEventListener("pointermove", (event) => {
          if (event.pointerType && event.pointerType !== "mouse") return;
          const rect = card.getBoundingClientRect();
          const px = (event.clientX - rect.left) / rect.width - 0.5;
          const py = (event.clientY - rect.top) / rect.height - 0.5;
          card.style.setProperty("--tilt-y", `${(px * 7).toFixed(2)}deg`);
          card.style.setProperty("--tilt-x", `${(-py * 7).toFixed(2)}deg`);
        });
        card.addEventListener("pointerleave", () => {
          card.style.setProperty("--tilt-y", "0deg");
          card.style.setProperty("--tilt-x", "0deg");
        });
      }
    });

    if (!motion || !("IntersectionObserver" in window)) return;
    const observer = new IntersectionObserver((entries) => {
      entries.forEach((entry) => {
        if (!entry.isIntersecting) return;
        animate(entry.target);
        observer.unobserve(entry.target);
      });
    }, { threshold: 0.55 });
    cards.forEach((card) => observer.observe(card));
  }

  function initChips() {
    document.querySelectorAll(".chip").forEach((chip) => {
      chip.addEventListener("click", () => {
        const pressed = chip.getAttribute("aria-pressed") === "true";
        chip.setAttribute("aria-pressed", pressed ? "false" : "true");
      });
    });
  }

  function initSprint() {
    const button = document.querySelector(".sprint-load");
    const board = document.getElementById("sprint-board");
    const status = document.getElementById("sprint-status");
    if (!button || !board || !status) return;
    const names = ["Screen", "Type", "Button", "Icon"];
    let built = false;
    let stack = null;

    function announce(text) {
      status.textContent = text;
    }

    function reset() {
      board.hidden = true;
      board.replaceChildren();
      button.setAttribute("aria-expanded", "false");
      built = false;
      stack = null;
      announce("");
    }

    function build() {
      const tray = document.createElement("div");
      tray.className = "sprint-tray";
      stack = document.createElement("div");
      stack.className = "sprint-stack";
      stack.setAttribute("role", "group");
      stack.setAttribute("aria-label", "Stack");
      names.forEach((name) => {
        const piece = document.createElement("button");
        piece.type = "button";
        piece.className = "piece";
        piece.textContent = name;
        piece.addEventListener("click", () => {
          if (!stack || piece.classList.contains("is-stacked")) return;
          piece.classList.add("is-stacked");
          stack.appendChild(piece);
          const done = stack.querySelectorAll(".piece").length >= names.length;
          announce(done ? "Stacked." : `${name} stacked.`);
        });
        tray.appendChild(piece);
      });
      board.append(tray, stack);
      board.hidden = false;
      button.setAttribute("aria-expanded", "true");
      built = true;
      announce("Tap each piece to stack it.");
    }

    button.addEventListener("click", () => {
      if (built) reset();
      else build();
    });
  }

  function initAlsoMore() {
    const button = document.querySelector(".view-more");
    const panel = document.getElementById("also-more");
    const grid = document.querySelector("#also .desk-grid");
    if (!button || !panel || !grid) return;

    function fitCards() {
      const cards = [...grid.querySelectorAll(".desk-card")];
      cards.forEach((card) => {
        card.style.minHeight = "";
        card.classList.add("is-visible");
        card.style.setProperty("--rise", "0px");
      });
      const visible = cards.filter((card) => card.getBoundingClientRect().height > 0);
      if (visible.length < 2) return;
      const max = Math.max(...visible.map((card) => card.getBoundingClientRect().height));
      visible.forEach((card) => {
        card.style.minHeight = `${Math.ceil(max)}px`;
      });
    }

    button.addEventListener("click", () => {
      const open = button.getAttribute("aria-expanded") === "true";
      button.setAttribute("aria-expanded", open ? "false" : "true");
      panel.hidden = open;
      button.textContent = open ? "View more" : "View less";
      requestAnimationFrame(fitCards);
    });

    window.addEventListener("resize", () => {
      if (!panel.hidden) fitCards();
    });
    fitCards();
  }

  function initKudos() {
    const mount = document.getElementById("kudos-mount");
    const about = document.getElementById("about");
    if (!mount) return;
    let started = false;

    function quotesFrom(data) {
      if (!Array.isArray(data)) return [];
      return data.filter((item) => item && typeof item.quote === "string" && item.quote.trim()).map((item) => ({
        quote: item.quote.trim(),
        by: typeof item.by === "string" ? item.by.trim() : "",
      }));
    }

    function render(quotes) {
      if (!quotes.length) return;
      const wrap = document.createElement("div");
      wrap.className = "kudos";
      const heading = document.createElement("h2");
      heading.id = "kudos-heading";
      heading.textContent = "Kudos";
      const list = document.createElement("ul");
      list.className = "kudos-list";
      quotes.forEach((item) => {
        const card = document.createElement("li");
        card.className = "kudo-card glass";
        const quote = document.createElement("blockquote");
        quote.className = "kudo-quote";
        quote.textContent = item.quote;
        card.appendChild(quote);
        if (item.by) {
          const by = document.createElement("p");
          by.className = "kudo-by";
          by.textContent = item.by;
          card.appendChild(by);
        }
        list.appendChild(card);
      });
      wrap.append(heading, list);
      mount.appendChild(wrap);
      mount.hidden = false;
    }

    function load() {
      if (started) return;
      started = true;
      fetch("data/kudos.json")
        .then((response) => (response.ok ? response.json() : []))
        .then((data) => render(quotesFrom(data)))
        .catch(() => {});
    }

    whenNear(about || mount, "200px", (near) => {
      if (near) load();
    });
  }

  function initSky() {
    const band = document.getElementById("night-band");
    const canvas = document.getElementById("star-field");
    if (!band) return;
    let bandNear = false;
    let running = false;
    let staticMode = "";
    let pointer = null;
    const stars = [];
    let shoot = null;
    let shootIn = 240;

    function nightNow() {
      const raw = getComputedStyle(band).getPropertyValue("--night");
      const value = parseFloat(raw);
      return Number.isFinite(value) ? value : 0;
    }

    function paintSky() {
      const rect = band.getBoundingClientRect();
      const travel = window.innerHeight * 0.75;
      const progress = clamp((window.innerHeight - rect.top) / travel, 0, 1);
      const night = clamp((progress - 0.42) / 0.38, 0, 1);
      const dusk = clamp((progress - 0.12) / 0.34, 0, 1) * (1 - night);
      band.style.setProperty("--dusk", dusk.toFixed(3));
      band.style.setProperty("--night", night.toFixed(3));
      const nightPhase = night >= 0.62;
      band.classList.toggle("is-dusk", progress > 0.28 && !nightPhase);
      band.classList.toggle("is-night", nightPhase);
      syncStars();
    }

    function resizeStars() {
      if (!canvas) return null;
      const dpr = Math.min(window.devicePixelRatio || 1, 1.5);
      const width = Math.max(1, canvas.clientWidth);
      const height = Math.max(1, canvas.clientHeight);
      const pw = Math.round(width * dpr);
      const ph = Math.round(height * dpr);
      if (canvas.width !== pw || canvas.height !== ph || !stars.length) {
        canvas.width = pw;
        canvas.height = ph;
        stars.length = 0;
        let seed = 42;
        const random = () => {
          seed = (seed + 0x6d2b79f5) | 0;
          let t = Math.imul(seed ^ (seed >>> 15), 1 | seed);
          t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
          return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
        };
        for (let i = 0; i < 48; i += 1) {
          stars.push({
            x: random() * width,
            y: random() * height,
            r: 0.6 + random() * 1.5,
            phase: random() * Math.PI * 2,
          });
        }
      }
      const context = canvas.getContext("2d");
      context.setTransform(dpr, 0, 0, dpr, 0, 0);
      return { context, width, height };
    }

    function clearStars() {
      const sized = resizeStars();
      if (!sized) return;
      sized.context.clearRect(0, 0, sized.width, sized.height);
    }

    function drawStarField(now, twinkle) {
      const sized = resizeStars();
      if (!sized) return;
      const { context, width, height } = sized;
      const alpha = nightNow();
      context.clearRect(0, 0, width, height);
      stars.forEach((star) => {
        const blink = twinkle ? 0.35 + 0.65 * (0.5 + 0.5 * Math.sin(now * 0.003 + star.phase)) : 0.8;
        context.beginPath();
        context.arc(star.x, star.y, star.r, 0, Math.PI * 2);
        context.fillStyle = `rgba(244, 247, 251, ${alpha * blink})`;
        context.fill();
      });
      if (pointer && now - pointer.t < 500) {
        const near = stars.filter((star) => Math.hypot(star.x - pointer.x, star.y - pointer.y) < 140);
        context.strokeStyle = `rgba(214, 228, 255, ${alpha * 0.85})`;
        context.lineWidth = 1;
        near.forEach((star, index) => {
          for (let next = index + 1; next < near.length && next < index + 3; next += 1) {
            const other = near[next];
            if (Math.hypot(star.x - other.x, star.y - other.y) > 160) continue;
            context.beginPath();
            context.moveTo(star.x, star.y);
            context.lineTo(other.x, other.y);
            context.stroke();
          }
        });
      }
      if (shoot) {
        context.strokeStyle = `rgba(244, 247, 251, ${alpha})`;
        context.lineWidth = 2;
        context.beginPath();
        context.moveTo(shoot.x, shoot.y);
        context.lineTo(shoot.x - shoot.vx * 8, shoot.y - shoot.vy * 8);
        context.stroke();
        shoot.x += shoot.vx;
        shoot.y += shoot.vy;
        shoot.life -= 1;
        if (shoot.life <= 0) shoot = null;
      } else if (twinkle) {
        shootIn -= 1;
        if (shootIn <= 0 && alpha > 0.45) {
          shoot = {
            x: Math.random() * width,
            y: Math.random() * height * 0.6,
            vx: 8 + Math.random() * 6,
            vy: 3 + Math.random() * 3,
            life: 28,
          };
          shootIn = 280 + Math.random() * 220;
        }
      }
    }

    function frame(now) {
      if (!running) return;
      requestAnimationFrame(frame);
      if (document.hidden || !bandNear || nightNow() <= 0.05) {
        running = false;
        clearStars();
        return;
      }
      drawStarField(now, true);
    }

    function syncStars() {
      if (!canvas) return;
      if (!motion) {
        const next = nightNow() >= 0.62 ? "on" : "off";
        if (next !== staticMode) {
          staticMode = next;
          if (next === "on") drawStarField(0, false);
          else clearStars();
        }
        return;
      }
      const want = bandNear && !document.hidden && nightNow() > 0.05;
      if (want && !running) {
        running = true;
        requestAnimationFrame(frame);
      }
      if (!want && running) running = false;
    }

    if (canvas && motion) {
      document.addEventListener("pointermove", (event) => {
        if (!bandNear) return;
        const rect = canvas.getBoundingClientRect();
        pointer = {
          x: event.clientX - rect.left,
          y: event.clientY - rect.top,
          t: performance.now(),
        };
      }, { passive: true });
    }

    whenNear(band, "180px", (near) => {
      bandNear = near;
      syncStars();
    });
    paintSky();
    window.addEventListener("scroll", paintSky, { passive: true });
    window.addEventListener("resize", paintSky);
    document.addEventListener("visibilitychange", syncStars);
    if (window.deskLenis && window.deskLenis.on) window.deskLenis.on("scroll", paintSky);
  }

  function initSling() {
    const stage = document.getElementById("sling-stage");
    const plane = document.getElementById("sling-plane");
    const preview = document.getElementById("aim-preview");
    const line = preview ? preview.querySelector("polyline") : null;
    const status = document.getElementById("sling-status");
    const help = document.getElementById("sling-help");
    const mail = document.getElementById("sling-mail");
    const target = stage ? stage.querySelector(".target") : null;
    const confetti = document.getElementById("sling-confetti");
    if (!stage || !plane || !target || !status) return;
    if (!motion && help) help.textContent = "Press the plane, or Enter, to copy the email address.";

    const gravity = 0.42;
    let dragging = false;
    let dragged = false;
    let flying = false;
    let resolving = false;
    let misses = 0;
    let samples = [];
    let raf = 0;

    function pauseScroll(stop) {
      const lenis = window.deskLenis;
      if (!lenis) return;
      if (stop && lenis.stop) lenis.stop();
      else if (!stop && lenis.start) lenis.start();
    }

    function anchor() {
      return { x: 28, y: Math.max(8, stage.clientHeight / 2 - 24) };
    }

    function place(x, y) {
      plane.style.left = `${x}px`;
      plane.style.top = `${y}px`;
    }

    function targetPoint() {
      const stageRect = stage.getBoundingClientRect();
      const rect = target.getBoundingClientRect();
      return {
        x: rect.left - stageRect.left + rect.width / 2,
        y: rect.top - stageRect.top + rect.height / 2,
        radius: rect.width * 0.48,
      };
    }

    function velocity() {
      if (samples.length < 2) return { vx: 0, vy: 0 };
      const first = samples[0];
      const last = samples[samples.length - 1];
      const dt = Math.max(16, last.t - first.t);
      let vx = ((last.x - first.x) / dt) * 16.67;
      let vy = ((last.y - first.y) / dt) * 16.67;
      const speed = Math.hypot(vx, vy);
      const max = 22;
      if (speed > max) {
        vx = (vx / speed) * max;
        vy = (vy / speed) * max;
      }
      return { vx, vy };
    }

    function simulate(x, y, vx, vy) {
      const goal = targetPoint();
      const points = [];
      let px = x;
      let py = y;
      let pvx = vx;
      let pvy = vy;
      let hit = false;
      for (let i = 0; i < 90; i += 1) {
        pvy += gravity;
        px += pvx;
        py += pvy;
        pvx *= 0.995;
        if (i % 3 === 0) points.push({ x: px + 24, y: py + 24 });
        const dx = px + 24 - goal.x;
        const dy = py + 24 - goal.y;
        if (dx * dx + dy * dy < goal.radius * goal.radius) {
          hit = true;
          break;
        }
        if (py > stage.clientHeight + 48 || px < -90 || px > stage.clientWidth + 90) break;
      }
      return { hit, points };
    }

    function showAim(points, on) {
      if (!preview || !line) return;
      const width = stage.clientWidth;
      const height = stage.clientHeight;
      preview.hidden = false;
      preview.setAttribute("viewBox", `0 0 ${width} ${height}`);
      preview.classList.toggle("is-on", on);
      line.setAttribute("points", points.map((point) => `${point.x.toFixed(1)},${point.y.toFixed(1)}`).join(" "));
    }

    function hideAim() {
      if (!preview) return;
      preview.hidden = true;
      preview.classList.remove("is-on");
    }

    function resetPlane() {
      const spot = anchor();
      plane.classList.add("is-return");
      place(spot.x, spot.y);
      window.setTimeout(() => plane.classList.remove("is-return"), 380);
    }

    function burst() {
      if (!confetti) return;
      const dpr = Math.min(window.devicePixelRatio || 1, 1.5);
      const width = Math.max(1, confetti.clientWidth);
      const height = Math.max(1, confetti.clientHeight);
      confetti.width = Math.round(width * dpr);
      confetti.height = Math.round(height * dpr);
      const context = confetti.getContext("2d");
      context.setTransform(dpr, 0, 0, dpr, 0, 0);
      const origin = targetPoint();
      const colors = ["#0b1f3a", "#2f6fed", "#f4f7fb", "#1a4ec4", "#d6e4ff"];
      const bits = Array.from({ length: 22 }, (_, index) => {
        const angle = Math.random() * Math.PI * 2;
        const speed = 2 + Math.random() * 4.2;
        return {
          x: origin.x,
          y: origin.y,
          vx: Math.cos(angle) * speed,
          vy: Math.sin(angle) * speed - 2.2,
          color: colors[index % colors.length],
          life: 36 + Math.random() * 16,
          size: 4 + Math.random() * 4,
        };
      });
      function draw() {
        context.clearRect(0, 0, width, height);
        let alive = false;
        bits.forEach((bit) => {
          bit.life -= 1;
          if (bit.life <= 0) return;
          alive = true;
          bit.vy += 0.14;
          bit.x += bit.vx;
          bit.y += bit.vy;
          context.globalAlpha = Math.max(0, bit.life / 48);
          context.fillStyle = bit.color;
          context.fillRect(bit.x, bit.y, bit.size, bit.size * 0.62);
        });
        context.globalAlpha = 1;
        if (alive) requestAnimationFrame(draw);
        else context.clearRect(0, 0, width, height);
      }
      if (motion) requestAnimationFrame(draw);
    }

    async function hit() {
      if (resolving) return;
      resolving = true;
      flying = false;
      if (raf) cancelAnimationFrame(raf);
      raf = 0;
      hideAim();
      status.textContent = "Delivered.";
      const done = document.getElementById("sling-done");
      if (done) done.hidden = false;
      setStep(3);
      burst();
      let ok = false;
      if (window.deskCopy) ok = await window.deskCopy();
      if (window.deskToast) window.deskToast(ok ? "Copied" : "Could not copy the email address.");
      if (!ok) {
        status.textContent = "Could not copy the email address.";
        if (mail) mail.hidden = false;
      }
      window.setTimeout(() => {
        resolving = false;
        resetPlane();
      }, motion ? 620 : 0);
    }

    function setStep(step) {
      document.querySelectorAll("#sling-steps li").forEach((item) => {
        item.classList.toggle("is-on", item.dataset.step === String(step));
      });
    }

    function miss() {
      flying = false;
      misses += 1;
      status.textContent = "Aim higher.";
      if (misses >= 2 && mail) mail.hidden = false;
      setStep(1);
      resetPlane();
    }

    function startPhysics(x, y, vx, vy) {
      plane.classList.remove("is-return");
      flying = true;
      let last = performance.now();
      function step(now) {
        const dt = Math.min(2, (now - last) / 16.67);
        last = now;
        vy += gravity * dt;
        x += vx * dt;
        y += vy * dt;
        vx *= Math.pow(0.995, dt);
        place(x, y);
        const goal = targetPoint();
        const dx = x + 24 - goal.x;
        const dy = y + 24 - goal.y;
        if (dx * dx + dy * dy < goal.radius * goal.radius) {
          raf = 0;
          hit();
          return;
        }
        if (y > stage.clientHeight + 20 || x < -80 || x > stage.clientWidth + 40) {
          raf = 0;
          miss();
          return;
        }
        raf = requestAnimationFrame(step);
      }
      raf = requestAnimationFrame(step);
    }

    function throwAtTarget() {
      if (flying || resolving) return;
      plane.classList.remove("is-return");
      if (!motion) {
        hit();
        return;
      }
      const spot = anchor();
      const goal = targetPoint();
      const startX = spot.x;
      const startY = spot.y;
      const endX = goal.x - 24;
      const endY = goal.y - 24;
      const began = performance.now();
      flying = true;
      function step(now) {
        const t = Math.min(1, (now - began) / 700);
        const eased = t * t * (3 - 2 * t);
        const x = startX + (endX - startX) * eased;
        const y = startY + (endY - startY) * eased - Math.sin(t * Math.PI) * 64;
        place(x, y);
        if (t < 1) raf = requestAnimationFrame(step);
        else {
          raf = 0;
          hit();
        }
      }
      raf = requestAnimationFrame(step);
    }

    plane.addEventListener("pointerdown", (event) => {
      if (event.button !== 0 || flying || resolving) return;
      dragging = true;
      dragged = false;
      setStep(1);
      plane.classList.remove("is-return");
      if (raf) cancelAnimationFrame(raf);
      raf = 0;
      try { plane.setPointerCapture(event.pointerId); } catch (error) { /* already released */ }
      samples = [{ x: plane.offsetLeft, y: plane.offsetTop, t: performance.now() }];
      pauseScroll(true);
    });

    plane.addEventListener("pointermove", (event) => {
      if (!dragging) return;
      const rect = stage.getBoundingClientRect();
      let x = event.clientX - rect.left - 24;
      let y = event.clientY - rect.top - 24;
      x = clamp(x, 0, Math.max(0, stage.clientWidth - 48));
      y = clamp(y, 0, Math.max(0, stage.clientHeight - 48));
      const origin = samples[0];
      if (Math.hypot(x - origin.x, y - origin.y) > 6) {
        dragged = true;
        setStep(2);
      }
      place(x, y);
      samples.push({ x, y, t: performance.now() });
      if (samples.length > 6) samples.shift();
      if (!motion) return;
      const vel = velocity();
      const previewPath = simulate(x, y, vel.vx, vel.vy);
      showAim(previewPath.points, previewPath.hit);
    });

    function endDrag() {
      if (!dragging) return;
      dragging = false;
      pauseScroll(false);
      hideAim();
      if (!dragged) {
        if (!motion) hit();
        return;
      }
      const vel = velocity();
      if (!motion || Math.hypot(vel.vx, vel.vy) < 1.4) {
        if (!motion) hit();
        else resetPlane();
        return;
      }
      setStep(3);
      startPhysics(plane.offsetLeft, plane.offsetTop, vel.vx, vel.vy);
    }

    plane.addEventListener("pointerup", endDrag);
    plane.addEventListener("pointercancel", () => {
      if (!dragging) return;
      dragging = false;
      pauseScroll(false);
      hideAim();
      resetPlane();
    });
    plane.addEventListener("keydown", (event) => {
      if (event.key !== "Enter" && event.key !== " ") return;
      event.preventDefault();
      throwAtTarget();
    });

    resetPlane();
  }

  function initHire() {
    const dialog = document.getElementById("hire-dialog");
    if (!dialog) return;
    const close = dialog.querySelector(".hire-close");
    if (close) close.addEventListener("click", () => dialog.close());
    let buffer = "";

    function inField(event) {
      const node = event.target;
      if (!node || node.nodeType !== 1 || !node.closest) return false;
      return Boolean(node.closest("input, textarea, select, [contenteditable]"));
    }

    document.addEventListener("keydown", (event) => {
      if (event.metaKey || event.ctrlKey || event.altKey || event.repeat) return;
      if (dialog.open || inField(event)) return;
      if (!event.key || event.key.length !== 1) return;
      buffer = (buffer + event.key.toLowerCase()).slice(-4);
      if (buffer === "hire") {
        buffer = "";
        dialog.showModal();
      }
    });
  }

  function initSkills() {
    if (window.deskSeeds && window.deskSeeds.setSkills) window.deskSeeds.setSkills(SKILLS);
  }

  function initDeskMetrics() {
    const nums = [...document.querySelectorAll(".desk-card .metric-num")];
    if (!nums.length || !motion || !("IntersectionObserver" in window)) return;
    const observer = new IntersectionObserver((entries) => {
      entries.forEach((entry) => {
        if (!entry.isIntersecting) return;
        const el = entry.target;
        const target = Number(el.dataset.value);
        if (!Number.isFinite(target)) return;
        const prefix = el.dataset.prefix || "";
        const suffix = el.dataset.suffix || "";
        const started = performance.now();
        const step = (now) => {
          const t = Math.min(1, (now - started) / 680);
          const eased = 1 - (1 - t) ** 3;
          el.textContent = `${prefix}${Math.round(eased * target)}${suffix}`;
          if (t < 1) requestAnimationFrame(step);
        };
        requestAnimationFrame(step);
        observer.unobserve(el);
      });
    }, { threshold: 0.5 });
    nums.forEach((el) => observer.observe(el));
  }

  [
    initSkills,
    initDeskMetrics,
    initLazyImages,
    initCaseOpen,
    initCursorIcons,
    initPortrait,
    initFacts,
    initChips,
    initSprint,
    initAlsoMore,
    initKudos,
    initSky,
    initSling,
    initHire,
  ].forEach((start) => {
    try {
      start();
    } catch (error) {
      console.error(error);
    }
  });
})();
