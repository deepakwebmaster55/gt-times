(() => {
  const grid = document.querySelector("[data-offers-grid]");

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

    offers.forEach((offer) => {
      const rule = formatOfferRule(offer, productsByKey);
      const card = document.createElement("article");
      card.className = "feature-card reveal offer-card";
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
          <a class="btn btn-primary" href="shop.html">Shop Offer</a>
          <a class="btn btn-secondary" href="contact.html">Ask Support</a>
        </div>
      `;
      grid.appendChild(card);
    });
  };

  const loadOffers = async () => {
    const offers = window.GT_OFFERS || [];
    const products = window.GT_PRODUCTS || [];
    const productsByKey = products.reduce((acc, product) => {
      if (product.id) acc[String(product.id)] = product;
      if (product.slug) acc[String(product.slug).toLowerCase()] = product;
      return acc;
    }, {});
    renderOffers(offers, productsByKey);
  };

  const boot = async () => {
    renderSkeletons();
    if (window.GT_DATA_READY && typeof window.GT_DATA_READY.finally === "function") {
      await window.GT_DATA_READY.finally(() => {});
    }
    loadOffers();
  };

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", boot);
  } else {
    boot();
  }
})();
