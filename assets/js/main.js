const onReady = (fn) => {
  const wait = window.GT_DATA_READY && typeof window.GT_DATA_READY.then === "function"
    ? Promise.race([
        window.GT_DATA_READY.catch(() => {}),
        new Promise((resolve) => setTimeout(resolve, 1200))
      ])
    : Promise.resolve();

  wait.finally(() => {
    if (document.readyState === "loading") {
      document.addEventListener("DOMContentLoaded", fn);
    } else {
      fn();
    }
  });
};
document.documentElement.classList.add("js-ready");
onReady(() => {
  document.documentElement.classList.add("js");
  if (document.body && document.body.hasAttribute("data-page-bg")) {
    requestAnimationFrame(() => {
      document.body.classList.add("page-bg-ready");
    });
  }
  const ensureSkeletonFallbacks = () => {
    const heroTrack = document.querySelector("[data-slider-track]");
    if (heroTrack && !heroTrack.querySelector(".hero-slide")) {
      heroTrack.innerHTML = `
        <article class="hero-slide is-active">
          <div class="hero-copy">
            <div class="skeleton-line" style="width:120px; margin-bottom:0.8rem;"></div>
            <div class="skeleton-line" style="width:60%; height:22px; margin-bottom:0.6rem;"></div>
            <div class="skeleton-line" style="width:80%;"></div>
          </div>
          <div class="hero-media">
            <div class="skeleton-block" style="height:300px;"></div>
          </div>
        </article>
      `;
    }

    const skeletonCard = `
      <article class="product-card carousel-card">
        <div class="product-thumb"><div class="skeleton-block" style="height:190px;"></div></div>
        <div class="product-content">
          <div class="skeleton-line" style="width:70%; margin-bottom:0.6rem;"></div>
          <div class="skeleton-line" style="width:40%;"></div>
        </div>
      </article>
    `;

    const carousels = Array.from(document.querySelectorAll("[data-carousel-key]"));
    carousels.forEach((carousel) => {
      const track = carousel.querySelector(".carousel-track");
      if (track && !track.children.length) {
        track.innerHTML = Array.from({ length: 4 }).map(() => skeletonCard).join("");
      }
    });

    const productsGrid = document.querySelector("[data-products-grid]");
    if (productsGrid && !productsGrid.children.length) {
      productsGrid.innerHTML = Array.from({ length: 8 }).map(() => `
        <article class="product-card">
          <div class="product-thumb"><div class="skeleton-block" style="height:190px;"></div></div>
          <div class="product-content">
            <div class="skeleton-line" style="width:70%; margin-bottom:0.6rem;"></div>
            <div class="skeleton-line" style="width:40%;"></div>
          </div>
        </article>
      `).join("");
    }

    const categoriesGrid = document.querySelector("[data-categories-grid]");
    if (categoriesGrid && !categoriesGrid.children.length) {
      categoriesGrid.innerHTML = Array.from({ length: 6 }).map(() => `
        <article class="category-tile">
          <div class="skeleton-block" style="height:170px; margin-bottom:0.8rem;"></div>
          <div class="skeleton-line" style="width:60%;"></div>
        </article>
      `).join("");
    }

    const blogGrid = document.querySelector("[data-blog-grid]");
    if (blogGrid && !blogGrid.children.length) {
      blogGrid.innerHTML = Array.from({ length: 3 }).map(() => `
        <article class="blog-card">
          <div class="skeleton-block" style="height:200px; margin-bottom:0.8rem;"></div>
          <div class="skeleton-line" style="width:70%; margin-bottom:0.4rem;"></div>
          <div class="skeleton-line" style="width:50%;"></div>
        </article>
      `).join("");
    }

    const reviewList = document.querySelector("[data-reviews-list]");
    if (reviewList && !reviewList.children.length) {
      reviewList.innerHTML = Array.from({ length: 3 }).map(() => `
        <div class="review-item">
          <div class="skeleton-line" style="width:60%; margin-bottom:0.4rem;"></div>
          <div class="skeleton-line" style="width:80%;"></div>
        </div>
      `).join("");
    }

    const filterWrap = document.querySelector("[data-filter-buttons]");
    if (filterWrap && !filterWrap.children.length) {
      filterWrap.innerHTML = Array.from({ length: 6 }).map(() => `<span class="filter-skeleton"></span>`).join("");
    }

    const addEmptyNote = (target, label) => {
      if (!target) return;
      if (target.dataset.hasContent === "true") return;
      if (target.children.length > 0) return;
      const parent = target.parentElement || target;
      if (!parent) return;
      const key = String(label || "items");
      let note = parent.querySelector('.empty-note[data-empty="' + key + '"]');
      if (!note) {
        note = document.createElement("p");
        note.className = "empty-note";
        note.dataset.empty = key;
        parent.appendChild(note);
      }
      note.textContent = "No " + key + " yet. We will add soon.";
    };

    const removeEmptyNote = (target, label) => {
      if (!target) return;
      const parent = target.parentElement || target;
      if (!parent) return;
      const key = String(label || "items");
      const note = parent.querySelector('.empty-note[data-empty="' + key + '"]');
      if (note) note.remove();
    };

    removeEmptyNote(heroTrack, "slides");
    carousels.forEach((carousel) => {
      const track = carousel.querySelector(".carousel-track");
      removeEmptyNote(track, "products");
    });
    removeEmptyNote(productsGrid, "products");
    removeEmptyNote(categoriesGrid, "categories");
    removeEmptyNote(filterWrap, "categories");
    removeEmptyNote(blogGrid, "blogs");
    removeEmptyNote(reviewList, "reviews");

    if (heroTrack && !heroTrack.children.length) addEmptyNote(heroTrack, "slides");
    carousels.forEach((carousel) => {
      const track = carousel.querySelector(".carousel-track");
      if (track && !track.children.length) addEmptyNote(track, "products");
    });
    if (productsGrid && !productsGrid.children.length) addEmptyNote(productsGrid, "products");
    if (categoriesGrid && !categoriesGrid.children.length) addEmptyNote(categoriesGrid, "categories");
    if (filterWrap && !filterWrap.children.length) addEmptyNote(filterWrap, "categories");
    if (blogGrid && !blogGrid.children.length) addEmptyNote(blogGrid, "blogs");
    if (reviewList && !reviewList.children.length) addEmptyNote(reviewList, "reviews");
  };

  setTimeout(ensureSkeletonFallbacks, 500);
  const slugify = (text) =>
    (text || "")
      .toLowerCase()
      .replace(/[^a-z0-9\s-]/g, "")
      .trim()
      .replace(/\s+/g, "-");

  const updateMobileNavPosition = () => {
    const header = document.querySelector(".site-header");
    const navEl = document.querySelector(".main-nav");
    if (!header || !navEl || !window.matchMedia("(max-width: 880px)").matches) return;
    const headerRect = header.getBoundingClientRect();
    const topValue = Math.max(12, Math.round(headerRect.bottom + 8));
    document.documentElement.style.setProperty("--mobile-nav-top", `${topValue}px`);
    navEl.style.top = `${topValue}px`;
  };

  const setMobileMenuState = (isOpen) => {
    if (!nav || !menuToggle) return;
    nav.classList.toggle("is-open", isOpen);
    menuToggle.setAttribute("aria-expanded", String(isOpen));
    document.body.classList.toggle("menu-open", isOpen);
  };

    const menuToggle = document.querySelector(".menu-toggle");
  const nav = document.querySelector(".main-nav");

  if (menuToggle && nav) {
    updateMobileNavPosition();
    menuToggle.addEventListener("click", () => {
      if (window.matchMedia("(max-width: 880px)").matches) {
        window.location.href = "mobile-menu.html";
        return;
      }
      updateMobileNavPosition();
      setMobileMenuState(!nav.classList.contains("is-open"));
    });
    nav.addEventListener("click", (event) => {
      if (!nav.classList.contains("is-open")) return;
      const navList = nav.querySelector("ul");
      if (navList && navList.contains(event.target)) return;
      setMobileMenuState(false);
    });
    nav.querySelectorAll("a").forEach((link) => {
      link.addEventListener("click", () => setMobileMenuState(false));
    });
    document.addEventListener("keydown", (event) => {
      if (event.key === "Escape") setMobileMenuState(false);
    });
    window.addEventListener("resize", updateMobileNavPosition);
    window.addEventListener("scroll", updateMobileNavPosition, { passive: true });
  }

  const moveAccountToMenu = () => {
    const navList = document.querySelector(".main-nav ul");
    const headerActions = document.querySelector(".header-actions");
    if (!navList || !headerActions) return;
    const accountLink = Array.from(headerActions.querySelectorAll("a")).find((link) =>
      (link.textContent || "").toLowerCase().includes("account")
    );
    if (!accountLink) return;
    if (!navList.querySelector("[data-account-link]")) {
      const li = document.createElement("li");
      accountLink.setAttribute("data-account-link", "true");
      li.appendChild(accountLink);
      navList.appendChild(li);
    }
  };

  const highlightActiveLinks = () => {
    const rawPath = window.location.pathname || "";
    const fileName = rawPath.split("/").filter(Boolean).pop() || "index.html";
    let current = fileName;

    if (current.startsWith("blog-")) {
      current = "blog.html";
    }

    if (current.startsWith("product-")) {
      current = "shop.html";
    }

    if (current === "luxury.html" || current === "everyday.html") {
      current = "categories.html";
    }

    const links = document.querySelectorAll("a[href]");
    links.forEach((link) => {
      const href = link.getAttribute("href") || "";
      if (!href || href.startsWith("http") || href.startsWith("mailto:") || href.startsWith("tel:")) return;
      const cleanHref = href.split("#")[0].split("?")[0];
      if (cleanHref === current) {
        link.classList.add("is-active");
        link.setAttribute("aria-current", "page");
      }
    });
  };

  const ensureFooterSocials = () => {
    const socials = [
      { label: "Instagram", href: "https://www.instagram.com/gt__times/?utm_source=ig_web_button_share_sheet" },
      { label: "Facebook", href: "https://www.facebook.com/share/17vZcymJNP/" },
      { label: "YouTube", href: "https://youtube.com/@gt-times?si=baXaA0kPcRecYYPB" }
    ];

    const footers = document.querySelectorAll("footer.site-footer");
    footers.forEach((footer) => {
      const existing = footer.querySelector(".social-links");
      const socialWrap = existing || document.createElement("div");
      socialWrap.className = "social-links footer-socials";
      socialWrap.style.marginTop = "0";
      socials.forEach((item) => {
        if (!Array.from(socialWrap.querySelectorAll("a")).some((link) => link.textContent === item.label)) {
          const a = document.createElement("a");
          a.href = item.href;
          a.target = "_blank";
          a.rel = "noopener";
          a.textContent = item.label;
          socialWrap.appendChild(a);
        }
      });
      const footerBottom = footer.querySelector(".footer-bottom");
      if (footerBottom) {
        footerBottom.appendChild(socialWrap);
      } else if (!existing) {
        footer.appendChild(socialWrap);
      }
    });
  };

  const setupTopTicker = () => {
    const topStrip = document.querySelector(".top-strip");
    if (!topStrip) return;
    const container = topStrip.querySelector(".container") || topStrip;
    container.innerHTML = "";
    const link = document.createElement("a");
    link.className = "top-ticker";
    link.href = "shop.html";
    link.setAttribute("aria-label", "Store updates");
    link.innerHTML = `
      <span class="ticker-track">
        <span class="ticker-item">COD available with non-refundable token amount</span>
        <span class="ticker-item">Free shipping above Rs. 5000</span>
        <span class="ticker-item">Call: +91 74950 98330</span>
        <span class="ticker-item">glamtreasure03@gmail.com</span>
        <span class="ticker-item">Limited edition drops weekly</span>
        <span class="ticker-item">Gift-ready packaging available</span>
        <span class="ticker-item">Trusted COD support</span>
        <span class="ticker-item">Premium everyday essentials</span>
      </span>
      <span class="ticker-track" aria-hidden="true">
        <span class="ticker-item">COD available with non-refundable token amount</span>
        <span class="ticker-item">Free shipping above Rs. 5000</span>
        <span class="ticker-item">Call: +91 74950 98330</span>
        <span class="ticker-item">glamtreasure03@gmail.com</span>
        <span class="ticker-item">Limited edition drops weekly</span>
        <span class="ticker-item">Gift-ready packaging available</span>
        <span class="ticker-item">Trusted COD support</span>
        <span class="ticker-item">Premium everyday essentials</span>
      </span>
    `;
    container.appendChild(link);
  };

  const setupMobileHeaderStack = () => {
    if (!window.matchMedia("(max-width: 620px)").matches) return;
    const header = document.querySelector(".site-header");
    const topStrip = document.querySelector(".top-strip");
    const announce = document.querySelector(".announcement-bar");
    const headerActions = document.querySelector(".header-actions");
    const navShell = document.querySelector(".nav-shell");
    const menuToggle = document.querySelector(".menu-toggle");
    if (!header || !topStrip || !announce) return;
    if (!header.querySelector(".top-strip")) {
      header.appendChild(topStrip);
    }
    if (!header.querySelector(".announcement-bar")) {
      header.appendChild(announce);
    }
    if (headerActions && navShell && menuToggle) {
      const cartLink = Array.from(headerActions.querySelectorAll("a")).find((link) =>
        (link.textContent || "").toLowerCase().includes("cart")
      );
      if (cartLink && !navShell.querySelector(".mobile-cart")) {
        cartLink.classList.add("mobile-cart");
        navShell.insertBefore(cartLink, menuToggle.nextSibling);
      }
    }
    if (headerActions && !headerActions.classList.contains("stacked")) {
      headerActions.classList.add("stacked");
      header.appendChild(headerActions);
    }
    updateMobileNavPosition();
  };

  const setupWhatsAppBubble = () => {
    const path = (window.location.pathname || "").toLowerCase();
    const excluded =
      path.includes("blog") ||
      path.includes("policies") ||
      path.includes("faq");
    const wa = document.querySelector(".wa-float");
    if (!wa) return;
    if (excluded) {
      wa.remove();
      return;
    }
    wa.classList.add("wa-icon");
    wa.setAttribute("aria-label", "WhatsApp");
    wa.setAttribute("title", "WhatsApp");
    wa.textContent = "";
  };

  const showContactToast = () => {
    const path = (window.location.pathname || "").toLowerCase();
    const excluded =
      path.includes("blog") ||
      path.includes("policies") ||
      path.includes("faq");
    if (excluded) return;
    const toast = document.createElement("div");
    toast.className = "contact-toast";
    toast.textContent = "Contact us!";
    document.body.appendChild(toast);
    setTimeout(() => toast.classList.add("show"), 150);
    setTimeout(() => {
      toast.classList.remove("show");
      setTimeout(() => toast.remove(), 300);
    }, 2600);
  };

  const showSiteNotice = (title, message, eyebrow = "Order Update") => {
    if (window.GTUI && typeof window.GTUI.showNoticeModal === "function") {
      window.GTUI.showNoticeModal({ eyebrow, title, message });
    }
  };

  const checkCancelledOrderNotice = async () => {
    if (!window.GTStore?.client) return;
    const session = await window.GTStore.getSession();
    if (!session?.user?.id) return;

    const storageKey = `gt_seen_cancelled_orders_${session.user.id}`;
    let seenIds = [];
    try {
      seenIds = JSON.parse(localStorage.getItem(storageKey) || "[]");
      if (!Array.isArray(seenIds)) seenIds = [];
    } catch (error) {
      seenIds = [];
    }

    const { data, error } = await window.GTStore.client
      .from("bookings")
      .select("id, order_number, total_amount, status")
      .eq("user_id", session.user.id)
      .eq("status", "cancelled")
      .order("created_at", { ascending: false })
      .limit(10);

    if (error || !Array.isArray(data) || !data.length) return;
    const unseen = data.find((row) => !seenIds.includes(row.id));
    if (!unseen) return;

    seenIds.push(unseen.id);
    try {
      localStorage.setItem(storageKey, JSON.stringify(seenIds.slice(-20)));
    } catch (error) {
    }

    const orderLabel = unseen.order_number || "your recent order";
    const amount = Number(unseen.total_amount || 0);
    const amountText = amount > 0 ? ` Order value: Rs. ${amount.toLocaleString()}.` : "";
    showSiteNotice(
      "Your order was cancelled",
      `Sorry, ${orderLabel} was cancelled by our team.${amountText} Please contact support if you need help placing it again.`,
      "Sorry For The Trouble"
    );
  };

  moveAccountToMenu();
  setupTopTicker();
  setupMobileHeaderStack();
  setupWhatsAppBubble();
  showContactToast();
  highlightActiveLinks();
  ensureFooterSocials();
  checkCancelledOrderNotice();

  let announcements = [
    "Buy any 2 watches and get Rs. 1000 OFF - Code: TIME1000",
    "Free shipping on orders above Rs. 5000",
    "COD available with non-refundable token amount"
  ];

  if (window.GT_ANNOUNCEMENTS && window.GT_ANNOUNCEMENTS.length) {
    announcements = window.GT_ANNOUNCEMENTS;
  }

  const announceEl = document.querySelector("[data-announcement]");
  if (announceEl) {
    let aIndex = 0;
    announceEl.textContent = announcements[aIndex];
    setInterval(() => {
      aIndex = (aIndex + 1) % announcements.length;
      announceEl.textContent = announcements[aIndex];
    }, 3200);
  }

  const sliders = document.querySelectorAll("[data-slider]");
  sliders.forEach((slider) => {
    const slides = Array.from(slider.querySelectorAll(".hero-slide"));
    const track = slider.querySelector("[data-slider-track]");
    if (slides.length === 0 || !track) return;

    const prevBtn = slider.querySelector("[data-slider-prev]");
    const nextBtn = slider.querySelector("[data-slider-next]");
    const dotsWrap = slider.querySelector("[data-slider-dots]");
    let index = 0;

    const dots = slides.map((_, i) => {
      if (!dotsWrap) return null;
      const dot = document.createElement("button");
      dot.type = "button";
      dot.className = "slider-dot";
      dot.setAttribute("aria-label", `Go to slide ${i + 1}`);
      dot.addEventListener("click", () => goTo(i));
      dotsWrap.appendChild(dot);
      return dot;
    });

    const goTo = (newIndex) => {
      index = (newIndex + slides.length) % slides.length;
      track.style.transform = `translateX(${-index * 100}%)`;
      slides.forEach((slide, i) => {
        slide.classList.toggle("is-active", i === index);
        if (dots[i]) dots[i].classList.toggle("is-active", i === index);
      });
    };

    goTo(0);

    if (prevBtn) prevBtn.addEventListener("click", () => goTo(index - 1));
    if (nextBtn) nextBtn.addEventListener("click", () => goTo(index + 1));

    const autoplay = slider.getAttribute("data-autoplay") === "true";
    const interval = Number(slider.getAttribute("data-interval") || 4000);
    if (autoplay) {
      setInterval(() => goTo(index + 1), interval);
    }
  });

  const carousels = document.querySelectorAll("[data-carousel]");
  carousels.forEach((carousel) => {
    const windowEl = carousel.querySelector("[data-carousel-window]");
    const prev = carousel.querySelector("[data-carousel-prev]");
    const next = carousel.querySelector("[data-carousel-next]");
    if (!windowEl) return;

    const step = () => Math.max(260, Math.floor(windowEl.clientWidth * 0.82));

    if (prev) {
      prev.addEventListener("click", () => {
        windowEl.scrollBy({ left: -step(), behavior: "smooth" });
      });
    }

    if (next) {
      next.addEventListener("click", () => {
        windowEl.scrollBy({ left: step(), behavior: "smooth" });
      });
    }

    const autoplay = carousel.getAttribute("data-carousel-autoplay") === "true";
    const interval = Number(carousel.getAttribute("data-carousel-interval") || 4000);
    if (autoplay) {
      setInterval(() => {
        const maxScroll = windowEl.scrollWidth - windowEl.clientWidth;
        if (maxScroll <= 0) return;
        const nextPos = windowEl.scrollLeft + step();
        if (nextPos >= maxScroll - 8) {
          windowEl.scrollTo({ left: 0, behavior: "smooth" });
        } else {
          windowEl.scrollBy({ left: step(), behavior: "smooth" });
        }
      }, interval);
    }
  });
  const initShopFilters = () => {
  const filterButtons = document.querySelectorAll(".filter-btn");
  const productCards = document.querySelectorAll(".product-card");
  if (!filterButtons.length && !productCards.length) return;

  productCards.forEach((card) => {
    const title = card.querySelector(".product-title");
    const link = card.querySelector("a.btn");
    if (!title || !link) return;
    if (link.getAttribute("href") && link.getAttribute("href").includes("?watch=")) return;
    const slug = slugify(title.textContent);
    if (!slug) return;
    link.href = `product-royal-crown-gold.html?watch=${encodeURIComponent(slug)}`;
  });

  let currentFilter = "all";
  let currentQuery = "";

  const normalizeFilterValue = (value) =>
    (value || "all")
      .toLowerCase()
      .replace(/[^a-z0-9\s-]/g, "")
      .trim()
      .replace(/\s+/g, "-");

  const applyFilter = (target) => {
    const normalized = normalizeFilterValue(target || "all");
    const map = {
      sports: "sport",
      handbags: "handbags",
      wallets: "wallets"
    };
    const finalTarget = map[normalized] || normalized;
    currentFilter = finalTarget;

    filterButtons.forEach((btn) => {
      const btnFilter = (btn.getAttribute("data-filter") || "").toLowerCase();
      btn.classList.toggle("is-active", btnFilter === finalTarget);
    });

    productCards.forEach((card) => {
      const cardTag = (card.getAttribute("data-category") || "").toLowerCase();
      const cardStyle = (card.getAttribute("data-style") || "").toLowerCase();
      const cardTags = (card.getAttribute("data-tags") || "").toLowerCase().split(",").filter(Boolean);
      const text = (card.textContent || "").toLowerCase();
      const matchesCategory =
        !finalTarget ||
        finalTarget === "all" ||
        cardTag === finalTarget ||
        cardStyle === finalTarget ||
        cardTags.includes(finalTarget);
      const matchesQuery = !currentQuery || text.includes(currentQuery);
      card.classList.toggle("hidden", !(matchesCategory && matchesQuery));
    });
  };

  const applySearch = (query) => {
    currentQuery = (query || "").toLowerCase().trim();
    applyFilter(currentFilter);
  };

  filterButtons.forEach((button) => {
    button.addEventListener("click", () => {
      const target = button.getAttribute("data-filter") || "all";
      applyFilter(target);
    });
  });

  const categoryParam = new URLSearchParams(window.location.search).get("category");
  if (categoryParam && filterButtons.length > 0) {
    applyFilter(normalizeFilterValue(categoryParam));
  }
  if (!categoryParam && filterButtons.length > 0) {
    applyFilter("all");
  }

  const pathName = (window.location.pathname || "").toLowerCase();
  const searchParam = new URLSearchParams(window.location.search).get("q");
  const isShopPage = !!document.querySelector(".shop-tools");
  const isSearchPage = pathName.endsWith("/search.html") || pathName.endsWith("search.html");
  if (searchParam && isShopPage && !isSearchPage) {
    applySearch(searchParam);
  }

  const searchForms = document.querySelectorAll("[data-search-form]");
  const searchInputs = document.querySelectorAll("[data-search-input]");
  searchInputs.forEach((input) => {
    if (searchParam) input.value = searchParam;
  });
  if (!isSearchPage) {
    searchForms.forEach((form) => {
      form.addEventListener("submit", (event) => {
        event.preventDefault();
        const input = form.querySelector("[data-search-input]");
        const query = input ? input.value.trim() : "";
        const target = query ? `search.html?q=${encodeURIComponent(query)}` : "search.html";
        window.location.href = target;
      });
    });
  }
};

window.initShopFilters = initShopFilters;
initShopFilters();

onReady(() => {
  if (!document.querySelector("[data-products-grid]")) return;

  let isProcessingShopAction = false;

  const setGlobalLoading = (value) => {
    if (window.GTUI && typeof window.GTUI.setLoading === "function") {
      window.GTUI.setLoading(value);
    }
  };

  const showAddedPopup = (message) => {
    if (window.GTUI && typeof window.GTUI.showCartModal === "function") {
      window.GTUI.showCartModal(message);
    }
  };

  const getCardItem = (card) => {
    if (!card) return null;
    const productId = card.getAttribute("data-product-id") || card.getAttribute("data-product-slug") || "";
    const title = card.getAttribute("data-product-title") || card.querySelector(".product-title")?.textContent?.trim() || "Product";
    const price = Number(card.getAttribute("data-product-price") || 0);
    const image = card.getAttribute("data-product-image") || card.querySelector("img")?.getAttribute("src") || "";
    const stock = Number(card.getAttribute("data-product-stock") || 1);
    const isActive = card.getAttribute("data-product-active") !== "false";
    const link = card.getAttribute("data-product-link") || "product-royal-crown-gold.html";

    return {
      isActive,
      stock,
      link,
      cartItem: {
        product_id: productId || title,
        title,
        price: Number.isFinite(price) ? price : 0,
        image_url: image,
        quantity: 1,
        options: {}
      }
    };
  };

  const storeReturnPath = (path) => {
    try {
      const checkoutUrl = new URL(path, window.location.href).href;
      sessionStorage.setItem("gt_return_to", checkoutUrl);
    } catch (error) {
      sessionStorage.setItem("gt_return_to", path);
    }
  };

  document.addEventListener("click", async (event) => {
    const target = event.target instanceof Element ? event.target : null;
    const actionButton = target ? target.closest("[data-shop-add-to-cart], [data-shop-buy-now]") : null;
    if (!(actionButton instanceof HTMLElement)) return;
    if (!window.GTStore || isProcessingShopAction) return;

    const card = actionButton.closest(".product-card");
    const payload = getCardItem(card);
    if (!payload) return;

    if (!payload.isActive || payload.stock <= 0) {
      event.preventDefault();
      showAddedPopup("This item is currently unavailable.");
      return;
    }

    const isBuyNow = actionButton.hasAttribute("data-shop-buy-now");
    event.preventDefault();
    isProcessingShopAction = true;
    setGlobalLoading(true);

    try {
      await window.GTStore.addToCart(payload.cartItem);

      if (isBuyNow) {
        const session = await window.GTStore.getSession();
        if (!session) {
          storeReturnPath("checkout.html");
          window.location.href = "login.html";
          return;
        }
        window.location.href = "checkout.html";
        return;
      }

      showAddedPopup("Added to cart");
    } catch (error) {
      showAddedPopup("We could not update the cart. Please try again.");
    } finally {
      if (!isBuyNow) {
        setGlobalLoading(false);
      }
      isProcessingShopAction = false;
    }
  });
});

  const gallery = document.querySelector("[data-product-gallery]");
  if (gallery) {
    const mainImage = gallery.querySelector("#main-product-image");
    const thumbs = gallery.querySelectorAll(".thumb-btn");
    thumbs.forEach((thumb) => {
      thumb.addEventListener("click", () => {
        const image = thumb.getAttribute("data-image");
        const alt = thumb.getAttribute("data-alt") || "Product image";
        if (mainImage && image) {
          mainImage.src = image;
          mainImage.alt = alt;
        }
        thumbs.forEach((btn) => btn.classList.remove("is-active"));
        thumb.classList.add("is-active");
      });
    });
  }

  const qtyControl = document.querySelector("[data-qty-control]");
  if (qtyControl) {
    const minus = qtyControl.querySelector("[data-qty-minus]");
    const plus = qtyControl.querySelector("[data-qty-plus]");
    const input = qtyControl.querySelector("[data-qty-input]");
    if (minus && plus && input) {
      minus.addEventListener("click", () => {
        const current = Number(input.value || 1);
        input.value = String(Math.max(1, current - 1));
      });
      plus.addEventListener("click", () => {
        const current = Number(input.value || 1);
        input.value = String(Math.min(10, current + 1));
      });
    }
  }

  const yearSlots = document.querySelectorAll("[data-year]");
  const nowYear = new Date().getFullYear();
  yearSlots.forEach((slot) => {
    slot.textContent = String(nowYear);
  });

  const observer = new IntersectionObserver(
    (entries) => {
      entries.forEach((entry) => {
        if (entry.isIntersecting) {
          entry.target.classList.add("is-visible");
          observer.unobserve(entry.target);
        }
      });
    },
    { threshold: 0.12 }
  );

  document.querySelectorAll(".reveal").forEach((el) => observer.observe(el));

  const forms = document.querySelectorAll("form[data-formspree]");
  forms.forEach((form) => {
    form.addEventListener("submit", async (event) => {
      event.preventDefault();
      const status = form.querySelector(".form-status");
      if (status) {
        status.classList.remove("is-success", "is-error");
        status.textContent = "Sending...";
      }
      try {
        const formData = new FormData(form);
        const response = await fetch(form.action, {
          method: "POST",
          body: formData,
          headers: { Accept: "application/json" }
        });
        if (response.ok) {
          if (status) {
            status.classList.add("is-success");
            status.textContent = "Form saved. You will get a reply within 48 hours.";
          }
          form.reset();
        } else {
          if (status) {
            status.classList.add("is-error");
            status.textContent = "Something went wrong. Please try again.";
          }
        }
      } catch (error) {
        if (status) {
          status.classList.add("is-error");
          status.textContent = "Network error. Please try again.";
        }
      }
    });
  });
});

