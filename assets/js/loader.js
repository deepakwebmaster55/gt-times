(() => {
  const ensureLoader = () => {
    let loader = document.querySelector(".gt-loader");
    if (!loader) {
      loader = document.createElement("div");
      loader.className = "gt-loader";
      loader.setAttribute("aria-hidden", "true");
      loader.innerHTML = `
        <div class="loader-brand" aria-label="Loading">
          <div class="loader-logo-wrap">
            <img class="loader-logo" src="assets/images/logo.svg" alt="Glamtreasure logo" />
          </div>
          <p class="loader-text">Loading Glamtreasure</p>
        </div>
      `;
      document.documentElement.appendChild(loader);
    }
    return loader;
  };

  const setLoading = (isLoading) => {
    if (isLoading) {
      document.documentElement.classList.remove("gt-site-ready");
    } else {
      document.documentElement.classList.add("gt-site-ready");
    }
    const loader = ensureLoader();
    loader.classList.toggle("hidden", !isLoading);
    loader.setAttribute("aria-hidden", String(!isLoading));
  };

  const ensureCartModal = () => {
    let modal = document.querySelector("[data-cart-modal]");
    if (modal) return modal;

    modal = document.createElement("div");
    modal.className = "gt-cart-modal hidden";
    modal.setAttribute("data-cart-modal", "");
    modal.setAttribute("aria-hidden", "true");
    modal.innerHTML = `
      <div class="gt-cart-modal__backdrop" data-cart-modal-close></div>
      <div class="gt-cart-modal__dialog" role="dialog" aria-modal="true" aria-labelledby="gt-cart-modal-title">
        <button class="gt-cart-modal__close" type="button" aria-label="Close popup" data-cart-modal-close>&times;</button>
        <p class="gt-cart-modal__eyebrow">Cart Updated</p>
        <h3 id="gt-cart-modal-title" class="gt-cart-modal__title">Added to cart</h3>
        <p class="gt-cart-modal__text" data-cart-modal-message>Your item has been added to cart.</p>
        <div class="gt-cart-modal__actions" data-cart-modal-actions hidden>
          <a class="btn btn-primary" href="#" data-cart-modal-primary></a>
        </div>
      </div>
    `;

    modal.addEventListener("click", (event) => {
      if (event.target instanceof HTMLElement && event.target.hasAttribute("data-cart-modal-close")) {
        hideCartModal();
      }
    });

    document.addEventListener("keydown", (event) => {
      if (event.key === "Escape") {
        hideCartModal();
      }
    });

    document.body.appendChild(modal);
    return modal;
  };

  const showNoticeModal = ({ eyebrow, title, message, primaryAction } = {}) => {
    const modal = ensureCartModal();
    const eyebrowEl = modal.querySelector(".gt-cart-modal__eyebrow");
    const titleEl = modal.querySelector(".gt-cart-modal__title");
    const messageEl = modal.querySelector("[data-cart-modal-message]");
    const actionsEl = modal.querySelector("[data-cart-modal-actions]");
    const primaryEl = modal.querySelector("[data-cart-modal-primary]");
    if (eyebrowEl) {
      eyebrowEl.textContent = eyebrow || "Notice";
    }
    if (titleEl) {
      titleEl.textContent = title || "Update";
    }
    if (messageEl) {
      messageEl.textContent = message || "We have an update for you.";
    }
    if (actionsEl && primaryEl) {
      const hasPrimary = !!(primaryAction && primaryAction.href && primaryAction.label);
      actionsEl.hidden = !hasPrimary;
      if (hasPrimary) {
        primaryEl.textContent = primaryAction.label;
        primaryEl.setAttribute("href", primaryAction.href);
      } else {
        primaryEl.textContent = "";
        primaryEl.setAttribute("href", "#");
      }
    }
    modal.classList.remove("hidden");
    modal.setAttribute("aria-hidden", "false");
    document.body.classList.add("gt-cart-modal-open");
  };

  const showCartModal = (message) => {
    showNoticeModal({
      eyebrow: "Cart Updated",
      title: "Added to cart",
      message: message || "Your item has been added to cart."
    });
  };

  const hideCartModal = () => {
    const modal = document.querySelector("[data-cart-modal]");
    if (!modal) return;
    modal.classList.add("hidden");
    modal.setAttribute("aria-hidden", "true");
    document.body.classList.remove("gt-cart-modal-open");
  };

  window.GTUI = {
    setLoading,
    showNoticeModal,
    showCartModal,
    hideCartModal
  };

  setLoading(true);

  setTimeout(() => {
    document.documentElement.classList.add("gt-site-ready");
  }, 4000);

  window.addEventListener("load", () => setLoading(false));
})();
