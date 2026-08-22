(() => {
  const THEME_STORAGE_KEY = "theme";
  const DARK_THEME = "dark";
  const LIGHT_THEME = "light";
  const DARK_LABEL = "라이트 모드로 전환";
  const LIGHT_LABEL = "다크 모드로 전환";
  const scriptUrl = document.currentScript?.src || new URL("./script.js", document.baseURI).href;
  const assetUrl = (fileName) => new URL(`./assets/${fileName}`, scriptUrl).href;

  const getStoredTheme = () => {
    try {
      return window.localStorage.getItem(THEME_STORAGE_KEY) === DARK_THEME ? DARK_THEME : LIGHT_THEME;
    } catch {
      return LIGHT_THEME;
    }
  };

  const storeTheme = (theme) => {
    try {
      window.localStorage.setItem(THEME_STORAGE_KEY, theme);
    } catch {
      // Theme still works for the current page if storage is unavailable.
    }
  };

  const applyTheme = (theme, toggle = document.querySelector("[data-theme-toggle]")) => {
    const nextTheme = theme === DARK_THEME ? DARK_THEME : LIGHT_THEME;
    document.documentElement.dataset.theme = nextTheme;
    document.documentElement.style.colorScheme = nextTheme;
    toggle?.setAttribute("aria-label", nextTheme === DARK_THEME ? DARK_LABEL : LIGHT_LABEL);
  };

  applyTheme(getStoredTheme(), null);

  const onReady = () => {
    const scroller = document.querySelector(".snap-root");
    const menuButton = document.querySelector("[data-menu-toggle]");
    const mobileMenu = document.querySelector("[data-mobile-menu]");
    const heroVideo = document.querySelector("[data-hero-video]");
    const projectGrid = document.querySelector("[data-project-grid]");
    const projects = Array.isArray(window.PORTFOLIO_PROJECTS) ? window.PORTFOLIO_PROJECTS : [];
    const links = [...document.querySelectorAll("[data-snap-link]")];
    const prefersReducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;

    const ensureThemeToggle = () => {
      const existingToggle = document.querySelector("[data-theme-toggle]");
      if (existingToggle) return existingToggle;

      const toggle = document.createElement("button");
      toggle.className = "theme-toggle";
      toggle.type = "button";
      toggle.setAttribute("data-theme-toggle", "");

      const sunIcon = document.createElement("img");
      sunIcon.className = "theme-icon theme-icon-sun";
      sunIcon.src = assetUrl("icon-sun.png");
      sunIcon.alt = "";

      const moonIcon = document.createElement("img");
      moonIcon.className = "theme-icon theme-icon-moon";
      moonIcon.src = assetUrl("icon-moon.png");
      moonIcon.alt = "";

      toggle.append(sunIcon, moonIcon);
      document.body.append(toggle);
      return toggle;
    };

    const themeToggle = ensureThemeToggle();
    applyTheme(getStoredTheme(), themeToggle);

    const resolveProjectPath = (value, rootPrefix) => {
      if (!value) return "#";
      if (value.startsWith("#")) return `${rootPrefix}${value}`;
      if (/^(https?:|mailto:|tel:|\/|\.{1,2}\/)/.test(value)) return value;
      return `${rootPrefix}${value}`;
    };

    const renderProjectCards = () => {
      if (!projectGrid || projects.length === 0) return;

      const rootPrefix = projectGrid.dataset.projectRoot || "";
      const fragment = document.createDocumentFragment();

      projects.forEach((project, index) => {
        const card = document.createElement("a");
        const href = resolveProjectPath(project.href, rootPrefix);
        card.className = "project-card";
        card.href = href;

        if (project.nodeId) card.dataset.nodeId = project.nodeId;
        if (/^https?:/.test(project.href || "")) {
          card.target = "_blank";
          card.rel = "noreferrer";
        }

        const figure = document.createElement("figure");
        figure.className = "project-media";

        const image = document.createElement("img");
        image.src = resolveProjectPath(project.image, rootPrefix);
        image.alt = project.imageAlt || `${project.title} project preview`;
        image.loading = project.loading || (index < 2 ? "eager" : "lazy");

        const info = document.createElement("div");
        info.className = "project-info";

        const title = document.createElement("h2");
        title.textContent = project.title;

        const description = document.createElement("p");
        description.textContent = project.description;

        figure.append(image);
        info.append(title, description);
        card.append(figure, info);
        fragment.append(card);
      });

      projectGrid.replaceChildren(fragment);
    };

    renderProjectCards();

    const closeMenu = () => {
      if (!menuButton || !mobileMenu) return;
      menuButton.setAttribute("aria-expanded", "false");
      mobileMenu.setAttribute("aria-hidden", "true");
      mobileMenu.classList.remove("is-open");
    };

    const scrollToPanel = (hash, behavior = prefersReducedMotion ? "auto" : "smooth") => {
      const target = document.querySelector(hash);
      if (!target) return;
      scroller?.classList.toggle("is-footer-free", hash === "#archive");
      target.scrollIntoView({
        behavior,
        block: "start",
      });
    };

    links.forEach((link) => {
      link.addEventListener("click", (event) => {
        const hash = link.getAttribute("href");
        if (!hash || !hash.startsWith("#")) return;
        event.preventDefault();
        closeMenu();
        scrollToPanel(hash);
      });
    });

    if (scroller && window.location.hash) {
      requestAnimationFrame(() => scrollToPanel(window.location.hash, "auto"));
    }

    menuButton?.addEventListener("click", () => {
      if (!mobileMenu) return;
      const isOpen = menuButton.getAttribute("aria-expanded") === "true";
      menuButton.setAttribute("aria-expanded", String(!isOpen));
      mobileMenu.setAttribute("aria-hidden", String(isOpen));
      mobileMenu.classList.toggle("is-open", !isOpen);
    });

    document.addEventListener("keydown", (event) => {
      if (event.key === "Escape") closeMenu();
    });

    heroVideo?.addEventListener("canplay", () => {
      heroVideo.classList.remove("is-unavailable");
      heroVideo.play().catch(() => {
        heroVideo.classList.add("is-unavailable");
      });
    });

    heroVideo?.addEventListener("error", () => {
      heroVideo.classList.add("is-unavailable");
    });

    const updateFooterSnap = () => {
      if (!scroller) return;
      const about = document.querySelector("#about");
      if (!about) return;
      const releasePoint = about.offsetTop + 8;
      scroller.classList.toggle("is-footer-free", scroller.scrollTop > releasePoint);
    };

    scroller?.addEventListener(
      "wheel",
      (event) => {
        const about = document.querySelector("#about");
        if (!about) return;
        const isAtAbout = Math.abs(scroller.scrollTop - about.offsetTop) < 12;
        if (event.deltaY > 0 && isAtAbout) {
          scroller.classList.add("is-footer-free");
        }
      },
      { passive: true }
    );

    window.addEventListener(
      "wheel",
      (event) => {
        if (!scroller || event.ctrlKey) return;
        const about = document.querySelector("#about");
        if (!about) return;
        const isAtAbout = Math.abs(scroller.scrollTop - about.offsetTop) < 12;
        if (event.deltaY > 0 && isAtAbout) {
          event.preventDefault();
          scroller.classList.add("is-footer-free");
          scroller.scrollBy({
            top: event.deltaY,
            left: 0,
            behavior: "auto",
          });
        }
      },
      { capture: true, passive: false }
    );

    scroller?.addEventListener("scroll", updateFooterSnap, { passive: true });

    if (scroller && "IntersectionObserver" in window) {
      const panels = [...document.querySelectorAll(".snap-panel, .footer-panel")];
      const observer = new IntersectionObserver(
        (entries) => {
          const current = entries
            .filter((entry) => entry.isIntersecting)
            .sort((a, b) => b.intersectionRatio - a.intersectionRatio)[0];

          if (!current) return;

          links.forEach((link) => {
            link.classList.toggle("is-active", link.getAttribute("href") === `#${current.target.id}`);
          });
        },
        {
          root: scroller,
          threshold: [0.55, 0.7, 0.85],
        }
      );

      panels.forEach((panel) => observer.observe(panel));
    }

    themeToggle?.addEventListener("click", () => {
      const nextTheme = document.documentElement.dataset.theme === DARK_THEME ? LIGHT_THEME : DARK_THEME;
      applyTheme(nextTheme, themeToggle);
      storeTheme(nextTheme);
    });

    window.addEventListener("storage", (event) => {
      if (event.key !== THEME_STORAGE_KEY) return;
      applyTheme(event.newValue === DARK_THEME ? DARK_THEME : LIGHT_THEME, themeToggle);
    });

    let themeToggleRevealTimer = 0;
    const showThemeToggle = () => {
      themeToggle?.classList.remove("is-scroll-hidden");
    };
    const handleThemeToggleScroll = () => {
      if (!themeToggle) return;
      themeToggle.classList.add("is-scroll-hidden");
      window.clearTimeout(themeToggleRevealTimer);
      themeToggleRevealTimer = window.setTimeout(showThemeToggle, 2000);
    };

    const scrollTargets = new Set([window]);
    if (scroller) scrollTargets.add(scroller);
    scrollTargets.forEach((target) => {
      target.addEventListener("scroll", handleThemeToggleScroll, { passive: true });
    });
  };

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", onReady, { once: true });
  } else {
    onReady();
  }
})();