const normalizeShowcaseImages = (value) => {
  if (Array.isArray(value)) return value.filter(Boolean);
  if (typeof value === "string") {
    const trimmed = value.trim();
    if (!trimmed) return [];
    if (trimmed.startsWith("{") && trimmed.endsWith("}")) {
      return trimmed
        .slice(1, -1)
        .split(",")
        .map((item) => item.replace(/^\"|\"$/g, "").trim())
        .filter(Boolean);
    }
    if (trimmed.startsWith("[")) {
      try {
        const parsed = JSON.parse(trimmed);
        return Array.isArray(parsed) ? parsed.filter(Boolean) : [];
      } catch (error) {
        return [trimmed];
      }
    }
    return [trimmed];
  }
  return value ? [value] : [];
};

const normalizeShowcaseColors = (value) => {
  if (Array.isArray(value)) return value.map(String).filter(Boolean);
  if (typeof value === "string") {
    return value.split(",").map((item) => item.trim()).filter(Boolean);
  }
  return [];
};

const normalizeShowcaseSections = (value) => {
  if (Array.isArray(value)) return value.map((item) => String(item || "").trim()).filter(Boolean);
  if (typeof value === "string") {
    const trimmed = value.trim();
    if (!trimmed) return [];
    if (trimmed.startsWith("{") && trimmed.endsWith("}")) {
      return trimmed
        .slice(1, -1)
        .split(",")
        .map((item) => item.replace(/^\"|\"$/g, "").trim())
        .filter(Boolean);
    }
    return trimmed.split(",").map((item) => item.trim()).filter(Boolean);
  }
  return [];
};

const normalizeShowcaseSectionKey = (value) =>
  String(value || "")
    .toLowerCase()
    .trim()
    .replace(/&/g, "and")
    .replace(/[^a-z0-9]+/g, "_")
    .replace(/^_+|_+$/g, "");

const expandShowcaseAliases = (value) => {
  const key = normalizeShowcaseSectionKey(value);
  const aliases = new Set([key]);
  if (key === "showcase_1") aliases.add("showcase_one");
  if (key === "showcase_2") aliases.add("showcase_two");
  if (key === "showcase_one") aliases.add("showcase_1");
  if (key === "showcase_two") aliases.add("showcase_2");
  return aliases;
};

const buildShowcaseMapFromProducts = () => {
  const products = Array.isArray(window.GT_PRODUCTS) ? window.GT_PRODUCTS : [];
  if (!products.length) return { showcase_one: [], showcase_two: [] };

  const bySection = (section) => {
    const wanted = expandShowcaseAliases(section);
    return products.filter((product) => {
      const sections = normalizeShowcaseSections(product.home_sections);
      const normalized = sections.flatMap((item) => Array.from(expandShowcaseAliases(item)));
      return normalized.some((item) => wanted.has(item));
    });
  };

  const fallbackOne = products.slice(0, 6);
  const fallbackTwo = products.slice(6, 12).length ? products.slice(6, 12) : products.slice(0, 6);
  const mapProduct = (product) => ({
    id: product.id,
    name: product.title || "",
    type: product.subtitle || "Signature Watch",
    tagline: product.badge || "Signature",
    desc: product.description || product.short_desc || "",
    oldPrice: product.old_price ? `Rs. ${Number(product.old_price).toLocaleString()}` : "",
    newPrice: product.price ? `Rs. ${Number(product.price).toLocaleString()}` : "",
    images: normalizeShowcaseImages(product.gallery).length ? normalizeShowcaseImages(product.gallery) : normalizeShowcaseImages(product.images),
    colors: normalizeShowcaseColors(product.colors).length ? normalizeShowcaseColors(product.colors) : ["Gold", "Silver", "Blue"],
    colorImages: product.color_images || {}
  });

  const showcaseOne = (bySection("showcase_one").length ? bySection("showcase_one") : fallbackOne).map(mapProduct);
  const usedIds = new Set(showcaseOne.map((item) => item.id));
  let showcaseTwo = (bySection("showcase_two").length ? bySection("showcase_two") : fallbackTwo)
    .filter((product) => !usedIds.has(product.id))
    .map(mapProduct);

  if (!showcaseTwo.length) {
    const secondFallback = products.filter((product) => !usedIds.has(product.id)).slice(0, 6);
    showcaseTwo = (secondFallback.length ? secondFallback : fallbackTwo).map(mapProduct);
  }

  return { showcase_one: showcaseOne, showcase_two: showcaseTwo };
};

const renderWatchShowcases = () => {
  const showcases = document.querySelectorAll("[data-watch-showcase]");
  if (showcases.length === 0) return;

  if (!window.GT_SHOWCASE_MAP || !Object.keys(window.GT_SHOWCASE_MAP).length) {
    window.GT_SHOWCASE_MAP = buildShowcaseMapFromProducts();
  }

  showcases.forEach((showcase) => {
    const source = showcase.getAttribute("data-showcase-source") || "showcase_one";
    const watches = (window.GT_SHOWCASE_MAP && Array.isArray(window.GT_SHOWCASE_MAP[source]))
      ? window.GT_SHOWCASE_MAP[source]
      : [];

    if (!watches.length) {
      showcase.classList.add("is-skeleton");
      let note = showcase.querySelector(".empty-note");
      if (!note) {
        note = document.createElement("p");
        note.className = "empty-note";
        showcase.appendChild(note);
      }
      note.textContent = source === "showcase_two"
        ? "No products added to Showcase 2 yet."
        : "No products added to Showcase 1 yet.";
      return;
    }

    showcase.classList.remove("is-skeleton");
    const existingNote = showcase.querySelector(".empty-note");
    if (existingNote) existingNote.remove();
    showcase.querySelectorAll(".showcase-skeleton").forEach((node) => node.remove());

    const nameEl = showcase.querySelector("[data-showcase-name]");
    const typeEl = showcase.querySelector("[data-showcase-type]");
    const tagEl = showcase.querySelector("[data-showcase-tagline]");
    const descEl = showcase.querySelector("[data-showcase-desc]");
    const oldEl = showcase.querySelector("[data-showcase-old]");
    const newEl = showcase.querySelector("[data-showcase-new]");
    const imgEl = showcase.querySelector("[data-showcase-image]");
    const colorsEl = showcase.querySelector("[data-showcase-colors]");
    const selectedColorEl = showcase.querySelector("[data-selected-color]");
    const nextBtn = showcase.querySelector("[data-showcase-next]");
    const imgPrevBtn = showcase.querySelector("[data-showcase-img-prev]");
    const imgNextBtn = showcase.querySelector("[data-showcase-img-next]");

    let index = 0;
    let imageIndex = 0;

    const render = () => {
      const watch = watches[index];      if (!watch) return;

      nameEl.textContent = watch.name;
      typeEl.textContent = watch.type;
      tagEl.textContent = watch.tagline;
      descEl.textContent = watch.desc;
      oldEl.textContent = watch.oldPrice;
      newEl.textContent = watch.newPrice;

      const images = Array.isArray(watch.images) ? watch.images : [];
      imageIndex = images.length ? imageIndex % images.length : 0;
      const imageUrl = images[imageIndex];
      const imgWrap = imgEl?.closest(".showcase-image-wrap");
      if (imageUrl) {
        imgEl.src = imageUrl;
        imgEl.alt = `${watch.name} showcase`;
        imgEl.classList.remove("is-empty");
        if (imgWrap) imgWrap.classList.remove("is-empty");
      } else {
        imgEl.removeAttribute("src");
        imgEl.alt = "";
        imgEl.classList.add("is-empty");
        if (imgWrap) imgWrap.classList.add("is-empty");
      }

      const colorImages = watch.colorImages && typeof watch.colorImages === "object" ? watch.colorImages : {};
      const colors = Array.isArray(watch.colors) && watch.colors.length
        ? watch.colors
        : ["Gold", "Silver", "Blue"];
      colorsEl.innerHTML = "";
      colors.forEach((color, i) => {
        const btn = document.createElement("button");
        btn.type = "button";
        btn.className = "color-dot" + (i === 0 ? " is-active" : "");
        btn.setAttribute("data-color", color);
        btn.setAttribute("aria-label", color);
        btn.style.setProperty("--dot", i === 0 ? "#d4af37" : i === 1 ? "#c3c9d4" : "#2f6ee6");
        btn.addEventListener("click", () => {
          colorsEl.querySelectorAll(".color-dot").forEach((x) => x.classList.remove("is-active"));
          btn.classList.add("is-active");
          selectedColorEl.textContent = color;
          const imgUrl = colorImages[color];
          if (imgUrl) {
            imgEl.src = imgUrl;
            imgEl.classList.remove("is-empty");
          }
        });
        colorsEl.appendChild(btn);
      });

      selectedColorEl.textContent = colors[0];
    }

    if (nextBtn) {
      nextBtn.addEventListener("click", () => {
        index = (index + 1) % watches.length;
        imageIndex = 0;
        render();
      });
    }

    if (imgPrevBtn) {
      imgPrevBtn.addEventListener("click", () => {
        const images = Array.isArray(watches[index].images) ? watches[index].images : [];
        if (!images.length) return;
        imageIndex = (imageIndex - 1 + images.length) % images.length;
        render();
      });
    }

    if (imgNextBtn) {
      imgNextBtn.addEventListener("click", () => {
        const images = Array.isArray(watches[index].images) ? watches[index].images : [];
        if (!images.length) return;
        imageIndex = (imageIndex + 1) % images.length;
        render();
      });
    }

    render();
  });
};

onReady(renderWatchShowcases);
window.addEventListener("gt:data-ready", renderWatchShowcases);

onReady(() => {
  const productPage = document.querySelector("[data-product-page]");
  if (!productPage) return;

  const run = () => {

  const slugify = (text) =>
    (text || "")
      .toLowerCase()
      .replace(/[^a-z0-9\s-]/g, "")
      .trim()
      .replace(/\s+/g, "-");

  const inferItemType = (slug = "") => {
    const value = slug.toLowerCase();
    if (value.includes("shade") || value.includes("sunglass") || value.includes("aviator") || value.includes("frame")) return "Shades";
    if (value.includes("goggle")) return "Goggles";
    if (value.includes("handbag") || value.includes("carryall") || value.includes("tote") || value.includes("satchel") || value.includes("quilted") || value.includes("bag")) return "Handbag";
    if (value.includes("shoe") || value.includes("sneaker") || value.includes("loafer") || value.includes("trainer") || value.includes("heel")) return "Shoes";
    if (value.includes("perfume") || value.includes("parfum") || value.includes("eau") || value.includes("mist") || value.includes("musk") || value.includes("oud") || value.includes("amber") || value.includes("velvet") || value.includes("bloom") || value.includes("noir")) return "Perfume";
    if (value.includes("jewel") || value.includes("bracelet") || value.includes("necklace") || value.includes("stud") || value.includes("halo") || value.includes("radiance")) return "Jewelry";
    if (value.includes("belt")) return "Belt";
    if (value.includes("wallet")) return "Wallet";
    return "Watch";
  };

  const titleCase = (slug) =>
    (slug || "watch")
      .split("-")
      .filter(Boolean)
      .map((part) => part.charAt(0).toUpperCase() + part.slice(1))
      .join(" ");

  const normalizeImages = (value) => {
    if (Array.isArray(value)) return value;
    if (typeof value === "string") {
      const trimmed = value.trim();
      if (trimmed.startsWith("{") && trimmed.endsWith("}")) {
        return trimmed
          .slice(1, -1)
          .split(",")
          .map((item) => item.replace(/^\"|\"$/g, "").trim())
          .filter(Boolean);
      }
      if (trimmed.startsWith("[")) {
        try {
          const parsed = JSON.parse(trimmed);
          if (Array.isArray(parsed)) return parsed;
        } catch (error) {
          return trimmed ? [trimmed] : [];
        }
      }
      if (trimmed) return [trimmed];
      return trimmed ? [trimmed] : [];
    }
    return value ? [value] : [];
  };

  const normalizeColorImages = (value) => {
    if (!value) return {};
    if (typeof value === "string") {
      try {
        const parsed = JSON.parse(value);
        if (parsed && typeof parsed === "object") return parsed;
      } catch (error) {
        return {};
      }
    }
    if (typeof value === "object") return value;
    return {};
  };

  const watchCatalog = {
    "royal-crown-gold": {
      name: "Royal Crown Gold",
      rating: "5.0 stars (32 verified reviews)",
      price: "Rs. 49,999",
      oldPrice: "Rs. 59,999",
      subtitle: "Premium luxury watch for events, business wear, and statement styling.",
      desc: "A statement luxury watch with premium metallic finish, elegant dial architecture, and event-ready wrist presence.",
      stock: "Limited premium stock available.",
      images: [
        "https://images.unsplash.com/photo-1523170335258-f5ed11844a49?auto=format&fit=crop&w=1200&q=80",
        "https://images.unsplash.com/photo-1547996160-81dfa63595aa?auto=format&fit=crop&w=1200&q=80",
        "https://images.unsplash.com/photo-1434056886845-dac89ffe9b56?auto=format&fit=crop&w=1200&q=80",
        "https://images.unsplash.com/photo-1495857000853-fe46c8f4b2d5?auto=format&fit=crop&w=1200&q=80"
      ]
    },
    "imperial-silver": {
      name: "Imperial Silver",
      rating: "4.9 stars (27 verified reviews)",
      price: "Rs. 44,999",
      oldPrice: "Rs. 53,499",
      subtitle: "Refined silver-tone chronograph design for premium styling.",
      desc: "A premium silver watch with elegant chronograph detailing, polished steel body, and all-day comfort.",
      stock: "In stock.",
      images: [
        "https://images.pexels.com/photos/280250/pexels-photo-280250.jpeg?auto=compress&cs=tinysrgb&w=1400",
        "https://images.pexels.com/photos/190819/pexels-photo-190819.jpeg?auto=compress&cs=tinysrgb&w=1400",
        "https://images.pexels.com/photos/277390/pexels-photo-277390.jpeg?auto=compress&cs=tinysrgb&w=1400",
        "https://images.unsplash.com/photo-1547996160-81dfa63595aa?auto=format&fit=crop&w=1400&q=80"
      ]
    },
    "titanium-edge": {
      name: "Titanium Edge",
      rating: "4.8 stars (22 verified reviews)",
      price: "Rs. 39,999",
      oldPrice: "Rs. 48,499",
      subtitle: "Strong titanium-inspired finish with sporty premium edge.",
      desc: "Built for performance-oriented users with a robust dial, bold markers, and premium wrist presence.",
      stock: "In stock.",
      images: [
        "https://images.pexels.com/photos/277390/pexels-photo-277390.jpeg?auto=compress&cs=tinysrgb&w=1400",
        "https://images.pexels.com/photos/280250/pexels-photo-280250.jpeg?auto=compress&cs=tinysrgb&w=1400",
        "https://images.pexels.com/photos/190819/pexels-photo-190819.jpeg?auto=compress&cs=tinysrgb&w=1400",
        "https://images.unsplash.com/photo-1434056886845-dac89ffe9b56?auto=format&fit=crop&w=1400&q=80"
      ]
    }
  };

  const urlParams = new URLSearchParams(window.location.search);
  const watchParam = slugify(urlParams.get("watch"));
  if (!watchParam) return;

  const fallbackImages = [
    "https://images.pexels.com/photos/190819/pexels-photo-190819.jpeg?auto=compress&cs=tinysrgb&w=1400",
    "https://images.pexels.com/photos/280250/pexels-photo-280250.jpeg?auto=compress&cs=tinysrgb&w=1400",
    "https://images.pexels.com/photos/277390/pexels-photo-277390.jpeg?auto=compress&cs=tinysrgb&w=1400",
    "https://images.pexels.com/photos/1697214/pexels-photo-1697214.jpeg?auto=compress&cs=tinysrgb&w=1400"
  ];

  const watch =
    watchCatalog[watchParam] || {
      name: titleCase(watchParam),
      rating: "4.8 stars (18 verified reviews)",
      price: "Rs. 29,999",
      oldPrice: "Rs. 36,999",
      subtitle: "Premium design with balanced daily comfort and luxury style.",
      desc: "Professional watch styling for office, events, and gifting. Crafted for comfort and long-lasting appeal.",
      stock: "In stock.",
      images: fallbackImages
    };
  if (window.GT_PRODUCT_DETAIL) {
    const db = window.GT_PRODUCT_DETAIL;
    const dbGallery = normalizeImages(db.gallery);
    const dbImagesRaw = normalizeImages(db.images);
    const dbImages = dbGallery.length ? dbGallery : dbImagesRaw;
    Object.assign(watch, {
      name: db.title || watch.name,
      rating: db.rating ? `${db.rating} stars` : watch.rating,
      price: db.price ? `Rs. ${Number(db.price).toLocaleString()}` : watch.price,
      oldPrice: db.old_price ? `Rs. ${Number(db.old_price).toLocaleString()}` : watch.oldPrice,
      subtitle: db.subtitle || watch.subtitle,
      desc: db.description || db.short_desc || watch.desc,
      stock: db.stock || watch.stock,
      images: dbImages.length ? dbImages : watch.images,
      specs: db.specs,
      colors: db.colors || watch.colors,
      colorImages: normalizeColorImages(db.color_images)
    });
  }
  const itemType = watch.itemType || inferItemType(watchParam);
  const itemLabel = itemType ? " " + itemType : "";

  const pageTitle = document.querySelector("[data-product-page-title]");
  const breadcrumb = document.querySelector("[data-product-breadcrumb]");
  const title = document.querySelector("[data-product-name]");
  const subtitle = document.querySelector("[data-product-subtitle]");
  const rating = document.querySelector("[data-product-rating]");
  const price = document.querySelector("[data-product-price]");
  const oldPrice = document.querySelector("[data-product-old-price]");
  const desc = document.querySelector("[data-product-desc]");
  const stock = document.querySelector("[data-product-stock]");
  const mainImage = document.querySelector("#main-product-image");
  const thumbs = Array.from(document.querySelectorAll(".thumb-btn"));
  const buyLink = document.querySelector("[data-product-buy-link]");
  const galleryWrap = document.querySelector(".product-gallery");
  const detailsWrap = document.querySelector(".product-details-panel");
  const colorDotsWrap = document.querySelector("[data-color-dots]");

  if (pageTitle) pageTitle.textContent = watch.name;
  if (breadcrumb) breadcrumb.textContent = `Home / Shop / ${watch.name}`;
  if (title) title.textContent = `${watch.name}${itemLabel}`;
  if (subtitle) subtitle.textContent = watch.subtitle;
  if (rating) rating.textContent = watch.rating;
  if (price) price.textContent = watch.price;
  if (oldPrice) oldPrice.textContent = watch.oldPrice;
  if (desc) desc.textContent = watch.desc;
  if (stock) stock.textContent = watch.stock;
  document.title = `${watch.name}${itemLabel} | Glamtreasure`;

  const metaDesc = document.querySelector('meta[name="description"]');
  if (metaDesc) metaDesc.setAttribute("content", watch.desc || watch.subtitle || "Premium product from Glamtreasure.");
  const ogTitle = document.querySelector('meta[property="og:title"]');
  if (ogTitle) ogTitle.setAttribute("content", `${watch.name}${itemLabel} | Glamtreasure`);
  const ogDesc = document.querySelector('meta[property="og:description"]');
  if (ogDesc) ogDesc.setAttribute("content", watch.desc || watch.subtitle || "Premium product from Glamtreasure.");
  const ogUrl = document.querySelector('meta[property="og:url"]');
  const canonical = document.querySelector('link[rel="canonical"]');
  const param = encodeURIComponent(watchParam);
  const newUrl = `https://glamtreasure.shop/product-royal-crown-gold.html?watch=${param}`;
  if (ogUrl) ogUrl.setAttribute("content", newUrl);
  if (canonical) canonical.setAttribute("href", newUrl);
  const ogImage = document.querySelector('meta[property="og:image"]');
  if (ogImage && watch.images && watch.images[0]) ogImage.setAttribute("content", watch.images[0]);

  const schema = {
    "@context": "https://schema.org",
    "@type": "Product",
    "name": watch.name,
    "image": watch.images || [],
    "description": watch.desc,
    "sku": watchParam,
    "brand": { "@type": "Brand", "name": "Glamtreasure" },
    "offers": {
      "@type": "Offer",
      "priceCurrency": "INR",
      "price": String((watch.price || "").replace(/[^\d]/g, "")),
      "availability": (watch.stock || "").toLowerCase().includes("out")
        ? "https://schema.org/OutOfStock"
        : "https://schema.org/InStock",
      "url": newUrl
    }
  };

  const breadcrumbSchema = {
    "@context": "https://schema.org",
    "@type": "BreadcrumbList",
    "itemListElement": [
      { "@type": "ListItem", "position": 1, "name": "Home", "item": "https://glamtreasure.shop/" },
      { "@type": "ListItem", "position": 2, "name": "Shop", "item": "https://glamtreasure.shop/shop.html" },
      { "@type": "ListItem", "position": 3, "name": watch.name, "item": newUrl }
    ]
  };

  const upsertSchema = (id, data) => {
    let el = document.querySelector(`#${id}`);
    if (!el) {
      el = document.createElement("script");
      el.type = "application/ld+json";
      el.id = id;
      document.head.appendChild(el);
    }
    el.textContent = JSON.stringify(data);
  };
  upsertSchema("product-schema", schema);
  upsertSchema("breadcrumb-schema", breadcrumbSchema);

  const specsList = document.querySelector("[data-product-specs]");
  if (specsList) {
    const defaultSpecs = [
      { label: "Case", value: "Stainless Steel" },
      { label: "Movement", value: "Automatic Quartz Hybrid" },
      { label: "Water Resistance", value: "50m" },
      { label: "Strap", value: "Metal / Leather options" },
      { label: "Warranty", value: "2 Year Support" }
    ];

    let specs = [];
    if (Array.isArray(watch.specs)) {
      specs = watch.specs;
    } else if (watch.specs && typeof watch.specs === "object") {
      specs = Object.entries(watch.specs).map(([label, value]) => ({ label, value }));
    }

    const list = specs.length ? specs : defaultSpecs;
    specsList.innerHTML = list
      .map((item) => `<li><strong>${item.label}:</strong> ${item.value}</li>`)
      .join("");
  }
  const strapLabel = document.querySelector("label[for=\"strap-select\"]");
  const sizeLabel = document.querySelector("label[for=\"size-select\"]");
  const strapSelect = document.querySelector("#strap-select");
  const sizeSelect = document.querySelector("#size-select");

  if (itemType !== "Watch" && strapLabel && sizeLabel && strapSelect && sizeSelect) {
    strapLabel.textContent = "Variant";
    sizeLabel.textContent = "Size / Style";
    strapSelect.innerHTML = "<option>Standard Variant</option><option>Premium Variant</option><option>Limited Edition</option>";
    sizeSelect.innerHTML = "<option>Small</option><option>Medium</option><option>Large</option>";
  }


  if (mainImage && watch.images && watch.images.length > 0) {
    mainImage.src = watch.images[0];
    mainImage.alt = `${watch.name} main image`;
  }

  thumbs.forEach((thumb, i) => {
    const img = watch.images[i] || fallbackImages[i % fallbackImages.length];
    thumb.setAttribute("data-image", img);
    thumb.setAttribute("data-alt", `${watch.name} view ${i + 1}`);
    const thumbImg = thumb.querySelector("img");
    if (thumbImg) {
      thumbImg.src = img;
      thumbImg.alt = `${watch.name} thumbnail ${i + 1}`;
    }
  });

  if (colorDotsWrap && Array.isArray(watch.colors) && watch.colors.length) {
    colorDotsWrap.innerHTML = "";
    const colorImages = watch.colorImages || {};
    watch.colors.forEach((color, index) => {
      const btn = document.createElement("button");
      btn.type = "button";
      btn.className = "color-dot" + (index === 0 ? " is-active" : "");
      btn.setAttribute("aria-label", color);
      btn.style.setProperty("--dot", color);
      btn.addEventListener("click", () => {
        colorDotsWrap.querySelectorAll(".color-dot").forEach((dot) => dot.classList.remove("is-active"));
        btn.classList.add("is-active");
        const imgUrl = colorImages[color];
        if (imgUrl && mainImage) {
          mainImage.src = imgUrl;
          mainImage.alt = `${watch.name} ${color}`;
        }
      });
      colorDotsWrap.appendChild(btn);
    });
    const firstColor = watch.colors[0];
    const firstUrl = colorImages[firstColor];
    if (firstUrl && mainImage) {
      mainImage.src = firstUrl;
      mainImage.alt = `${watch.name} ${firstColor}`;
    }
  } else if (colorDotsWrap) {
    colorDotsWrap.innerHTML = "<span class=\"small\">No colors listed.</span>";
  }

  if (galleryWrap) {
    galleryWrap.classList.remove("is-skeleton");
    const skel = galleryWrap.querySelector(".product-skeleton");
    if (skel) skel.remove();
  }
  if (detailsWrap) {
    detailsWrap.classList.remove("is-skeleton");
    const skel = detailsWrap.querySelector(".product-skeleton");
    if (skel) skel.remove();
  }
  };

  if (window.GT_DATA_READY && typeof window.GT_DATA_READY.finally === "function") {
    window.GT_DATA_READY.finally(run);
  } else {
    run();
  }
});




















































