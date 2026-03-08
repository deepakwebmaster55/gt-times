document.addEventListener("DOMContentLoaded", () => {
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

  const announcements = [
    "Buy any 2 watches and get Rs. 1000 OFF - Code: TIME1000",
    "Free shipping on orders above Rs. 5000",
    "COD available with non-refundable token amount"
  ];

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
    const interval = Number(slider.getAttribute("data-interval") || 4200);
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

    const step = () => Math.max(280, Math.floor(windowEl.clientWidth * 0.82));

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
  });

  const filterButtons = document.querySelectorAll(".filter-btn");
  const productCards = document.querySelectorAll(".product-card");

  productCards.forEach((card) => {
    const title = card.querySelector(".product-title");
    const link = card.querySelector("a.btn");
    if (!title || !link) return;
    const slug = slugify(title.textContent);
    if (!slug) return;
    link.href = `product-royal-crown-gold.html?watch=${encodeURIComponent(slug)}`;
  });

  const applyFilter = (target) => {
    const normalized = (target || "all").toLowerCase();
    const map = {
      sports: "sport",
      smart: "luxury",
      premium: "luxury",
      digital: "minimal"
    };
    const finalTarget = map[normalized] || normalized;

    filterButtons.forEach((btn) => {
      const btnFilter = (btn.getAttribute("data-filter") || "").toLowerCase();
      btn.classList.toggle("is-active", btnFilter === finalTarget);
    });

    productCards.forEach((card) => {
      if (!finalTarget || finalTarget === "all") {
        card.classList.remove("hidden");
        return;
      }
      const cardTag = (card.getAttribute("data-category") || "").toLowerCase();
      const cardStyle = (card.getAttribute("data-style") || "").toLowerCase();
      card.classList.toggle("hidden", !(cardTag === finalTarget || cardStyle === finalTarget));
    });
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

  const forms = document.querySelectorAll("form[data-demo-form]");
  forms.forEach((form) => {
    form.addEventListener("submit", (event) => {
      event.preventDefault();
      const status = form.querySelector(".form-status");
      if (status) status.textContent = "Thank you. Glamtreasure team will contact you shortly.";
      form.reset();
    });
  });
});

document.addEventListener("DOMContentLoaded", () => {
  const showcases = document.querySelectorAll("[data-watch-showcase]");
  if (showcases.length === 0) return;

  const watches = [
    {
      name: "Royal Crown Gold",
      type: "Luxury Statement Watch",
      tagline: "Design For Bold Moments",
      desc: "A premium luxury watch with polished gold finish, bold dial balance, and standout wrist presence for events and formal looks.",
      oldPrice: "Rs. 59,999",
      newPrice: "Rs. 49,999",
      images: [
        "https://images.pexels.com/photos/190819/pexels-photo-190819.jpeg?auto=compress&cs=tinysrgb&w=1400",
        "https://images.pexels.com/photos/280250/pexels-photo-280250.jpeg?auto=compress&cs=tinysrgb&w=1400",
        "https://images.pexels.com/photos/277390/pexels-photo-277390.jpeg?auto=compress&cs=tinysrgb&w=1400"
      ],
      colors: ["Gold", "Silver", "Blue"]
    },
    {
      name: "Aero Smart Series",
      type: "Smart Performance Watch",
      tagline: "Track Every Move",
      desc: "Smart design built for productivity and fitness tracking while preserving elegant premium aesthetics.",
      oldPrice: "Rs. 38,499",
      newPrice: "Rs. 32,999",
      images: [
        "https://images.pexels.com/photos/280250/pexels-photo-280250.jpeg?auto=compress&cs=tinysrgb&w=1400",
        "https://images.pexels.com/photos/1697214/pexels-photo-1697214.jpeg?auto=compress&cs=tinysrgb&w=1400",
        "https://images.pexels.com/photos/190819/pexels-photo-190819.jpeg?auto=compress&cs=tinysrgb&w=1400"
      ],
      colors: ["Graphite", "Black", "Blue"]
    },
    {
      name: "Titanium Edge Pro",
      type: "Sports Luxury Watch",
      tagline: "Power In Every Second",
      desc: "Engineered for active use with robust construction and strong premium detailing for modern athletes.",
      oldPrice: "Rs. 48,499",
      newPrice: "Rs. 39,999",
      images: [
        "https://images.pexels.com/photos/364822/pexels-photo-364822.jpeg?auto=compress&cs=tinysrgb&w=1400",
        "https://images.pexels.com/photos/277390/pexels-photo-277390.jpeg?auto=compress&cs=tinysrgb&w=1400",
        "https://images.pexels.com/photos/1697214/pexels-photo-1697214.jpeg?auto=compress&cs=tinysrgb&w=1400"
      ],
      colors: ["Black", "Grey", "Orange"]
    }
  ];

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
      const watch = watches[index];
      if (!watch) return;

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
        });
        colorsEl.appendChild(btn);
      });

      selectedColorEl.textContent = watch.colors[0];
    };

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

document.addEventListener("DOMContentLoaded", () => {
  const productPage = document.querySelector("[data-product-page]");
  if (!productPage) return;

  const slugify = (text) =>
    (text || "")
      .toLowerCase()
      .replace(/[^a-z0-9\s-]/g, "")
      .trim()
      .replace(/\s+/g, "-");

  const titleCase = (slug) =>
    (slug || "watch")
      .split("-")
      .filter(Boolean)
      .map((part) => part.charAt(0).toUpperCase() + part.slice(1))
      .join(" ");

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

  if (pageTitle) pageTitle.textContent = watch.name;
  if (breadcrumb) breadcrumb.textContent = `Home / Shop / ${watch.name}`;
  if (title) title.textContent = `${watch.name} Watch`;
  if (subtitle) subtitle.textContent = watch.subtitle;
  if (rating) rating.textContent = watch.rating;
  if (price) price.textContent = watch.price;
  if (oldPrice) oldPrice.textContent = watch.oldPrice;
  if (desc) desc.textContent = watch.desc;
  if (stock) stock.textContent = watch.stock;
  document.title = `${watch.name} Watch | Glamtreasure`;

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
});





