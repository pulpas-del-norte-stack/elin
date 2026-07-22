const header = document.querySelector(".site-header");
const toggle = document.querySelector(".nav-toggle");
const nav = document.querySelector(".site-nav");
const year = document.getElementById("year");

if (year) year.textContent = new Date().getFullYear();

window.addEventListener("scroll", () => {
  header?.classList.toggle("is-scrolled", window.scrollY > 12);
});

toggle?.addEventListener("click", () => {
  const open = nav?.classList.toggle("is-open");
  toggle.setAttribute("aria-expanded", open ? "true" : "false");
  toggle.setAttribute("aria-label", open ? "Cerrar menú" : "Abrir menú");
});

nav?.querySelectorAll("a").forEach((link) => {
  link.addEventListener("click", () => {
    nav.classList.remove("is-open");
    toggle?.setAttribute("aria-expanded", "false");
    toggle?.setAttribute("aria-label", "Abrir menú");
  });
});

const explorer = document.querySelector("[data-service-explorer]");
const capsules = explorer?.querySelector("[data-service-capsules]");
const detail = explorer?.querySelector("[data-service-detail]");
const detailPanel = detail?.querySelector(".service-detail-panel");
const stickyBack = detail?.querySelector(".service-back-sticky");
const panels = explorer?.querySelectorAll("[data-panel]");
const desktopQuery = window.matchMedia("(min-width: 761px)");
let lastTrigger = null;
let closingTimer = null;
let animationTimer = null;

const isDesktop = () => desktopQuery.matches;

const setStickyBackFaded = (faded) => {
  stickyBack?.classList.toggle("is-faded", Boolean(faded));
};

const updateStickyBackVisibility = () => {
  if (!detailPanel || !stickyBack || isDesktop() || !detail?.classList.contains("is-open")) {
    setStickyBackFaded(false);
    return;
  }

  const bottomBack = detail.querySelector(".service-panel.is-active .service-back");
  if (!bottomBack) {
    setStickyBackFaded(false);
    return;
  }

  const panelRect = detailPanel.getBoundingClientRect();
  const backRect = bottomBack.getBoundingClientRect();
  const bottomButtonVisible =
    backRect.top < panelRect.bottom - 12 && backRect.bottom > panelRect.top + 12;

  setStickyBackFaded(bottomButtonVisible);
};

const resetDetailScroll = () => {
  if (detailPanel) detailPanel.scrollTop = 0;
  setStickyBackFaded(false);
};

const setActiveCapsule = (id) => {
  capsules?.querySelectorAll("[data-service]").forEach((button) => {
    button.classList.toggle("is-active", button.dataset.service === id);
    button.setAttribute("aria-expanded", button.dataset.service === id ? "true" : "false");
  });
};

const clearActiveCapsules = () => {
  capsules?.querySelectorAll("[data-service]").forEach((button) => {
    button.classList.remove("is-active");
    button.setAttribute("aria-expanded", "false");
  });
};

const activatePanel = (id) => {
  panels?.forEach((panel) => {
    const active = panel.dataset.panel === id;
    panel.hidden = !active;
    panel.classList.toggle("is-active", active);
    if (active) {
      const heading = panel.querySelector("h3");
      if (heading?.id) detailPanel?.setAttribute("aria-labelledby", heading.id);
      // Restart enter animation when switching categories.
      panel.style.animation = "none";
      void panel.offsetWidth;
      panel.style.animation = "";
    }
  });
};

const playMaximize = () => {
  if (!detail) return;
  detail.classList.add("is-animating");
  window.clearTimeout(animationTimer);
  animationTimer = window.setTimeout(() => {
    detail.classList.remove("is-animating");
  }, 420);
};

const DEFAULT_SERVICE = "instalaciones";

