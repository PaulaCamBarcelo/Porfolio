/* ==========================================================================
   PAULA BARCELÓ — PORTFOLIO · main.js
   Librerías: GSAP + ScrollTrigger (animaciones), Lenis (scroll suave)
   Si las librerías no cargan, todo sigue funcionando con IntersectionObserver + CSS.
   ========================================================================== */
(() => {
  "use strict";

  const d = document;
  const root = d.documentElement;
  const $ = (s, c = d) => c.querySelector(s);
  const $$ = (s, c = d) => [...c.querySelectorAll(s)];

  const reduce = matchMedia("(prefers-reduced-motion: reduce)").matches;
  const finePointer = matchMedia("(hover: hover) and (pointer: fine)").matches;
  const hasGSAP = typeof gsap !== "undefined" && typeof ScrollTrigger !== "undefined";
  const hasLenis = typeof Lenis !== "undefined";

  if (hasGSAP) {
    root.classList.add("gsap");
    gsap.registerPlugin(ScrollTrigger);
  }

  // Si algo falla, nunca dejar contenido oculto
  const failsafe = setTimeout(() => {
    if (!root.classList.contains("ready")) root.classList.add("force-show");
  }, 5000);

  /* ------------------------------------------------------------------ utils */
  // Ejecuta cb una sola vez cuando el elemento entra en pantalla
  function onEnter(el, cb, start = "top 88%") {
    if (hasGSAP) {
      ScrollTrigger.create({ trigger: el, start, once: true, onEnter: cb });
    } else if ("IntersectionObserver" in window) {
      const io = new IntersectionObserver((es) => {
        es.forEach((e) => { if (e.isIntersecting) { io.disconnect(); cb(); } });
      }, { rootMargin: "0px 0px -12% 0px" });
      io.observe(el);
    } else cb();
  }

  // Divide el texto en palabras y letras (respeta elementos hijos)
  function splitText(el) {
    let idx = 0;
    const walk = (node) => {
      [...node.childNodes].forEach((n) => {
        if (n.nodeType === 3) {
          const frag = d.createDocumentFragment();
          n.textContent.split(/(\s+)/).forEach((part) => {
            if (!part) return;
            if (/^\s+$/.test(part)) { frag.append(" "); return; }
            const w = d.createElement("span");
            w.className = "w";
            w.setAttribute("aria-hidden", "true");
            [...part].forEach((ch) => {
              const c = d.createElement("span");
              c.className = "c";
              c.style.setProperty("--i", idx++);
              c.textContent = ch;
              w.append(c);
            });
            frag.append(w);
          });
          n.replaceWith(frag);
        } else if (n.nodeType === 1) walk(n);
      });
    };
    el.setAttribute("aria-label", el.textContent.trim());
    walk(el);
    return $$(".c", el);
  }

  // Efecto "descifrado" de texto
  const GLYPHS = "ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789#%&/<>_";
  function scramble(el) {
    const final = el.dataset.text || el.textContent;
    el.dataset.text = final;
    if (reduce) { el.textContent = final; return; }
    const dur = 700, t0 = performance.now();
    (function tick(now) {
      const p = Math.min(1, (now - t0) / dur);
      const fixed = Math.floor(p * final.length);
      let out = "";
      for (let i = 0; i < final.length; i++) {
        const ch = final[i];
        out += i < fixed || ch === " " ? ch : GLYPHS[(Math.random() * GLYPHS.length) | 0];
      }
      el.textContent = out;
      if (p < 1) requestAnimationFrame(tick); else el.textContent = final;
    })(t0);
  }

  function countTo(el, target, dur = 1600, suffix = "") {
    if (reduce) { el.textContent = target + suffix; return; }
    const t0 = performance.now();
    (function tick(now) {
      const p = Math.min(1, (now - t0) / dur);
      const e = 1 - Math.pow(1 - p, 3);
      el.textContent = Math.round(target * e) + suffix;
      if (p < 1) requestAnimationFrame(tick);
    })(t0);
  }

  /* ------------------------------------------------------------ smooth scroll */
  let lenis = null;
  if (hasLenis && !reduce) {
    lenis = new Lenis({
      duration: 1.15,
      easing: (t) => Math.min(1, 1.001 - Math.pow(2, -10 * t)),
      smoothWheel: true,
    });
    if (hasGSAP) {
      lenis.on("scroll", ScrollTrigger.update);
      gsap.ticker.add((t) => lenis.raf(t * 1000));
      gsap.ticker.lagSmoothing(0);
    } else {
      const raf = (t) => { lenis.raf(t); requestAnimationFrame(raf); };
      requestAnimationFrame(raf);
    }
  }
  const scrollToTarget = (target) => {
    const offset = -(parseInt(getComputedStyle(root).getPropertyValue("--header-h")) || 72) + 1;
    if (lenis) lenis.scrollTo(target, { offset, duration: 1.4 });
    else {
      const y = (target === 0 ? 0 : target.getBoundingClientRect().top + scrollY + offset);
      scrollTo({ top: y, behavior: reduce ? "auto" : "smooth" });
    }
  };

  // Enlaces ancla
  $$('a[href^="#"], a[href^="index.html#"]').forEach((a) => {
    a.addEventListener("click", (e) => {
      const href = a.getAttribute("href");
      const hash = href.slice(href.indexOf("#"));
      const onIndex = /index\.html$/.test(location.pathname) || location.pathname.endsWith("/");
      if (href.startsWith("index.html") && !onIndex) return; // navegación normal a otra página
      const target = hash === "#" ? 0 : $(hash);
      if (target === null) return;
      e.preventDefault();
      closeMenu();
      scrollToTarget(target);
      history.replaceState(null, "", hash);
    });
  });

  /* ------------------------------------------------------------------ header */
  const header = $(".site-header");
  const burger = $(".burger");
  function closeMenu() {
    if (!header.classList.contains("menu-open")) return;
    header.classList.remove("menu-open");
    burger.setAttribute("aria-expanded", "false");
    if (lenis) lenis.start();
    d.body.style.overflow = "";
  }
  burger && burger.addEventListener("click", () => {
    const open = header.classList.toggle("menu-open");
    burger.setAttribute("aria-expanded", String(open));
    if (lenis) open ? lenis.stop() : lenis.start();
    d.body.style.overflow = open ? "hidden" : "";
  });
  addEventListener("keydown", (e) => { if (e.key === "Escape") closeMenu(); });

  const progress = $(".progress");
  let ticking = false;
  function onScroll() {
    const y = scrollY;
    header.classList.toggle("scrolled", y > 40);
    const max = root.scrollHeight - innerHeight;
    if (progress) progress.style.transform = `scaleX(${max > 0 ? Math.min(1, y / max) : 0})`;
    ticking = false;
  }
  addEventListener("scroll", () => { if (!ticking) { ticking = true; requestAnimationFrame(onScroll); } }, { passive: true });
  onScroll();

  // Enlace activo según la sección visible
  const navLinks = $$('.nav a[href*="#"]');
  const sections = navLinks
    .map((a) => { const h = a.getAttribute("href"); return $(h.slice(h.indexOf("#"))); })
    .filter(Boolean);
  if (sections.length && "IntersectionObserver" in window) {
    const io = new IntersectionObserver((es) => {
      es.forEach((e) => {
        if (!e.isIntersecting) return;
        navLinks.forEach((a) => a.classList.toggle("active", a.getAttribute("href").endsWith("#" + e.target.id)));
      });
    }, { rootMargin: "-45% 0px -50% 0px" });
    sections.forEach((s) => io.observe(s));
  }

  // Transición suave entre páginas
  const fade = $(".page-fade");
  $$("a[href]").forEach((a) => {
    const href = a.getAttribute("href");
    if (!href || href.startsWith("#") || /^(mailto:|tel:|https?:)/.test(href) || a.target === "_blank" || a.hasAttribute("download")) return;
    if (href.includes("#") && href.split("#")[0] === location.pathname.split("/").pop()) return;
    a.addEventListener("click", (e) => {
      if (e.metaKey || e.ctrlKey || e.shiftKey || !fade || reduce) return;
      if (e.defaultPrevented) return;
      e.preventDefault();
      fade.classList.add("on");
      setTimeout(() => (location.href = a.href), 280);
    });
  });
  addEventListener("pageshow", (e) => { if (e.persisted && fade) fade.classList.remove("on"); });

  /* ---------------------------------------------------------- luz de cursor */
  const glow = $(".cursor-glow");
  if (glow && finePointer && !reduce) {
    let gx = innerWidth / 2, gy = innerHeight / 2, cx = gx, cy = gy;
    addEventListener("pointermove", (e) => { gx = e.clientX; gy = e.clientY; glow.classList.add("on"); }, { passive: true });
    d.addEventListener("pointerleave", () => glow.classList.remove("on"));
    (function loop() {
      cx += (gx - cx) * 0.12; cy += (gy - cy) * 0.12;
      glow.style.transform = `translate(${cx}px, ${cy}px)`;
      requestAnimationFrame(loop);
    })();
  }

  // Spotlight en cards
  $$(".card").forEach((c) => {
    c.addEventListener("pointermove", (e) => {
      const r = c.getBoundingClientRect();
      c.style.setProperty("--mx", e.clientX - r.left + "px");
      c.style.setProperty("--my", e.clientY - r.top + "px");
    });
  });

  // Botones magnéticos
  if (finePointer && !reduce) {
    $$("[data-magnetic]").forEach((b) => {
      b.addEventListener("pointermove", (e) => {
        const r = b.getBoundingClientRect();
        const x = (e.clientX - r.left - r.width / 2) * 0.22;
        const y = (e.clientY - r.top - r.height / 2) * 0.3;
        b.style.transform = `translate(${x}px, ${y}px)`;
      });
      b.addEventListener("pointerleave", () => { b.style.transform = ""; });
    });
  }

  // Tilt 3D del retrato
  const portrait = $("[data-tilt]");
  if (portrait && finePointer && !reduce) {
    const host = portrait.parentElement;
    host.addEventListener("pointermove", (e) => {
      const r = portrait.getBoundingClientRect();
      const px = (e.clientX - r.left) / r.width - 0.5;
      const py = (e.clientY - r.top) / r.height - 0.5;
      portrait.style.transform = `rotateY(${px * 10}deg) rotateX(${-py * 8}deg)`;
    });
    host.addEventListener("pointerleave", () => { portrait.style.transform = ""; });
  }

  /* ------------------------------------------------- red de partículas (canvas) */
  function network(canvas) {
    const ctx = canvas.getContext("2d");
    if (!ctx) return;
    let w, h, dpr, nodes = [], visible = true, running = false;
    const mouse = { x: -999, y: -999 };
    const RGB = "57,255,136";

    function resize() {
      dpr = Math.min(devicePixelRatio || 1, 2);
      w = canvas.clientWidth; h = canvas.clientHeight;
      canvas.width = w * dpr; canvas.height = h * dpr;
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
      const count = Math.min(70, Math.floor((w * h) / (w < 700 ? 24000 : 17000)));
      nodes = Array.from({ length: count }, () => ({
        x: Math.random() * w, y: Math.random() * h,
        vx: (Math.random() - 0.5) * 0.28, vy: (Math.random() - 0.5) * 0.28,
        r: Math.random() * 1.4 + 0.6,
      }));
    }

    function frame() {
      ctx.clearRect(0, 0, w, h);
      const link = w < 700 ? 100 : 135;
      for (let i = 0; i < nodes.length; i++) {
        const a = nodes[i];
        if (!reduce) {
          a.x += a.vx; a.y += a.vy;
          if (a.x < 0 || a.x > w) a.vx *= -1;
          if (a.y < 0 || a.y > h) a.vy *= -1;
        }
        for (let j = i + 1; j < nodes.length; j++) {
          const b = nodes[j];
          const dist = Math.hypot(a.x - b.x, a.y - b.y);
          if (dist < link) {
            ctx.strokeStyle = `rgba(${RGB},${(1 - dist / link) * 0.22})`;
            ctx.lineWidth = 1;
            ctx.beginPath(); ctx.moveTo(a.x, a.y); ctx.lineTo(b.x, b.y); ctx.stroke();
          }
        }
        const dm = Math.hypot(a.x - mouse.x, a.y - mouse.y);
        if (dm < 170) {
          ctx.strokeStyle = `rgba(${RGB},${(1 - dm / 170) * 0.7})`;
          ctx.beginPath(); ctx.moveTo(a.x, a.y); ctx.lineTo(mouse.x, mouse.y); ctx.stroke();
          if (!reduce) { a.x += (mouse.x - a.x) * 0.004; a.y += (mouse.y - a.y) * 0.004; }
        }
        ctx.fillStyle = `rgba(${RGB},0.85)`;
        ctx.beginPath(); ctx.arc(a.x, a.y, a.r, 0, 6.283); ctx.fill();
      }
      if (running && visible && !d.hidden && !reduce) requestAnimationFrame(frame);
      else running = false;
    }
    function start() { if (!running && !reduce) { running = true; requestAnimationFrame(frame); } }

    resize(); frame();
    let rt;
    addEventListener("resize", () => { clearTimeout(rt); rt = setTimeout(() => { resize(); frame(); }, 150); });
    canvas.parentElement.addEventListener("pointermove", (e) => {
      const r = canvas.getBoundingClientRect();
      mouse.x = e.clientX - r.left; mouse.y = e.clientY - r.top;
    }, { passive: true });
    canvas.parentElement.addEventListener("pointerleave", () => { mouse.x = mouse.y = -999; });
    if ("IntersectionObserver" in window) {
      new IntersectionObserver((es) => { visible = es[0].isIntersecting; if (visible) start(); }).observe(canvas);
    }
    d.addEventListener("visibilitychange", start);
    start();
  }
  $$("canvas[data-net]").forEach(network);

  /* ------------------------------------------------------ rol animado (typing) */
  function typer(el) {
    const roles = JSON.parse(el.dataset.roles || "[]");
    if (!roles.length) return;
    if (reduce) { el.textContent = roles[0]; return; }
    let r = 0, i = 0, del = false;
    (function step() {
      const word = roles[r];
      el.textContent = word.slice(0, i);
      let wait = del ? 28 : 65;
      if (!del && i === word.length) { del = true; wait = 1700; }
      else if (del && i === 0) { del = false; r = (r + 1) % roles.length; wait = 350; }
      else i += del ? -1 : 1;
      setTimeout(step, wait);
    })();
  }

  /* -------------------------------------------------------------- reloj HUD */
  const clock = $("[data-clock]");
  if (clock) {
    const pad = (n) => String(n).padStart(2, "0");
    const tick = () => {
      const n = new Date();
      clock.textContent = `${pad(n.getDate())}/${pad(n.getMonth() + 1)}/${n.getFullYear()} ${pad(n.getHours())}:${pad(n.getMinutes())}:${pad(n.getSeconds())}`;
    };
    tick(); setInterval(tick, 1000);
  }

  /* ----------------------------------------------------- animaciones de scroll */
  function setupScrollAnimations() {
    // Títulos divididos (los del hero se animan en la intro)
    $$("[data-split]").forEach((el) => {
      const chars = el.__chars || splitText(el);
      if (el.hasAttribute("data-intro")) return;
      onEnter(el, () => {
        if (hasGSAP) gsap.fromTo(chars, { y: "115%" }, { y: "0%", duration: 1, ease: "power4.out", stagger: 0.025, onComplete() { el.classList.add("is-in"); gsap.set(chars, { clearProps: "transform" }); } });
        else el.classList.add("is-in");
      });
    });

    // Scramble en etiquetas
    $$("[data-scramble]").forEach((el) => {
      if (el.hasAttribute("data-intro")) return;
      onEnter(el, () => scramble(el), "top 92%");
    });

    // Reveals genéricos
    $$("[data-reveal]").forEach((el) => {
      if (el.hasAttribute("data-intro")) return;
      const delay = parseFloat(el.dataset.delay || 0);
      onEnter(el, () => {
        if (hasGSAP) gsap.fromTo(el, { opacity: 0, y: 32 }, { opacity: 1, y: 0, duration: 1, delay, ease: "power3.out", clearProps: "transform" });
        else { el.style.setProperty("--d", delay + "s"); el.classList.add("is-in"); }
      });
    });

    // Barras de habilidades + porcentaje
    $$(".skill").forEach((s) => {
      const fill = $(".bar i", s), label = $("em", s);
      const target = parseInt(fill.style.getPropertyValue("--w")) || 0;
      onEnter(s, () => {
        const delay = ($$(".skill", s.parentElement).indexOf(s)) * 0.08;
        if (hasGSAP) gsap.fromTo(fill, { width: "0%" }, { width: target + "%", duration: 1.6, delay, ease: "power3.out" });
        else { fill.parentElement.classList.add("is-in"); }
        setTimeout(() => countTo(label, target, 1500, "%"), delay * 1000);
      }, "top 92%");
    });

    // Contadores
    $$("[data-count]").forEach((el) => {
      const target = parseInt(el.dataset.count, 10);
      const suffix = el.dataset.suffix || "";
      onEnter(el, () => countTo(el, target, 1700, suffix), "top 92%");
    });

    // Línea de tiempo: se dibuja con el scroll
    $$("[data-timeline]").forEach((tl) => {
      const fill = $(".tl-fill", tl);
      if (hasGSAP && !reduce) {
        gsap.to(fill, { scaleY: 1, ease: "none", scrollTrigger: { trigger: tl, start: "top 65%", end: "bottom 65%", scrub: 0.6 } });
      } else {
        fill.style.transform = "scaleY(1)";
      }
      $$(".tl-item", tl).forEach((it) => onEnter(it, () => it.classList.add("lit"), "top 72%"));
    });

    // Parallax del hero
    if (hasGSAP && !reduce) {
      const hero = $(".hero");
      if (hero) {
        gsap.to(".hero-copy", { yPercent: -10, opacity: 0.2, ease: "none", scrollTrigger: { trigger: hero, start: "top top", end: "bottom top", scrub: true } });
        gsap.to(".hero-visual", { yPercent: -18, ease: "none", scrollTrigger: { trigger: hero, start: "top top", end: "bottom top", scrub: true } });
        gsap.to(".hero canvas.net, .hero .hero-grid", { yPercent: 12, ease: "none", scrollTrigger: { trigger: hero, start: "top top", end: "bottom top", scrub: true } });
      }
      const ph = $(".page-hero");
      if (ph) gsap.to(".page-hero .container", { yPercent: 14, opacity: 0.1, ease: "none", scrollTrigger: { trigger: ph, start: "top top", end: "bottom top", scrub: true } });

      // Pequeño desplazamiento diferencial en tarjetas de habilidades
      $$(".skills-card").forEach((c, i) => {
        gsap.fromTo(c, { y: 24 + i * 18 }, { y: 0, ease: "none", scrollTrigger: { trigger: ".skills-grid", start: "top bottom", end: "top 35%", scrub: true } });
      });
    }
  }

  /* ----------------------------------------------------------------- intro */
  function intro() {
    clearTimeout(failsafe);
    root.classList.add("ready");
    const introEls = $$("[data-intro]");
    const split = introEls.filter((e) => e.hasAttribute("data-split"));
    split.forEach((e) => { e.__chars = splitText(e); });

    setupScrollAnimations();

    const typed = $("[data-roles]");
    if (typed) setTimeout(() => typer(typed), reduce ? 0 : 1100);

    introEls.filter((e) => e.hasAttribute("data-scramble")).forEach((e) => setTimeout(() => scramble(e), 150));

    const rest = introEls.filter((e) => e.hasAttribute("data-reveal"));
    if (hasGSAP && !reduce) {
      const tl = gsap.timeline({ defaults: { ease: "power4.out" } });
      split.forEach((e, i) => {
        tl.fromTo(e.__chars, { y: "115%" }, { y: "0%", duration: 1.15, stagger: 0.035, onComplete() { e.classList.add("is-in"); gsap.set(e.__chars, { clearProps: "transform" }); } }, 0.15 + i * 0.1);
      });
      tl.fromTo(rest, { opacity: 0, y: 28 }, { opacity: 1, y: 0, duration: 0.9, stagger: 0.12, clearProps: "transform" }, 0.55);
      const vis = $(".portrait");
      if (vis) tl.fromTo(vis, { opacity: 0, scale: 0.92, y: 40 }, { opacity: 1, scale: 1, y: 0, duration: 1.3, clearProps: "opacity,transform" }, 0.4);
      const chips = $$(".chip");
      if (chips.length) tl.fromTo(chips, { opacity: 0, x: 20 }, { opacity: 1, x: 0, duration: 0.8, stagger: 0.15, clearProps: "opacity,x" }, 1.2);
      const hint = $(".scroll-hint");
      if (hint) tl.fromTo(hint, { opacity: 0 }, { opacity: 1, duration: 1 }, 1.6);
    } else {
      split.forEach((e) => e.classList.add("is-in"));
      rest.forEach((e, i) => { e.style.setProperty("--d", 0.35 + i * 0.1 + "s"); e.classList.add("is-in"); });
      if (reduce) root.classList.add("force-show");
    }
    if (hasGSAP) ScrollTrigger.refresh();
  }

  /* ------------------------------------------------------------------ boot */
  const boot = $(".boot");
  const seen = (() => { try { return sessionStorage.getItem("boot"); } catch (e) { return null; } })();
  if (boot && !seen && !reduce) {
    const lines = $(".boot-lines", boot);
    const bar = $(".boot-bar i", boot);
    const pct = $(".boot-pct", boot);
    const script = [
      ["> iniciando sistema…", 0],
      ["> cargando módulos de seguridad <b>[ OK ]</b>", 380],
      ["> verificando identidad… <b>paula.barcelo</b>", 800],
      ["> acceso <b>concedido</b>", 1250],
    ];
    d.body.style.overflow = "hidden";
    script.forEach(([html, t]) => setTimeout(() => {
      const p = d.createElement("p"); p.innerHTML = html; lines.append(p);
    }, t));
    const t0 = performance.now(), total = 1700;
    (function tick(now) {
      const p = Math.min(1, (now - t0) / total);
      bar.style.width = p * 100 + "%";
      pct.textContent = String(Math.round(p * 100)).padStart(3, "0") + "%";
      if (p < 1) requestAnimationFrame(tick);
      else {
        try { sessionStorage.setItem("boot", "1"); } catch (e) {}
        setTimeout(() => {
          boot.classList.add("done");
          d.body.style.overflow = "";
          intro();
        }, 250);
      }
    })(t0);
  } else {
    if (boot) boot.remove();
    // Esperar a que el DOM esté listo
    requestAnimationFrame(intro);
  }

  /* ------------------------------------------------------------ formulario */
  const form = $("#contact-form");
  if (form) {
    const status = $(".form-status", form);
    const btn = $("button[type=submit]", form);
    form.addEventListener("submit", (e) => {
      e.preventDefault();
      const set = (msg, cls) => { status.textContent = msg; status.className = "form-status " + (cls || ""); };
      if (typeof emailjs === "undefined") { set("// error: servicio de correo no disponible, probá más tarde.", "err"); return; }
      btn.disabled = true;
      set("> enviando mensaje…");
      emailjs.sendForm("service_ukwvoz1", "template_o5f31cg", form).then(
        () => { set("> mensaje enviado correctamente. ¡Gracias!", "ok"); form.reset(); btn.disabled = false; },
        (err) => { set("// error al enviar: " + (err && err.text ? err.text : "intentá nuevamente"), "err"); btn.disabled = false; }
      );
    });
  }
})();
