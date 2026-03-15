(() => {
  const addBtn = document.querySelector("[data-add-to-cart]");
  const statusEl = document.querySelector("[data-cart-status]");
  const buyNow = document.querySelector("[data-product-buy-link]");

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

  const buildItem = () => {
    const title = document.querySelector("[data-product-name]")?.textContent?.trim() || "Product";
    const price = parsePrice(document.querySelector("[data-product-price]")?.textContent);
    const image = document.querySelector("#main-product-image")?.getAttribute("src") || "";
    const qty = Number(document.querySelector("[data-qty-input]")?.value || 1);
    const strap = document.querySelector("#strap-select")?.value || "";
    const size = document.querySelector("#size-select")?.value || "";
    const color = document.querySelector("[data-selected-color]")?.textContent || "";
    const params = new URLSearchParams(window.location.search);
    const productId = window.GT_PRODUCT_DETAIL?.id || params.get("watch") || title;

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

  const handleAdd = async () => {
    if (!window.GTStore) return;
    await window.GTStore.addToCart(buildItem());
    setStatus("Added to cart. View cart to checkout.", false);
  };

  const handleBuyNow = async (event) => {
    event.preventDefault();
    if (!window.GTStore) return;
    const session = await window.GTStore.getSession();
    if (!session) {
      setStatus("Please login to continue.", true);
      window.location.href = "login.html";
      return;
    }
    await window.GTStore.addToCart(buildItem());
    window.location.href = "checkout.html";
  };

  if (addBtn) {
    addBtn.addEventListener("click", handleAdd);
  }

  if (buyNow) {
    buyNow.addEventListener("click", handleBuyNow);
  }
})();
