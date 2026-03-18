(() => {
  const grid = document.querySelector("[data-offers-grid]");

  const formatPrice = (value) => {
    const num = Number(value || 0);
    if (!Number.isFinite(num)) return "";
    return `Rs. ${num.toLocaleString()}`;
  };

  const formatOfferRule = (offer, productsById = {}) => {
    const rules = offer.rules || {};
    if (offer.type === "bogo") {
      const buyProduct = productsById[rules.buy_product_id] || {};
      const getProduct = productsById[rules.get_product_id] || {};
      return {
        title: "Buy One Get One",
        detail: `Buy ${rules.buy_qty || 1} ${buyProduct.title || "product"} · Get ${rules.get_qty || 1} ${getProduct.title || "product"}`
      };
    }
    const product = productsById[rules.product_id] || {};
    const value = rules.discount_type === "percent"
      ? `${Number(rules.discount_value || 0)}% OFF`
      : `${formatPrice(rules.discount_value)} OFF`;
    return {
      title: "Discount Offer",
      detail: `${value} on ${product.title || "selected product"}`
    };
  };

  const renderOffers = (offers = [], productsById = {}) => {
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
      const rule = formatOfferRule(offer, productsById);
      const card = document.createElement("article");
      card.className = "feature-card reveal";
      card.innerHTML = `
        <div class="pill" style="margin-bottom:0.6rem;">${offer.badge || rule.title}</div>
        <h3>${offer.title || rule.title}</h3>
        <p>${offer.description || rule.detail}</p>
        ${offer.code ? `<div class="coupon-box" style="margin-top:0.8rem;"><strong>Use Code:</strong> ${offer.code}</div>` : ""}
        <div class="btn-row" style="margin-top:1rem;">
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
    const productsById = products.reduce((acc, product) => {
      if (product.id) acc[product.id] = product;
      return acc;
    }, {});
    renderOffers(offers, productsById);
  };

  const boot = async () => {
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
