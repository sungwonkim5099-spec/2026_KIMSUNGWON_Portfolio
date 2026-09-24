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
    const menuButton = document.querySelector("[data-menu-toggle]");
    const mobileMenu = document.querySelector("[data-mobile-menu]");
    const projectGrid = document.querySelector("[data-project-grid]");
    const projects = Array.isArray(window.PORTFOLIO_PROJECTS) ? window.PORTFOLIO_PROJECTS : [];
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

    const ensureMobileElsewhereLinks = () => {
      if (
        !mobileMenu ||
        document.body.classList.contains("elsewhere-page") ||
        mobileMenu.querySelector("[data-mobile-elsewhere-links]")
      ) {
        return;
      }

      const elsewhereLink = [...mobileMenu.querySelectorAll("a")].find((link) =>
        link.getAttribute("href")?.includes("elsewhere")
      );
      if (!elsewhereLink) return;

      const channels = document.createElement("div");
      channels.className = "mobile-elsewhere-links";
      channels.setAttribute("data-mobile-elsewhere-links", "");
      channels.setAttribute("aria-label", "Elsewhere channels");

      [
        ["YouTube", "calmato"],
        ["Unsplash", "unsplash"],
      ].forEach(([label, channel]) => {
        const channelLink = document.createElement("a");
        const destination = new URL(elsewhereLink.href, window.location.href);
        destination.searchParams.set("channel", channel);
        channelLink.href = destination.href;
        channelLink.textContent = label;
        channels.append(channelLink);
      });

      elsewhereLink.insertAdjacentElement("afterend", channels);
    };

    ensureMobileElsewhereLinks();

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

    const getCssMilliseconds = (element, propertyName, fallback) => {
      const token = getComputedStyle(element).getPropertyValue(propertyName).trim();
      const value = Number.parseFloat(token);

      if (!Number.isFinite(value)) return fallback;
      return token.endsWith("ms") ? value : value * 1000;
    };

    const initializeWorksGridEntrance = () => {
      const desktopEntryQuery = window.matchMedia("(min-width: 834px)");
      let isPrepared = false;
      let isRevealing = false;
      let revealTimer = 0;

      const cards = () => (projectGrid ? [...projectGrid.querySelectorAll(".project-card")] : []);
      const shouldRun = () =>
        Boolean(
          projectGrid &&
            projects.length > 0 &&
            !prefersReducedMotion &&
            desktopEntryQuery.matches
        );

      const getSpatialRevealOrder = () => {
        const allCards = cards();
        const anchor = allCards[0];
        if (!anchor) return [];

        const anchorCenterX = anchor.offsetLeft + anchor.offsetWidth / 2;
        const anchorCenterY = anchor.offsetTop + anchor.offsetHeight / 2;

        return allCards
          .slice(1)
          .map((card, index) => {
            const cardCenterX = card.offsetLeft + card.offsetWidth / 2;
            const cardCenterY = card.offsetTop + card.offsetHeight / 2;
            const deltaX = cardCenterX - anchorCenterX;
            const deltaY = cardCenterY - anchorCenterY;
            const distance = Math.hypot(deltaX, deltaY);
            const lowerRightBias = Math.max(0, deltaX + deltaY) * 0.12;

            return { card, index, score: distance - lowerRightBias };
          })
          .sort((a, b) => a.score - b.score || a.index - b.index)
          .map(({ card }) => card);
      };

      const clearEntranceState = () => {
        window.clearTimeout(revealTimer);
        cards().forEach((card) => {
          card.classList.remove("is-works-entrance-anchor");
          card.style.removeProperty("--works-reveal-delay");
        });
        projectGrid?.classList.remove("is-works-entrance-prepared", "is-works-entrance-revealing");
        isPrepared = false;
        isRevealing = false;
      };

      return {
        shouldRun,
        prepare: () => {
          if (!shouldRun() || isPrepared) return isPrepared;

          const [anchor, ...surroundingCards] = cards();
          if (!anchor) return false;

          anchor.classList.add("is-works-entrance-anchor");
          surroundingCards.forEach((card) => card.style.removeProperty("--works-reveal-delay"));
          projectGrid.classList.add("is-works-entrance-prepared");
          isPrepared = true;
          return true;
        },
        reveal: (onComplete = () => {}) => {
          if (!isPrepared || isRevealing) return;

          isRevealing = true;
          const revealOrder = getSpatialRevealOrder();
          const stagger = getCssMilliseconds(projectGrid, "--works-reveal-stagger", 75);
          const duration = getCssMilliseconds(projectGrid, "--works-reveal-duration", 580);

          revealOrder.forEach((card, index) => {
            card.style.setProperty("--works-reveal-delay", `${index * stagger}ms`);
          });

          window.requestAnimationFrame(() => {
            projectGrid.classList.add("is-works-entrance-revealing");

            const finalDelay = Math.max(0, revealOrder.length - 1) * stagger;
            revealTimer = window.setTimeout(() => {
              clearEntranceState();
              onComplete();
            }, duration + finalDelay + 60);
          });
        },
      };
    };

    const worksGridEntrance = initializeWorksGridEntrance();

    const initializeWorksCameraGallery = () => {
      const gallery = document.querySelector(".works-page .project-gallery");
      const cameraViewport = gallery?.querySelector("[data-works-camera-viewport]");

      if (!gallery || !cameraViewport || !projectGrid || projects.length === 0) return;

      const cameraQuery = window.matchMedia("(min-width: 320px)");
      if (!cameraQuery.matches) return;

      const cameraConfig = {
        wheelAxisBias: 1.15,
      };
      let activeIndex = 0;
      let wheelLockedUntil = 0;
      let suppressCardClickUntil = 0;
      let touchGesture = null;
      let isWorksEntranceActive = false;
      let cameraOutlineTimer = 0;

      const cards = () => [...projectGrid.querySelectorAll(".project-card")];
      const getCssNumber = (propertyName, fallback) => {
        const value = Number.parseFloat(getComputedStyle(gallery).getPropertyValue(propertyName));
        return Number.isFinite(value) ? value : fallback;
      };
      const isCameraEnabled = () => cameraQuery.matches;
      const getColumnCount = () => Math.max(1, Math.round(getCssNumber("--works-grid-columns", 4)));

      const getTargetIndex = (index, columnDelta, rowDelta) => {
        const allCards = cards();
        const columnCount = getColumnCount();
        const rowCount = Math.ceil(allCards.length / columnCount);
        const currentColumn = index % columnCount;
        const currentRow = Math.floor(index / columnCount);
        const nextColumn = Math.max(0, Math.min(columnCount - 1, currentColumn + columnDelta));
        const nextRow = Math.max(0, Math.min(rowCount - 1, currentRow + rowDelta));
        const targetIndex = nextRow * columnCount + nextColumn;

        return targetIndex < allCards.length ? targetIndex : index;
      };

      const synchronizeCameraGeometry = () => {
        if (!isCameraEnabled()) return false;

        const stageWidth = cameraViewport.clientWidth;
        const stageHeight = cameraViewport.clientHeight;
        const zoom = Math.min(1, Math.max(0.01, getCssNumber("--works-camera-zoom", 0.35)));
        const minCellWidth = Math.max(0, getCssNumber("--works-camera-min-cell-width", 0));
        const minCellHeight = Math.max(0, getCssNumber("--works-camera-min-cell-height", 0));

        if (!stageWidth || !stageHeight) return false;

        const formatPixels = (value) => `${Math.round(value * 100) / 100}px`;
        projectGrid.style.setProperty("--works-camera-cell-width", formatPixels(Math.max(stageWidth * zoom, minCellWidth)));
        projectGrid.style.setProperty("--works-camera-cell-height", formatPixels(Math.max(stageHeight * zoom, minCellHeight)));

        return true;
      };

      const positionCamera = () => {
        if (!isCameraEnabled() || !synchronizeCameraGeometry()) return;

        const allCards = cards();
        const activeCard = allCards[activeIndex];
        const activeMedia = activeCard?.querySelector(".project-media");

        if (!activeCard || !activeMedia) return;

        const stageWidth = cameraViewport.clientWidth;
        const stageHeight = cameraViewport.clientHeight;
        const focusY = getCssNumber("--works-camera-focus-y", 46) / 100;
        const mediaCenterX = activeCard.offsetLeft + activeMedia.offsetLeft + activeMedia.offsetWidth / 2;
        const mediaCenterY = activeCard.offsetTop + activeMedia.offsetTop + activeMedia.offsetHeight / 2;
        const targetX = stageWidth / 2 - mediaCenterX;
        const targetY = stageHeight * focusY - mediaCenterY;

        projectGrid.style.setProperty("--works-camera-x", `${Math.round(targetX)}px`);
        projectGrid.style.setProperty("--works-camera-y", `${Math.round(targetY)}px`);
      };

      const scheduleCameraOutline = () => {
        window.clearTimeout(cameraOutlineTimer);
        gallery.classList.remove("is-works-camera-outline-visible");

        const travelDuration = getCssMilliseconds(gallery, "--works-camera-transition-duration", 900);
        const outlineDelay = getCssMilliseconds(gallery, "--works-camera-outline-delay", 1000);

        cameraOutlineTimer = window.setTimeout(() => {
          gallery.classList.add("is-works-camera-outline-visible");
        }, travelDuration + outlineDelay);
      };

      const setActiveIndex = (nextIndex, { focus = false } = {}) => {
        const allCards = cards();
        const boundedIndex = Math.max(0, Math.min(allCards.length - 1, nextIndex));

        activeIndex = boundedIndex;
        allCards.forEach((card, index) => {
          card.classList.toggle("is-works-camera-active", index === activeIndex);
        });
        positionCamera();
        scheduleCameraOutline();

        if (focus) allCards[activeIndex]?.focus({ preventScroll: true });
      };

      const establishInitialCameraFraming = () => {
        gallery.classList.add("is-works-initializing");
        setActiveIndex(0);
        projectGrid.getBoundingClientRect();
        gallery.classList.remove("is-works-initializing");
      };

      const moveCamera = (columnDelta, rowDelta, options) => {
        if (isWorksEntranceActive) return false;

        const nextIndex = getTargetIndex(activeIndex, columnDelta, rowDelta);

        if (nextIndex === activeIndex) return false;

        setActiveIndex(nextIndex, options);
        return true;
      };

      const normalizeWheelDelta = (value, deltaMode) => {
        if (deltaMode === WheelEvent.DOM_DELTA_LINE) return value * 16;
        if (deltaMode === WheelEvent.DOM_DELTA_PAGE) return value * cameraViewport.clientHeight;
        return value;
      };

      const onWheel = (event) => {
        if (!isCameraEnabled() || event.ctrlKey) return;
        if (isWorksEntranceActive) {
          event.preventDefault();
          return;
        }

        const deltaX = normalizeWheelDelta(event.deltaX, event.deltaMode);
        const deltaY = normalizeWheelDelta(event.deltaY, event.deltaMode);
        const threshold = getCssNumber("--works-camera-wheel-threshold", 10);
        const isHorizontal = Math.abs(deltaX) > Math.abs(deltaY) * cameraConfig.wheelAxisBias;
        const primaryDelta = isHorizontal ? deltaX : deltaY;

        if (Math.abs(primaryDelta) < threshold) return;

        const canMove = isHorizontal
          ? getTargetIndex(activeIndex, primaryDelta > 0 ? 1 : -1, 0) !== activeIndex
          : getTargetIndex(activeIndex, 0, primaryDelta > 0 ? 1 : -1) !== activeIndex;

        if (!canMove) return;

        event.preventDefault();

        if (performance.now() < wheelLockedUntil) return;

        const cooldown = getCssNumber("--works-camera-wheel-cooldown", 430);
        wheelLockedUntil = performance.now() + cooldown;
        moveCamera(isHorizontal ? (primaryDelta > 0 ? 1 : -1) : 0, isHorizontal ? 0 : primaryDelta > 0 ? 1 : -1);
      };

      const onKeyDown = (event) => {
        if (!isCameraEnabled() || event.defaultPrevented || event.metaKey || event.ctrlKey || event.altKey) return;

        if (isWorksEntranceActive) {
          if (["ArrowLeft", "ArrowRight", "ArrowUp", "ArrowDown", "Home", "End"].includes(event.key)) {
            event.preventDefault();
          }
          return;
        }

        const directions = {
          ArrowLeft: [-1, 0],
          ArrowRight: [1, 0],
          ArrowUp: [0, -1],
          ArrowDown: [0, 1],
        };
        const direction = directions[event.key];

        if (direction && moveCamera(direction[0], direction[1])) {
          event.preventDefault();
          return;
        }

        if (event.key === "Home" && activeIndex !== 0) {
          event.preventDefault();
          setActiveIndex(0);
        }

        if (event.key === "End") {
          const lastIndex = cards().length - 1;
          if (activeIndex !== lastIndex) {
            event.preventDefault();
            setActiveIndex(lastIndex);
          }
        }
      };

      const onCardClick = (event) => {
        const card = event.target.closest(".project-card");

        if (!card || !projectGrid.contains(card) || !isCameraEnabled()) return;
        if (event.metaKey || event.ctrlKey || event.shiftKey || event.altKey) return;
        if (isWorksEntranceActive) {
          event.preventDefault();
          return;
        }
        if (performance.now() < suppressCardClickUntil) {
          event.preventDefault();
          return;
        }

        const index = cards().indexOf(card);
        if (index === activeIndex) return;

        event.preventDefault();
        setActiveIndex(index, { focus: true });
      };

      const synchronizeCamera = () => {
        if (!isCameraEnabled() || isWorksEntranceActive) return;
        positionCamera();
      };

      const onPointerDown = (event) => {
        if (!isCameraEnabled() || isWorksEntranceActive || event.pointerType !== "touch" || !event.isPrimary) return;

        touchGesture = {
          pointerId: event.pointerId,
          startX: event.clientX,
          startY: event.clientY,
        };
        gallery.setPointerCapture?.(event.pointerId);
      };

      const onPointerUp = (event) => {
        if (!touchGesture || event.pointerId !== touchGesture.pointerId) return;

        if (isWorksEntranceActive) {
          touchGesture = null;
          return;
        }

        const deltaX = event.clientX - touchGesture.startX;
        const deltaY = event.clientY - touchGesture.startY;
        const threshold = getCssNumber("--works-camera-swipe-threshold", 28);
        touchGesture = null;

        if (Math.max(Math.abs(deltaX), Math.abs(deltaY)) < threshold) return;

        const isHorizontal = Math.abs(deltaX) > Math.abs(deltaY) * cameraConfig.wheelAxisBias;
        const moved = isHorizontal
          ? moveCamera(deltaX < 0 ? 1 : -1, 0)
          : moveCamera(0, deltaY < 0 ? 1 : -1);

        suppressCardClickUntil = performance.now() + 420;

        if (!moved && !isHorizontal) {
          window.scrollBy({ top: -deltaY, behavior: "auto" });
        }
      };

      const onPointerCancel = (event) => {
        if (touchGesture?.pointerId === event.pointerId) touchGesture = null;
      };

      const startWorksEntrance = () => {
        const shouldReveal = worksGridEntrance.prepare();
        establishInitialCameraFraming();

        if (!shouldReveal) return;

        isWorksEntranceActive = true;

        // Paint the hidden surrounding cards before dissolving them in.
        projectGrid.getBoundingClientRect();

        window.requestAnimationFrame(() => {
          worksGridEntrance.reveal(() => {
            isWorksEntranceActive = false;
          });
        });
      };

      gallery.tabIndex = 0;
      gallery.setAttribute("aria-label", "Works gallery. Use arrow keys to browse projects.");
      gallery.classList.add("is-works-camera-ready");
      startWorksEntrance();

      gallery.addEventListener("wheel", onWheel, { passive: false });
      gallery.addEventListener("keydown", onKeyDown);
      gallery.addEventListener("pointerdown", onPointerDown);
      gallery.addEventListener("pointerup", onPointerUp);
      gallery.addEventListener("pointercancel", onPointerCancel);
      projectGrid.addEventListener("click", onCardClick);
      window.addEventListener("resize", synchronizeCamera);

      if ("ResizeObserver" in window) {
        const resizeObserver = new ResizeObserver(synchronizeCamera);
        resizeObserver.observe(cameraViewport);
      }
    };

    initializeWorksCameraGallery();

    // Elsewhere channel navigation
    const elsewhere = document.querySelector("[data-elsewhere]");
    const elsewhereSubnavs = [...document.querySelectorAll("[data-elsewhere-subnav]")];
    const elsewherePanelStage = document.querySelector("[data-elsewhere-panel-stage]");
    const elsewhereTabs = [...document.querySelectorAll("[data-elsewhere-tab]")];
    const elsewherePanels = [...document.querySelectorAll("[data-elsewhere-panel]")];
    const elsewhereSnapNav = document.querySelector("[data-elsewhere-snap-nav]");
    const floatingNavShell = document.querySelector(".nav-shell");
    const elsewhereNavItem = document.querySelector("[data-elsewhere-nav-item]");
    const elsewhereNavTrigger = elsewhereNavItem?.querySelector("[data-elsewhere-nav-trigger]");
    const elsewhereDesktopSubnav = elsewhereNavItem?.querySelector(":scope > [data-elsewhere-subnav]");
    const ELSEWHERE_PILL_ENTRY_KEY = "portfolio:elsewhere-pill-entry";
    const ELSEWHERE_PILL_ENTRY_MAX_AGE = 3000;
    let elsewhereActivePanel = "calmato";
    let elsewhereTouchStartX = 0;
    let elsewhereTouchStartY = 0;
    let elsewherePanelHeightTimer = 0;

    const isElsewhereDestination = (destination) =>
      destination.pathname.replace(/\/+$/, "").endsWith("/elsewhere");

    const rememberElsewherePillEntry = (destination) => {
      if (!isElsewhereDestination(destination)) return;

      try {
        window.sessionStorage.setItem(ELSEWHERE_PILL_ENTRY_KEY, String(Date.now()));
      } catch {
        // A blocked session store simply skips the cross-document expansion.
      }
    };

    const consumeElsewherePillEntry = () => {
      try {
        const timestamp = Number.parseInt(window.sessionStorage.getItem(ELSEWHERE_PILL_ENTRY_KEY) || "", 10);
        window.sessionStorage.removeItem(ELSEWHERE_PILL_ENTRY_KEY);
        return Number.isFinite(timestamp) && Date.now() - timestamp <= ELSEWHERE_PILL_ENTRY_MAX_AGE;
      } catch {
        return false;
      }
    };

    const measureElsewherePill = () => {
      if (!floatingNavShell || !elsewhereNavItem || !elsewhereNavTrigger || !elsewhereDesktopSubnav) return;

      const wasOpen = elsewhereNavItem.classList.contains("is-open");
      const wasExpanded = floatingNavShell.classList.contains("is-elsewhere-expanded");
      floatingNavShell.classList.add("is-nav-pill-measuring");
      elsewhereNavItem.classList.add("is-open");
      elsewhereNavTrigger.setAttribute("aria-expanded", "true");

      const subnavWidth = elsewhereDesktopSubnav.getBoundingClientRect().width;
      floatingNavShell.style.setProperty("--nav-pill-secondary-width", `${subnavWidth}px`);

      elsewhereNavItem.classList.toggle("is-open", wasOpen);
      floatingNavShell.classList.toggle("is-elsewhere-expanded", wasExpanded);
      elsewhereNavTrigger.setAttribute("aria-expanded", String(wasOpen));
      floatingNavShell.classList.remove("is-nav-pill-measuring");
    };

    const applyElsewherePillImmediately = (callback) => {
      if (!floatingNavShell) {
        callback();
        return;
      }

      floatingNavShell.classList.add("is-elsewhere-pill-initializing");
      callback();
      floatingNavShell.getBoundingClientRect();
      floatingNavShell.classList.remove("is-elsewhere-pill-initializing");
    };

    const setElsewhereDropdownOpen = (isOpen, { measure = true } = {}) => {
      if (!elsewhereNavItem || !elsewhereNavTrigger) return;
      if (isOpen && measure) measureElsewherePill();
      elsewhereNavItem.classList.toggle("is-open", isOpen);
      floatingNavShell?.classList.toggle("is-elsewhere-expanded", isOpen);
      elsewhereNavTrigger.setAttribute("aria-expanded", String(isOpen));
    };

    const elsewhereDesktopPillQuery = window.matchMedia("(min-width: 834px)");
    let shouldAnimateElsewherePillEntry = consumeElsewherePillEntry() && !prefersReducedMotion;
    const syncElsewherePill = () => {
      if (!elsewhereDesktopPillQuery.matches) {
        applyElsewherePillImmediately(() => setElsewhereDropdownOpen(false, { measure: false }));
        floatingNavShell?.classList.add("is-elsewhere-pill-ready");
        return;
      }

      if (shouldAnimateElsewherePillEntry) {
        shouldAnimateElsewherePillEntry = false;
        applyElsewherePillImmediately(() => {
          setElsewhereDropdownOpen(false, { measure: false });
          measureElsewherePill();
        });
        floatingNavShell?.classList.add("is-elsewhere-pill-ready");
        window.requestAnimationFrame(() => {
          window.requestAnimationFrame(() => {
            if (elsewhereDesktopPillQuery.matches) {
              setElsewhereDropdownOpen(true, { measure: false });
            }
          });
        });
        return;
      }

      applyElsewherePillImmediately(() => setElsewhereDropdownOpen(true));
      floatingNavShell?.classList.add("is-elsewhere-pill-ready");
    };

    const collapseElsewherePillForPrimaryLeave = () => {
      if (elsewhereDesktopPillQuery.matches) {
        setElsewhereDropdownOpen(false, { measure: false });
      }
    };

    elsewhereNavTrigger?.addEventListener("click", (event) => {
      if (!elsewhereDesktopPillQuery.matches) return;
      event.preventDefault();
      setElsewhereDropdownOpen(true);
    });

    elsewhereDesktopPillQuery.addEventListener("change", syncElsewherePill);
    syncElsewherePill();

    const initializeNavSelectionIndicators = () => {
      const navShell = document.querySelector(".nav-shell");
      const navPrimary = navShell?.querySelector(".nav-primary");
      if (!navShell || !navPrimary) {
        return {
          sync: () => {},
          getPrimaryIndicator: () => null,
          getPrimaryCurrentGeometry: () => null,
          getPrimaryGeometry: () => null,
          lockPrimaryGeometry: () => {},
          freezePrimaryToGeometry: () => null,
          movePrimaryToGeometry: () => null,
        };
      }

      const desktopQuery = window.matchMedia("(min-width: 834px)");
      const primaryIndicatorModifier = "nav-selection-indicator--primary";
      const getPrimaryItems = () =>
        [...navPrimary.children].flatMap((child) =>
          child.matches("a") ? [child] : [...child.querySelectorAll(":scope > a")]
        );
      const groups = [
        {
          container: navPrimary,
          modifier: primaryIndicatorModifier,
          getItems: getPrimaryItems,
          isActive: (item) =>
            item.classList.contains("is-active") ||
            (item.hasAttribute("aria-current") && item.getAttribute("aria-current") !== "false"),
        },
        ...elsewhereSubnavs
          .filter((subnav) => !subnav.classList.contains("elsewhere-subnav-mobile"))
          .map((container) => ({
            container,
            modifier: "nav-selection-indicator--secondary",
            getItems: () => [...container.querySelectorAll(".elsewhere-subnav-link")],
            isActive: (item) => item.classList.contains("is-active") || item.getAttribute("aria-selected") === "true",
          })),
      ].map((group) => {
        let indicator = group.container.querySelector(`.${group.modifier}`);
        if (!indicator) {
          indicator = document.createElement("span");
          indicator.className = `nav-selection-indicator ${group.modifier}`;
          indicator.setAttribute("aria-hidden", "true");
          group.container.prepend(indicator);
        }
        return { ...group, indicator };
      });

      const getItemGeometry = (container, item) => {
        const containerRect = container.getBoundingClientRect();
        const itemRect = item.getBoundingClientRect();

        return {
          x: itemRect.left - containerRect.left - container.clientLeft,
          width: itemRect.width,
        };
      };

      const applyIndicatorGeometry = (indicator, geometry) => {
        indicator.style.setProperty("--nav-selection-x", `${geometry.x}px`);
        indicator.style.setProperty("--nav-selection-width", `${geometry.width}px`);
        indicator.classList.add("is-visible");
      };

      let frame = 0;
      let isPrimaryGeometryLocked = false;
      const sync = () => {
        frame = 0;
        const isDesktop = desktopQuery.matches;

        groups.forEach(({ container, indicator, getItems, isActive, modifier }) => {
          if (modifier === primaryIndicatorModifier && isPrimaryGeometryLocked) return;

          const items = getItems();
          const activeItem = isDesktop ? items.find(isActive) : null;
          if (!activeItem) {
            indicator.classList.remove("is-visible");
            return;
          }

          applyIndicatorGeometry(indicator, getItemGeometry(container, activeItem));
        });
      };

      const scheduleSync = () => {
        if (!frame) frame = window.requestAnimationFrame(sync);
      };

      const observer = new MutationObserver(scheduleSync);
      observer.observe(navShell, {
        subtree: true,
        attributes: true,
        attributeFilter: ["aria-current", "aria-selected"],
      });

      window.addEventListener("resize", scheduleSync, { passive: true });
      desktopQuery.addEventListener("change", scheduleSync);
      document.fonts?.ready.then(scheduleSync);
      sync();
      window.requestAnimationFrame(() => {
        groups.forEach(({ indicator }) => indicator.classList.add("is-motion-ready"));
      });

      return {
        sync: scheduleSync,
        getPrimaryIndicator: () =>
          groups.find(({ modifier }) => modifier === primaryIndicatorModifier)?.indicator || null,
        getPrimaryCurrentGeometry: () => {
          const primaryGroup = groups.find(({ modifier }) => modifier === primaryIndicatorModifier);
          const indicator = primaryGroup?.indicator;
          if (!indicator || !indicator.classList.contains("is-visible")) return null;

          const rect = indicator.getBoundingClientRect();
          const containerRect = primaryGroup.container.getBoundingClientRect();
          return rect.width > 0
            ? {
                x: rect.left - containerRect.left - primaryGroup.container.clientLeft,
                width: rect.width,
              }
            : null;
        },
        getPrimaryGeometry: (target) => {
          if (!desktopQuery.matches) return null;

          const primaryGroup = groups.find(({ modifier }) => modifier === primaryIndicatorModifier);
          if (!primaryGroup || !primaryGroup.getItems().includes(target)) return null;

          return getItemGeometry(primaryGroup.container, target);
        },
        lockPrimaryGeometry: () => {
          isPrimaryGeometryLocked = true;
        },
        freezePrimaryToGeometry: (geometry) => {
          if (!desktopQuery.matches || !geometry) return null;

          const primaryGroup = groups.find(({ modifier }) => modifier === primaryIndicatorModifier);
          if (!primaryGroup) return null;

          primaryGroup.indicator.classList.remove("is-motion-ready");
          applyIndicatorGeometry(primaryGroup.indicator, geometry);
          return primaryGroup.indicator;
        },
        movePrimaryToGeometry: (geometry) => {
          if (!desktopQuery.matches || !geometry) return null;

          const primaryGroup = groups.find(({ modifier }) => modifier === primaryIndicatorModifier);
          if (!primaryGroup) return null;

          primaryGroup.indicator.classList.add("is-motion-ready");
          applyIndicatorGeometry(primaryGroup.indicator, geometry);
          return primaryGroup.indicator;
        },
      };
    };

    const navSelectionIndicators = initializeNavSelectionIndicators();
    const syncNavSelectionIndicators = navSelectionIndicators.sync;

    const initializePrimaryNavLeaveMotion = () => {
      const navPrimary = document.querySelector(".nav-primary");
      if (!navPrimary) return;

      const desktopQuery = window.matchMedia("(min-width: 834px)");
      const primaryLinks = [...navPrimary.children].flatMap((child) =>
        child.matches("a") ? [child] : [...child.querySelectorAll(":scope > a")]
      );

      let isNavigating = false;

      const getIndicatorDuration = () => {
        const token = getComputedStyle(document.documentElement)
          .getPropertyValue("--nav-indicator-duration")
          .trim();
        const value = Number.parseFloat(token);
        if (!Number.isFinite(value)) return 420;
        return token.endsWith("ms") ? value : value * 1000;
      };

      const getDestination = (link) => {
        const destination = new URL(link.href, window.location.href);
        const current = new URL(window.location.href);
        const isSameDocument =
          destination.origin === current.origin &&
          destination.pathname === current.pathname &&
          destination.search === current.search;

        if (
          destination.origin !== current.origin ||
          !["http:", "https:"].includes(destination.protocol) ||
          isSameDocument ||
          link.target && link.target !== "_self" ||
          link.hasAttribute("download")
        ) {
          return null;
        }

        return destination;
      };

      primaryLinks.forEach((link) => {
        link.addEventListener("click", (event) => {
          if (
            !desktopQuery.matches ||
            event.defaultPrevented ||
            event.button !== 0 ||
            event.metaKey ||
            event.ctrlKey ||
            event.shiftKey ||
            event.altKey
          ) {
            return;
          }

          const destination = getDestination(link);
          if (!destination) return;

          const isEnteringElsewhere = isElsewhereDestination(destination);
          const isLeavingElsewhere = Boolean(elsewhereNavItem) && !isEnteringElsewhere;

          event.preventDefault();
          if (isNavigating) return;

          const indicator = navSelectionIndicators.getPrimaryIndicator();
          const targetGeometry = navSelectionIndicators.getPrimaryGeometry(link);
          const currentGeometry = navSelectionIndicators.getPrimaryCurrentGeometry();

          if (!indicator || !targetGeometry || !currentGeometry) {
            if (isEnteringElsewhere) rememberElsewherePillEntry(destination);
            if (isLeavingElsewhere) collapseElsewherePillForPrimaryLeave();
            window.location.assign(destination.href);
            return;
          }

          isNavigating = true;
          navSelectionIndicators.lockPrimaryGeometry();
          const frozenIndicator = navSelectionIndicators.freezePrimaryToGeometry(currentGeometry);
          if (!frozenIndicator) {
            if (isEnteringElsewhere) rememberElsewherePillEntry(destination);
            if (isLeavingElsewhere) collapseElsewherePillForPrimaryLeave();
            window.location.assign(destination.href);
            return;
          }

          if (isEnteringElsewhere) rememberElsewherePillEntry(destination);
          if (isLeavingElsewhere) collapseElsewherePillForPrimaryLeave();

          let hasNavigated = false;
          let fallbackTimer = 0;
          const navigate = () => {
            if (hasNavigated) return;
            hasNavigated = true;
            window.clearTimeout(fallbackTimer);
            indicator.removeEventListener("transitionend", handleTransitionEnd);
            window.location.assign(destination.href);
          };
          const handleTransitionEnd = (transitionEvent) => {
            if (transitionEvent.target === indicator && transitionEvent.propertyName === "transform") {
              window.requestAnimationFrame(() => {
                window.requestAnimationFrame(navigate);
              });
            }
          };

          indicator.addEventListener("transitionend", handleTransitionEnd);
          // Paint the frozen source capsule before changing it to the target geometry.
          indicator.getBoundingClientRect();
          window.requestAnimationFrame(() => {
            if (hasNavigated) return;

            indicator.classList.add("is-motion-ready");
            indicator.getBoundingClientRect();
            window.requestAnimationFrame(() => {
              if (hasNavigated) return;

              const movingIndicator = navSelectionIndicators.movePrimaryToGeometry(targetGeometry);
              if (!movingIndicator) {
                navigate();
                return;
              }

              fallbackTimer = window.setTimeout(navigate, getIndicatorDuration() + 150);
            });
          });
        });
      });
    };

    initializePrimaryNavLeaveMotion();

    const setElsewhereSubnavHidden = (hidden) => {
      elsewhereSubnavs.forEach((subnav) => subnav.classList.toggle("is-hidden", hidden));
    };

    const isElsewhereSubnavHidden = () =>
      elsewhereSubnavs.some((subnav) => subnav.classList.contains("is-hidden"));

    const setElsewherePanel = (nextPanel) => {
      if (!elsewhereTabs.length || !elsewherePanels.length) return;
      if (!["calmato", "unsplash"].includes(nextPanel) || nextPanel === elsewhereActivePanel) return;

      const isMovingToRight = nextPanel === "unsplash";

      if (elsewherePanelStage) {
        elsewherePanelStage.style.minHeight = `${elsewherePanelStage.offsetHeight}px`;
        window.clearTimeout(elsewherePanelHeightTimer);
        elsewherePanelHeightTimer = window.setTimeout(() => {
          elsewherePanelStage.style.minHeight = "";
        }, prefersReducedMotion ? 0 : 420);
      }

      elsewhereActivePanel = nextPanel;
      elsewhere?.classList.toggle(
        "is-calmato-footer-swipe-ready",
        nextPanel === "calmato" && calmatoDominantIndex === elsewhereSnapPanels.length - 1
      );

      elsewhereTabs.forEach((tab) => {
        const isActive = tab.dataset.elsewhereTab === nextPanel;
        tab.classList.toggle("is-active", isActive);
        tab.setAttribute("aria-selected", String(isActive));
      });
      syncNavSelectionIndicators();

      elsewherePanels.forEach((panel) => {
        const isActive = panel.dataset.elsewherePanel === nextPanel;
        panel.classList.toggle("is-active", isActive);
        panel.classList.toggle("is-before", !isActive && isMovingToRight);
        panel.setAttribute("aria-hidden", String(!isActive));
      });

      elsewhereSnapNav?.classList.toggle("is-hidden", nextPanel !== "calmato");
      if (nextPanel !== "calmato") clearCalmatoScrollHint();

      // Unsplash is a single viewport. Reset a retained Calmato scroll position
      // so the gallery is not rendered above the currently visible area.
      if (nextPanel === "unsplash" && elsewhere) {
        elsewhere.classList.remove("is-footer-free");
        elsewhere.scrollTop = 0;
      }

      if (nextPanel === "calmato") {
        window.requestAnimationFrame(() => {
          syncCalmatoDissolveMetrics();
          requestCalmatoDissolve();
          scheduleCalmatoScrollHint();
        });
      }
    };

    const requestedElsewherePanel = new URLSearchParams(window.location.search).get("channel");
    if (["calmato", "unsplash"].includes(requestedElsewherePanel)) {
      window.requestAnimationFrame(() => setElsewherePanel(requestedElsewherePanel));
    }

    elsewhereTabs.forEach((tab) => {
      tab.addEventListener("click", () => {
        setElsewherePanel(tab.dataset.elsewhereTab || "calmato");
        if (tab.closest(".mobile-menu")) closeMenu();
      });

      tab.addEventListener("keydown", (event) => {
        if (!["ArrowLeft", "ArrowRight"].includes(event.key)) return;
        event.preventDefault();
        const nextPanel = event.key === "ArrowRight" ? "unsplash" : "calmato";
        setElsewherePanel(nextPanel);
        tab.closest("[data-elsewhere-subnav]")
          ?.querySelector(`[data-elsewhere-tab="${nextPanel}"]`)
          ?.focus();
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
          if (
            window.matchMedia("(max-width: 833px)").matches &&
            elsewhereActivePanel === "calmato"
          ) {
            return;
          }
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
        title: "Big Ben",
        location: "London, UK",
        year: "2024.03",
        url: "https://unsplash.com/ko/%EC%82%AC%EC%A7%84/qLdwTdrpw7k",
      },
      {
        src: "../assets/elsewhere_unsplash/01_unsplash.jpg",
        alt: "Shinjuku Gyoen 02",
        title: "Disneyland Tokyo",
        location: "Tokyo, Japan",
        year: "2024.10",
        url: "https://unsplash.com/ko/%EC%82%AC%EC%A7%84/%ED%91%B8%EB%A5%B8-%ED%95%98%EB%8A%98%EC%9D%84-%EB%B0%B0%EA%B2%BD%EC%9C%BC%EB%A1%9C-%EC%8B%A0%EB%8D%B0%EB%A0%90%EB%9D%BC-%EC%84%B1%EC%9D%B4-%EC%B2%A8%ED%83%91%EC%9C%BC%EB%A1%9C-%EC%86%9F%EC%95%84-%EC%9E%88%EB%8B%A4-KPV_a6VpUW8",
      },
      {
        src: "../assets/elsewhere_unsplash/02_unsplash.jpg",
        alt: "Shinjuku Gyoen 01",
        title: "Shinjuku Gyoen 01",
        location: "Tokyo, Japan",
        year: "2026.04",
        url: "https://unsplash.com/ko/%EC%82%AC%EC%A7%84/-IUoLmKwxiM",
      },
      {
        src: "../assets/elsewhere_unsplash/03_unsplash.jpg",
        alt: "Unsplash photo 04 image path placeholder",
        title: "Shinjuku Gyoen 02",
        location: "Tokyo, Japan",
        year: "2026.04",
        url: "https://unsplash.com/ko/%EC%82%AC%EC%A7%84/cyvfj8GICHc",
      },
      {
        src: "../assets/elsewhere_unsplash/04_unsplash.jpg",
        alt: "Unsplash photo 05 image path placeholder",
        title: "Tokyo Tower in the Rain",
        location: "Tokyo, Japan",
        year: "2026.08",
        url: "https://unsplash.com/ko/%EC%82%AC%EC%A7%84/%EB%B0%A4%EC%97%90-%EC%A1%B0%EB%AA%85%EC%9D%B4-%EC%BC%9C%EC%A7%84-%ED%86%B5%EC%8B%A0%ED%83%91-ic5ii8OKu8Y",
      },
      {
        src: "../assets/elsewhere_unsplash/05_unsplash.jpg",
        alt: "Unsplash photo 06 image path placeholder",
        title: "After the Rain",
        location: "Tokyo, Japan",
        year: "2026.08",
        url: "https://unsplash.com/ko/%EC%82%AC%EC%A7%84/%EB%8F%84%EC%BF%84-%EB%84%A4%EC%98%A8-%EC%9D%98%EB%A5%98-%EA%B0%80%EA%B2%8C-%EC%82%AC%EB%9E%8C-q15usnWEDzU",
      },
      {
        src: "../assets/elsewhere_unsplash/06_unsplash.jpg",
        alt: "Unsplash photo 07 image path placeholder",
        title: "City Lights",
        location: "Seoul, South Korea",
        year: "2025.10",
        url: "https://unsplash.com/ko/%EC%82%AC%EC%A7%84/p-uvvueNgSk",
      },
      {
        src: "../assets/elsewhere_unsplash/07_unsplash.jpg",
        alt: "Unsplash photo 08 image path placeholder",
        title: "Trumpet Vine",
        location: "Seoul, South Korea",
        year: "2026.07",
        url: "https://unsplash.com/ko/%EC%82%AC%EC%A7%84/%EC%A7%99%EC%9D%80-%EB%85%B9%EC%83%89-%EC%9E%8E%EC%82%AC%EA%B7%80-%EB%8D%A9%EA%B5%B4-%EC%9C%84%EC%97%90-%ED%94%BC%EC%96%B4%EB%82%98%EB%8A%94-%EC%A3%BC%ED%99%A9%EC%83%89-%EB%82%98%ED%8C%94%EA%BD%83-Z51vlqU62WI",
      },
      {
        src: "../assets/elsewhere_unsplash/08_unsplash.jpg",
        alt: "Unsplash photo 09 image path placeholder",
        title: "Golden Hour in Seoul",
        location: "Seoul, South Korea",
        year: "2026.03",
        url: "https://unsplash.com/ko/%EC%82%AC%EC%A7%84/%EA%B1%B4%EB%AC%BC-%EC%82%AC%EC%9D%B4-%EA%B3%A8%EB%AA%A9-%ED%95%B4%EC%A7%88-%EB%AC%B4%EB%A0%B5-%EB%82%98%EB%AC%B4%EA%B0%80-%EC%95%99%EC%83%81%ED%95%9C-%EA%B3%B3%EC%9C%BC%EB%A1%9C-%EC%9D%B4%EC%96%B4%EC%A7%84%EB%8B%A4-TMoq1a7OKVY",
      },
      {
        src: "../assets/elsewhere_unsplash/09_unsplash.jpg",
        alt: "Above Osaka",
        title: "Above Osaka",
        location: "Osaka, Japan",
        year: "2025.03",
        url: "https://unsplash.com/ko/%EC%82%AC%EC%A7%84/x2IVopZtN6k",
      },
    
    ];

    const unsplashHeader = document.querySelector("[data-nav]");
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
    const unsplashLightboxMeta = document.querySelector(".unsplash-lightbox-meta");
    const unsplashLightboxPrevious = document.querySelector('[data-unsplash-lightbox-adjacent-button="previous"]');
    const unsplashLightboxNext = document.querySelector('[data-unsplash-lightbox-adjacent-button="next"]');
    const unsplashLightboxAdjacentButtons = [unsplashLightboxPrevious, unsplashLightboxNext].filter(Boolean);
    const unsplashLightboxTitle = document.querySelector("[data-unsplash-lightbox-title]");
    const unsplashLightboxDetail = document.querySelector("[data-unsplash-lightbox-detail]");
    const unsplashLightboxLink = document.querySelector("[data-unsplash-lightbox-link]");
    const unsplashLightboxCloseTargets = [...document.querySelectorAll("[data-unsplash-lightbox-close]")];
    const unsplashLightboxClose = unsplashLightboxCloseTargets.find((target) => target.matches("button"));
    let unsplashActiveIndex = 0;
    let unsplashMetaTimer = 0;
    let unsplashPointerStartX = 0;
    let unsplashPointerStartY = 0;
    let unsplashPointerCurrentX = 0;
    let unsplashPointerLastX = 0;
    let unsplashPointerLastTime = 0;
    let unsplashPointerVelocityX = 0;
    let unsplashPointerCardStep = 1;
    let unsplashPointerCard = null;
    let unsplashPointerStartProgress = 0;
    let unsplashCurrentProgress = 0;
    let unsplashTargetProgress = 0;
    let unsplashSettleTargetProgress = 0;
    let unsplashSettleTargetIndex = null;
    let unsplashWheelMomentum = 0;
    let unsplashWheelGestureProgress = 0;
    let unsplashWheelStartIndex = null;
    let unsplashWheelGestureTimer = 0;
    let unsplashInertiaVelocity = 0;
    let unsplashMotionFrame = 0;
    let unsplashLastMotionFrameTime = 0;
    let unsplashIsSettling = false;
    let unsplashMotionConfig = null;
    let unsplashPointerMoved = false;
    let unsplashPointerIsDown = false;
    let unsplashPointerStartIndex = 0;
    let unsplashIgnoredCardClick = null;
    let unsplashIgnoredCardClickTimer = 0;
    let unsplashLightboxOpen = false;
    let unsplashLightboxClosing = false;
    let unsplashLightboxCloseTimer = 0;
    let unsplashLightboxTransitioning = false;
    let unsplashLightboxTransitionTimer = 0;
    let unsplashLightboxTransitionImage = null;
    let unsplashLightboxCloseAfterTransition = false;
    let unsplashSubnavWasHidden = false;
    let unsplashLightboxScrollTop = 0;
    let unsplashPreviousFocus = null;
    let unsplashMotionTimer = 0;
    const unsplashMobileQuery = window.matchMedia("(max-width: 833px)");

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

    const getUnsplashIndexDelta = (fromIndex, toIndex) => {
      const itemCount = unsplashItems.length;
      let delta = toIndex - fromIndex;
      if (delta > itemCount / 2) delta -= itemCount;
      if (delta < itemCount / -2) delta += itemCount;
      return delta;
    };

    const getUnsplashItemDetail = (item) => {
      return [item.location, item.year].filter(Boolean).join(" · ") || "Metadata placeholder";
    };

    const getUnsplashMotionValue = (style, property, fallback) => {
      const value = Number.parseFloat(style.getPropertyValue(property));
      return Number.isFinite(value) ? value : fallback;
    };

    const clampUnsplashProgress = (progress) => {
      const maxOffset = unsplashMotionConfig?.maxTemporaryOffset || 1.35;
      return Math.max(-maxOffset, Math.min(maxOffset, progress));
    };

    const getUnsplashNearestIndexDelta = (progress) => {
      return Math.round(-progress);
    };

    const getUnsplashDirectionalSnapIndexDelta = (progress) => {
      const motionConfig = unsplashMotionConfig || readUnsplashMotionConfig();
      const magnitude = Math.abs(progress);
      if (magnitude < motionConfig.snapThreshold) return 0;

      const cardCount = Math.min(2, Math.max(1, Math.round(magnitude)));
      return (progress > 0 ? -1 : 1) * cardCount;
    };

    const getUnsplashSettleProgress = (targetIndex) => {
      return clampUnsplashProgress(-getUnsplashIndexDelta(unsplashActiveIndex, targetIndex));
    };

    const readUnsplashMotionConfig = () => {
      const style = window.getComputedStyle(unsplashGallery || unsplashCarousel);
      unsplashMotionConfig = {
        arcNearY: getUnsplashMotionValue(style, "--unsplash-arc-y-near", 42),
        arcFarY: getUnsplashMotionValue(style, "--unsplash-arc-y-far", 78),
        scaleCenter: getUnsplashMotionValue(style, "--unsplash-scale-center", 1),
        scaleNear: getUnsplashMotionValue(style, "--unsplash-scale-near", 0.9),
        scaleFar: getUnsplashMotionValue(style, "--unsplash-scale-far", 0.8),
        opacityNear: getUnsplashMotionValue(style, "--unsplash-opacity-near", 0.98),
        opacityFar: getUnsplashMotionValue(style, "--unsplash-opacity-far", 0.88),
        tiltStep: getUnsplashMotionValue(style, "--unsplash-tilt-step", 1.8),
        rotateYStep: getUnsplashMotionValue(style, "--unsplash-rotate-y-step", -3),
        depthNear: getUnsplashMotionValue(style, "--unsplash-depth-near", -24),
        depthFar: getUnsplashMotionValue(style, "--unsplash-depth-far", -58),
        dragSensitivity: getUnsplashMotionValue(style, "--unsplash-drag-sensitivity", 0.88),
        wheelSensitivity: getUnsplashMotionValue(style, "--unsplash-wheel-sensitivity", 0.7),
        wheelNoiseThreshold: getUnsplashMotionValue(style, "--unsplash-wheel-noise-threshold", 2),
        smoothingFactor: getUnsplashMotionValue(style, "--unsplash-smoothing-factor", 0.18),
        settleStrength: getUnsplashMotionValue(style, "--unsplash-settle-strength", 0.26),
        pointerVelocityInfluence: getUnsplashMotionValue(style, "--unsplash-pointer-velocity-influence", 140),
        inertiaStrength: getUnsplashMotionValue(style, "--unsplash-inertia-strength", 0.18),
        inertiaDecay: getUnsplashMotionValue(style, "--unsplash-inertia-decay", 0.86),
        snapThreshold: getUnsplashMotionValue(style, "--unsplash-snap-threshold", 0.18),
        settleEpsilon: getUnsplashMotionValue(style, "--unsplash-settle-epsilon", 0.002),
        maxTemporaryOffset: getUnsplashMotionValue(style, "--unsplash-max-temporary-offset", 1.35),
        metadataCenterSwitchThreshold: getUnsplashMotionValue(style, "--unsplash-metadata-center-switch-threshold", 0.5),
        clickDragThreshold: getUnsplashMotionValue(style, "--unsplash-click-drag-threshold", 8),
        wheelMaxCards: getUnsplashMotionValue(style, "--unsplash-wheel-max-cards", 1),
        autoResumeDelay: getUnsplashMotionValue(style, "--unsplash-auto-resume-delay", 2600),
      };
      return unsplashMotionConfig;
    };

    const syncUnsplashLightboxClosePosition = (imageRect = null) => {
      if (!unsplashLightboxClose) return;

      const rect = imageRect || unsplashLightboxImage?.getBoundingClientRect();
      if (!rect?.width || !rect?.height) return;

      const closeSize = unsplashLightboxClose.getBoundingClientRect().width || 42;
      const inset = 14;
      const headerBottom = unsplashHeader?.getBoundingClientRect()?.bottom || 0;
      const top = Math.min(
        Math.max(rect.top + inset, headerBottom + 8),
        window.innerHeight - closeSize - 8
      );
      const left = Math.min(
        Math.max(rect.right - closeSize - inset, 8),
        window.innerWidth - closeSize - 8
      );

      unsplashLightboxClose.style.setProperty("--unsplash-lightbox-close-top", `${top}px`);
      unsplashLightboxClose.style.setProperty("--unsplash-lightbox-close-left", `${left}px`);
      unsplashLightboxClose.style.setProperty("--unsplash-lightbox-close-right", "auto");
    };

    const syncUnsplashLightboxSafeArea = () => {
      if (!unsplashLightbox) return;

      const headerRect = unsplashHeader?.getBoundingClientRect();
      const cssHeaderHeight = Number.parseFloat(
        window.getComputedStyle(document.documentElement).getPropertyValue("--header-height")
      );
      const headerHeight = headerRect?.height || cssHeaderHeight || 0;
      unsplashLightbox.style.setProperty(
        "--unsplash-lightbox-top-safe-area",
        `${Math.max(headerHeight, 0)}px`
      );
      if (unsplashLightboxOpen) syncUnsplashLightboxClosePosition();
    };

    const restoreUnsplashLightboxScroll = () => {
      if (elsewhere) elsewhere.scrollTop = unsplashLightboxScrollTop;
    };

    const restoreUnsplashLightboxScrollAfterFocus = () => {
      restoreUnsplashLightboxScroll();
      window.requestAnimationFrame(() => {
        restoreUnsplashLightboxScroll();
        if (unsplashLightboxOpen) setElsewhereSubnavHidden(true);
      });
    };

    syncUnsplashLightboxSafeArea();
    window.addEventListener("resize", syncUnsplashLightboxSafeArea, { passive: true });
    if (unsplashHeader && typeof ResizeObserver === "function") {
      new ResizeObserver(syncUnsplashLightboxSafeArea).observe(unsplashHeader);
    }

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

      // Keep the rendered position so a new index can continue from the current drag/wheel frame.
      unsplashCurrentProgress = dragProgress;

      const motionConfig = unsplashMotionConfig || readUnsplashMotionConfig();
      const {
        arcNearY,
        arcFarY,
        scaleCenter,
        scaleNear,
        scaleFar,
        opacityNear,
        opacityFar,
        tiltStep,
        rotateYStep,
        depthNear,
        depthFar,
      } = motionConfig;

      const isMobile = unsplashMobileQuery.matches;
      const visibleLimit = isMobile ? 1.5 : 2.5;
      [...unsplashTrack.children].forEach((card, index) => {
        const baseOffset = getUnsplashOffset(index);
        const offset = baseOffset + dragProgress;
        const distance = Math.abs(offset);
        const isVisible = distance <= visibleLimit;
        const isActive = Math.abs(offset) < 0.5;
        const xPosition = offset;
        const clampedDistance = Math.min(distance, 2);
        const nearMix = Math.min(clampedDistance, 1);
        const farMix = Math.max(clampedDistance - 1, 0);
        const yPosition = clampedDistance <= 1 ? arcNearY * nearMix : arcNearY + (arcFarY - arcNearY) * farMix;
        const cardScale = clampedDistance <= 1 ? scaleCenter + (scaleNear - scaleCenter) * nearMix : scaleNear + (scaleFar - scaleNear) * farMix;
        const cardOpacity = isVisible ? (clampedDistance <= 1 ? 1 + (opacityNear - 1) * nearMix : opacityNear + (opacityFar - opacityNear) * farMix) : 0;
        const cardTilt = isVisible ? offset * tiltStep : 0;
        const cardRotate = isVisible ? offset * rotateYStep : 0;
        const cardDepth = clampedDistance <= 1 ? depthNear * nearMix : depthNear + (depthFar - depthNear) * farMix;
        const cardOrder = 10 - distance;

        card.classList.toggle("is-active", isActive);
        card.classList.toggle("is-hidden", !isVisible);
        card.setAttribute("aria-hidden", String(!isVisible));
        card.tabIndex = isVisible ? 0 : -1;
        card.style.setProperty("--unsplash-card-x", `calc(var(--unsplash-card-step) * ${xPosition})`);
        card.style.setProperty("--unsplash-card-y", `${yPosition}px`);
        card.style.setProperty("--unsplash-card-scale", cardScale);
        card.style.setProperty("--unsplash-card-opacity", cardOpacity);
        card.style.setProperty("--unsplash-card-tilt", `${cardTilt}deg`);
        card.style.setProperty("--unsplash-card-rotate", `${cardRotate}deg`);
        card.style.setProperty("--unsplash-card-depth", `${cardDepth}px`);
        card.style.setProperty("--unsplash-card-order", cardOrder);
        card.style.transitionDuration = immediate || unsplashPointerIsDown ? "0ms" : transitionDuration;
      });

      if (!unsplashPointerIsDown && syncMeta) updateUnsplashMeta(unsplashItems[unsplashActiveIndex], immediate);
    };

    const stopUnsplashMotionFrame = () => {
      if (unsplashMotionFrame) cancelAnimationFrame(unsplashMotionFrame);
      unsplashMotionFrame = 0;
      unsplashLastMotionFrameTime = 0;
    };

    const rebaseUnsplashProgress = () => {
      const motionConfig = unsplashMotionConfig || readUnsplashMotionConfig();
      if (Math.abs(unsplashCurrentProgress) < motionConfig.metadataCenterSwitchThreshold) return false;

      const indexDelta = Math.round(-unsplashCurrentProgress);
      if (!indexDelta) return false;

      unsplashActiveIndex = normalizeUnsplashIndex(unsplashActiveIndex + indexDelta);
      unsplashCurrentProgress += indexDelta;
      if (!unsplashIsSettling) unsplashTargetProgress += indexDelta;
      updateUnsplashMeta(unsplashItems[unsplashActiveIndex]);
      return true;
    };

    const beginUnsplashSettle = (nextIndex = null) => {
      if (unsplashPointerIsDown) return;

      const targetIndex = nextIndex === null
        ? normalizeUnsplashIndex(unsplashActiveIndex + getUnsplashNearestIndexDelta(unsplashCurrentProgress))
        : normalizeUnsplashIndex(nextIndex);

      unsplashSettleTargetIndex = targetIndex;
      unsplashSettleTargetProgress = getUnsplashSettleProgress(targetIndex);
      unsplashTargetProgress = unsplashSettleTargetProgress;
      unsplashWheelMomentum = 0;
      unsplashInertiaVelocity = 0;
      unsplashIsSettling = true;
      requestUnsplashMotionFrame();
    };

    const animateUnsplashMotion = (now) => {
      const motionConfig = unsplashMotionConfig || readUnsplashMotionConfig();
      const elapsed = unsplashLastMotionFrameTime
        ? Math.min(Math.max(now - unsplashLastMotionFrameTime, 1), 32)
        : 16.67;
      const frameRatio = elapsed / 16.67;
      unsplashLastMotionFrameTime = now;

      if (!unsplashPointerIsDown && unsplashIsSettling && unsplashSettleTargetIndex !== null) {
        unsplashSettleTargetProgress = getUnsplashSettleProgress(unsplashSettleTargetIndex);
        unsplashTargetProgress = unsplashSettleTargetProgress;
      }

      const smoothingFactor = unsplashIsSettling
        ? motionConfig.settleStrength
        : motionConfig.smoothingFactor;
      const frameSmoothing = 1 - Math.pow(
        1 - Math.max(0.001, Math.min(smoothingFactor, 0.99)),
        frameRatio
      );
      unsplashCurrentProgress += (unsplashTargetProgress - unsplashCurrentProgress) * frameSmoothing;

      if (!unsplashPointerIsDown) rebaseUnsplashProgress();
      updateUnsplashCards(true, unsplashCurrentProgress, false);

      if (!unsplashPointerIsDown && !unsplashIsSettling &&
        Math.abs(unsplashTargetProgress - unsplashCurrentProgress) <= motionConfig.settleEpsilon) {
        beginUnsplashSettle();
      }

      if (
        unsplashIsSettling &&
        unsplashSettleTargetIndex === unsplashActiveIndex &&
        Math.abs(unsplashCurrentProgress) <= motionConfig.settleEpsilon
      ) {
        unsplashCurrentProgress = 0;
        unsplashTargetProgress = 0;
        unsplashSettleTargetProgress = 0;
        unsplashSettleTargetIndex = null;
        unsplashIsSettling = false;
        updateUnsplashCards(true, 0, false);
        updateUnsplashMeta(unsplashItems[unsplashActiveIndex], true);
        startUnsplashMotion();
      }

      const needsFrame = unsplashPointerIsDown
        || Math.abs(unsplashTargetProgress - unsplashCurrentProgress) > 0.001
        || unsplashIsSettling;

      if (needsFrame) {
        unsplashMotionFrame = requestAnimationFrame(animateUnsplashMotion);
      } else {
        unsplashMotionFrame = 0;
        unsplashLastMotionFrameTime = 0;
      }
    };

    const requestUnsplashMotionFrame = () => {
      if (unsplashMotionFrame) return;
      unsplashLastMotionFrameTime = performance.now();
      unsplashMotionFrame = requestAnimationFrame(animateUnsplashMotion);
    };

    const syncUnsplashBreakpoint = () => {
      if (!unsplashTrack) return;
      stopUnsplashMotionFrame();
      readUnsplashMotionConfig();
      updateUnsplashCards(true, unsplashCurrentProgress, false);
      unsplashPointerCardStep = getUnsplashCardStep();
    };

    if (typeof unsplashMobileQuery.addEventListener === "function") {
      unsplashMobileQuery.addEventListener("change", syncUnsplashBreakpoint);
    } else {
      unsplashMobileQuery.addListener(syncUnsplashBreakpoint);
    }

    const setUnsplashActiveIndex = (nextIndex, immediate = false, reboundDirection = 0, allowLightbox = false) => {
      if (
        unsplashItems.length === 0 ||
        unsplashLightboxClosing ||
        (unsplashLightboxOpen && !allowLightbox)
      ) return;
      const normalizedIndex = normalizeUnsplashIndex(nextIndex);
      if (immediate || allowLightbox) {
        stopUnsplashMotionFrame();
        unsplashActiveIndex = normalizedIndex;
        unsplashCurrentProgress = 0;
        unsplashTargetProgress = 0;
        unsplashSettleTargetProgress = 0;
        unsplashSettleTargetIndex = null;
        unsplashWheelMomentum = 0;
        unsplashInertiaVelocity = 0;
        unsplashIsSettling = false;
        updateUnsplashCards(true, 0, true);
        return;
      }

      beginUnsplashSettle(normalizedIndex);
    };

    const moveUnsplashCarousel = (direction) => {
      setUnsplashActiveIndex(unsplashActiveIndex + direction, false, direction > 0 ? -1 : 1);
    };

    const stopUnsplashMotion = () => {
      window.clearTimeout(unsplashMotionTimer);
      unsplashMotionTimer = 0;
    };

    const startUnsplashMotion = () => {
      const motionConfig = unsplashMotionConfig || readUnsplashMotionConfig();
      const unsplashMotionDelay = motionConfig.autoResumeDelay;

      stopUnsplashMotion();
      if (
        prefersReducedMotion ||
        !isUnsplashPanelActive() ||
        unsplashLightboxOpen ||
        unsplashLightboxClosing ||
        unsplashPointerIsDown ||
        unsplashIsSettling ||
        Math.abs(unsplashTargetProgress - unsplashCurrentProgress) > (unsplashMotionConfig?.settleEpsilon || 0.002)
      ) return;

      unsplashMotionTimer = window.setTimeout(() => {
        if (!isUnsplashPanelActive() || unsplashLightboxOpen || unsplashLightboxClosing || unsplashPointerIsDown) return;
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

    const setUnsplashLightboxAdjacent = () => {
      const adjacentItems = [
        { button: unsplashLightboxPrevious, index: normalizeUnsplashIndex(unsplashActiveIndex - 1), label: "이전 사진" },
        { button: unsplashLightboxNext, index: normalizeUnsplashIndex(unsplashActiveIndex + 1), label: "다음 사진" },
      ];

      adjacentItems.forEach(({ button, index, label }) => {
        if (!button) return;

        const item = unsplashItems[index];
        const image = button.querySelector("img");
        if (!item || !image) {
          button.hidden = true;
          return;
        }

        button.hidden = false;
        button.dataset.unsplashIndex = String(index);
        button.setAttribute("aria-label", `${label}: ${item.title}`);
        image.src = item.src || "";
        image.alt = item.alt || item.title;
      });
    };

    const getUnsplashLightboxFlip = (sourceRect, targetRect) => {
      if (!sourceRect || !targetRect || !sourceRect.width || !sourceRect.height) return null;

      const sourceCenterX = sourceRect.left + sourceRect.width / 2;
      const sourceCenterY = sourceRect.top + sourceRect.height / 2;
      const targetCenterX = targetRect.left + targetRect.width / 2;
      const targetCenterY = targetRect.top + targetRect.height / 2;
      const scale = Math.max(
        0.01,
        Math.min(targetRect.width / sourceRect.width, targetRect.height / sourceRect.height)
      );

      return {
        x: targetCenterX - sourceCenterX,
        y: targetCenterY - sourceCenterY,
        scale,
        css: `translate3d(${targetCenterX - sourceCenterX}px, ${targetCenterY - sourceCenterY}px, 0) scale(${scale})`,
      };
    };

    const getUnsplashLightboxDuration = () => {
      return getUnsplashMotionValue(
        window.getComputedStyle(unsplashLightbox),
        "--unsplash-lightbox-duration",
        520
      );
    };

    const removeUnsplashLightboxTransitionImage = () => {
      window.clearTimeout(unsplashLightboxTransitionTimer);
      unsplashLightboxTransitionTimer = 0;
      unsplashLightboxTransitionImage?.remove();
      unsplashLightboxTransitionImage = null;
      unsplashLightboxAdjacentButtons.forEach((button) => {
        button.style.removeProperty("visibility");
      });
    };

    const setUnsplashLightboxOrigin = (sourceRect, targetRect) => {
      if (!unsplashLightboxImage || !sourceRect || !targetRect) return;

      const sourceCenterX = sourceRect.left + sourceRect.width / 2;
      const sourceCenterY = sourceRect.top + sourceRect.height / 2;
      const targetCenterX = targetRect.left + targetRect.width / 2;
      const targetCenterY = targetRect.top + targetRect.height / 2;
      const widthScale = targetRect.width ? sourceRect.width / targetRect.width : 1;
      const heightScale = targetRect.height ? sourceRect.height / targetRect.height : 1;
      const originScale = Math.max(0.01, Math.min(widthScale, heightScale));
      const originX = sourceCenterX - targetCenterX;
      const originY = sourceCenterY - targetCenterY;

      unsplashLightboxImage.style.setProperty("--unsplash-lightbox-origin-x", `${originX}px`);
      unsplashLightboxImage.style.setProperty("--unsplash-lightbox-origin-y", `${originY}px`);
      unsplashLightboxImage.style.setProperty("--unsplash-lightbox-origin-scale", originScale);

      return { x: originX, y: originY, scale: originScale };
    };

    const openUnsplashLightbox = (item, sourceCard = null) => {
      if (!unsplashLightbox || !setUnsplashLightboxContent(item)) return;

      window.clearTimeout(unsplashLightboxCloseTimer);
      unsplashLightboxCloseTimer = 0;
      removeUnsplashLightboxTransitionImage();
      unsplashLightboxTransitioning = false;
      unsplashLightboxCloseAfterTransition = false;
      unsplashLightboxClosing = false;
      syncUnsplashLightboxSafeArea();
      unsplashSubnavWasHidden = isElsewhereSubnavHidden();
      setElsewhereSubnavHidden(true);
      const sourceImage = sourceCard?.querySelector("img");
      const sourceRect = (sourceImage || sourceCard)?.getBoundingClientRect?.();

      unsplashLightbox.classList.remove("is-open");
      unsplashLightbox.setAttribute("aria-hidden", "true");
      unsplashLightboxImage?.style.setProperty("--unsplash-lightbox-origin-x", "0px");
      unsplashLightboxImage?.style.setProperty("--unsplash-lightbox-origin-y", "0px");
      unsplashLightboxImage?.style.setProperty("--unsplash-lightbox-origin-scale", "1");
      unsplashLightboxImage?.style.removeProperty("transition");
      unsplashLightboxImage?.style.removeProperty("transform");
      unsplashLightboxClose?.style.removeProperty("--unsplash-lightbox-close-top");
      unsplashLightboxClose?.style.removeProperty("--unsplash-lightbox-close-left");
      unsplashLightboxClose?.style.removeProperty("--unsplash-lightbox-close-right");

      unsplashLightboxScrollTop = elsewhere?.scrollTop ?? 0;
      stopUnsplashMotion();
      stopUnsplashMotionFrame();
      unsplashLightboxOpen = true;
      setUnsplashLightboxAdjacent();
      unsplashPreviousFocus = document.activeElement;
      unsplashLightbox.hidden = false;
      document.body.classList.add("is-unsplash-lightbox-open");
      restoreUnsplashLightboxScroll();

      const revealUnsplashLightbox = () => {
        if (!unsplashLightboxOpen) return;

        const targetRect = unsplashLightboxImage?.getBoundingClientRect();
        const origin = setUnsplashLightboxOrigin(sourceRect, targetRect);
        if (!origin || !unsplashLightboxImage) return;
        syncUnsplashLightboxClosePosition(targetRect);

        unsplashLightboxImage.style.transition = "none";
        unsplashLightboxImage.style.transform = `translate3d(${origin.x}px, ${origin.y}px, 0) scale(${origin.scale})`;
        // Commit the card-sized start state before the open transition begins.
        unsplashLightboxImage?.getBoundingClientRect();

        window.requestAnimationFrame(() => {
          if (!unsplashLightboxOpen) return;
          unsplashLightbox.classList.add("is-open");
          unsplashLightboxImage.style.removeProperty("transition");
          unsplashLightboxImage.style.transform = "translate3d(0, 0, 0) scale(1)";
          unsplashLightbox.setAttribute("aria-hidden", "false");
          unsplashLightboxCloseTargets.find((target) => target.matches("button"))?.focus({ preventScroll: true });
          restoreUnsplashLightboxScrollAfterFocus();
        });
      };

      if (unsplashLightboxImage?.complete && unsplashLightboxImage.naturalWidth > 0) {
        revealUnsplashLightbox();
      } else {
        unsplashLightboxImage?.addEventListener("load", revealUnsplashLightbox, { once: true });
        unsplashLightboxImage?.addEventListener("error", revealUnsplashLightbox, { once: true });
      }
    };

    const closeUnsplashLightbox = () => {
      if (!unsplashLightbox || !unsplashLightboxOpen) return;
      if (unsplashLightboxTransitioning) {
        unsplashLightboxCloseAfterTransition = true;
        return;
      }

      const activeCard = unsplashTrack?.querySelector(`.unsplash-card[data-unsplash-index="${unsplashActiveIndex}"]`);
      const activeSource = activeCard?.querySelector("img") || activeCard;
      const closeSourceRect = activeSource?.getBoundingClientRect?.();
      unsplashLightboxOpen = false;
      unsplashLightboxClosing = true;
      unsplashLightboxImage?.style.removeProperty("transition");
      unsplashLightboxImage?.style.removeProperty("transform");
      syncUnsplashLightboxClosePosition(closeSourceRect);
      unsplashLightbox.classList.remove("is-open");
      unsplashLightbox.setAttribute("aria-hidden", "true");

      const closeDuration = getUnsplashLightboxDuration();

      unsplashLightboxCloseTimer = window.setTimeout(() => {
        unsplashLightboxCloseTimer = 0;
        if (!unsplashLightboxOpen) {
          unsplashLightbox.hidden = true;
          unsplashLightboxClosing = false;
          restoreUnsplashLightboxScroll();
          document.body.classList.remove("is-unsplash-lightbox-open");
          if (!unsplashSubnavWasHidden) setElsewhereSubnavHidden(false);
          unsplashPreviousFocus?.focus?.({ preventScroll: true });
          restoreUnsplashLightboxScrollAfterFocus();
          startUnsplashMotion();
        }
      }, prefersReducedMotion ? 0 : closeDuration);
    };

    const switchUnsplashLightbox = (direction) => {
      if (!unsplashLightboxOpen || unsplashLightboxTransitioning || unsplashItems.length < 2) return;

      const step = Math.sign(direction);
      const nextIndex = normalizeUnsplashIndex(unsplashActiveIndex + step);
      const nextItem = unsplashItems[nextIndex];
      const incomingButton = step > 0 ? unsplashLightboxNext : unsplashLightboxPrevious;
      const outgoingButton = step > 0 ? unsplashLightboxPrevious : unsplashLightboxNext;
      const incomingImage = incomingButton?.querySelector("img");
      const outgoingImage = outgoingButton?.querySelector("img");
      const currentRect = unsplashLightboxImage?.getBoundingClientRect();
      const incomingRect = incomingImage?.getBoundingClientRect() || incomingButton?.getBoundingClientRect();
      const outgoingRect = outgoingImage?.getBoundingClientRect() || outgoingButton?.getBoundingClientRect();
      const incomingFlip = getUnsplashLightboxFlip(incomingRect, currentRect);
      const outgoingFlip = getUnsplashLightboxFlip(currentRect, outgoingRect);

      if (!nextItem?.src || !incomingRect || !outgoingRect || !incomingFlip || !outgoingFlip) return;

      const transitionImage = document.createElement("img");
      const duration = prefersReducedMotion ? 0 : getUnsplashLightboxDuration();
      transitionImage.className = "unsplash-lightbox-transition-image";
      transitionImage.src = nextItem.src;
      transitionImage.alt = nextItem.alt || nextItem.title;
      transitionImage.style.left = `${incomingRect.left}px`;
      transitionImage.style.top = `${incomingRect.top}px`;
      transitionImage.style.width = `${incomingRect.width}px`;
      transitionImage.style.height = `${incomingRect.height}px`;
      transitionImage.style.transform = "translate3d(0, 0, 0) scale(1)";
      transitionImage.style.transition = "none";
      unsplashLightbox.append(transitionImage);

      incomingButton.style.visibility = "hidden";
      unsplashLightboxTransitionImage = transitionImage;
      unsplashLightboxTransitioning = true;
      unsplashLightboxMeta?.classList.add("is-changing");
      setUnsplashActiveIndex(nextIndex, false, 0, true);
      // The page carousel is hidden underneath the lightbox; settle it now so close returns to the selected card.
      updateUnsplashCards(true, 0, false);
      unsplashLightboxImage.style.transform = outgoingFlip.css;
      transitionImage.getBoundingClientRect();

      window.requestAnimationFrame(() => {
        if (!unsplashLightboxOpen || unsplashLightboxTransitionImage !== transitionImage) return;

        transitionImage.style.transition = `transform ${duration}ms cubic-bezier(0.16, 1, 0.3, 1)`;
        transitionImage.style.transform = incomingFlip.css;
      });

      const finishTransition = () => {
        unsplashLightboxTransitionTimer = 0;
        if (!unsplashLightboxOpen) return;

        unsplashLightboxImage.style.transition = "none";
        unsplashLightboxImage.style.transform = "none";
        setUnsplashLightboxContent(nextItem);
        setUnsplashLightboxAdjacent();

        let contentCommitted = false;
        const commitContent = () => {
          if (contentCommitted) return;
          contentCommitted = true;
          const activeCard = unsplashTrack?.querySelector(`.unsplash-card[data-unsplash-index="${nextIndex}"]`);
          const activeSource = activeCard?.querySelector("img") || activeCard;
          const targetRect = unsplashLightboxImage.getBoundingClientRect();
          syncUnsplashLightboxClosePosition(targetRect);
          if (activeSource && targetRect.width && targetRect.height) {
            setUnsplashLightboxOrigin(activeSource.getBoundingClientRect(), targetRect);
          }

          window.requestAnimationFrame(() => {
            if (!unsplashLightboxOpen) return;

            removeUnsplashLightboxTransitionImage();
            unsplashLightboxImage.style.removeProperty("transition");
            unsplashLightboxImage.style.removeProperty("transform");
            unsplashLightboxMeta?.classList.remove("is-changing");
            unsplashLightboxTransitioning = false;

            if (unsplashLightboxCloseAfterTransition) {
              unsplashLightboxCloseAfterTransition = false;
              closeUnsplashLightbox();
            }
          });
        };

        if (unsplashLightboxImage.complete && unsplashLightboxImage.naturalWidth > 0) {
          commitContent();
        } else {
          unsplashLightboxImage.addEventListener("load", commitContent, { once: true });
          unsplashLightboxImage.addEventListener("error", commitContent, { once: true });
        }
      };

      unsplashLightboxTransitionTimer = window.setTimeout(finishTransition, duration);
    };

    unsplashLightboxPrevious?.addEventListener("click", () => {
      switchUnsplashLightbox(-1);
    });

    unsplashLightboxNext?.addEventListener("click", () => {
      switchUnsplashLightbox(1);
    });

    if (unsplashTrack && unsplashCarousel && unsplashItems.length > 0) {
      const activateUnsplashCard = (card) => {
        if (!card || unsplashPointerMoved || unsplashLightboxOpen || unsplashLightboxClosing) return;

        const index = Number(card.dataset.unsplashIndex);
        if (!Number.isInteger(index) || !unsplashItems[index]) return;

        if (index !== unsplashActiveIndex) {
          stopUnsplashMotion();
          setUnsplashActiveIndex(index);
          startUnsplashMotion();
          return;
        }

        openUnsplashLightbox(unsplashItems[unsplashActiveIndex], card);
      };

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
          if (unsplashIgnoredCardClick === card) {
            unsplashIgnoredCardClick = null;
            window.clearTimeout(unsplashIgnoredCardClickTimer);
            unsplashIgnoredCardClickTimer = 0;
            return;
          }
          activateUnsplashCard(card);
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
      readUnsplashMotionConfig();
      updateUnsplashCards(true, 0, true);
      unsplashPointerCardStep = getUnsplashCardStep();
      startUnsplashMotion();

      unsplashCarousel.addEventListener("wheel", (event) => {
        if (!isUnsplashPanelActive() || unsplashLightboxOpen || unsplashLightboxClosing) return;

        const motionConfig = unsplashMotionConfig || readUnsplashMotionConfig();
        const dominantDelta = Math.abs(event.deltaX) > Math.abs(event.deltaY)
          ? event.deltaX
          : event.deltaY;
        const deltaModeScale = event.deltaMode === 1
          ? 16
          : event.deltaMode === 2
            ? window.innerHeight
            : 1;
        const normalizedDelta = dominantDelta * deltaModeScale;

        if (Math.abs(normalizedDelta) < motionConfig.wheelNoiseThreshold) return;

        event.preventDefault();
        stopUnsplashMotion();
        unsplashIsSettling = false;
        unsplashSettleTargetIndex = null;
        unsplashInertiaVelocity = 0;
        unsplashWheelMomentum = 0;

        const cardStep = unsplashPointerCardStep || getUnsplashCardStep();
        const wheelProgress = (normalizedDelta / cardStep) * motionConfig.wheelSensitivity;
        const wheelMovement = -wheelProgress;
        if (unsplashWheelStartIndex === null) {
          unsplashWheelStartIndex = unsplashActiveIndex;
        }
        const wheelDirectionChanged = unsplashWheelGestureProgress !== 0
          && Math.sign(unsplashWheelGestureProgress) !== Math.sign(wheelMovement);
        if (wheelDirectionChanged) {
          unsplashWheelGestureProgress = 0;
          unsplashWheelStartIndex = unsplashActiveIndex;
        }

        const remainingWheelProgress = Math.max(
          motionConfig.wheelMaxCards - Math.abs(unsplashWheelGestureProgress),
          0
        );
        const acceptedWheelMovement = Math.sign(wheelMovement) * Math.min(
          Math.abs(wheelMovement),
          remainingWheelProgress
        );

        unsplashWheelGestureProgress += acceptedWheelMovement;
        unsplashTargetProgress = clampUnsplashProgress(unsplashTargetProgress + acceptedWheelMovement);
        window.clearTimeout(unsplashWheelGestureTimer);
        unsplashWheelGestureTimer = window.setTimeout(() => {
          const indexDelta = getUnsplashDirectionalSnapIndexDelta(unsplashWheelGestureProgress);
          const startIndex = unsplashWheelStartIndex ?? unsplashActiveIndex;
          unsplashWheelGestureProgress = 0;
          unsplashWheelStartIndex = null;
          unsplashWheelGestureTimer = 0;
          beginUnsplashSettle(startIndex + indexDelta);
        }, 180);
        requestUnsplashMotionFrame();
      }, { passive: false });
      unsplashCarousel.addEventListener("dragstart", (event) => {
        event.preventDefault();
      });
      // Pointer capture can retarget a simple click to the carousel wrapper.
      unsplashCarousel.addEventListener("click", (event) => {
        if (event.target.closest?.(".unsplash-card")) return;

        const card = document.elementFromPoint(event.clientX, event.clientY)?.closest?.(".unsplash-card");
        if (card && unsplashCarousel.contains(card)) activateUnsplashCard(card);
      });
      unsplashCarousel.addEventListener("pointerdown", (event) => {
        if (!isUnsplashPanelActive() || unsplashLightboxOpen || unsplashLightboxClosing || event.button > 0) return;
        stopUnsplashMotion();
        stopUnsplashMotionFrame();
        rebaseUnsplashProgress();
        unsplashPointerIsDown = true;
        unsplashPointerMoved = false;
        unsplashPointerStartX = event.clientX;
        unsplashPointerStartY = event.clientY;
        unsplashPointerCurrentX = event.clientX;
        unsplashPointerLastX = event.clientX;
        unsplashPointerLastTime = event.timeStamp;
        unsplashPointerVelocityX = 0;
        unsplashPointerCard = event.target.closest?.(".unsplash-card") || null;
        if (unsplashPointerCard && !unsplashCarousel.contains(unsplashPointerCard)) {
          unsplashPointerCard = null;
        }
        unsplashPointerStartProgress = unsplashCurrentProgress;
        unsplashPointerStartIndex = unsplashActiveIndex;
        unsplashTargetProgress = unsplashCurrentProgress;
        unsplashSettleTargetIndex = null;
        unsplashWheelMomentum = 0;
        window.clearTimeout(unsplashWheelGestureTimer);
        unsplashWheelGestureTimer = 0;
        unsplashWheelGestureProgress = 0;
        unsplashWheelStartIndex = null;
        unsplashInertiaVelocity = 0;
        unsplashIsSettling = false;
        unsplashPointerCardStep = getUnsplashCardStep();
        unsplashCarousel.classList.remove("is-dragging");
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

        const motionConfig = unsplashMotionConfig || readUnsplashMotionConfig();
        const pointerDistance = Math.hypot(deltaX, deltaY);
        const isHorizontalMovement = Math.abs(deltaX) > Math.abs(deltaY);
        if (pointerDistance > motionConfig.clickDragThreshold) {
          unsplashPointerMoved = true;
          if (isHorizontalMovement) {
            unsplashCarousel.classList.add("is-dragging");
            if (!unsplashCarousel.hasPointerCapture?.(event.pointerId)) {
              unsplashCarousel.setPointerCapture?.(event.pointerId);
            }
          }
        }

        const dragProgress = deltaX / unsplashPointerCardStep * motionConfig.dragSensitivity;
        unsplashTargetProgress = clampUnsplashProgress(unsplashPointerStartProgress + dragProgress);
        requestUnsplashMotionFrame();
      });

      const endUnsplashPointer = (event) => {
        if (!unsplashPointerIsDown) return;
        const motionConfig = unsplashMotionConfig || readUnsplashMotionConfig();
        const pointerEndX = event.type === "pointercancel" ? unsplashPointerCurrentX : event.clientX;
        const deltaX = pointerEndX - unsplashPointerStartX;
        const deltaY = event.clientY - unsplashPointerStartY;
        const dragDistance = deltaX / unsplashPointerCardStep * motionConfig.dragSensitivity;
        const velocityAge = event.timeStamp - unsplashPointerLastTime;
        const releaseVelocityX = velocityAge <= 90 ? unsplashPointerVelocityX : 0;
        const velocityDistance = Math.max(
          -0.35,
          Math.min(
            0.35,
            releaseVelocityX * motionConfig.pointerVelocityInfluence * motionConfig.inertiaStrength
          )
        );
        const projectedDistance = dragDistance + velocityDistance;
        const isHorizontalDrag = Math.abs(deltaX) > motionConfig.clickDragThreshold
          && Math.abs(deltaX) > Math.abs(deltaY);
        const snapIndexDelta = isHorizontalDrag
          ? getUnsplashDirectionalSnapIndexDelta(projectedDistance)
          : 0;
        const shouldAdvance = snapIndexDelta !== 0;
        const wasClick = !unsplashPointerMoved && event.type !== "pointercancel";
        const pointerCard = unsplashPointerCard;

        unsplashPointerIsDown = false;
        unsplashCarousel.classList.remove("is-dragging");
        if (unsplashCarousel.hasPointerCapture?.(event.pointerId)) {
          unsplashCarousel.releasePointerCapture?.(event.pointerId);
        }
        unsplashPointerCard = null;

        if (wasClick) {
          unsplashWheelMomentum = 0;
          unsplashInertiaVelocity = 0;
          unsplashIsSettling = false;

          if (pointerCard) {
            unsplashIgnoredCardClick = pointerCard;
            window.clearTimeout(unsplashIgnoredCardClickTimer);
            unsplashIgnoredCardClickTimer = window.setTimeout(() => {
              unsplashIgnoredCardClick = null;
              unsplashIgnoredCardClickTimer = 0;
            }, 0);
            activateUnsplashCard(pointerCard);
          } else {
            beginUnsplashSettle();
          }

          window.setTimeout(() => {
            unsplashPointerMoved = false;
          }, 0);
          return;
        }

        const nextDirection = shouldAdvance ? snapIndexDelta : 0;
        unsplashWheelMomentum = 0;
        unsplashInertiaVelocity = 0;
        beginUnsplashSettle(unsplashPointerStartIndex + nextDirection);

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
    const elsewhereSnapScroller = elsewhere || elsewhereSnapRoot;
    let elsewhereDissolveFrame = 0;

    // Calmato 02 core-value icons reveal once when the page becomes dominant.
    const calmatoValueIcons = [...document.querySelectorAll(".calmato-value-icon")];
    let calmatoValueIconsRevealed = false;
    const revealCalmatoValueIcon = (icon) => {
      icon.classList.add("is-revealed");

      // Start SVG path motion at the same moment as the existing icon reveal.
      icon.querySelectorAll("[data-calmato-value-motion], [data-calmato-value-motion-opacity]").forEach((motion) => {
        if (typeof motion.beginElement === "function") motion.beginElement();
      });
    };

    calmatoValueIcons.forEach((icon, index) => {
      icon.style.setProperty("--calmato-value-reveal-delay", `${index * 90}ms`);
    });

    const revealCalmatoValueIconsOnce = () => {
      if (calmatoValueIconsRevealed) return;
      calmatoValueIconsRevealed = true;
      calmatoValueIcons.forEach(revealCalmatoValueIcon);
    };

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

    const clampCalmatoDissolve = (value, min, max) => Math.min(Math.max(value, min), max);
    let calmatoDissolveDistance = 0;
    let calmatoDissolveRootTop = 0;
    let calmatoDissolveProgressPower = 1;
    let calmatoDissolveLeavingScale = 0;
    let calmatoDissolveLeavingTranslateY = 0;
    let calmatoDissolveEnteringTranslateY = 0;
    let calmatoIndicatorSwitchThreshold = 0.55;
    let calmatoDominantIndex = -1;
    let calmatoScrollHintTimer = 0;

    const readCalmatoDissolveNumber = (propertyName, fallback) => {
      if (!elsewhereSnapRoot) return fallback;
      const value = Number.parseFloat(getComputedStyle(elsewhereSnapRoot).getPropertyValue(propertyName));
      return Number.isFinite(value) ? value : fallback;
    };

    const setCalmatoScrollHintVisible = (isVisible) => {
      elsewhereSnapNav?.classList.toggle("is-scroll-hint-visible", isVisible);
    };

    const clearCalmatoScrollHint = () => {
      window.clearTimeout(calmatoScrollHintTimer);
      calmatoScrollHintTimer = 0;
      setCalmatoScrollHintVisible(false);
    };

    const canShowCalmatoScrollHint = () => {
      if (
        !elsewhereSnapNav ||
        !elsewhereSnapScroller ||
        elsewhereActivePanel !== "calmato" ||
        elsewhereSnapNav.classList.contains("is-hidden") ||
        elsewhereSnapScroller.classList.contains("is-footer-free")
      ) {
        return false;
      }

      return true;
    };

    const scheduleCalmatoScrollHint = () => {
      clearCalmatoScrollHint();
      if (!canShowCalmatoScrollHint()) return;

      const delay = Math.max(readCalmatoDissolveNumber("--calmato-scroll-hint-delay", 2000), 0);
      calmatoScrollHintTimer = window.setTimeout(() => {
        calmatoScrollHintTimer = 0;
        if (canShowCalmatoScrollHint()) setCalmatoScrollHintVisible(true);
      }, delay);
    };

    const syncCalmatoDissolveMetrics = () => {
      if (!elsewhereSnapRoot || !elsewhereSnapScroller || elsewhereSnapPanels.length === 0) return;

      const distanceMultiplier = Math.max(
        readCalmatoDissolveNumber("--calmato-dissolve-scroll-distance", 1),
        0.1
      );

      calmatoDissolveDistance = Math.max(elsewhereSnapScroller.clientHeight * distanceMultiplier, 1);
      calmatoDissolveProgressPower = Math.max(
        readCalmatoDissolveNumber("--calmato-dissolve-progress-power", 1),
        0.1
      );
      calmatoDissolveLeavingScale = readCalmatoDissolveNumber("--calmato-dissolve-leaving-scale", 0);
      calmatoDissolveLeavingTranslateX = readCalmatoDissolveNumber(
      "--calmato-dissolve-leaving-translate-x",
      0
      );
      calmatoDissolveEnteringTranslateX = readCalmatoDissolveNumber(
      "--calmato-dissolve-entering-translate-x",
      0
      );
      calmatoIndicatorSwitchThreshold = clampCalmatoDissolve(
        readCalmatoDissolveNumber("--calmato-indicator-switch-threshold", 0.55),
        0.5,
        0.95
      );

      const trackHeight = calmatoDissolveDistance * elsewhereSnapPanels.length;
      elsewhereSnapRoot.style.height = `${trackHeight}px`;
      elsewhereSnapRoot.style.minHeight = `${trackHeight}px`;

      const scrollerRect = elsewhereSnapScroller.getBoundingClientRect();
      const rootRect = elsewhereSnapRoot.getBoundingClientRect();
      calmatoDissolveRootTop = elsewhereSnapScroller.scrollTop + rootRect.top - scrollerRect.top;
    };

    const setCalmatoDominantIndex = (nextIndex) => {
      if (nextIndex === calmatoDominantIndex) return;
      calmatoDominantIndex = nextIndex;

      if (nextIndex < 0) clearCalmatoScrollHint();

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

      elsewhere?.classList.toggle(
        "is-calmato-footer-swipe-ready",
        elsewhereActivePanel === "calmato" && nextIndex === elsewhereSnapPanels.length - 1
      );

      if (nextIndex === 1) revealCalmatoValueIconsOnce();
    };

    const getCalmatoDominantIndex = (fromIndex, toIndex, progress) => {
      if (fromIndex === toIndex) return fromIndex;
      if (calmatoDominantIndex === toIndex) {
        return progress <= 1 - calmatoIndicatorSwitchThreshold ? fromIndex : toIndex;
      }
      if (calmatoDominantIndex === fromIndex) {
        return progress >= calmatoIndicatorSwitchThreshold ? toIndex : fromIndex;
      }
      return progress >= 0.5 ? toIndex : fromIndex;
    };

    const updateCalmatoDissolve = () => {
      if (
        elsewhereActivePanel !== "calmato" ||
        !elsewhereSnapScroller ||
        elsewhereSnapPanels.length === 0 ||
        calmatoDissolveDistance <= 0
      ) {
        return;
      }

      const rawProgress = (elsewhereSnapScroller.scrollTop - calmatoDissolveRootTop) / calmatoDissolveDistance;
      const panelCount = elsewhereSnapPanels.length;

      if (rawProgress < 0 || rawProgress >= panelCount) {
        setCalmatoDominantIndex(-1);
        return;
      }

      const sceneProgress = clampCalmatoDissolve(rawProgress, 0, panelCount - 1);
      const fromIndex = Math.floor(sceneProgress);
      const toIndex = Math.min(fromIndex + 1, panelCount - 1);
      const dissolveProgress = Math.pow(sceneProgress - fromIndex, calmatoDissolveProgressPower);

      elsewhereSnapPanels.forEach((panel, index) => {
        let opacity = 0;
        let translateX = 0;
        let scale = 1;
        let zIndex = 0;

        if (index === fromIndex) {
          opacity = 1;
          scale += dissolveProgress * calmatoDissolveLeavingScale;
          translateX = dissolveProgress * calmatoDissolveLeavingTranslateX;
          zIndex = 1;
        }

        if (index === toIndex && toIndex !== fromIndex) {
          opacity = dissolveProgress;
          translateX = (1 - dissolveProgress) * calmatoDissolveEnteringTranslateX;
          zIndex = 2;
        }

        panel.style.setProperty("--calmato-dissolve-opacity", String(opacity));
        panel.style.setProperty("--calmato-dissolve-translate-x", `${translateX}px`);
        panel.style.setProperty("--calmato-dissolve-scale", String(scale));
        panel.style.zIndex = String(zIndex);
      });

      setCalmatoDominantIndex(getCalmatoDominantIndex(fromIndex, toIndex, dissolveProgress));
    };

    const requestCalmatoDissolve = () => {
      if (elsewhereDissolveFrame) return;

      elsewhereDissolveFrame = window.requestAnimationFrame(() => {
        elsewhereDissolveFrame = 0;
        updateCalmatoDissolve();
      });
    };

    const scrollToCalmatoPage = (targetIndex) => {
      if (!elsewhereSnapScroller || elsewhereSnapPanels.length === 0) return;
      const nextIndex = clampCalmatoDissolve(targetIndex, 0, elsewhereSnapPanels.length - 1);
      elsewhereSnapScroller.classList.remove("is-footer-free");
      syncCalmatoDissolveMetrics();
      scheduleCalmatoScrollHint();
      elsewhereSnapScroller.scrollTo({
        top: calmatoDissolveRootTop + calmatoDissolveDistance * nextIndex,
        behavior: prefersReducedMotion ? "auto" : "smooth",
      });
    };

    const scrollToCalmatoFooter = () => {
      const footer = document.querySelector("[data-elsewhere-footer]");
      if (!footer || !elsewhereSnapScroller) return;
      clearCalmatoScrollHint();
      const scrollerRect = elsewhereSnapScroller.getBoundingClientRect();
      const footerRect = footer.getBoundingClientRect();
      const targetTop = Math.min(
        elsewhereSnapScroller.scrollHeight - elsewhereSnapScroller.clientHeight,
        elsewhereSnapScroller.scrollTop + footerRect.top - scrollerRect.top
      );

      // The footer sits after the four snap pages, so release their mandatory snap
      // before continuing the last mobile swipe into the normal document flow.
      elsewhereSnapScroller.classList.add("is-footer-free");
      window.requestAnimationFrame(() => {
        elsewhereSnapScroller.scrollTo({
          top: targetTop,
          behavior: prefersReducedMotion ? "auto" : "smooth",
        });
      });
    };

    if (elsewhereSnapRoot && elsewhereSnapScroller && elsewhereSnapPanels.length && elsewhereSnapDots.length) {
      elsewhereSnapDots.forEach((dot) => {
        dot.addEventListener("click", () => {
          const targetIndex = Number(dot.dataset.elsewhereSnapDot || 0);
          if (!Number.isInteger(targetIndex) || targetIndex < 0 || targetIndex >= elsewhereSnapPanels.length) return;

          scrollToCalmatoPage(targetIndex);
        });
      });

      let calmatoMobileSwipe = null;
      const calmatoMobileQuery = window.matchMedia("(max-width: 833px)");
      const getCalmatoMobileSwipeIndex = () => {
        if (calmatoDominantIndex >= 0) return calmatoDominantIndex;
        const rawIndex = (elsewhereSnapScroller.scrollTop - calmatoDissolveRootTop) / calmatoDissolveDistance;
        return clampCalmatoDissolve(Math.round(rawIndex), 0, elsewhereSnapPanels.length - 1);
      };
      const isCalmatoSwipeTarget = (target) =>
        !target.closest("a, button, input, textarea, select, iframe, [data-youtube-frame]");

      elsewhereSnapScroller.addEventListener(
        "touchstart",
        (event) => {
          if (
            !calmatoMobileQuery.matches ||
            elsewhereActivePanel !== "calmato" ||
            !isCalmatoSwipeTarget(event.target)
          ) {
            calmatoMobileSwipe = null;
            return;
          }

          const touch = event.touches[0];
          if (!touch) return;
          calmatoMobileSwipe = {
            startX: touch.clientX,
            startY: touch.clientY,
            startIndex: getCalmatoMobileSwipeIndex(),
            axis: null,
          };
        },
        { passive: true }
      );

      elsewhereSnapScroller.addEventListener(
        "touchmove",
        (event) => {
          if (!calmatoMobileSwipe) return;
          const touch = event.touches[0];
          if (!touch) return;

          const deltaX = touch.clientX - calmatoMobileSwipe.startX;
          const deltaY = touch.clientY - calmatoMobileSwipe.startY;
          if (!calmatoMobileSwipe.axis && Math.max(Math.abs(deltaX), Math.abs(deltaY)) > 12) {
            calmatoMobileSwipe.axis = Math.abs(deltaX) > Math.abs(deltaY) ? "horizontal" : "vertical";
          }

          if (calmatoMobileSwipe.axis === "horizontal") {
            event.preventDefault();
            return;
          }

          const isLastPage = calmatoMobileSwipe.startIndex === elsewhereSnapPanels.length - 1;
          if (!isLastPage || deltaY > 0) event.preventDefault();
        },
        { passive: false }
      );

      elsewhereSnapScroller.addEventListener(
        "touchend",
        (event) => {
          if (!calmatoMobileSwipe) return;
          const touch = event.changedTouches[0];
          const swipe = calmatoMobileSwipe;
          calmatoMobileSwipe = null;
          if (!touch) return;

          if (
            swipe.axis === "vertical" &&
            swipe.startIndex === elsewhereSnapPanels.length - 1 &&
            touch.clientY - swipe.startY < -56
          ) {
            scrollToCalmatoFooter();
            return;
          }

          if (swipe.axis !== "horizontal") return;

          const deltaX = touch.clientX - swipe.startX;
          if (Math.abs(deltaX) < 56) return;
          scrollToCalmatoPage(swipe.startIndex + (deltaX < 0 ? 1 : -1));
        },
        { passive: true }
      );

      elsewhereSnapScroller.addEventListener(
        "touchcancel",
        () => {
          calmatoMobileSwipe = null;
        },
        { passive: true }
      );

      elsewhereSnapScroller.addEventListener(
        "scroll",
        () => {
          requestCalmatoDissolve();
          scheduleCalmatoScrollHint();
        },
        { passive: true }
      );

      ["wheel", "pointerdown", "touchstart"].forEach((eventName) => {
        elsewhereSnapScroller.addEventListener(eventName, scheduleCalmatoScrollHint, { passive: true });
      });

      window.addEventListener(
        "resize",
        () => {
          syncCalmatoDissolveMetrics();
          requestCalmatoDissolve();
          scheduleCalmatoScrollHint();
        },
        { passive: true }
      );

      syncCalmatoDissolveMetrics();
      updateCalmatoDissolve();
      scheduleCalmatoScrollHint();
    }

    const closeMenu = () => {
      if (!menuButton || !mobileMenu) return;
      menuButton.setAttribute("aria-expanded", "false");
      mobileMenu.setAttribute("aria-hidden", "true");
      mobileMenu.classList.remove("is-open");
    };

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
