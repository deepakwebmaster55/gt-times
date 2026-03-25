(() => {
  const grid = document.querySelector("[data-offers-grid]");
  const META_PREFIX = "<!--GTMETA:";
  const META_SUFFIX = "-->";

  const formatPrice = (value) => {
    const num = Number(value || 0);
    if (!Number.isFinite(num)) return "";
    return `Rs. ${num.toLocaleString()}`;
  };

  const normalizeRules = (rules) => {
    if (!rules) return {};
    if (typeof rules === "string") {
      try {
        return JSON.parse(rules);
      } catch (error) {
        return {};
      }
    }
    if (typeof rules === "object") return rules;
    return {};
  };

  const normalizeOffer = (offer) => {
    const row = offer && typeof offer === "object" ? offer : {};
    const rawDescription = typeof row.description === "string" ? row.description : "";
    const start = rawDescription.indexOf(META_PREFIX);
    const end = rawDescription.indexOf(META_SUFFIX, start + META_PREFIX.length);
    let description = rawDescription;
    let meta = {};

    if (start !== -1 && end !== -1) {
      description = rawDescription.slice(0, start).trim();
      try {
        meta = JSON.parse(rawDescription.slice(start + META_PREFIX.length, end)) || {};
      } catch (error) {
        meta = {};
      }
    }

    return {
      ...row,
      description,
      badge: row.badge || meta.badge || "",
      type: row.type || meta.type || "discount",
      rules: row.rules || meta.rules || {}
    };
  };

  const getProductLink = (product) => {
    const key = product?.slug || product?.id || "";
    if (!key) return "shop.html";
    return `product-royal-crown-gold.html?watch=${encodeURIComponent(key)}`;
  };

  const renderOfferProduct = (product, label) => {
    if (!product) {
      return `
        <div class="offer-product">
          <div>
            <div class="offer-kicker">${label}</div>
            <div class="offer-name">Product not linked yet</div>
            <div class="offer-muted">Assign a product in admin panel.</div>
          </div>
        </div>
      `;
    }
    const image = Array.isArray(product.images) ? product.images[0] : (product.images || "");
    const price = product.price ? formatPrice(product.price) : "";
    return `
      <div class="offer-product">
        <img src="${image}" alt="${product.title || "Product"}" />
        <div>
          <div class="offer-kicker">${label}</div>
          <div class="offer-name">${product.title || "Product"}</div>
          ${price ? `<div class="offer-muted">${price}</div>` : ""}
          <a class="offer-link" href="${getProductLink(product)}">View product</a>
        </div>
      </div>
    `;
  };

  const getPrimaryOfferProduct = (offer, productsByKey = {}) => {
    const rules = normalizeRules(offer.rules);
    const key = offer.type === "bogo" ? rules.buy_product_id : rules.product_id;
    return productsByKey[String(key || "")] || productsByKey[String(key || "").toLowerCase()] || null;
  };

  const getOfferCartQuantity = (offer) => {
    const rules = normalizeRules(offer.rules);
    return offer.type === "bogo" ? Math.max(1, Number(rules.buy_qty || 1)) : 1;
  };

  const normalizeImage = (value) => {
    if (Array.isArray(value)) return value[0] || "";
    if (typeof value === "string") {
      const trimmed = value.trim();
      if (!trimmed) return "";
      if (trimmed.startsWith("{") && trimmed.endsWith("}")) {
        return trimmed
          .slice(1, -1)
          .split(",")
          .map((item) => item.replace(/^\"|\"$/g, "").trim())
          .filter(Boolean)[0] || "";
      }
      if (trimmed.startsWith("[")) {
        try {
          const parsed = JSON.parse(trimmed);
          return Array.isArray(parsed) ? parsed[0] || "" : "";
        } catch (error) {
          return trimmed;
        }
      }
      return trimmed;
    }
    return "";
  };

  const showOfferNotice = (message, isError) => {
    if (window.GTUI?.showNoticeModal) {
      window.GTUI.showNoticeModal({
        eyebrow: isError ? "Offer Issue" : "Offer Selected",
        title: isError ? "Unable to Continue" : "Offer Added",
        message
      });
      return;
    }
    window.alert(message);
  };

  const startOfferCheckout = async (offer, productsByKey = {}) => {
    const product = getPrimaryOfferProduct(offer, productsByKey);
    if (!product) {
      showOfferNotice("This offer does not have a linked product yet. Please update it in admin.", true);
      return;
    }
    if (!window.GTStore?.addToCart) {
      showOfferNotice("Cart system is not ready yet. Please refresh and try again.", true);
      return;
    }

    const quantity = getOfferCartQuantity(offer);
    const activeOffer = {
      id: offer.id || "",
      title: offer.title || "",
      code: offer.code || "",
      type: offer.type || "discount",
      rules: normalizeRules(offer.rules),
      product_id: product.id || product.slug || "",
      product_slug: product.slug || "",
      product_title: product.title || "Product"
    };

    window.GTStore.setActiveOffer?.(activeOffer);

    const result = await window.GTStore.addToCart({
      product_id: product.id || product.slug || "",
      title: product.title || "Product",
      price: Number(product.price || 0),
      image_url: normalizeImage(product.images),
      quantity,
      options: {
        offer_id: offer.id || "",
        offer_code: offer.code || "",
        offer_type: offer.type || "discount"
      }
    });

    if (result?.authRequired) {
      try {
        const checkoutUrl = new URL("checkout.html", window.location.href).href;
        sessionStorage.setItem("gt_return_to", checkoutUrl);
      } catch (error) {
        sessionStorage.setItem("gt_return_to", "checkout.html");
      }
      if (window.GTUI?.showNoticeModal) {
        window.GTUI.showNoticeModal({
          eyebrow: "Login Required",
          title: "Login First",
          message: "Please login first to continue with this offer.",
          primaryAction: {
            label: "Login",
            href: "login.html"
          }
        });
      } else {
        showOfferNotice("Please login first to continue with this offer.", true);
      }
      return;
    }

    if (result?.error) {
      showOfferNotice("We could not add this offer product to cart. Please try again.", true);
      return;
    }

    window.location.href = "checkout.html";
  };

  const formatOfferRule = (offer, productsByKey = {}) => {
    const rules = normalizeRules(offer.rules);
    if (offer.type === "bogo") {
      const buyProduct = productsByKey[String(rules.buy_product_id || "")] || productsByKey[String(rules.buy_product_id || "").toLowerCase()];
      const getProduct = productsByKey[String(rules.get_product_id || "")] || productsByKey[String(rules.get_product_id || "").toLowerCase()];
      return {
        title: "Buy One Get One",
        detail: `Buy ${rules.buy_qty || 1} · Get ${rules.get_qty || 1}`,
        blocks: [
          renderOfferProduct(buyProduct, `Buy ${rules.buy_qty || 1}`),
          renderOfferProduct(getProduct, `Get ${rules.get_qty || 1}`)
        ]
      };
    }

    const product = productsByKey[String(rules.product_id || "")] || productsByKey[String(rules.product_id || "").toLowerCase()];
    const value = rules.discount_type === "percent"
      ? `${Number(rules.discount_value || 0)}% OFF`
      : `${formatPrice(rules.discount_value)} OFF`;
    return {
      title: "Discount Offer",
      detail: `${value} on selected products`,
      blocks: [renderOfferProduct(product, value)]
    };
  };

  const renderSkeletons = () => {
    if (!grid) return;
    grid.innerHTML = Array.from({ length: 4 }).map(() => `
      <article class="feature-card offer-card">
        <div class="skeleton-line" style="width:40%; margin-bottom:0.6rem;"></div>
        <div class="skeleton-line" style="width:70%; margin-bottom:0.4rem;"></div>
        <div class="skeleton-line" style="width:90%;"></div>
        <div class="skeleton-block" style="height:84px; margin-top:0.8rem;"></div>
      </article>
    `).join("");
  };

  const renderOffers = (offers = [], productsByKey = {}) => {
    if (!grid) return;
    grid.innerHTML = "";
    if (!offers.length) {
      const note = document.createElement("p");
      note.className = "empty-note";
      note.textContent = "No offers yet. We will add soon.";
      grid.appendChild(note);
      return;
    }

    offers.forEach((item) => {
      const offer = normalizeOffer(item);
      const rule = formatOfferRule(offer, productsByKey);
      const card = document.createElement("article");
      card.className = "feature-card offer-card is-visible";
      card.innerHTML = `
        <div class="offer-meta">
          <span class="pill">${offer.badge || rule.title}</span>
          <span class="offer-type">${offer.type === "bogo" ? "BOGO" : "Discount"}</span>
        </div>
        <h3>${offer.title || rule.title}</h3>
        <p>${offer.description || rule.detail}</p>
        <div class="offer-rule">${rule.detail}</div>
        <div class="offer-products">
          ${rule.blocks.join("")}
        </div>
        ${offer.code ? `<div class="coupon-box"><strong>Use Code:</strong> ${offer.code}</div>` : ""}
        <div class="btn-row">
          <a class="btn btn-primary" href="#" data-offer-checkout>Shop Offer</a>
          <a class="btn btn-secondary" href="contact.html">Ask Support</a>
        </div>
      `;
      const checkoutBtn = card.querySelector("[data-offer-checkout]");
      if (checkoutBtn) {
        checkoutBtn.addEventListener("click", async (event) => {
          event.preventDefault();
          await startOfferCheckout(offer, productsByKey);
        });
      }
      grid.appendChild(card);
    });
  };

  const fetchPublicOffers = async () => {
    const config = window.GT_CONFIG?.supabase2 || {};
    const baseUrl = config.functionsUrl || (config.url ? `${config.url}/functions/v1` : "");
    if (!baseUrl) return [];

    try {
      const response = await fetch(`${baseUrl}/admin-offers`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json"
        },
        body: JSON.stringify({ action: "list_public" })
      });

      const text = await response.text();
      if (!response.ok || !text) return [];

      const payload = JSON.parse(text);
      return Array.isArray(payload?.offers) ? payload.offers : [];
    } catch (error) {
      return [];
    }
  };

  const fetchProductsForOffers = async () => {
    const client = window.GT_SUPABASE1;
    if (!client) return [];

    try {
      const primary = await client
        .from("products")
        .select("*")
        .eq("is_active", true);

      if (!primary.error) {
        return Array.isArray(primary.data) ? primary.data : [];
      }

      const fallback = await client
        .from("products")
        .select("*");

      if (!fallback.error) {
        return Array.isArray(fallback.data)
          ? fallback.data.filter((product) => product?.is_active !== false)
          : [];
      }
    } catch (error) {
      return [];
    }

    return [];
  };

  const loadOffers = async () => {
    let offers = window.GT_OFFERS || [];
    if (!offers.length) {
      offers = await fetchPublicOffers();
    }
    offers = Array.isArray(offers) ? offers.map((offer) => normalizeOffer(offer)) : [];

    let products = window.GT_PRODUCTS || [];
    if (!products.length) {
      products = await fetchProductsForOffers();
      window.GT_PRODUCTS = products;
    }
    const productsByKey = products.reduce((acc, product) => {
      if (product.id) acc[String(product.id)] = product;
      if (product.slug) acc[String(product.slug).toLowerCase()] = product;
      return acc;
    }, {});
    renderOffers(offers, productsByKey);
  };

  const boot = async () => {
    renderSkeletons();
    loadOffers();
    if (window.GT_DATA_READY && typeof window.GT_DATA_READY.finally === "function") {
      window.GT_DATA_READY.finally(() => {
        loadOffers();
      });
    }
  };

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", boot);
  } else {
    boot();
  }
})();
