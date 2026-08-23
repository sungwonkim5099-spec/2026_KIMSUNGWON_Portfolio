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

    // Elsewhere switcher
    const elsewhere = document.querySelector("[data-elsewhere]");
    const elsewhereSwitcher = document.querySelector("[data-elsewhere-switcher]");
    const elsewherePanelStage = document.querySelector("[data-elsewhere-panel-stage]");
    const elsewhereTabs = [...document.querySelectorAll("[data-elsewhere-tab]")];
    const elsewherePanels = [...document.querySelectorAll("[data-elsewhere-panel]")];
    const elsewhereSnapNav = document.querySelector("[data-elsewhere-snap-nav]");
    let elsewhereActivePanel = "calmato";
    let elsewhereTouchStartX = 0;
    let elsewhereTouchStartY = 0;
    let elsewherePanelHeightTimer = 0;
    let elsewhereSlideTimer = 0;

    const animateElsewhereIndicator = (nextPanel) => {
      const indicator = elsewhereSwitcher?.querySelector(".elsewhere-switcher-indicator");
      if (!indicator || typeof indicator.animate !== "function") return;

      const fromIndex = elsewhereActivePanel === "unsplash" ? 1 : 0;
      const toIndex = nextPanel === "unsplash" ? 1 : 0;
      const travel = indicator.offsetWidth;
      const fromX = fromIndex * travel;
      const toX = toIndex * travel;

      indicator.getAnimations().forEach((animation) => animation.cancel());
      indicator.animate(
        [
          { transform: `translate3d(${fromX}px, 0, 0) scaleX(1)` },
          { transform: `translate3d(${(fromX + toX) / 2}px, 0, 0) scaleX(1.08)`, offset: 0.52 },
          { transform: `translate3d(${toX}px, 0, 0) scaleX(1)` },
        ],
        {
          duration: 520,
          easing: "cubic-bezier(0.22, 1, 0.36, 1)",
          fill: "both",
        }
      );
    };

    const setElsewherePanel = (nextPanel) => {
      if (!elsewhereSwitcher || !elsewhereTabs.length || !elsewherePanels.length) return;
      if (!["calmato", "unsplash"].includes(nextPanel) || nextPanel === elsewhereActivePanel) return;

      const isMovingToRight = nextPanel === "unsplash";
      elsewhereSwitcher.dataset.slideDirection = isMovingToRight ? "right" : "left";
      elsewhereSwitcher.classList.add("is-sliding");
      animateElsewhereIndicator(nextPanel);
      window.clearTimeout(elsewhereSlideTimer);
      elsewhereSlideTimer = window.setTimeout(() => {
        elsewhereSwitcher.classList.remove("is-sliding");
      }, 520);

      if (elsewherePanelStage) {
        elsewherePanelStage.style.minHeight = `${elsewherePanelStage.offsetHeight}px`;
        window.clearTimeout(elsewherePanelHeightTimer);
        elsewherePanelHeightTimer = window.setTimeout(() => {
          elsewherePanelStage.style.minHeight = "";
        }, prefersReducedMotion ? 0 : 420);
      }

      elsewhereActivePanel = nextPanel;
      elsewhereSwitcher.dataset.active = nextPanel;

      elsewhereTabs.forEach((tab) => {
        const isActive = tab.dataset.elsewhereTab === nextPanel;
        tab.classList.toggle("is-active", isActive);
        tab.setAttribute("aria-selected", String(isActive));
      });

      elsewherePanels.forEach((panel) => {
        const isActive = panel.dataset.elsewherePanel === nextPanel;
        panel.classList.toggle("is-active", isActive);
        panel.classList.toggle("is-before", !isActive && isMovingToRight);
        panel.setAttribute("aria-hidden", String(!isActive));
      });

      elsewhereSnapNav?.classList.toggle("is-hidden", nextPanel !== "calmato");
    };

    elsewhereTabs.forEach((tab) => {
      tab.addEventListener("click", () => {
        setElsewherePanel(tab.dataset.elsewhereTab || "calmato");
      });

      tab.addEventListener("keydown", (event) => {
        if (!["ArrowLeft", "ArrowRight"].includes(event.key)) return;
        event.preventDefault();
        const nextPanel = event.key === "ArrowRight" ? "unsplash" : "calmato";
        setElsewherePanel(nextPanel);
        document.querySelector(`[data-elsewhere-tab="${nextPanel}"]`)?.focus();
      });
    });

    elsewhere?.addEventListener(
      "touchstart",
      (event) => {
        const touch = event.touches[0];
        if (!touch) return;
        elsewhereTouchStartX = touch.clientX;
        elsewhereTouchStartY = touch.clientY;
      },
      { passive: true }
    );

    elsewhere?.addEventListener(
      "touchend",
      (event) => {
        const touch = event.changedTouches[0];
        if (!touch) return;

        const deltaX = touch.clientX - elsewhereTouchStartX;
        const deltaY = touch.clientY - elsewhereTouchStartY;
        const isHorizontalSwipe = Math.abs(deltaX) > 48 && Math.abs(deltaX) > Math.abs(deltaY) * 1.4;
        if (!isHorizontalSwipe) return;

        setElsewherePanel(deltaX < 0 ? "unsplash" : "calmato");
      },
      { passive: true }
    );

    // Elsewhere snap indicator
    const elsewhereSnapRoot = document.querySelector("[data-elsewhere-snap-root]");
    const elsewhereSnapPanels = [...document.querySelectorAll("[data-elsewhere-snap-panel]")];
    const elsewhereSnapDots = [...document.querySelectorAll("[data-elsewhere-snap-dot]")];
    const elsewhereFooter = document.querySelector("[data-elsewhere-footer]");
    const elsewhereSnapScroller = elsewhereSnapRoot;
    let elsewhereSnapStateFrame = 0;

    const getElsewhereYouTubeId = (url) => {
      if (!url) return "";

      try {
        const parsedUrl = new URL(url);
        const host = parsedUrl.hostname.replace(/^www\./, "");

        if (host === "youtu.be") return parsedUrl.pathname.split("/").filter(Boolean)[0] || "";
        if (!host.includes("youtube.com")) return "";
        if (parsedUrl.searchParams.has("v")) return parsedUrl.searchParams.get("v") || "";

        const pathParts = parsedUrl.pathname.split("/").filter(Boolean);
        const videoPathIndex = pathParts.findIndex((part) => ["embed", "shorts", "live"].includes(part));
        return videoPathIndex >= 0 ? pathParts[videoPathIndex + 1] || "" : "";
      } catch {
        return "";
      }
    };

    document.querySelectorAll("[data-youtube-url]").forEach((video) => {
      const videoId = getElsewhereYouTubeId(video.dataset.youtubeUrl || "");
      const frame = video.querySelector("[data-youtube-frame]");
      if (!videoId || !frame) return;

      const iframe = document.createElement("iframe");
      iframe.src = `https://www.youtube-nocookie.com/embed/${encodeURIComponent(videoId)}?rel=0&modestbranding=1&playsinline=1`;
      iframe.title = video.getAttribute("aria-label") || "Calmato YouTube video";
      iframe.loading = "lazy";
      iframe.allow = "accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share";
      iframe.allowFullscreen = true;
      iframe.setAttribute("playsinline", "");
      frame.replaceChildren(iframe);
    });

    const getElsewhereScrollTop = (target) => {
      if (!elsewhereSnapScroller || !target) return 0;
      return target.offsetTop;
    };

    const isElsewhereFooterVisible = () => {
      if (!elsewhereFooter) return false;
      const footerRect = elsewhereFooter.getBoundingClientRect();
      return footerRect.top < window.innerHeight && footerRect.bottom > 0;
    };

    const setElsewhereSnapIndex = (nextIndex) => {
      elsewhereSnapDots.forEach((dot, index) => {
        const isActive = index === nextIndex;
        dot.classList.toggle("is-active", isActive);
        dot.setAttribute("aria-current", isActive ? "true" : "false");
      });

      elsewhereSnapPanels.forEach((panel) => {
        panel.classList.toggle(
          "is-visible",
          Number(panel.dataset.elsewhereSnapPanel || 0) === nextIndex
        );
      });

      elsewhereSwitcher?.classList.toggle("is-hidden", nextIndex !== 0);
    };

    const updateElsewhereSnapState = () => {
      if (!elsewhereSnapScroller || !elsewhereSnapPanels.length) return;

      if (isElsewhereFooterVisible()) {
        setElsewhereSnapIndex(-1);
        return;
      }

      const viewportCenter = elsewhereSnapScroller.scrollTop + elsewhereSnapScroller.clientHeight / 2;
      const currentPanel = elsewhereSnapPanels
        .map((panel, index) => {
          const panelCenter = getElsewhereScrollTop(panel) + panel.offsetHeight / 2;
          return { index, distance: Math.abs(viewportCenter - panelCenter) };
        })
        .sort((a, b) => a.distance - b.distance)[0];

      setElsewhereSnapIndex(currentPanel?.index ?? 0);
    };

    const requestElsewhereSnapState = () => {
      window.cancelAnimationFrame(elsewhereSnapStateFrame);
      elsewhereSnapStateFrame = window.requestAnimationFrame(updateElsewhereSnapState);
    };

    if (elsewhereSnapRoot && elsewhereSnapScroller && elsewhereSnapPanels.length && elsewhereSnapDots.length) {
      elsewhereSnapDots.forEach((dot) => {
        dot.addEventListener("click", () => {
          const targetPanel = elsewhereSnapPanels.find(
            (panel) => panel.dataset.elsewhereSnapPanel === dot.dataset.elsewhereSnapDot
          );

          if (!targetPanel) return;
          setElsewhereSnapIndex(Number(dot.dataset.elsewhereSnapDot || 0));
          elsewhereSnapScroller.scrollTo({
            top: getElsewhereScrollTop(targetPanel),
            behavior: prefersReducedMotion ? "auto" : "smooth",
          });
        });
      });

      elsewhereSnapScroller.addEventListener(
        "scroll",
        () => {
          requestElsewhereSnapState();
        },
        { passive: true }
      );

      elsewhereSnapScroller.addEventListener(
        "wheel",
        (event) => {
          if (event.deltaY < 0 && isElsewhereFooterVisible()) {
            event.preventDefault();
            window.scrollBy({
              top: event.deltaY,
              left: 0,
              behavior: "auto",
            });
            requestElsewhereSnapState();
            return;
          }

          const lastSnapPanel = elsewhereSnapPanels[elsewhereSnapPanels.length - 1];
          if (!lastSnapPanel || event.deltaY <= 0) return;

          const lastPanelTop = getElsewhereScrollTop(lastSnapPanel);
          const isAtLastPanel = Math.abs(elsewhereSnapScroller.scrollTop - lastPanelTop) < 12;
          const isAtScrollEnd =
            elsewhereSnapScroller.scrollTop + elsewhereSnapScroller.clientHeight >= elsewhereSnapScroller.scrollHeight - 2;

          if (isAtLastPanel && isAtScrollEnd) {
            setElsewhereSnapIndex(-1);
          }
        },
        { passive: false }
      );

      window.addEventListener("scroll", requestElsewhereSnapState, { passive: true });

      if ("IntersectionObserver" in window) {
        const observer = new IntersectionObserver(
          requestElsewhereSnapState,
          {
            root: elsewhereSnapScroller,
            threshold: [0, 0.5, 0.7, 0.9],
          }
        );

        elsewhereSnapPanels.forEach((panel) => observer.observe(panel));
      }

      if (elsewhereFooter && "IntersectionObserver" in window) {
        const footerObserver = new IntersectionObserver(
          () => {
            if (isElsewhereFooterVisible()) {
              setElsewhereSnapIndex(-1);
              return;
            }

            updateElsewhereSnapState();
          },
          {
            threshold: [0, 0.05],
          }
        );

        footerObserver.observe(elsewhereFooter);
      }

      updateElsewhereSnapState();
    }

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
      const snapDots = [...document.querySelectorAll(".snap-dot")];

      const indicatorTargets = ["visual", "works", "about"];

snapDots.forEach((dot, index) => {

  dot.addEventListener("click", () => {

    const targetId = indicatorTargets[index];

    const target = document.getElementById(targetId);

    if (!target) return;

    target.scrollIntoView({

      behavior: "smooth",

      block: "start",

    });

  });

});

      const observer = new IntersectionObserver(
        (entries) => {
          const current = entries
            .filter((entry) => entry.isIntersecting)
            .sort((a, b) => b.intersectionRatio - a.intersectionRatio)[0];

          if (!current) return;

          const indicatorTargets = ["visual", "works", "about"];

const currentIndex = indicatorTargets.indexOf(current.target.id);

snapDots.forEach((dot, index) => {

  dot.classList.toggle("is-active", index === currentIndex);

});

links.forEach((link) => {

  link.classList.toggle("is-active", link.getAttribute("href") === `#${current.target.id}`);

});
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
      themeToggleRevealTimer = window.setTimeout(showThemeToggle, 1000);
    };

    const scrollTargets = new Set([window]);
    if (scroller) scrollTargets.add(scroller);
    if (elsewhere) scrollTargets.add(elsewhere);
    if (elsewhereSnapRoot) scrollTargets.add(elsewhereSnapRoot);
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
