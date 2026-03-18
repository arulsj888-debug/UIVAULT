(() => {
  "use strict";

  const CTA = {
    primary: "https://rosehillops.gumroad.com/l/xjricaw?utm_source=demo&utm_medium=react&utm_campaign=landing_sprint&utm_content=theme_clean",
    secondary: "#sections",
  };

  const BRAND = {
    name: "Rosehill Webtools",
    short: "RH",
    tagline: "IF IT DIDN'T DEMO, IT DIDN'T HAPPEN.",
    location: "Remote / USA",
  };

  const prefersReducedMotion =
    window.matchMedia?.("(prefers-reduced-motion: reduce)")?.matches ?? false;
  const hasGSAP = typeof window.gsap !== "undefined";
  const hasScrollTrigger = typeof window.ScrollTrigger !== "undefined";

  function applyBrand() {
    document.querySelectorAll("[data-brand-text]").forEach((el) => (el.textContent = BRAND.name));
    document.querySelectorAll("[data-brand-short]").forEach((el) => (el.textContent = BRAND.short));
    const taglineEl = document.querySelector("[data-brand-tagline]");
    if (taglineEl) taglineEl.textContent = BRAND.tagline;
    const locEl = document.querySelector("[data-brand-location]");
    if (locEl) locEl.textContent = BRAND.location;
    const yearEl = document.querySelector("[data-year]");
    if (yearEl) yearEl.textContent = String(new Date().getFullYear());
  }

  function applyCTALinks() {
    document.querySelectorAll('[data-cta="primary"]').forEach((a) => a.setAttribute("href", CTA.primary));
    document.querySelectorAll('[data-cta="secondary"]').forEach((a) => a.setAttribute("href", CTA.secondary));
  }

  function initMobileMenu() {
    const menuRoot = document.getElementById("mobileMenu");
    const menuBtn = document.getElementById("menuBtn");
    const menuCloseBtn = document.getElementById("menuCloseBtn");
    const panel = menuRoot?.querySelector("[data-menu-panel]");
    const backdrop = menuRoot?.querySelector("[data-menu-backdrop]");
    const menuLinks = menuRoot?.querySelectorAll("[data-menu-link]") || [];
    let menuOpen = false;

    const lockScroll = (lock) => { document.documentElement.style.overflow = lock ? "hidden" : ""; };
    const setMenuA11y = (open) => { menuBtn?.setAttribute("aria-expanded", String(open)); };

    const openMenu = () => {
      if (!menuRoot || !panel || !backdrop || menuOpen) return;
      menuOpen = true;
      setMenuA11y(true);
      lockScroll(true);
      menuRoot.style.pointerEvents = "auto";
      if (!prefersReducedMotion && hasGSAP) {
        window.gsap.to(backdrop, { opacity: 1, duration: 0.25, ease: "power2.out" });
        window.gsap.to(panel, { opacity: 1, y: 0, duration: 0.35, ease: "power3.out", overwrite: true });
      } else {
        backdrop.style.opacity = "1";
        panel.style.opacity = "1";
        panel.style.transform = "translateY(0)";
      }
    };

    const closeMenu = () => {
      if (!menuRoot || !panel || !backdrop || !menuOpen) return;
      menuOpen = false;
      setMenuA11y(false);
      lockScroll(false);
      if (!prefersReducedMotion && hasGSAP) {
        window.gsap.to(backdrop, { opacity: 0, duration: 0.2, ease: "power2.out" });
        window.gsap.to(panel, {
          opacity: 0, y: -24, duration: 0.25, ease: "power2.in",
          onComplete: () => { menuRoot.style.pointerEvents = "none"; },
        });
      } else {
        backdrop.style.opacity = "0";
        panel.style.opacity = "0";
        panel.style.transform = "translateY(-24px)";
        menuRoot.style.pointerEvents = "none";
      }
    };

    menuBtn?.addEventListener("click", openMenu);
    menuCloseBtn?.addEventListener("click", closeMenu);
    backdrop?.addEventListener("click", closeMenu);
    menuLinks.forEach((a) => a.addEventListener("click", closeMenu));
    window.addEventListener("keydown", (e) => { if (e.key === "Escape") closeMenu(); });
  }

  function initNavbarScroll() {
    const nav = document.getElementById("navbar");
    if (!nav) return;
    const onScroll = () => {
      if (window.scrollY > 50) nav.classList.add("bg-black/90", "backdrop-blur-md", "shadow-lg");
      else nav.classList.remove("bg-black/90", "backdrop-blur-md", "shadow-lg");
    };
    window.addEventListener("scroll", onScroll, { passive: true });
    onScroll();
  }

  function showFallback() {
    document.querySelector(".loader")?.remove();
    document.querySelectorAll(".reveal-on-load").forEach((el) => {
      el.style.opacity = "1";
      el.style.transform = "none";
    });
  }

  function initAnimations() {
    if (prefersReducedMotion || !hasGSAP) { showFallback(); return; }
    if (hasScrollTrigger) { window.gsap.registerPlugin(window.ScrollTrigger); }

    // Loader + initial reveal
    const tl = window.gsap.timeline();
    tl.to(".loader-text", { opacity: 1, y: 0, duration: 0.9, ease: "power2.out" })
      .to(".loader", { y: "-100%", duration: 0.9, delay: 0.35, ease: "power4.inOut" })
      .to(".reveal-on-load", { opacity: 1, y: 0, duration: 0.7, stagger: 0.12, ease: "power2.out" }, "-=0.15");

    if (!hasScrollTrigger) return;

    // Section reveals
    document.querySelectorAll('[data-reveal="left"]').forEach((el) => {
      window.gsap.from(el, {
        scrollTrigger: { trigger: el, start: "top 80%", toggleActions: "play none none reverse" },
        x: -50, opacity: 0, duration: 0.9, ease: "power3.out",
      });
    });

    document.querySelectorAll('[data-reveal="right"]').forEach((el) => {
      window.gsap.from(el, {
        scrollTrigger: { trigger: el, start: "top 80%", toggleActions: "play none none reverse" },
        x: 50, opacity: 0, duration: 0.9, delay: 0.1, ease: "power3.out",
      });
    });

    // Service cards
    window.gsap.from(".service-card", {
      scrollTrigger: { trigger: "#sections", start: "top 75%" },
      y: 40, opacity: 0, duration: 0.7, stagger: 0.15, ease: "power2.out",
    });

    // Hero parallax
    window.gsap.to(".hero-img", {
      scrollTrigger: { trigger: "#home", start: "top top", end: "bottom top", scrub: true },
      y: 90, scale: 1.08,
    });

    // Count-up stats
    document.querySelectorAll("[data-count]").forEach((el) => {
      const end = Number(el.getAttribute("data-count") || "0");
      const obj = { val: 0 };
      window.gsap.to(obj, {
        val: end, duration: 1.2, ease: "power1.out", snap: { val: 1 },
        onUpdate: () => { el.textContent = String(Math.round(obj.val)); },
        scrollTrigger: { trigger: el, start: "top 85%" },
      });
    });
  }

  document.addEventListener("DOMContentLoaded", () => {
    applyBrand();
    applyCTALinks();
    initMobileMenu();
    initNavbarScroll();
    try { initAnimations(); } catch { showFallback(); }
  });
})();
