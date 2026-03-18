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
  const showcases = Array.from(document.querySelectorAll("[data-watch-showcase]"));

  const renderSkeletons = () => {
    if (heroTrack) {
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
    const { data } = await supabase1.from("products").select("*").neq("is_active", false);
    return data || [];
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
    const { data } = await supabase1.from("blogs").select("*").neq("is_active", false).order("published_at", { ascending: false });
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

  const slugify = (text) =>
    (text || "")
      .toLowerCase()
      .replace(/[^a-z0-9\s-]/g, "")
      .trim()
      .replace(/\s+/g, "-");

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
      <article class="product-card reveal" data-category="${categorySlug}" data-tags="${tagList.join(",")}">
        <div class="product-thumb">
          <span class="product-tag">${product.badge || "Product"}</span>
          <img src="${image}" alt="${product.title || "Product"}" />
        </div>
        <div class="product-content">
          <h3 class="product-title">${product.title || ""}</h3>
          <div class="price">
            <strong>${price}</strong>
            <span>${oldPrice}</span>
          </div>
          <p class="rating">${product.short_desc || ""}</p>
          <a class="btn btn-primary" href="product-royal-crown-gold.html?watch=${encodeURIComponent(slugOrId)}">Buy Now</a>
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
    const url = blog.url || `blog-${blog.slug}.html`;
    const date = blog.published_at ? new Date(blog.published_at).toLocaleDateString() : "";
    return `
      <article class="blog-card reveal">
        <img src="${blog.image_url || "https://images.pexels.com/photos/190819/pexels-photo-190819.jpeg?auto=compress&cs=tinysrgb&w=1200"}" alt="${blog.title || "Blog"}" />
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

  if (heroTrack) {
    const slides = await fetchHeroSlides();
    if (slides.length) {
      heroTrack.innerHTML = slides
        .map((slide) => {
          return `
            <article class="hero-slide">
              <div class="hero-copy">
                <span class="eyebrow">${slide.eyebrow || "Collection"}</span>
                <h2>${slide.title || ""}</h2>
                <p>${slide.subtitle || ""}</p>
                <div class="btn-row">
                  <a class="btn btn-primary" href="${slide.primary_cta_link || "shop.html"}">${slide.primary_cta_label || "Shop Now"}</a>
                  <a class="btn btn-secondary" href="${slide.secondary_cta_link || "categories.html"}">${slide.secondary_cta_label || "Explore"}</a>
                </div>
              </div>
              <div class="hero-media">
                <img src="${slide.image_url || ""}" alt="${slide.title || "Hero"}" />
              </div>
            </article>
          `;
        })
        .join("");
      clearEmptyNote(heroTrack, "slides");
    } else {
      setEmptyNote(heroTrack, "slides");
    }
  }

  let products = [];
  if (carouselEls.length || productsGrid || reviewList) {
    products = await fetchProducts();
  }
  window.GT_PRODUCTS = products;

  if (carouselEls.length) {
    const bySection = (section) => products.filter((product) => (product.home_sections || []).includes(section));
    carouselEls.forEach((carousel) => {
      const key = carousel.getAttribute("data-carousel-key");
      const track = carousel.querySelector(".carousel-track");
      if (!track) return;
      const items = products.length ? bySection(key) : [];
      if (items.length) {
        track.innerHTML = items.map(mapProductCard).join("");
        clearEmptyNote(track, "products");
      } else {
        setEmptyNote(track, "products");
      }
    });

    if (products.length) {
      const showcaseProducts = bySection("signature_showcase").map((product) => {
        return {
          name: product.title || "",
          type: product.subtitle || "Signature Watch",
          tagline: product.badge || "Signature",
          desc: product.description || product.short_desc || "",
          oldPrice: product.old_price ? `Rs. ${Number(product.old_price).toLocaleString()}` : "",
          newPrice: product.price ? `Rs. ${Number(product.price).toLocaleString()}` : "",
          images: product.gallery && product.gallery.length ? product.gallery : normalizeImages(product.images),
          colors: product.colors && product.colors.length ? product.colors : ["Gold", "Silver", "Blue"],
          colorImages: product.color_images || {}
        };
      });

      if (showcaseProducts.length) {
        window.GT_SHOWCASE_DATA = showcaseProducts;
      }
    }
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

  if (!window.GT_BLOGS) {
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
})();

function finishLoading() {
  if (typeof setLoading === "function") {
    setLoading(false);
  }
}

window.addEventListener("load", finishLoading);

