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
  const slugify = (text) =>
    (text || "")
      .toLowerCase()
      .replace(/[^a-z0-9\s-]/g, "")
      .trim()
      .replace(/\s+/g, "-");

    const menuToggle = document.querySelector(".menu-toggle");
  const nav = document.querySelector(".main-nav");

  if (menuToggle && nav) {
    menuToggle.addEventListener("click", () => {
      const isOpen = nav.classList.toggle("is-open");
      menuToggle.setAttribute("aria-expanded", String(isOpen));
    });
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
        <span class="ticker-item">JavaScript</span>
        <span class="ticker-item">HTML5</span>
        <span class="ticker-item">CSS3</span>
        <span class="ticker-item">MongoDB</span>
      </span>
      <span class="ticker-track" aria-hidden="true">
        <span class="ticker-item">COD available with non-refundable token amount</span>
        <span class="ticker-item">Free shipping above Rs. 5000</span>
        <span class="ticker-item">Call: +91 74950 98330</span>
        <span class="ticker-item">glamtreasure03@gmail.com</span>
        <span class="ticker-item">JavaScript</span>
        <span class="ticker-item">HTML5</span>
        <span class="ticker-item">CSS3</span>
        <span class="ticker-item">MongoDB</span>
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

  moveAccountToMenu();
  setupTopTicker();
  setupMobileHeaderStack();
  setupWhatsAppBubble();
  showContactToast();
  highlightActiveLinks();
  ensureFooterSocials();

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

  const applyFilter = (target) => {
    const normalized = (target || "all").toLowerCase();
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
      const text = (card.textContent || "").toLowerCase();
      const matchesCategory =
        !finalTarget || finalTarget === "all" || cardTag === finalTarget || cardStyle === finalTarget;
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
    applyFilter(categoryParam);
  }

  const searchParam = new URLSearchParams(window.location.search).get("q");
  const isShopPage = !!document.querySelector(".shop-tools");
  if (searchParam && isShopPage) {
    applySearch(searchParam);
  }

  const searchForms = document.querySelectorAll("[data-search-form]");
  const searchInputs = document.querySelectorAll("[data-search-input]");
  searchInputs.forEach((input) => {
    if (searchParam) input.value = searchParam;
  });
  searchForms.forEach((form) => {
    form.addEventListener("submit", (event) => {
      event.preventDefault();
      const input = form.querySelector("[data-search-input]");
      const query = input ? input.value.trim() : "";
      if (!isShopPage) {
        const target = query ? `shop.html?q=${encodeURIComponent(query)}` : "shop.html";
        window.location.href = target;
        return;
      }
      applySearch(query);
      const url = new URL(window.location.href);
      if (query) {
        url.searchParams.set("q", query);
      } else {
        url.searchParams.delete("q");
      }
      window.history.replaceState({}, "", url.toString());
    });
  });
};

window.initShopFilters = initShopFilters;
initShopFilters();

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

onReady(() => {  const showcases = document.querySelectorAll("[data-watch-showcase]");
  if (showcases.length === 0) return;

  const watches = (window.GT_SHOWCASE_DATA && window.GT_SHOWCASE_DATA.length)
    ? window.GT_SHOWCASE_DATA
    : [];

  if (!watches.length) {
    showcases.forEach((showcase) => {
      showcase.innerHTML = "";
      const note = document.createElement("p");
      note.className = "empty-note";
      note.textContent = "No signature products yet. We will add soon.";
      showcase.appendChild(note);
    });
    return;
  }

  showcases.forEach((showcase) => {
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

      const images = watch.images || [];
      imageIndex = images.length ? imageIndex % images.length : 0;
      imgEl.src = images[imageIndex] || "";
      imgEl.alt = `${watch.name} showcase`;

      const colorImages = watch.colorImages || {};
      colorsEl.innerHTML = "";
      watch.colors.forEach((color, i) => {
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
          }
        });
        colorsEl.appendChild(btn);
      });

      selectedColorEl.textContent = watch.colors[0];
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
        const images = watches[index].images || [];
        if (!images.length) return;
        imageIndex = (imageIndex - 1 + images.length) % images.length;
        render();
      });
    }

    if (imgNextBtn) {
      imgNextBtn.addEventListener("click", () => {
        const images = watches[index].images || [];
        if (!images.length) return;
        imageIndex = (imageIndex + 1) % images.length;
        render();
      });
    }

    render();
  });
});

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

  if (buyLink) {
    const msg = encodeURIComponent(`I want to buy ${watch.name} from Glamtreasure.`);
    buyLink.href = `https://wa.me/917495098330?text=${msg}`;
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




















































