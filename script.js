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
    
// Calmato Hero Typewriter

const calmatoTypewriter = document.querySelector(
  "[data-calmato-typewriter]"
);

console.log("Calmato Typewriter:", calmatoTypewriter);

if (calmatoTypewriter) {

  const lines = [

    "일상의 끝에 잠시 머물 수 있는 순간을 전하는 음악 콘텐츠 채널입니다.",

    "콘텐츠의 기획부터 비주얼, 영상과 사운드까지 하나의 방향성으로 설계하며,",

    "누군가의 하루가 조금 더 차분하고 평온하게 마무리될 수 있는 콘텐츠를 제작하고 있습니다."

  ];

  const speed = 30;

  const lineDelay = 100;

  const startTypewriter = () => {

    if (calmatoTypewriter.dataset.typed === "true") return;

    calmatoTypewriter.dataset.typed = "true";

    calmatoTypewriter.innerHTML = "";

    let lineIndex = 0;

    let charIndex = 0;

    const typeLine = () => {

      if (lineIndex >= lines.length) return;

      if (charIndex < lines[lineIndex].length) {

        calmatoTypewriter.append(

          document.createTextNode(lines[lineIndex][charIndex])

        );

        charIndex++;

        window.setTimeout(typeLine, speed);

        return;

      }

      lineIndex++;

      charIndex = 0;

      if (lineIndex < lines.length) {

        calmatoTypewriter.append(document.createElement("br"));

        window.setTimeout(typeLine, lineDelay);

      }

    };

    typeLine();

  };

  window.setTimeout(startTypewriter, 300);

}
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
        if (isHorizontalSwipe) {
          setElsewherePanel(deltaX < 0 ? "unsplash" : "calmato");
        }
      },
      { passive: true }
    );

    // Elsewhere / Unsplash Carousel
    // VS Code Edit: 이미지 추가 후 src에 실제 확장자를 포함한 경로를 입력하세요.
    // src 예시: "../assets/elsewhere_unsplash/00_unsplash.[실제확장자]"
    const unsplashItems = [
      {
        src: "../assets/elsewhere_unsplash/00_unsplash.jpg",
        alt: "Shinjuku Gyoen 01",
        title: "Shinjuku Gyoen 01",
        location: "Tokyo, Japan",
        year: "2026.04",
        url: "#",
      },
      {
        src: "../assets/elsewhere_unsplash/01_unsplash.jpg",
        alt: "Shinjuku Gyoen 02",
        title: "Shinjuku Gyoen 02",
        location: "Tokyo, Japan",
        year: "2026.04",
        url: "#",
      },
      {
        src: "../assets/elsewhere_unsplash/02_unsplash.jpg",
        alt: "Shinjuku Gyoen 03",
        title: "Shinjuku Gyoen 03",
        location: "Tokyo, Japan",
        year: "2026.04",
        url: "#",
      },
      {
        src: "../assets/elsewhere_unsplash/03_unsplash.jpg",
        alt: "Unsplash photo 04 image path placeholder",
        title: "Photo 04 Placeholder",
        location: "Tokyo, Japan",
        year: "2026.08",
        url: "#",
      },
      {
        src: "../assets/elsewhere_unsplash/04_unsplash.jpg",
        alt: "Unsplash photo 05 image path placeholder",
        title: "Night Tokyo",
        location: "Tokyo, Japan",
        year: "2026.03",
        url: "#",
      },
      {
        src: "../assets/elsewhere_unsplash/05_unsplash.jpg",
        alt: "Unsplash photo 06 image path placeholder",
        title: "Photo 06 Placeholder",
        location: "Location placeholder",
        year: "2026",
        url: "#",
      },
      {
        src: "../assets/elsewhere_unsplash/06_unsplash.jpg",
        alt: "Unsplash photo 07 image path placeholder",
        title: "Photo 07 Placeholder",
        location: "Location placeholder",
        year: "2026",
        url: "#",
      },
      {
        src: "../assets/elsewhere_unsplash/07_unsplash.jpg",
        alt: "Unsplash photo 08 image path placeholder",
        title: "Photo 08 Placeholder",
        location: "Location placeholder",
        year: "2026",
        url: "#",
      },
      {
        src: "../assets/elsewhere_unsplash/08_unsplash.jpg",
        alt: "Unsplash photo 09 image path placeholder",
        title: "Photo 09 Placeholder",
        location: "Location placeholder",
        year: "2026",
        url: "#",
      },
      {
        src: "../assets/elsewhere_unsplash/09_unsplash.jpg",
        alt: "Unsplash photo 10 image path placeholder",
        title: "Photo 10 Placeholder",
        location: "Location placeholder",
        year: "2026",
        url: "#",
      },
      {
        src: "../assets/elsewhere_unsplash/10_unsplash.jpg",
        alt: "Unsplash photo 10 image path placeholder",
        title: "Photo 10 Placeholder",
        location: "Location placeholder",
        year: "2026",
        url: "#",
      },
      {
        src: "../assets/elsewhere_unsplash/11_unsplash.jpg",
        alt: "Unsplash photo 10 image path placeholder",
        title: "Photo 10 Placeholder",
        location: "Location placeholder",
        year: "2026",
        url: "#",
      },
      {
        src: "../assets/elsewhere_unsplash/12_unsplash.jpg",
        alt: "Unsplash photo 10 image path placeholder",
        title: "Photo 10 Placeholder",
        location: "Location placeholder",
        year: "2026",
        url: "#",
      },
      {
        src: "../assets/elsewhere_unsplash/13_unsplash.jpg",
        alt: "Unsplash photo 10 image path placeholder",
        title: "Photo 10 Placeholder",
        location: "Location placeholder",
        year: "2026",
        url: "#",
      },
      {
        src: "../assets/elsewhere_unsplash/13_unsplash.jpg",
        alt: "Unsplash photo 10 image path placeholder",
        title: "Photo 10 Placeholder",
        location: "Location placeholder",
        year: "2026",
        url: "#",
      },
      {
        src: "../assets/elsewhere_unsplash/14_unsplash.jpg",
        alt: "Unsplash photo 10 image path placeholder",
        title: "Photo 10 Placeholder",
        location: "Location placeholder",
        year: "2026",
        url: "#",
      },
      {
        src: "../assets/elsewhere_unsplash/15_unsplash.jpg",
        alt: "Unsplash photo 10 image path placeholder",
        title: "Photo 10 Placeholder",
        location: "Location placeholder",
        year: "2026",
        url: "#",
      },
    ];

    const unsplashPanel = document.querySelector('[data-elsewhere-panel="unsplash"]');
    const unsplashGallery = document.querySelector("[data-unsplash-gallery]");
    const unsplashCarousel = document.querySelector("[data-unsplash-carousel]");
    const unsplashTrack = document.querySelector("[data-unsplash-track]");
    const unsplashMeta = document.querySelector("[data-unsplash-meta]");
    const unsplashCounter = document.querySelector("[data-unsplash-counter]");
    const unsplashTitle = document.querySelector("[data-unsplash-title]");
    const unsplashDetail = document.querySelector("[data-unsplash-detail]");
    const unsplashLink = document.querySelector("[data-unsplash-link]");
    const unsplashLightbox = document.querySelector("[data-unsplash-lightbox]");
    const unsplashLightboxImage = document.querySelector("[data-unsplash-lightbox-image]");
    const unsplashLightboxTitle = document.querySelector("[data-unsplash-lightbox-title]");
    const unsplashLightboxDetail = document.querySelector("[data-unsplash-lightbox-detail]");
    const unsplashLightboxLink = document.querySelector("[data-unsplash-lightbox-link]");
    const unsplashLightboxCloseTargets = [...document.querySelectorAll("[data-unsplash-lightbox-close]")];
    let unsplashActiveIndex = 0;
    let unsplashMetaTimer = 0;
    let unsplashWheelTimer = 0;
    let unsplashPointerStartX = 0;
    let unsplashPointerStartY = 0;
    let unsplashPointerCurrentX = 0;
    let unsplashPointerLastX = 0;
    let unsplashPointerLastTime = 0;
    let unsplashPointerVelocityX = 0;
    let unsplashPointerCardStep = 1;
    let unsplashPointerMoved = false;
    let unsplashPointerIsDown = false;
    let unsplashLightboxOpen = false;
    let unsplashPreviousFocus = null;
    let unsplashMotionTimer = 0;
    let unsplashSwitcherRevealTimer = 0;
    let unsplashReboundTimer = 0;

    const isUnsplashPanelActive = () => unsplashPanel?.classList.contains("is-active");

    const normalizeUnsplashIndex = (index) => {
      const itemCount = unsplashItems.length;
      return ((index % itemCount) + itemCount) % itemCount;
    };

    const getUnsplashOffset = (index) => {
      const itemCount = unsplashItems.length;
      let offset = index - unsplashActiveIndex;
      if (offset > itemCount / 2) offset -= itemCount;
      if (offset < itemCount / -2) offset += itemCount;
      return offset;
    };

    const getUnsplashItemDetail = (item) => {
      return [item.location, item.year].filter(Boolean).join(" · ") || "Metadata placeholder";
    };

    const getUnsplashMotionValue = (style, property, fallback) => {
      const value = Number.parseFloat(style.getPropertyValue(property));
      return Number.isFinite(value) ? value : fallback;
    };

    const getUnsplashCardStep = () => {
      if (!unsplashTrack) return 1;
      const cards = [...unsplashTrack.children];
      const activeCard = cards[unsplashActiveIndex];
      const adjacentCard = cards.find((card, index) => getUnsplashOffset(index) === 1);
      if (!activeCard || !adjacentCard) return Math.max(unsplashCarousel?.clientWidth * 0.25 || 1, 1);

      const activeRect = activeCard.getBoundingClientRect();
      const adjacentRect = adjacentCard.getBoundingClientRect();
      const activeCenter = activeRect.left + activeRect.width / 2;
      const adjacentCenter = adjacentRect.left + adjacentRect.width / 2;
      return Math.max(Math.abs(adjacentCenter - activeCenter), 1);
    };

    const setUnsplashExternalLink = (link, item) => {
      if (!link) return;
      const hasUrl = Boolean(item?.url && item.url !== "#");
      link.href = hasUrl ? item.url : "#";
      link.toggleAttribute("target", hasUrl);
      link.toggleAttribute("rel", hasUrl);
      if (hasUrl) {
        link.target = "_blank";
        link.rel = "noreferrer";
        link.removeAttribute("aria-disabled");
      } else {
        link.removeAttribute("target");
        link.removeAttribute("rel");
        link.setAttribute("aria-disabled", "true");
      }
    };

    const updateUnsplashMeta = (item, immediate = false) => {
      const applyMeta = () => {
        if (unsplashCounter) {
          unsplashCounter.textContent = `${String(unsplashActiveIndex + 1).padStart(2, "0")} / ${String(unsplashItems.length).padStart(2, "0")}`;
        }
        if (unsplashTitle) unsplashTitle.textContent = item.title;
        if (unsplashDetail) unsplashDetail.textContent = getUnsplashItemDetail(item);
        setUnsplashExternalLink(unsplashLink, item);
        unsplashMeta?.classList.remove("is-changing");
      };

      window.clearTimeout(unsplashMetaTimer);
      if (immediate || prefersReducedMotion) {
        applyMeta();
        return;
      }

      unsplashMeta?.classList.add("is-changing");
      unsplashMetaTimer = window.setTimeout(applyMeta, 140);
    };

    const updateUnsplashCards = (immediate = false, dragProgress = 0, syncMeta = true, transitionDuration = "") => {
      if (!unsplashTrack || unsplashItems.length === 0) return;

      const motionStyle = window.getComputedStyle(unsplashGallery || unsplashCarousel);
      const arcNearY = getUnsplashMotionValue(motionStyle, "--unsplash-arc-y-near", 42);
      const arcFarY = getUnsplashMotionValue(motionStyle, "--unsplash-arc-y-far", 78);
      const scaleNear = getUnsplashMotionValue(motionStyle, "--unsplash-scale-near", 0.9);
      const scaleFar = getUnsplashMotionValue(motionStyle, "--unsplash-scale-far", 0.8);
      const opacityNear = getUnsplashMotionValue(motionStyle, "--unsplash-opacity-near", 0.98);
      const opacityFar = getUnsplashMotionValue(motionStyle, "--unsplash-opacity-far", 0.88);
      const tiltStep = getUnsplashMotionValue(motionStyle, "--unsplash-tilt-step", 1.8);
      const rotateYStep = getUnsplashMotionValue(motionStyle, "--unsplash-rotate-y-step", -3);
      const depthNear = getUnsplashMotionValue(motionStyle, "--unsplash-depth-near", -24);
      const depthFar = getUnsplashMotionValue(motionStyle, "--unsplash-depth-far", -58);

      [...unsplashTrack.children].forEach((card, index) => {
        const baseOffset = getUnsplashOffset(index);
        const offset = baseOffset + dragProgress;
        const distance = Math.abs(offset);
        const isVisible = distance <= 2.5;
        const isActive = Math.abs(offset) < 0.5;
        const xPosition = offset;
        const clampedDistance = Math.min(distance, 2);
        const nearMix = Math.min(clampedDistance, 1);
        const farMix = Math.max(clampedDistance - 1, 0);
        const yPosition = clampedDistance <= 1 ? arcNearY * nearMix : arcNearY + (arcFarY - arcNearY) * farMix;
        const cardScale = clampedDistance <= 1 ? 1 + (scaleNear - 1) * nearMix : scaleNear + (scaleFar - scaleNear) * farMix;
        const cardOpacity = clampedDistance <= 1 ? 1 + (opacityNear - 1) * nearMix : opacityNear + (opacityFar - opacityNear) * farMix;
        const cardTilt = isVisible ? offset * tiltStep : 0;
        const cardRotate = isVisible ? offset * rotateYStep : 0;
        const cardDepth = clampedDistance <= 1 ? depthNear * nearMix : depthNear + (depthFar - depthNear) * farMix;
        const cardOrder = 10 - distance;

        card.classList.toggle("is-active", isActive);
        card.classList.toggle("is-hidden", !isVisible);
        card.setAttribute("aria-hidden", String(!isVisible));
        card.style.setProperty("--unsplash-card-x", `calc(var(--unsplash-card-step) * ${xPosition})`);
        card.style.setProperty("--unsplash-card-y", `${yPosition}px`);
        card.style.setProperty("--unsplash-card-scale", cardScale);
        card.style.setProperty("--unsplash-card-opacity", cardOpacity);
        card.style.setProperty("--unsplash-card-tilt", `${cardTilt}deg`);
        card.style.setProperty("--unsplash-card-rotate", `${cardRotate}deg`);
        card.style.setProperty("--unsplash-card-depth", `${cardDepth}px`);
        card.style.setProperty("--unsplash-card-order", cardOrder);
        card.style.transitionDuration = immediate || unsplashPointerIsDown || prefersReducedMotion ? "0ms" : transitionDuration;
      });

      if (!unsplashPointerIsDown && syncMeta) updateUnsplashMeta(unsplashItems[unsplashActiveIndex], immediate);
    };

    const stopUnsplashRebound = () => {
      window.clearTimeout(unsplashReboundTimer);
      unsplashReboundTimer = 0;
    };

    const playUnsplashRebound = (releaseDirection = 0, syncMeta = true) => {
      stopUnsplashRebound();

      if (prefersReducedMotion || !releaseDirection) {
        updateUnsplashCards(false, 0, syncMeta);
        return;
      }

      const motionStyle = window.getComputedStyle(unsplashGallery || unsplashCarousel);
      const reboundMax = Math.max(0, getUnsplashMotionValue(motionStyle, "--unsplash-rebound-distance", 0.16));
      const reboundDelay = Math.max(0, getUnsplashMotionValue(motionStyle, "--unsplash-rebound-delay", 180));
      const settleDuration = Math.max(0, getUnsplashMotionValue(motionStyle, "--unsplash-rebound-settle-duration", 460));
      const reboundMagnitude = Math.min(reboundMax, Math.max(reboundMax * 0.45, Math.abs(releaseDirection) * 0.16));
      const reboundProgress = Math.sign(releaseDirection) * reboundMagnitude;

      updateUnsplashCards(false, reboundProgress, syncMeta, `${reboundDelay}ms`);
      unsplashReboundTimer = window.setTimeout(() => {
        unsplashReboundTimer = 0;
        updateUnsplashCards(false, 0, false, `${settleDuration}ms`);
      }, reboundDelay);
    };

    const setUnsplashActiveIndex = (nextIndex, immediate = false, reboundDirection = 0) => {
      if (unsplashItems.length === 0 || unsplashLightboxOpen) return;
      unsplashActiveIndex = normalizeUnsplashIndex(nextIndex);
      if (!immediate && reboundDirection) {
        playUnsplashRebound(reboundDirection);
      } else {
        stopUnsplashRebound();
        updateUnsplashCards(immediate);
      }
    };

    const moveUnsplashCarousel = (direction) => {
      setUnsplashActiveIndex(unsplashActiveIndex + direction, false, direction > 0 ? -1 : 1);
    };

    const stopUnsplashMotion = () => {
      window.clearTimeout(unsplashMotionTimer);
      unsplashMotionTimer = 0;
    };

    const startUnsplashMotion = () => {
      // VS Code Edit: 자동 캐러셀 모션 속도는 아래 delay 값을 조정하세요.
      const unsplashMotionDelay = 2600;

      stopUnsplashMotion();
      if (prefersReducedMotion || !isUnsplashPanelActive() || unsplashLightboxOpen || unsplashPointerIsDown) return;

      unsplashMotionTimer = window.setTimeout(() => {
        if (!isUnsplashPanelActive() || unsplashLightboxOpen || unsplashPointerIsDown) return;
        moveUnsplashCarousel(1);
        startUnsplashMotion();
      }, unsplashMotionDelay);
    };

    const setUnsplashLightboxContent = (item) => {
      if (!item || !item.src || !unsplashLightboxImage) return false;

      unsplashLightboxImage.src = item.src;
      unsplashLightboxImage.alt = item.alt || item.title;
      if (unsplashLightboxTitle) unsplashLightboxTitle.textContent = item.title;
      if (unsplashLightboxDetail) unsplashLightboxDetail.textContent = getUnsplashItemDetail(item);
      setUnsplashExternalLink(unsplashLightboxLink, item);
      return true;
    };

    const openUnsplashLightbox = (item) => {
      if (!unsplashLightbox || !setUnsplashLightboxContent(item)) return;

      stopUnsplashMotion();
      stopUnsplashRebound();
      unsplashLightboxOpen = true;
      unsplashPreviousFocus = document.activeElement;
      unsplashLightbox.hidden = false;
      document.body.classList.add("is-unsplash-lightbox-open");

      window.requestAnimationFrame(() => {
        unsplashLightbox.classList.add("is-open");
        unsplashLightbox.setAttribute("aria-hidden", "false");
        unsplashLightboxCloseTargets.find((target) => target.matches("button"))?.focus();
      });
    };

    const closeUnsplashLightbox = () => {
      if (!unsplashLightbox || !unsplashLightboxOpen) return;

      unsplashLightboxOpen = false;
      unsplashLightbox.classList.remove("is-open");
      unsplashLightbox.setAttribute("aria-hidden", "true");
      document.body.classList.remove("is-unsplash-lightbox-open");

      window.setTimeout(() => {
        if (!unsplashLightboxOpen) {
          unsplashLightbox.hidden = true;
          unsplashPreviousFocus?.focus?.();
          startUnsplashMotion();
        }
      }, prefersReducedMotion ? 0 : 360);
    };

    if (unsplashTrack && unsplashCarousel && unsplashItems.length > 0) {
      const fragment = document.createDocumentFragment();

      unsplashItems.forEach((item, index) => {
        const card = document.createElement("button");
        card.className = "unsplash-card";
        card.type = "button";
        card.dataset.unsplashIndex = String(index);
        card.setAttribute("aria-label", `${String(index + 1).padStart(2, "0")} ${item.title}`);

        if (item.src) {
          const image = document.createElement("img");
          image.src = item.src;
          image.alt = item.alt || item.title;
          image.loading = index < 3 ? "eager" : "lazy";
          card.append(image);
        } else {
          const placeholder = document.createElement("span");
          placeholder.className = "unsplash-card-placeholder";
          placeholder.textContent = `${String(index).padStart(2, "0")}_unsplash image path needed`;
          card.append(placeholder);
        }

        card.addEventListener("click", () => {
          if (unsplashPointerMoved) return;
          if (index !== unsplashActiveIndex) {
            stopUnsplashMotion();
            setUnsplashActiveIndex(index);
            startUnsplashMotion();
            return;
          }
          openUnsplashLightbox(unsplashItems[unsplashActiveIndex]);
        });

        card.addEventListener("keydown", (event) => {
          if (event.key === "ArrowLeft") {
            event.preventDefault();
            stopUnsplashMotion();
            moveUnsplashCarousel(-1);
            startUnsplashMotion();
          }
          if (event.key === "ArrowRight") {
            event.preventDefault();
            stopUnsplashMotion();
            moveUnsplashCarousel(1);
            startUnsplashMotion();
          }
        });

        fragment.append(card);
      });

      unsplashTrack.replaceChildren(fragment);
      updateUnsplashCards(true);
      startUnsplashMotion();

      unsplashCarousel.addEventListener(
        "wheel",
        (event) => {
          if (!isUnsplashPanelActive() || unsplashLightboxOpen) return;
          const primaryDelta = Math.abs(event.deltaX) > Math.abs(event.deltaY) ? event.deltaX : event.deltaY;
          if (Math.abs(primaryDelta) < 18) return;

          event.preventDefault();
          if (unsplashWheelTimer) return;
          stopUnsplashMotion();
          moveUnsplashCarousel(primaryDelta > 0 ? 1 : -1);
          startUnsplashMotion();
          unsplashWheelTimer = window.setTimeout(() => {
            unsplashWheelTimer = 0;
          }, prefersReducedMotion ? 120 : 640);
        },
        { passive: false }
      );
      unsplashCarousel.addEventListener("dragstart", (event) => {
        event.preventDefault();
      });
      unsplashCarousel.addEventListener("pointerdown", (event) => {
        if (!isUnsplashPanelActive() || unsplashLightboxOpen || event.button > 0) return;
        stopUnsplashMotion();
        unsplashPointerIsDown = true;
        unsplashPointerMoved = false;
        unsplashPointerStartX = event.clientX;
        unsplashPointerStartY = event.clientY;
        unsplashPointerCurrentX = event.clientX;
        unsplashPointerLastX = event.clientX;
        unsplashPointerLastTime = event.timeStamp;
        unsplashPointerVelocityX = 0;
        unsplashPointerCardStep = getUnsplashCardStep();
        unsplashCarousel.classList.add("is-dragging");
        window.clearTimeout(unsplashSwitcherRevealTimer);
        if (elsewhereActivePanel === "unsplash") {
          elsewhereSwitcher?.classList.add("is-hidden");
        }
        unsplashCarousel.setPointerCapture?.(event.pointerId);
      });

      unsplashCarousel.addEventListener("pointermove", (event) => {
        if (!unsplashPointerIsDown) return;

        const deltaX = event.clientX - unsplashPointerStartX;
        const deltaY = event.clientY - unsplashPointerStartY;
        const elapsed = Math.max(event.timeStamp - unsplashPointerLastTime, 1);
        const instantVelocity = (event.clientX - unsplashPointerLastX) / elapsed;

        unsplashPointerCurrentX = event.clientX;
        unsplashPointerVelocityX = unsplashPointerVelocityX * 0.72 + instantVelocity * 0.28;
        unsplashPointerLastX = event.clientX;
        unsplashPointerLastTime = event.timeStamp;

        if (Math.abs(deltaX) > 8 && Math.abs(deltaX) > Math.abs(deltaY)) {
          unsplashPointerMoved = true;
        }

        const dragProgress = deltaX / unsplashPointerCardStep;
        updateUnsplashCards(false, dragProgress);
      });

      const endUnsplashPointer = (event) => {
        if (!unsplashPointerIsDown) return;
        const pointerEndX = event.type === "pointercancel" ? unsplashPointerCurrentX : event.clientX;
        const deltaX = pointerEndX - unsplashPointerStartX;
        const deltaY = event.clientY - unsplashPointerStartY;
        const dragDistance = deltaX / unsplashPointerCardStep;
        const velocityAge = event.timeStamp - unsplashPointerLastTime;
        const releaseVelocityX = velocityAge <= 90 ? unsplashPointerVelocityX : 0;
        const velocityDistance = Math.max(-0.35, Math.min(0.35, (releaseVelocityX * 150) / unsplashPointerCardStep));
        const projectedDistance = dragDistance + velocityDistance;
        const isHorizontalDrag = Math.abs(deltaX) > 8 && Math.abs(deltaX) > Math.abs(deltaY);
        const isFlick = Math.abs(dragDistance) >= 0.12 && Math.abs(releaseVelocityX) >= 0.55;
        const shouldAdvance = Math.abs(dragDistance) >= 0.2 || isFlick;

        unsplashPointerIsDown = false;
        unsplashCarousel.classList.remove("is-dragging");
        unsplashCarousel.releasePointerCapture?.(event.pointerId);
        if (elsewhereActivePanel === "unsplash") {
          window.clearTimeout(unsplashSwitcherRevealTimer);
          unsplashSwitcherRevealTimer = window.setTimeout(() => {
            elsewhereSwitcher?.classList.remove("is-hidden");
          }, 1000);
        }

        if (isHorizontalDrag && shouldAdvance) {
          const releaseDirection = projectedDistance || dragDistance;
          const jumpCount = Math.min(2, Math.max(1, Math.round(Math.abs(releaseDirection))));
          const nextDirection = (releaseDirection > 0 ? -1 : 1) * jumpCount;
          setUnsplashActiveIndex(unsplashActiveIndex + nextDirection, false, releaseDirection);
        } else {
          playUnsplashRebound(isHorizontalDrag ? -dragDistance : 0);
        }

        startUnsplashMotion();

        window.setTimeout(() => {
          unsplashPointerMoved = false;
        }, 0);
      };

      unsplashCarousel.addEventListener("pointerup", endUnsplashPointer);
      unsplashCarousel.addEventListener("pointercancel", endUnsplashPointer);

      ["touchstart", "touchmove", "touchend"].forEach((eventName) => {
        unsplashCarousel.addEventListener(
          eventName,
          (event) => {
            event.stopPropagation();
          },
          { passive: true }
        );
      });

      const unsplashPanelObserver = new MutationObserver(() => {
        if (isUnsplashPanelActive()) {
          startUnsplashMotion();
          return;
        }

        stopUnsplashMotion();
      });

      if (unsplashPanel) {
        unsplashPanelObserver.observe(unsplashPanel, { attributes: true, attributeFilter: ["class"] });
      }
    }

    unsplashLightboxCloseTargets.forEach((target) => {
      target.addEventListener("click", closeUnsplashLightbox);
    });

    document.addEventListener("keydown", (event) => {
      if (event.key === "Escape") closeUnsplashLightbox();
    });

    // Elsewhere snap indicator
    const elsewhereSnapRoot = document.querySelector("[data-elsewhere-snap-root]");
    const elsewhereSnapPanels = [...document.querySelectorAll("[data-elsewhere-snap-panel]")];
    const elsewhereSnapDots = [...document.querySelectorAll("[data-elsewhere-snap-dot]")];
    const elsewhereFooter = document.querySelector("[data-elsewhere-footer]");
    const elsewhereSnapScroller = elsewhere || elsewhereSnapRoot;
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

    const calmatoVideoGrid = document.querySelector("[data-calmato-video-grid]");
    const calmatoVideoCards = [...document.querySelectorAll("[data-calmato-video-card]")];
    const calmatoVideoPrev = document.querySelector("[data-calmato-video-prev]");
    const calmatoVideoNext = document.querySelector("[data-calmato-video-next]");
    const calmatoVideoMobileQuery = window.matchMedia("(max-width: 833px)");
    const calmatoVideoTabletQuery = window.matchMedia("(max-width: 1439px)");
    let calmatoVideoPage = 0;
    let calmatoVideoTransitionTimer = 0;
    let calmatoVideoIsAnimating = false;

    const getCalmatoVideoPageSize = () => {
      if (calmatoVideoMobileQuery.matches) return 1;
      if (calmatoVideoTabletQuery.matches) return 2;
      return 3;
    };

    const clearCalmatoVideoMotion = () => {
      calmatoVideoCards.forEach((card) => {
        card.classList.remove("is-sliding-in", "is-sliding-out");
        card.style.removeProperty("--calmato-video-card-enter-x");
        card.style.removeProperty("--calmato-video-card-exit-x");
        card.style.removeProperty("--calmato-video-card-order");
      });
    };

    const setCalmatoVideoMotion = (cards, direction, motionClass) => {
      cards.forEach((card, index) => {
        card.style.setProperty("--calmato-video-card-enter-x", `${direction * 100}vw`);
        card.style.setProperty("--calmato-video-card-exit-x", `${direction * -24}vw`);
        card.style.setProperty("--calmato-video-card-order", index);
        card.classList.add(motionClass);
      });
    };

    const updateCalmatoVideoPage = () => {
      if (!calmatoVideoGrid || calmatoVideoCards.length === 0) return;

      const pageSize = getCalmatoVideoPageSize();
      const pageCount = Math.max(1, Math.ceil(calmatoVideoCards.length / pageSize));
      calmatoVideoPage = (calmatoVideoPage + pageCount) % pageCount;
      const pageStart = calmatoVideoPage * pageSize;
      const pageEnd = pageStart + pageSize;

      calmatoVideoCards.forEach((card, index) => {
        const isVisible = index >= pageStart && index < pageEnd;
        card.hidden = !isVisible;
        card.setAttribute("aria-hidden", String(!isVisible));
      });

      calmatoVideoGrid.dataset.activePage = String(calmatoVideoPage + 1);
    };

    const setCalmatoVideoPage = (direction) => {
  if (
    !calmatoVideoGrid ||
    calmatoVideoCards.length === 0 ||
    calmatoVideoIsAnimating
  ) {
    return;
  }

  const pageSize = getCalmatoVideoPageSize();
  const pageCount = Math.max(
    1,
    Math.ceil(calmatoVideoCards.length / pageSize)
  );

  if (pageCount <= 1) return;

  calmatoVideoIsAnimating = true;

  const visibleCards = calmatoVideoCards.filter(
    (card) => !card.hidden
  );

  // 현재 카드: 멀리 밀리지 않고 살짝 이동하며 디졸브
  visibleCards.forEach((card, index) => {
    card.animate(
      [
        {
          transform: "translateX(0)",
          opacity: 1,
        },
        {
          transform: `translateX(${direction * -4}vw)`,
          opacity: 0,
        },
      ],
      {
        duration: 480,
        delay: index * 30,
        easing: "cubic-bezier(0.4, 0, 0.2, 1)",
        fill: "forwards",
      }
    );
  });

  window.clearTimeout(calmatoVideoTransitionTimer);

  // 기존 카드가 사라진 후 다음 페이지로 전환
  calmatoVideoTransitionTimer = window.setTimeout(() => {
    calmatoVideoPage += direction;
    updateCalmatoVideoPage();

    const enteringCards = calmatoVideoCards.filter(
      (card) => !card.hidden
    );

    // 새 카드: 가까운 화면 밖에서 천천히 슬라이드 + 페이드 인
    enteringCards.forEach((card, index) => {
      card.animate(
        [
          {
            transform: `translateX(${direction * 18}vw)`,
            opacity: 0,
          },
          {
            transform: "translateX(0)",
            opacity: 1,
          },
        ],
        {
          duration: 900,
          delay: index * 55,
          easing: "cubic-bezier(0.22, 1, 0.36, 1)",
          fill: "both",
        }
      );
    });

    // 애니메이션 종료 후 다음 클릭 허용
    calmatoVideoTransitionTimer = window.setTimeout(() => {
      calmatoVideoIsAnimating = false;
    }, 1080);
  }, 560);
};

    if (calmatoVideoCards.length > 0) {
      updateCalmatoVideoPage();

      calmatoVideoPrev?.addEventListener("click", () => {
        setCalmatoVideoPage(-1);
      });

      calmatoVideoNext?.addEventListener("click", () => {
        setCalmatoVideoPage(1);
      });

      const handleCalmatoVideoBreakpoint = () => {
        window.clearTimeout(calmatoVideoTransitionTimer);
        clearCalmatoVideoMotion();
        calmatoVideoIsAnimating = false;
        calmatoVideoPage = 0;
        updateCalmatoVideoPage();
      };

      if (typeof calmatoVideoMobileQuery.addEventListener === "function") {
        calmatoVideoMobileQuery.addEventListener("change", handleCalmatoVideoBreakpoint);
        calmatoVideoTabletQuery.addEventListener("change", handleCalmatoVideoBreakpoint);
      } else {
        calmatoVideoMobileQuery.addListener(handleCalmatoVideoBreakpoint);
        calmatoVideoTabletQuery.addListener(handleCalmatoVideoBreakpoint);
      }
    }

    const getElsewhereScrollTop = (target) => {
      if (!elsewhereSnapScroller || !target) return 0;
      const scrollerRect = elsewhereSnapScroller.getBoundingClientRect();
      const targetRect = target.getBoundingClientRect();
      return elsewhereSnapScroller.scrollTop + targetRect.top - scrollerRect.top;
    };

    const isElsewhereFooterVisible = () => {
      if (!elsewhereFooter) return false;
      const footerRect = elsewhereFooter.getBoundingClientRect();
      return footerRect.top < window.innerHeight && footerRect.bottom > 0;
    };

    const syncElsewhereSwitcherVisibility = (snapIndex) => {
      if (!elsewhereSwitcher || !elsewhereSnapScroller) return;

      const isAtFirstSnapTop =
        snapIndex === 0 &&
        elsewhereSnapScroller.scrollTop <= 8 &&
        !isElsewhereFooterVisible();

      elsewhereSwitcher.classList.toggle("is-hidden", !isAtFirstSnapTop);
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

      syncElsewhereSwitcherVisibility(nextIndex);
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

    const isElsewhereAtLastSnapPanel = () => {
      if (!elsewhereSnapScroller || !elsewhereSnapPanels.length) return false;
      const lastSnapPanel = elsewhereSnapPanels[elsewhereSnapPanels.length - 1];
      const lastPanelTop = getElsewhereScrollTop(lastSnapPanel);
      return Math.abs(elsewhereSnapScroller.scrollTop - lastPanelTop) < 32;
    };

    const updateElsewhereFooterSnap = () => {
      if (!elsewhereSnapScroller || !elsewhereSnapPanels.length) return;
      const lastSnapPanel = elsewhereSnapPanels[elsewhereSnapPanels.length - 1];
      const releasePoint = getElsewhereScrollTop(lastSnapPanel) + 8;
      const isFooterFree = elsewhereSnapScroller.scrollTop > releasePoint || isElsewhereFooterVisible();
      elsewhereSnapScroller.classList.toggle("is-footer-free", isFooterFree);
    };

    const releaseElsewhereFooterSnap = (scrollAmount = 0, behavior = "auto") => {
      if (!elsewhereSnapScroller || elsewhereActivePanel !== "calmato") return;
      if (!isElsewhereAtLastSnapPanel()) return;

      elsewhereSnapScroller.classList.add("is-footer-free");
      setElsewhereSnapIndex(-1);

      if (scrollAmount > 0) {
        elsewhereSnapScroller.scrollBy({
          top: scrollAmount,
          left: 0,
          behavior,
        });
      }
    };

    if (elsewhereSnapRoot && elsewhereSnapScroller && elsewhereSnapPanels.length && elsewhereSnapDots.length) {
      elsewhereSnapDots.forEach((dot) => {
        dot.addEventListener("click", () => {
          const targetPanel = elsewhereSnapPanels.find(
            (panel) => panel.dataset.elsewhereSnapPanel === dot.dataset.elsewhereSnapDot
          );

          if (!targetPanel) return;
          setElsewhereSnapIndex(Number(dot.dataset.elsewhereSnapDot || 0));
          elsewhereSnapScroller.classList.remove("is-footer-free");
          elsewhereSnapScroller.scrollTo({
            top: getElsewhereScrollTop(targetPanel),
            behavior: prefersReducedMotion ? "auto" : "smooth",
          });
        });
      });

      elsewhereSnapScroller.addEventListener(
        "scroll",
        () => {
          if (elsewhereSnapScroller.scrollTop > 8) {
            elsewhereSwitcher?.classList.add("is-hidden");
          }

          updateElsewhereFooterSnap();
          requestElsewhereSnapState();
        },
        { passive: true }
      );

      elsewhereSnapScroller.addEventListener(
        "touchmove",
        (event) => {
          const touch = event.touches[0];
          if (!touch) return;

          const deltaX = touch.clientX - elsewhereTouchStartX;
          const deltaY = touch.clientY - elsewhereTouchStartY;
          const isVerticalRelease = deltaY < -24 && Math.abs(deltaY) > Math.abs(deltaX) * 1.4;
          if (isVerticalRelease) releaseElsewhereFooterSnap();
        },
        { passive: true }
      );

      elsewhereSnapScroller.addEventListener(
        "touchend",
        (event) => {
          const touch = event.changedTouches[0];
          if (!touch) return;

          const deltaX = touch.clientX - elsewhereTouchStartX;
          const deltaY = touch.clientY - elsewhereTouchStartY;
          const isVerticalRelease = deltaY < -48 && Math.abs(deltaY) > Math.abs(deltaX) * 1.4;
          if (!isVerticalRelease) return;

          releaseElsewhereFooterSnap(Math.min(Math.max(Math.abs(deltaY) * 1.6, 140), 520));
        },
        { passive: true }
      );

      elsewhereSnapScroller.addEventListener(
        "wheel",
        (event) => {
          if (event.deltaY > 0) releaseElsewhereFooterSnap();
        },
        { passive: true }
      );

      window.addEventListener(
        "wheel",
        (event) => {
          if (event.ctrlKey || event.deltaY <= 0) return;
          if (elsewhereActivePanel !== "calmato") return;
          if (!isElsewhereAtLastSnapPanel()) return;

          event.preventDefault();
          releaseElsewhereFooterSnap(Math.max(event.deltaY, 140));
        },
        { capture: true, passive: false }
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

}; // onReady 끝

if (document.readyState === "loading") {
  document.addEventListener("DOMContentLoaded", onReady, { once: true });
} else {
  onReady();
}

})();
