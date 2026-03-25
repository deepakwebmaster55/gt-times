(() => {
  const itemsEl = document.querySelector("[data-checkout-items]");
  const emptyNote = document.querySelector("[data-checkout-empty]");
  const subtotalEl = document.querySelector("[data-checkout-subtotal]");
  const shippingEl = document.querySelector("[data-checkout-shipping]");
  const discountRowEl = document.querySelector("[data-checkout-discount-row]");
  const discountEl = document.querySelector("[data-checkout-discount]");
  const offerNoteEl = document.querySelector("[data-checkout-offer-note]");
  const totalEl = document.querySelector("[data-checkout-total]");
  const addressSelect = document.querySelector("[data-checkout-address]");
  const addressNote = document.querySelector("[data-checkout-address-note]");
  const phoneNote = document.querySelector("[data-checkout-phone-note]");
  const placeOrderBtn = document.querySelector("[data-place-order]");
  const statusEl = document.querySelector("[data-checkout-status]");
  let isPlacingOrder = false;

  const catalogConfig = window.GT_CONFIG?.supabase1 || {};
  const catalogClient = window.supabase && catalogConfig.url && catalogConfig.anonKey
    ? window.supabase.createClient(catalogConfig.url, catalogConfig.anonKey)
    : null;

  const formatPrice = (value) => `Rs. ${Number(value || 0).toLocaleString()}`;

  const setStatus = (message, isError) => {
    if (!statusEl) return;
    statusEl.textContent = message;
    statusEl.style.color = isError ? "#c13a2e" : "";
  };

  const normalizePhone = (value) => {
    const digits = String(value || "").replace(/\D/g, "");
    if (!digits) return "";
    if (digits.startsWith("91") && digits.length === 12) return `+${digits}`;
    if (digits.length === 10) return `+91${digits}`;
    if (digits.length >= 11 && digits.length <= 15) return `+${digits}`;
    return "";
  };

  const calcTotals = (items) => {
    const subtotal = items.reduce((sum, item) => sum + Number(item.price || 0) * Number(item.quantity || 0), 0);
    const shipping = subtotal >= 5000 ? 0 : items.length ? 199 : 0;
    const total = subtotal + shipping;
    return { subtotal, shipping, total };
  };

  const normalizeImages = (value) => {
    if (Array.isArray(value)) return value;
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
          return Array.isArray(parsed) ? parsed : [];
        } catch (error) {
          return [trimmed];
        }
      }
      return [trimmed];
    }
    return value ? [value] : [];
  };

  const getCanonicalItems = async (items) => {
    if (!catalogClient || !items.length) return items;

    const productKeys = Array.from(new Set(items.map((item) => String(item.product_id || "").trim()).filter(Boolean)));
    if (!productKeys.length) return items;

    const [byIdRes, bySlugRes] = await Promise.all([
      catalogClient.from("products").select("id, slug, title, price, images, stock_quantity, is_active").in("id", productKeys),
      catalogClient.from("products").select("id, slug, title, price, images, stock_quantity, is_active").in("slug", productKeys)
    ]);

    const lookup = new Map();
    [...(byIdRes.data || []), ...(bySlugRes.data || [])].forEach((product) => {
      if (product?.id !== undefined && product?.id !== null) {
        lookup.set(String(product.id), product);
      }
      if (product?.slug) {
        lookup.set(String(product.slug), product);
      }
    });

    const canonicalItems = items.map((item) => {
      const match = lookup.get(String(item.product_id || "").trim());
      if (!match) return item;
      return {
        ...item,
        _catalog_id: match.id,
        _catalog_slug: match.slug || "",
        _stock_quantity: Number(match.stock_quantity || 0),
        _is_active: match.is_active !== false,
        title: match.title || item.title,
        price: Number(match.price || 0) || Number(item.price || 0),
        image_url: normalizeImages(match.images)[0] || item.image_url
      };
    });

    const session = await window.GTStore.getSession();
    if (session && window.GTStore?.client) {
      for (const item of canonicalItems) {
        if (!item.id) continue;
        await window.GTStore.client
          .from("cart_items")
          .update({
            title: item.title,
            price: item.price,
            image_url: item.image_url
          })
          .eq("id", item.id);
      }
    } else {
      localStorage.setItem("gt_cart", JSON.stringify(canonicalItems));
    }

    return canonicalItems;
  };

  const getItemKeys = (item) => {
    const keys = new Set();
    if (item.product_id) keys.add(String(item.product_id));
    if (item._catalog_id) keys.add(String(item._catalog_id));
    if (item._catalog_slug) keys.add(String(item._catalog_slug));
    return keys;
  };

  const matchesProduct = (item, target) => {
    const wanted = String(target || "").trim();
    if (!wanted) return false;
    const lower = wanted.toLowerCase();
    return Array.from(getItemKeys(item)).some((key) => key === wanted || key.toLowerCase() === lower);
  };

  const fetchOfferProducts = async (offer) => {
    if (!catalogClient || !offer?.rules) return {};
    const keys = [offer.rules.product_id, offer.rules.buy_product_id, offer.rules.get_product_id]
      .filter(Boolean)
      .map((value) => String(value));
    if (!keys.length) return {};

    const [byIdRes, bySlugRes] = await Promise.all([
      catalogClient.from("products").select("id, slug, title, price, images, stock_quantity, is_active").in("id", keys),
      catalogClient.from("products").select("id, slug, title, price, images, stock_quantity, is_active").in("slug", keys)
    ]);

    const lookup = {};
    [...(byIdRes.data || []), ...(bySlugRes.data || [])].forEach((product) => {
      if (product?.id) lookup[String(product.id)] = product;
      if (product?.slug) lookup[String(product.slug)] = product;
    });
    return lookup;
  };

  const getOfferSummary = async (items) => {
    const base = calcTotals(items);
    const empty = {
      ...base,
      discount: 0,
      total: base.total,
      applied: false,
      note: "",
      bonusItems: []
    };
    const offer = window.GTStore?.getActiveOffer?.();
    if (!offer || !items.length) return empty;

    const rules = offer.rules && typeof offer.rules === "object" ? offer.rules : {};
    const productLookup = await fetchOfferProducts(offer);

    if (offer.type === "bogo") {
      const buyQty = Math.max(1, Number(rules.buy_qty || 1));
      const getQty = Math.max(1, Number(rules.get_qty || 1));
      const matchingItems = items.filter((item) => matchesProduct(item, rules.buy_product_id));
      const boughtQty = matchingItems.reduce((sum, item) => sum + Number(item.quantity || 0), 0);
      const bundles = Math.floor(boughtQty / buyQty);
      if (bundles < 1) {
        return { ...empty, note: `Add ${buyQty} of the buy product to activate this BOGO offer.` };
      }

      const rewardUnits = bundles * getQty;
      const rewardProduct = productLookup[String(rules.get_product_id || "")] || matchingItems[0] || null;
      const rewardPrice = Number(rewardProduct?.price || 0);
      const discount = Math.max(0, rewardUnits * rewardPrice);
      const bonusItems = rewardUnits > 0 ? [{
        product_id: rewardProduct?.id || rewardProduct?.slug || rules.get_product_id || "",
        title: rewardProduct?.title || "Free Offer Item",
        quantity: rewardUnits,
        price: 0,
        _catalog_id: rewardProduct?.id || "",
        _catalog_slug: rewardProduct?.slug || "",
        _stock_quantity: Number(rewardProduct?.stock_quantity || 0),
        _is_active: rewardProduct?.is_active !== false
      }] : [];

      return {
        ...base,
        discount,
        total: Math.max(0, base.total - discount),
        applied: discount > 0,
        note: discount > 0
          ? `BOGO applied: ${rewardUnits} free item(s) will be included with this order.`
          : "BOGO is selected, but the reward item is not priced yet.",
        bonusItems
      };
    }

    const matchingItems = items.filter((item) => matchesProduct(item, rules.product_id));
    const matchedTotal = matchingItems.reduce((sum, item) => sum + Number(item.price || 0) * Number(item.quantity || 0), 0);
    if (!matchedTotal) {
      return { ...empty, note: "Add the linked offer product to apply this discount." };
    }

    const discount = rules.discount_type === "flat"
      ? Math.min(Number(rules.discount_value || 0), matchedTotal)
      : Math.min(matchedTotal, (matchedTotal * Math.max(0, Number(rules.discount_value || 0))) / 100);

    return {
      ...base,
      discount,
      total: Math.max(0, base.total - discount),
      applied: discount > 0,
      note: discount > 0 ? `${offer.title || "Offer"} applied.` : "Offer selected but no discount was calculated.",
      bonusItems: []
    };
  };

  const ensureStockAvailable = (items, bonusItems = []) => {
    for (const item of [...items, ...bonusItems]) {
      const title = item.title || "Product";
      const quantity = Number(item.quantity || 0);
      const stockQuantity = Number(item._stock_quantity || 0);
      if (item._is_active === false) {
        setStatus(`${title} is currently inactive and cannot be ordered.`, true);
        return false;
      }
      if (stockQuantity && quantity > stockQuantity) {
        setStatus(`Only ${stockQuantity} unit(s) left for ${title}.`, true);
        return false;
      }
    }
    return true;
  };

  const updateCatalogStock = async (items) => {
    if (!catalogClient) return;
    const nowIso = new Date().toISOString();
    for (const item of items) {
      const catalogId = item._catalog_id || item.product_id;
      if (!catalogId) continue;
      const remaining = Math.max(0, Number(item._stock_quantity || 0) - Number(item.quantity || 0));
      const { error } = await catalogClient
        .from("products")
        .update({
          stock_quantity: remaining,
          stock_updated_at: nowIso,
          stock: remaining > 0 ? "In stock" : "Out of stock"
        })
        .eq("id", catalogId);
      if (error) {
        throw error;
      }
    }
  };

  const renderItems = async (items) => {
    if (!itemsEl) return;
    itemsEl.innerHTML = "";
    if (!items.length) {
      if (emptyNote) emptyNote.style.display = "block";
      await updateSummary([]);
      return;
    }
    if (emptyNote) emptyNote.style.display = "none";
    items.forEach((item) => {
      const row = document.createElement("div");
      row.className = "cart-item";
      const options = item.options || {};
      const optionText = Object.keys(options)
        .map((key) => `${key}: ${options[key]}`)
        .join(" · ");

      row.innerHTML = `
        <div class="cart-thumb">
          <img src="${item.image_url || "assets/images/watch-classic.svg"}" alt="${item.title || "Product"}" />
        </div>
        <div class="cart-info">
          <h4>${item.title || "Product"}</h4>
          <p class="small">${optionText || "Standard selection"}</p>
          <p class="small">Qty: ${item.quantity || 1}</p>
        </div>
        <div class="cart-price">${formatPrice(item.price || 0)}</div>
      `;

      itemsEl.appendChild(row);
    });
    await updateSummary(items);
  };

  const updateSummary = async (items) => {
    const totals = await getOfferSummary(items);
    if (subtotalEl) subtotalEl.textContent = formatPrice(totals.subtotal);
    if (shippingEl) shippingEl.textContent = totals.shipping === 0 ? "Free" : formatPrice(totals.shipping);
    if (discountRowEl) discountRowEl.style.display = totals.discount > 0 ? "flex" : "none";
    if (discountEl) discountEl.textContent = `-${formatPrice(totals.discount)}`;
    if (offerNoteEl) {
      offerNoteEl.style.display = totals.note ? "block" : "none";
      offerNoteEl.textContent = totals.note || "";
    }
    if (totalEl) totalEl.textContent = formatPrice(totals.total);
    return totals;
  };

  const loadAddresses = async () => {
    if (!addressSelect || !window.GTStore?.client) return;
    const session = await window.GTStore.getSession();
    if (!session) {
      addressSelect.innerHTML = "<option value=\"\">Select address</option>";
      if (addressNote) addressNote.textContent = "Login to choose a saved address.";
      if (phoneNote) {
        phoneNote.innerHTML = "<strong>Phone verification:</strong> Login first, then verify your phone in Account.";
      }
      return;
    }
    const { data } = await window.GTStore.client
      .from("addresses")
      .select("id,label,line1,line2,city,state,postal_code,country,is_default")
      .eq("user_id", session.user.id)
      .order("is_default", { ascending: false });
    const addresses = data || [];
    addressSelect.innerHTML = ["<option value=\"\">Select address</option>"]
      .concat(addresses.map((addr) => {
        const parts = [addr.line1, addr.line2, addr.city, addr.state, addr.postal_code, addr.country]
          .filter(Boolean)
          .join(", ");
        return `<option value="${addr.id}">${addr.label || "Address"} - ${parts}</option>`;
      }))
      .join("");
    const defaultAddress = addresses.find((addr) => addr.is_default);
    if (defaultAddress) {
      addressSelect.value = defaultAddress.id;
    }
    if (addressNote) addressNote.textContent = addresses.length ? "" : "Add an address in your account first.";
    await ensurePhone(session, false);
  };

  const ensurePhone = async (session, showErrors = true) => {
    const { data } = await window.GTStore.client
      .from("profiles")
      .select("phone, phone_verified, verified_phone")
      .eq("id", session.user.id)
      .maybeSingle();
    const normalizedPhone = normalizePhone(data?.phone || "");
    const isVerified = !!(data?.phone_verified && normalizedPhone && data?.verified_phone === normalizedPhone);
    if (phoneNote) {
      phoneNote.innerHTML = isVerified
        ? `<strong>Phone verification:</strong> ${normalizedPhone} is verified for this account.`
        : "<strong>Phone verification:</strong> Verify your phone in Account before placing a COD order.";
    }
    if (!normalizedPhone) {
      if (showErrors) setStatus("Please add your phone number in Account before ordering.", true);
      return false;
    }
    if (!isVerified) {
      if (showErrors) setStatus("Please verify your phone number in Account before booking.", true);
      return false;
    }
    return true;
  };

  const createBooking = async (items) => {
    if (isPlacingOrder) return;
    isPlacingOrder = true;
    if (!window.GTStore?.client) {
      setStatus("Supabase 3 keys missing.", true);
      isPlacingOrder = false;
      return;
    }
    const session = await window.GTStore.getSession();
    if (!session) {
      try {
        sessionStorage.setItem("gt_return_to", window.location.href);
      } catch (error) {
        sessionStorage.setItem("gt_return_to", "checkout.html");
      }
      if (window.GTUI?.showNoticeModal) {
        window.GTUI.showNoticeModal({
          eyebrow: "Login Required",
          title: "Login First",
          message: "Please login first to place your order.",
          primaryAction: {
            label: "Login",
            href: "login.html"
          }
        });
      } else {
        setStatus("Please login to place order.", true);
      }
      isPlacingOrder = false;
      return;
    }
    const hasPhone = await ensurePhone(session);
    if (!hasPhone) {
      isPlacingOrder = false;
      return;
    }

    const offerSummary = await getOfferSummary(items);
    if (!ensureStockAvailable(items, offerSummary.bonusItems || [])) {
      isPlacingOrder = false;
      return;
    }

    const addressId = addressSelect?.value || "";
    if (!addressId) {
      setStatus("Please select a delivery address.", true);
      isPlacingOrder = false;
      return;
    }

    const { data: address } = await window.GTStore.client
      .from("addresses")
      .select("*")
      .eq("id", addressId)
      .maybeSingle();

    const orderNumber = `GT-${Date.now()}`;

    const { data: booking, error: bookingError } = await window.GTStore.client
      .from("bookings")
      .insert({
        user_id: session.user.id,
        order_number: orderNumber,
        total_amount: offerSummary.total,
        status: "order_placed",
        address_id: addressId,
        address_snapshot: address || null
      })
      .select()
      .maybeSingle();

    if (bookingError || !booking) {
      setStatus(bookingError?.message || "Unable to create booking.", true);
      isPlacingOrder = false;
      return;
    }

    const itemsPayload = items.map((item) => ({
      booking_id: booking.id,
      product_id: item.product_id,
      title: item.title,
      quantity: item.quantity,
      price: item.price
    })).concat((offerSummary.bonusItems || []).map((item) => ({
      booking_id: booking.id,
      product_id: item.product_id,
      title: `${item.title} (Offer Bonus)`,
      quantity: item.quantity,
      price: 0
    })));

    await window.GTStore.client.from("booking_items").insert(itemsPayload);

    await window.GTStore.client.from("payments").insert({
      user_id: session.user.id,
      booking_id: booking.id,
      transaction_id: `COD-${orderNumber}`,
      amount: offerSummary.total,
      status: "payment_pending",
      currency: "INR"
    });

    try {
      const supabaseUrl = window.GT_CONFIG?.supabase3?.url || "";
      const notifyUrl = supabaseUrl ? `${supabaseUrl}/functions/v1/admin-push` : "";
      if (notifyUrl) {
        await fetch(notifyUrl, {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            "Authorization": `Bearer ${session.access_token}`
          },
          body: JSON.stringify({ action: "notify", booking_id: booking.id })
        });
      }
    } catch (error) {
    }

    try {
      await updateCatalogStock(items.concat(offerSummary.bonusItems || []));
    } catch (error) {
      setStatus("Order placed, but stock sync failed. Update it from admin stocks.", true);
    }

    await window.GTStore.client.from("cart_items").delete().eq("user_id", session.user.id);
    localStorage.removeItem("gt_cart");
    window.GTStore.clearActiveOffer?.();
    try {
      sessionStorage.setItem("gt_last_order_success", JSON.stringify({
        booking_id: booking.id,
        order_number: orderNumber,
        created_at: booking.created_at || new Date().toISOString()
      }));
    } catch (error) {
    }
    setStatus(`Order placed. Booking ${orderNumber} saved as COD.`, false);
    setTimeout(() => {
      window.location.href = `order-success.html?booking=${encodeURIComponent(booking.id)}&order=${encodeURIComponent(orderNumber)}`;
    }, 700);
    isPlacingOrder = false;
  };

  const refresh = async () => {
    const cartItems = await window.GTStore.loadCart();
    const items = await getCanonicalItems(cartItems);
    await renderItems(items);
    await loadAddresses();
  };

  if (placeOrderBtn) {
    placeOrderBtn.addEventListener("click", async (event) => {
      event.preventDefault();
      const cartItems = await window.GTStore.loadCart();
      const items = await getCanonicalItems(cartItems);
      if (!items.length) return;
      await createBooking(items);
    });
  }

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", refresh);
  } else {
    refresh();
  }
})();
