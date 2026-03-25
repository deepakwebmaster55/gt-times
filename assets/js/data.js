const GTConfig = window.GT_CONFIG || {};

window.GT_DATA_READY = (async () => {
  const supabase1Config = GTConfig.supabase1 || {};
  const supabase2Config = GTConfig.supabase2 || {};

  const heroTrack = document.querySelector("[data-slider-track]");
  const carouselEls = Array.from(document.querySelectorAll("[data-carousel-key]"));
  const productsGrid = document.querySelector("[data-products-grid]");
  const categoriesGrid = document.querySelector("[data-categories-grid]");
  const blogGrid = document.querySelector("[data-blog-grid]");
  const reviewList = document.querySelector("[data-reviews-list]");
  const filterWrap = document.querySelector("[data-filter-buttons]");
  const searchPage = document.querySelector("[data-search-page]");
  const showcases = Array.from(document.querySelectorAll("[data-watch-showcase]"));

  const renderSkeletons = () => {
    if (heroTrack) {
      heroTrack.innerHTML = `
        <article class="hero-slide is-active hero-loading-slide">
          <div class="hero-loading-state" aria-label="Loading slider" aria-live="polite">
            <div class="hero-loading-spinner" role="status"></div>
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

    carouselEls.forEach((carousel) => {
      const track = carousel.querySelector(".carousel-track");
      if (track) {
        track.innerHTML = Array.from({ length: 4 }).map(() => skeletonCard).join("");
      }
    });

    if (productsGrid) {
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

    if (categoriesGrid) {
      categoriesGrid.innerHTML = Array.from({ length: 6 }).map(() => `
        <article class="category-tile">
          <div class="skeleton-block" style="height:170px; margin-bottom:0.8rem;"></div>
          <div class="skeleton-line" style="width:60%;"></div>
        </article>
      `).join("");
    }

    if (blogGrid) {
      blogGrid.innerHTML = Array.from({ length: 3 }).map(() => `
        <article class="blog-card">
          <div class="skeleton-block" style="height:200px; margin-bottom:0.8rem;"></div>
          <div class="skeleton-line" style="width:70%; margin-bottom:0.4rem;"></div>
          <div class="skeleton-line" style="width:50%;"></div>
        </article>
      `).join("");
    }

    if (reviewList) {
      reviewList.innerHTML = Array.from({ length: 3 }).map(() => `
        <div class="review-item">
          <div class="skeleton-line" style="width:60%; margin-bottom:0.4rem;"></div>
          <div class="skeleton-line" style="width:80%;"></div>
        </div>
      `).join("");
    }

    if (filterWrap) {
      filterWrap.innerHTML = Array.from({ length: 6 }).map(() => `<span class="filter-skeleton"></span>`).join("");
    }

    showcases.forEach((showcase) => {
      showcase.classList.add("is-skeleton");
      const setSkeleton = (selector, width) => {
        const el = showcase.querySelector(selector);
        if (el) {
          el.innerHTML = `<span class="skeleton-line" style="width:${width}; display:block;"></span>`;
        }
      };
      setSkeleton("[data-showcase-tagline]", "40%");
      setSkeleton("[data-showcase-name]", "70%");
      setSkeleton("[data-showcase-type]", "50%");
      setSkeleton("[data-showcase-desc]", "80%");
      setSkeleton("[data-showcase-old]", "30%");
      setSkeleton("[data-showcase-new]", "40%");

      const imgWrap = showcase.querySelector(".showcase-image-wrap");
      if (imgWrap && !imgWrap.querySelector(".showcase-skeleton")) {
        const skel = document.createElement("div");
        skel.className = "showcase-skeleton skeleton-block";
        skel.style.height = "260px";
        imgWrap.appendChild(skel);
      }
    });
  };

  renderSkeletons();

  const setEmptyNote = (targetEl, label) => {
    if (!targetEl) return;
    if (targetEl.dataset.hasContent === "true") return;
    const parent = targetEl.parentElement || targetEl;
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

  const clearEmptyNote = (targetEl, label) => {
    if (!targetEl) return;
    const parent = targetEl.parentElement || targetEl;
    if (!parent) return;
    targetEl.dataset.hasContent = "true";
    const key = String(label || "items");
    const note = parent.querySelector('.empty-note[data-empty="' + key + '"]');
    if (note) note.remove();
  };

  const setMetaTag = (selector, attr, value) => {
    if (!value) return;
    let el = document.querySelector(selector);
    if (!el) {
      el = document.createElement("meta");
      if (selector.startsWith('meta[name="')) {
        const name = selector.slice(11, -2);
        el.setAttribute("name", name);
      } else if (selector.startsWith('meta[property="')) {
        const property = selector.slice(15, -2);
        el.setAttribute("property", property);
      }
      document.head.appendChild(el);
    }
    el.setAttribute(attr, value);
  };

  const setCanonical = (href) => {
    if (!href) return;
    let link = document.querySelector('link[rel="canonical"]');
    if (!link) {
      link = document.createElement("link");
      link.setAttribute("rel", "canonical");
      document.head.appendChild(link);
    }
    link.setAttribute("href", href);
  };

  const upsertJsonLd = (id, json) => {
    if (!json) return;
    let script = document.getElementById(id);
    if (!script) {
      script = document.createElement("script");
      script.type = "application/ld+json";
      script.id = id;
      document.head.appendChild(script);
    }
    script.textContent = JSON.stringify(json);
  };

  if (!window.supabase || !supabase1Config.url || !supabase1Config.anonKey) {
    if (heroTrack) setEmptyNote(heroTrack, "slides");
    carouselEls.forEach((carousel) => {
      const track = carousel.querySelector(".carousel-track");
      if (track) setEmptyNote(track, "products");
    });
    if (productsGrid) setEmptyNote(productsGrid, "products");
    if (categoriesGrid) setEmptyNote(categoriesGrid, "categories");
    if (filterWrap) setEmptyNote(filterWrap, "categories");
    if (blogGrid) setEmptyNote(blogGrid, "blogs");
    if (reviewList) setEmptyNote(reviewList, "reviews");
    return;
  }

  const supabase1 = supabase.createClient(supabase1Config.url, supabase1Config.anonKey);
  const supabase2 = supabase2Config.url && supabase2Config.anonKey
    ? supabase.createClient(supabase2Config.url, supabase2Config.anonKey)
    : null;

  window.GT_SUPABASE1 = supabase1;
  window.GT_SUPABASE2 = supabase2;

  

  const productPageSkeleton = document.querySelector("[data-product-page]");
  if (productPageSkeleton) {
    const gallery = productPageSkeleton.querySelector(".product-gallery");
    const details = productPageSkeleton.querySelector(".product-details-panel");
    if (gallery) {
      gallery.classList.add("is-skeleton");
      if (!gallery.querySelector(".product-skeleton")) {
        const skel = document.createElement("div");
        skel.className = "product-skeleton";
        skel.innerHTML = `<div class="skeleton-block" style="height:360px;"></div>`;
        gallery.appendChild(skel);
      }
    }
    if (details) {
      details.classList.add("is-skeleton");
      if (!details.querySelector(".product-skeleton")) {
        const skel = document.createElement("div");
        skel.className = "product-skeleton";
        skel.innerHTML = `
          <div class="skeleton-line" style="width:40%; margin-bottom:0.6rem;"></div>
          <div class="skeleton-line" style="width:70%; margin-bottom:0.6rem;"></div>
          <div class="skeleton-line" style="width:60%; margin-bottom:1rem;"></div>
          <div class="skeleton-line" style="width:50%;"></div>
        `;
        details.appendChild(skel);
      }
    }
  }

  const fetchProducts = async () => {
    const primary = await supabase1
      .from("products")
      .select("*")
      .neq("is_active", false);

    if (!primary.error) {
      return primary.data || [];
    }

    console.warn("Primary products query failed, retrying without active filter.", primary.error);

    const fallback = await supabase1
      .from("products")
      .select("*");

    if (fallback.error) {
      console.error("Products fallback query failed.", fallback.error);
      return [];
    }

    return (fallback.data || []).filter((product) => product?.is_active !== false);
  };

  const fetchCategories = async () => {
    const { data, error } = await supabase1.from("categories").select("*").neq("is_active", false);
    if (error) {
      const fallback = await supabase1.from("categories").select("*");
      return fallback.data || [];
    }
    return data || [];
  };

  const fetchBlogs = async () => {
    if (!supabase2) return [];
    const { data } = await supabase2.from("blogs").select("*").neq("is_active", false).order("published_at", { ascending: false });
    return data || [];
  };

  const fetchHeroSlides = async () => {
    const { data } = await supabase1.from("home_sliders").select("*").neq("is_active", false).order("order_index", { ascending: true });
    return data || [];
  };

  const fetchReviews = async () => {
    if (!supabase2) return [];
    const { data } = await supabase2.from("reviews").select("*").neq("is_active", false).order("created_at", { ascending: false });
    return data || [];
  };

  const fetchOffers = async () => {
    if (!supabase2) return [];
    const { data } = await supabase2.from("offers").select("*").neq("is_active", false);
    return data || [];
  };

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

  const normalizeCategoryList = (value) => {
    if (Array.isArray(value)) return value.map(String);
    if (typeof value === "string") {
      return value
        .split(",")
        .map((item) => item.trim())
        .filter(Boolean);
    }
    return [];
  };

  const normalizeSectionList = (value) => {
    if (Array.isArray(value)) {
      return value.map((item) => String(item || "").trim()).filter(Boolean);
    }
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
      if (trimmed.includes(",")) {
        return trimmed.split(",").map((item) => item.trim()).filter(Boolean);
      }
      return [trimmed];
    }
    return [];
  };

  const normalizeSectionKey = (value) =>
    String(value || "")
      .toLowerCase()
      .trim()
      .replace(/&/g, "and")
      .replace(/[^a-z0-9]+/g, "_")
      .replace(/^_+|_+$/g, "");

  const expandSectionAliases = (value) => {
    const key = normalizeSectionKey(value);
    const aliases = new Set([key]);

    if (key === "showcase_1") aliases.add("showcase_one");
    if (key === "showcase_2") aliases.add("showcase_two");
    if (key === "showcase_one") aliases.add("showcase_1");
    if (key === "showcase_two") aliases.add("showcase_2");
    if (key === "new_arrival") aliases.add("new_arrivals");
    if (key === "best_seller") aliases.add("bestseller");
    if (key === "best_sellers") aliases.add("bestseller");
    if (key === "bestseller") aliases.add("bestseller");
    if (key === "premium") aliases.add("premium_choice");
    if (key === "premium_products") aliases.add("premium_choice");
    if (key === "featured_products") aliases.add("featured");

    return aliases;
  };

  const slugify = (text) =>
    (text || "")
      .toLowerCase()
      .replace(/[^a-z0-9\s-]/g, "")
      .trim()
      .replace(/\s+/g, "-");

  const escapeHtml = (value) =>
    String(value || "")
      .replace(/&/g, "&amp;")
      .replace(/</g, "&lt;")
      .replace(/>/g, "&gt;")
      .replace(/\"/g, "&quot;")
      .replace(/'/g, "&#39;");

  const getHeroHighlights = (slide) => {
    const title = String(slide?.title || "").toLowerCase();
    if (title.includes("fossil")) {
      return ["Premium Finish", "Gift Ready", "Fast Delivery"];
    }
    if (title.includes("rolex")) {
      return ["Luxury Pick", "Swiss Style", "Statement Wear"];
    }
    return ["Top Seller", "Premium Quality", "Trusted COD"];
  };

  const mapProductCard = (product) => {
    const image = normalizeImages(product.images)[0] || "";
    const price = product.price ? `Rs. ${Number(product.price).toLocaleString()}` : "";
    const oldPrice = product.old_price ? `Rs. ${Number(product.old_price).toLocaleString()}` : "";
    const slugOrId = product.slug || product.id || "";
    return `
      <article class="product-card carousel-card">
        <div class="product-thumb">
          <span class="product-tag">${product.badge || "Product"}</span>
          <img src="${image}" alt="${product.title || "Product"}" />
        </div>
        <div class="product-content">
          <h3 class="product-title">${product.title || ""}</h3>
          <p class="rating">${product.rating ? `${product.rating} stars` : ""}</p>
          <div class="price">
            <strong>${price}</strong>
            <span>${oldPrice}</span>
          </div>
          <a class="btn btn-primary" href="product-royal-crown-gold.html?watch=${encodeURIComponent(slugOrId)}">View Product</a>
        </div>
      </article>
    `;
  };

  const mapShopCard = (product, categoryMap = {}) => {
    const image = normalizeImages(product.images)[0] || "";
    const price = product.price ? `Rs. ${Number(product.price).toLocaleString()}` : "";
    const oldPrice = product.old_price ? `Rs. ${Number(product.old_price).toLocaleString()}` : "";
    const slugOrId = product.slug || product.id || "";
    const productLink = `product-royal-crown-gold.html?watch=${encodeURIComponent(slugOrId)}`;
    const categories = normalizeCategoryList(product.category);
    const tagSet = new Set();
    categories.forEach((cat) => {
      const raw = String(cat || "");
      const rawSlug = slugify(raw);
      if (rawSlug) tagSet.add(rawSlug);
      const mapped = categoryMap[raw.toLowerCase()];
      if (mapped) tagSet.add(mapped);
    });
    const tagList = Array.from(tagSet);
    const categorySlug = tagList[0] || "";
    return `
      <article
        class="product-card is-visible"
        data-category="${categorySlug}"
        data-tags="${tagList.join(",")}"
        data-product-id="${String(product.id || "")}"
        data-product-slug="${String(product.slug || "")}"
        data-product-title="${String(product.title || "").replace(/"/g, "&quot;")}"
        data-product-price="${String(product.price || 0)}"
        data-product-image="${String(image || "").replace(/"/g, "&quot;")}"
        data-product-link="${productLink}"
        data-product-stock="${String(product.stock_quantity ?? "")}"
        data-product-active="${product.is_active === false ? "false" : "true"}"
      >
        <a class="product-thumb" href="${productLink}" aria-label="View ${product.title || "Product"} details">
          <span class="product-tag">${product.badge || "Product"}</span>
          <img src="${image}" alt="${product.title || "Product"}" />
        </a>
        <div class="product-content">
          <h3 class="product-title"><a href="${productLink}">${product.title || ""}</a></h3>
          <div class="price">
            <strong>${price}</strong>
            <span>${oldPrice}</span>
          </div>
          <p class="rating">${product.short_desc || ""}</p>
          <div class="product-card-actions">
            <button class="btn btn-secondary" type="button" data-shop-add-to-cart>Add to Cart</button>
            <button class="btn btn-primary" type="button" data-shop-buy-now>Buy Now</button>
          </div>
        </div>
      </article>
    `;
  };

  const mapCategoryCard = (category) => {
    const link = category.slug
      ? `shop.html?category=${encodeURIComponent(category.slug)}`
      : "shop.html";
    return `
      <article class="category-tile">
        <a href="${link}">
          <img src="${category.image_url || "https://images.pexels.com/photos/190819/pexels-photo-190819.jpeg?auto=compress&cs=tinysrgb&w=1200"}" alt="${category.name || "Category"}" />
          <h3>${category.name || ""}</h3>
          <p class="small">${category.description || ""}</p>
        </a>
      </article>
    `;
  };

  const mapBlogCard = (blog) => {
    const slug = String(blog.slug || "").trim();
    const url = slug ? `blog-details.html?slug=${encodeURIComponent(slug)}` : "blog.html";
    const date = blog.published_at ? new Date(blog.published_at).toLocaleDateString() : "";
    const rawImage = String(blog.image_url || "").trim().replace(/^['"]|['"]$/g, "");
    const normalizedImage = (() => {
      if (!rawImage) return "";
      if (/^https?:\/\//i.test(rawImage) || rawImage.startsWith("data:")) return rawImage;
      if (!supabase2Config.url) return "";

      const base = supabase2Config.url.replace(/\/+$/, "");
      if (rawImage.startsWith("/storage/v1/object/public/")) return `${base}${rawImage}`;
      if (rawImage.startsWith("storage/v1/object/public/")) return `${base}/${rawImage}`;
      if (rawImage.startsWith("product-images/")) return `${base}/storage/v1/object/public/${rawImage}`;
      if (rawImage.startsWith("/product-images/")) return `${base}/storage/v1/object/public${rawImage}`;
      if (rawImage.startsWith("blogs/")) return `${base}/storage/v1/object/public/product-images/${rawImage}`;
      if (rawImage.startsWith("/blogs/")) return `${base}/storage/v1/object/public/product-images${rawImage}`;
      if (rawImage.startsWith("/")) return `${base}${rawImage}`;
      return `${base}/storage/v1/object/public/product-images/${rawImage}`;
    })();

    const imageTag = normalizedImage
      ? `<img src="${normalizedImage}" alt="${blog.title || "Blog"}" onerror="this.onerror=null;this.style.display='none'" />`
      : `<img src="assets/images/logo.svg" alt="${blog.title || "Blog"}" />`;
    return `
      <article class="blog-card is-visible">
        ${imageTag}
        <div class="meta">${date}</div>
        <h3>${blog.title || ""}</h3>
        <p>${blog.summary || ""}</p>
        <a class="btn btn-secondary" href="${url}">Read More</a>
      </article>
    `;
  };

  const mapReview = (review) => {
    return `
      <div class="review-item">
        <strong>${review.name || ""} - ${review.rating || ""}</strong>
        <p>${review.feedback || ""}</p>
      </div>
    `;
  };

  let products = [];
  if (heroTrack || carouselEls.length || productsGrid || reviewList || searchPage) {
    products = await fetchProducts();
  }
  window.GT_PRODUCTS = products;

  if (heroTrack) {
    const slides = await fetchHeroSlides();
    if (slides.length) {
      heroTrack.innerHTML = slides
        .map((slide, index) => {
          const desktopImage = slide.image_url || "";
          const mobileImage = slide.mobile_image_url || desktopImage;
          const overlaySvg = slide.overlay_svg_url || slide.svg_url || "";
          const desktopX = Number.isFinite(Number(slide.svg_desktop_x)) ? Number(slide.svg_desktop_x) : 74;
          const desktopY = Number.isFinite(Number(slide.svg_desktop_y)) ? Number(slide.svg_desktop_y) : 50;
          const mobileX = Number.isFinite(Number(slide.svg_mobile_x)) ? Number(slide.svg_mobile_x) : 50;
          const mobileY = Number.isFinite(Number(slide.svg_mobile_y)) ? Number(slide.svg_mobile_y) : 26;
          const safeTitle = escapeHtml(slide.title || "");
          const safeSubtitle = escapeHtml(slide.subtitle || "");
          const safeEyebrow = escapeHtml(slide.eyebrow || "Collection");
          const primaryLabel = escapeHtml(slide.primary_cta_label || "Shop Now");
          const secondaryLabel = escapeHtml(slide.secondary_cta_label || "Explore");
          const primaryLink = slide.primary_cta_link || "shop.html";
          const secondaryLink = slide.secondary_cta_link || "categories.html";
          return `
            <article class="hero-slide" data-hero-slide-index="${index}">
              <div class="hero-slide-bg">
                <picture class="hero-slide-picture">
                  <source media="(max-width: 880px)" srcset="${mobileImage}" />
                  <img src="${desktopImage}" alt="${safeTitle || "Hero"}" loading="${index === 0 ? "eager" : "lazy"}" />
                </picture>
                <div class="hero-slide-image-mask"></div>
              </div>
              <div class="hero-slide-overlay-art${overlaySvg ? " has-art" : ""}" style="--hero-art-x:${desktopX}%; --hero-art-y:${desktopY}%; --hero-art-mobile-x:${mobileX}%; --hero-art-mobile-y:${mobileY}%;">
                ${overlaySvg ? `<img src="${overlaySvg}" alt="" aria-hidden="true" />` : ""}
              </div>
              <div class="hero-slide-panel">
                <div class="hero-copy">
                  <span class="eyebrow">${safeEyebrow}</span>
                  <h2>${safeTitle}</h2>
                  <p>${safeSubtitle}</p>
                  <div class="hero-highlights">
                    ${getHeroHighlights(slide).map((item) => `<span>${escapeHtml(item)}</span>`).join("")}
                  </div>
                  <div class="btn-row">
                    <a class="btn btn-primary" href="${primaryLink}">${primaryLabel}</a>
                    <a class="btn btn-secondary" href="${secondaryLink}">${secondaryLabel}</a>
                  </div>
                </div>
              </div>
            </article>
          `;
        })
        .join("");
      document.dispatchEvent(new CustomEvent("gt:hero-slides-ready", { detail: { count: slides.length } }));
      clearEmptyNote(heroTrack, "slides");
    } else {
      setEmptyNote(heroTrack, "slides");
    }
  }

  const bySection = (section) => {
    const wanted = expandSectionAliases(section);
    return products.filter((product) => {
      const sections = normalizeSectionList(product.home_sections);
      const normalized = sections.flatMap((item) => Array.from(expandSectionAliases(item)));
      return normalized.some((item) => wanted.has(item));
    });
  };

  const fallbackBuckets = {
    featured: products.slice(0, 8),
    new_arrivals: products.slice(0, 8),
    bestseller: products.slice(0, 8),
    premium_choice: products.slice(0, 8),
    showcase_one: products.slice(0, 6),
    showcase_two: products.slice(6, 12).length ? products.slice(6, 12) : products.slice(0, 6)
  };

  if (carouselEls.length) {
    carouselEls.forEach((carousel) => {
      const key = carousel.getAttribute("data-carousel-key");
      const track = carousel.querySelector(".carousel-track");
      if (!track) return;
      const items = products.length ? bySection(key) : [];
      const finalItems = items.length ? items : (fallbackBuckets[key] || []);
      if (finalItems.length) {
        track.innerHTML = finalItems.map(mapProductCard).join("");
        clearEmptyNote(track, "products");
      } else {
        setEmptyNote(track, "products");
      }
    });
  }

  if (products.length) {
    const mapShowcaseProduct = (product) => ({
      id: product.id,
      name: product.title || "",
      type: product.subtitle || "Signature Watch",
      tagline: product.badge || "Signature",
      desc: product.description || product.short_desc || "",
      oldPrice: product.old_price ? `Rs. ${Number(product.old_price).toLocaleString()}` : "",
      newPrice: product.price ? `Rs. ${Number(product.price).toLocaleString()}` : "",
      images: normalizeImages(product.gallery).length ? normalizeImages(product.gallery) : normalizeImages(product.images),
      colors: normalizeCategoryList(product.colors).length ? normalizeCategoryList(product.colors) : ["Gold", "Silver", "Blue"],
      colorImages: product.color_images || {}
    });

    const showcaseOneSource = bySection("showcase_one").length ? bySection("showcase_one") : (fallbackBuckets.showcase_one || []);
    const showcaseOne = showcaseOneSource.map(mapShowcaseProduct);
    const showcaseOneIds = new Set(showcaseOne.map((item) => item.id));
    const showcaseTwoSource = bySection("showcase_two").length ? bySection("showcase_two") : (fallbackBuckets.showcase_two || []);
    let showcaseTwo = showcaseTwoSource
      .filter((product) => !showcaseOneIds.has(product.id))
      .map(mapShowcaseProduct);

    if (!showcaseTwo.length) {
      const secondFallback = products.filter((product) => !showcaseOneIds.has(product.id)).slice(0, 6);
      showcaseTwo = (secondFallback.length ? secondFallback : showcaseTwoSource).map(mapShowcaseProduct);
    }

    window.GT_SHOWCASE_DATA = [];
    window.GT_SHOWCASE_MAP = {
      showcase_one: showcaseOne,
      showcase_two: showcaseTwo
    };
  }

  if (productsGrid && products.length) {
    const categories = await fetchCategories();
    window.GT_CATEGORIES = categories;
    const categoryMap = (categories || []).reduce((acc, cat) => {
      const name = (cat.name || cat.slug || "").toString().trim().toLowerCase();
      const slug = slugify(cat.slug || cat.name || "");
      if (name && slug) acc[name] = slug;
      return acc;
    }, {});
    productsGrid.innerHTML = products.map((product) => mapShopCard(product, categoryMap)).join("");
    clearEmptyNote(productsGrid, "products");
  } else if (productsGrid) {
    setEmptyNote(productsGrid, "products");
  }

  if (categoriesGrid) {
    const categories = await fetchCategories();
    window.GT_CATEGORIES = categories;
    const baseCategory = {
      name: "All Products",
      slug: "all",
      description: "Explore every watch and accessory in one place.",
      image_url: "https://fpveczcpjwqkpgvqeapc.supabase.co/storage/v1/object/public/product-images/categories/category/1773649478801_all2.jfif"
    };
    const list = categories.length ? [baseCategory, ...categories] : [];
    if (list.length) {
      categoriesGrid.innerHTML = list.map(mapCategoryCard).join("");
      categoriesGrid.dataset.hasContent = "true";
      clearEmptyNote(categoriesGrid, "categories");
    } else {
      setEmptyNote(categoriesGrid, "categories");
    }
  }

  if (filterWrap) {
    const categories = await fetchCategories();
    window.GT_CATEGORIES = categories;
    if (categories.length) {
      const buttons = [
        { slug: "all", name: "All" },
        ...categories.map((cat) => ({
          slug: (cat.slug || cat.name || "").toLowerCase().replace(/\s+/g, "-"),
          name: cat.name || cat.slug || "Category"
        }))
      ];
      filterWrap.innerHTML = buttons
        .map((btn, index) => `<button class="filter-btn${index === 0 ? " is-active" : ""}" data-filter="${btn.slug}">${btn.name}</button>`)
        .join("");
      clearEmptyNote(filterWrap, "categories");
      window.initShopFilters?.();
    } else {
      setEmptyNote(filterWrap, "categories");
    }
  }

  if (blogGrid) {
    const blogs = await fetchBlogs();
    window.GT_BLOGS = blogs;
    if (blogs.length) {
      blogGrid.innerHTML = blogs.map(mapBlogCard).join("");
    }
  }

  if (!window.GT_BLOGS && (blogGrid || searchPage)) {
    window.GT_BLOGS = await fetchBlogs();
  }

  if (!window.GT_CATEGORIES) {
    window.GT_CATEGORIES = await fetchCategories();
  }

  window.GT_SEARCH_DATA = {
    products: window.GT_PRODUCTS || [],
    categories: window.GT_CATEGORIES || [],
    blogs: window.GT_BLOGS || []
  };

  if (reviewList) {
    const reviews = await fetchReviews();
    if (reviews.length) {
      reviewList.innerHTML = reviews.map(mapReview).join("");
      clearEmptyNote(reviewList, "reviews");
    } else {
      setEmptyNote(reviewList, "reviews");
    }
  }

  const offers = await fetchOffers();
  if (offers.length) {
    window.GT_ANNOUNCEMENTS = offers.map((offer) => offer.title || offer.description || "Offer");
  }
  window.GT_OFFERS = offers;

  finishLoading();
  const productPage = document.querySelector("[data-product-page]");
  if (productPage) {
    const params = new URLSearchParams(window.location.search);
    const watchParam = params.get("watch");
    if (watchParam) {
      let { data } = await supabase1.from("products").select("*").eq("slug", watchParam).single();
      if (!data && /^[0-9]+$/.test(watchParam)) {
        const res = await supabase1.from("products").select("*").eq("id", watchParam).single();
        data = res.data || null;
      }
      if (data) {
        window.GT_PRODUCT_DETAIL = data;
        const name = data.title || "Product";
        const desc = data.short_desc || data.description || "Premium watches and accessories from Glamtreasure.";
        const images = normalizeImages(data.images);
        const primaryImage = images[0] || "https://glamtreasure.shop/assets/images/logo.svg";
        const canonicalUrl = window.location.href.split("#")[0];
        document.title = `${name} | Glamtreasure`;
        setMetaTag('meta[name="description"]', "content", desc);
        setMetaTag('meta[property="og:title"]', "content", `${name} | Glamtreasure`);
        setMetaTag('meta[property="og:description"]', "content", desc);
        setMetaTag('meta[property="og:image"]', "content", primaryImage);
        setMetaTag('meta[property="og:url"]', "content", canonicalUrl);
        setCanonical(canonicalUrl);
        upsertJsonLd("product-jsonld", {
          "@context": "https://schema.org",
          "@type": "Product",
          "name": name,
          "image": images.length ? images : [primaryImage],
          "description": desc,
          "brand": { "@type": "Brand", "name": "Glamtreasure" },
          "offers": {
            "@type": "Offer",
            "priceCurrency": "INR",
            "price": data.price ? String(data.price) : undefined,
            "availability": data.stock === 0 ? "https://schema.org/OutOfStock" : "https://schema.org/InStock",
            "url": canonicalUrl
          }
        });
      }
    }
  }

  const blogPage = document.querySelector("[data-blog-page]");
  if (blogPage && supabase2) {
    const params = new URLSearchParams(window.location.search);
    const blogSlug = (params.get("slug") || "").trim();
    if (blogSlug) {
      const { data: blogBySlug } = await supabase2
        .from("blogs")
        .select("*")
        .eq("slug", blogSlug)
        .neq("is_active", false)
        .maybeSingle();

      const blogData = blogBySlug || null;
      if (blogData) {
        window.GT_BLOG_DETAIL = blogData;
        const name = blogData.title || "Blog";
        const desc = blogData.summary || "Glamtreasure style and accessory blog.";
        const image = blogData.image_url || "https://glamtreasure.shop/assets/images/logo.svg";
        const canonicalUrl = window.location.href.split("#")[0];
        document.title = `${name} | Glamtreasure Blog`;
        setMetaTag('meta[name="description"]', "content", desc);
        setMetaTag('meta[property="og:title"]', "content", `${name} | Glamtreasure Blog`);
        setMetaTag('meta[property="og:description"]', "content", desc);
        setMetaTag('meta[property="og:image"]', "content", image);
        setMetaTag('meta[property="og:url"]', "content", canonicalUrl);
        setCanonical(canonicalUrl);
      } else {
        window.GT_BLOG_DETAIL = null;
      }
    } else {
      window.GT_BLOG_DETAIL = null;
    }
  }

  window.dispatchEvent(new CustomEvent("gt:data-ready"));
})();

function finishLoading() {
  if (typeof setLoading === "function") {
    setLoading(false);
  }
}

window.addEventListener("load", finishLoading);