const syncDesktopDetailVisibility = () => {
  if (!detail) return;
  if (isDesktop()) {
    detail.hidden = false;
    document.body.classList.remove("service-detail-open");
    if (!detail.classList.contains("is-open")) {
      const firstCapsule = capsules?.querySelector(`[data-service="${DEFAULT_SERVICE}"]`);
      openServiceDetail(DEFAULT_SERVICE, firstCapsule, { focusHeading: false, animate: false });
    }
  } else if (!detail.classList.contains("is-open")) {
    detail.hidden = true;
  }
};

const closeServiceDetail = () => {
  if (!detail || !detail.classList.contains("is-open")) return;

  window.clearTimeout(closingTimer);

  if (isDesktop()) {
    // En escritorio siempre queda una categoría visible (la primera).
    const firstCapsule = capsules?.querySelector(`[data-service="${DEFAULT_SERVICE}"]`);
    openServiceDetail(DEFAULT_SERVICE, firstCapsule, { focusHeading: false });
    return;
  }

  detail.classList.remove("is-open", "is-animating");
  clearActiveCapsules();
  document.body.classList.remove("service-detail-open");

  closingTimer = window.setTimeout(() => {
    detail.hidden = true;
    resetDetailScroll();
    setStickyBackFaded(false);
    panels?.forEach((panel) => {
      panel.hidden = true;
      panel.classList.remove("is-active");
    });
    lastTrigger?.focus({ preventScroll: true });
    lastTrigger = null;
  }, 320);
};

const openServiceDetail = (id, trigger, options = {}) => {
  if (!detail || !panels) return;

  const { focusHeading = true, animate = true } = options;

  window.clearTimeout(closingTimer);
  lastTrigger = trigger || null;
  setActiveCapsule(id);
  activatePanel(id);
  resetDetailScroll();

  const alreadyOpen = detail.classList.contains("is-open");
  detail.hidden = false;

  if (isDesktop()) {
    void detail.offsetWidth;
    detail.classList.add("is-open");
    if (animate) playMaximize();
    resetDetailScroll();
    if (focusHeading) {
      const activePanel = detail.querySelector(".service-panel.is-active");
      const heading = activePanel?.querySelector("h3");
      heading?.setAttribute("tabindex", "-1");
      heading?.focus({ preventScroll: true });
    }
    requestAnimationFrame(resetDetailScroll);
    return;
  }

  if (!alreadyOpen) {
    void detail.offsetWidth;
    requestAnimationFrame(() => {
      detail.classList.add("is-open");
      document.body.classList.add("service-detail-open");
      resetDetailScroll();
      if (focusHeading) {
        const activePanel = detail.querySelector(".service-panel.is-active");
        const heading = activePanel?.querySelector("h3");
        heading?.setAttribute("tabindex", "-1");
        heading?.focus({ preventScroll: true });
      }
      requestAnimationFrame(resetDetailScroll);
    });
    return;
  }

  if (animate) playMaximize();
  resetDetailScroll();
};

detailPanel?.addEventListener("scroll", updateStickyBackVisibility, { passive: true });

capsules?.querySelectorAll("[data-service]").forEach((button) => {
  button.setAttribute("aria-expanded", "false");
  button.addEventListener("click", () => {
    openServiceDetail(button.dataset.service, button);
  });
});

detail?.querySelectorAll("[data-service-back], [data-service-close]").forEach((el) => {
  el.addEventListener("click", closeServiceDetail);
});

document.addEventListener("keydown", (event) => {
  if (event.key === "Escape" && detail?.classList.contains("is-open")) {
    closeServiceDetail();
  }
});

desktopQuery.addEventListener("change", () => {
  closeServiceDetail();
  syncDesktopDetailVisibility();
  setStickyBackFaded(false);
});

syncDesktopDetailVisibility();

document.querySelector(".contact-form")?.addEventListener("submit", (event) => {
  event.preventDefault();
  alert("Formulario listo para conectar. Por ahora usa WhatsApp o el correo de contacto.");
});
