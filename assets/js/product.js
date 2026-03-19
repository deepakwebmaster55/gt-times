(() => {
  const addBtn = document.querySelector("[data-add-to-cart]");
  const statusEl = document.querySelector("[data-cart-status]");
  const buyNow = document.querySelector("[data-product-buy-link]");
  const shareBtn = document.querySelector("[data-share-product]");
  let isSubmitting = false;

  const parsePrice = (value) => {
    const num = Number(String(value || "").replace(/[^0-9.]/g, ""));
    return Number.isFinite(num) ? num : 0;
  };

  const setStatus = (message, isError) => {
    if (!statusEl) return;
    statusEl.textContent = message;
    statusEl.classList.toggle("is-error", !!isError);
    statusEl.classList.toggle("is-success", !isError);
  };

  const canOrderCurrentProduct = () => {
    const detail = window.GT_PRODUCT_DETAIL || {};
    if (detail.is_active === false) {
      setStatus("This product is inactive right now.", true);
      return false;
    }
    if (Number(detail.stock_quantity || 0) <= 0) {
      setStatus("This product is out of stock.", true);
      return false;
    }
    return true;
  };

  const buildItem = () => {
    const title = document.querySelector("[data-product-name]")?.textContent?.trim() || "Product";
    const price = Number(window.GT_PRODUCT_DETAIL?.price || 0) || parsePrice(document.querySelector("[data-product-price]")?.textContent);
    const image = document.querySelector("#main-product-image")?.getAttribute("src") || normalizeImage(window.GT_PRODUCT_DETAIL?.images) || "";
    const qty = Number(document.querySelector("[data-qty-input]")?.value || 1);
    const strap = document.querySelector("#strap-select")?.value || "";
    const size = document.querySelector("#size-select")?.value || "";
    const color = document.querySelector("[data-selected-color]")?.textContent || "";
    const params = new URLSearchParams(window.location.search);
    const productId = window.GT_PRODUCT_DETAIL?.id || window.GT_PRODUCT_DETAIL?.slug || params.get("watch") || title;

    const options = {
      strap: strap || undefined,
      size: size || undefined,
      color: color || undefined
    };

    return {
      product_id: productId,
      title,
      price,
      image_url: image,
      quantity: qty,
      options
    };
  };

  const buildShareUrl = () => {
    const detail = window.GT_PRODUCT_DETAIL || {};
    const params = new URLSearchParams(window.location.search);
    const watchParam = detail.slug || detail.id || params.get("watch") || "";
    const path = watchParam
      ? `product-royal-crown-gold.html?watch=${encodeURIComponent(String(watchParam))}`
      : "product-royal-crown-gold.html";

    if (window.location.protocol === "file:") {
      return `https://glamtreasure.shop/${path}`;
    }
    return new URL(path, window.location.href).href;
  };

  const handleShare = async () => {
    const title = document.querySelector("[data-product-name]")?.textContent?.trim() || "Glamtreasure Product";
    const price = document.querySelector("[data-product-price]")?.textContent?.trim() || "";
    const url = buildShareUrl();
    const text = price ? `${title} - ${price}` : title;

    if (navigator.share) {
      try {
        await navigator.share({ title, text, url });
        setStatus("Product link shared.", false);
        return;
      } catch (error) {
        if (error && error.name === "AbortError") return;
      }
    }

    if (navigator.clipboard?.writeText) {
      try {
        await navigator.clipboard.writeText(url);
        setStatus("Product link copied. Share it anywhere.", false);
        return;
      } catch (error) {}
    }

    window.prompt("Copy this product link:", url);
  };

  function normalizeImage(value) {
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
  }

  const handleAdd = async () => {
    if (!window.GTStore) return;
    if (!canOrderCurrentProduct()) return;
    const session = await window.GTStore.getSession();
    const result = await window.GTStore.addToCart(buildItem());
    if (result?.error) {
      setStatus("Saved locally. Login cart sync will retry.", true);
      return;
    }
    if (!session) {
      setStatus("Added to cart. Login first to buy this item.", true);
      return;
    }
    setStatus("Added to cart. View cart to checkout.", false);
  };

  const handleBuyNow = async (event) => {
    event.preventDefault();
    if (!window.GTStore || isSubmitting) return;
    if (!canOrderCurrentProduct()) return;
    isSubmitting = true;
    try {
      const result = await window.GTStore.addToCart(buildItem());
      if (result?.error) {
        setStatus("Cart synced locally. Continuing to checkout.", true);
      }
      const session = await window.GTStore.getSession();
      if (!session) {
        setStatus("Please login first to buy this item.", true);
        try {
          const checkoutUrl = new URL("checkout.html", window.location.href).href;
          sessionStorage.setItem("gt_return_to", checkoutUrl);
        } catch (error) {
          sessionStorage.setItem("gt_return_to", "checkout.html");
        }
        window.location.href = "login.html";
        return;
      }
      window.location.href = "checkout.html";
    } finally {
      isSubmitting = false;
    }
  };

  if (addBtn) {
    addBtn.addEventListener("click", handleAdd);
  }

  if (buyNow) {
    buyNow.addEventListener("click", handleBuyNow);
  }

  if (shareBtn) {
    shareBtn.addEventListener("click", handleShare);
  }
})();
