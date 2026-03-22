(() => {
  const itemsEl = document.querySelector("[data-checkout-items]");
  const emptyNote = document.querySelector("[data-checkout-empty]");
  const subtotalEl = document.querySelector("[data-checkout-subtotal]");
  const shippingEl = document.querySelector("[data-checkout-shipping]");
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

  const ensureStockAvailable = (items) => {
    for (const item of items) {
      const title = item.title || "Product";
      const quantity = Number(item.quantity || 0);
      const stockQuantity = Number(item._stock_quantity || 0);
      if (item._is_active === false) {
        setStatus(`${title} is currently inactive and cannot be ordered.`, true);
        return false;
      }
      if (quantity > stockQuantity) {
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

  const renderItems = (items) => {
    if (!itemsEl) return;
    itemsEl.innerHTML = "";
    if (!items.length) {
      if (emptyNote) emptyNote.style.display = "block";
      updateSummary([]);
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
        <div class=\"cart-thumb\">
          <img src=\"${item.image_url || "assets/images/watch-classic.svg"}\" alt=\"${item.title || "Product"}\" />
        </div>
        <div class=\"cart-info\">
          <h4>${item.title || "Product"}</h4>
          <p class=\"small\">${optionText || "Standard selection"}</p>
          <p class=\"small\">Qty: ${item.quantity || 1}</p>
        </div>
        <div class=\"cart-price\">${formatPrice(item.price || 0)}</div>
      `;

      itemsEl.appendChild(row);
    });
    updateSummary(items);
  };

  const updateSummary = (items) => {
    const totals = calcTotals(items);
    if (subtotalEl) subtotalEl.textContent = formatPrice(totals.subtotal);
    if (shippingEl) shippingEl.textContent = totals.shipping === 0 ? "Free" : formatPrice(totals.shipping);
    if (totalEl) totalEl.textContent = formatPrice(totals.total);
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
        return `<option value=\"${addr.id}\">${addr.label || "Address"} - ${parts}</option>`;
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
      if (showErrors) {
        setStatus("Please add your phone number in Account before ordering.", true);
      }
      return false;
    }
    if (!isVerified) {
      if (showErrors) {
        setStatus("Please verify your phone number in Account before booking.", true);
      }
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
      setStatus("Please login to place order.", true);
      try {
        sessionStorage.setItem("gt_return_to", window.location.href);
      } catch (error) {
        sessionStorage.setItem("gt_return_to", "checkout.html");
      }
      window.location.href = "login.html";
      isPlacingOrder = false;
      return;
    }
    const hasPhone = await ensurePhone(session);
    if (!hasPhone) {
      isPlacingOrder = false;
      return;
    }
    if (!ensureStockAvailable(items)) {
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

    const totals = calcTotals(items);
    const orderNumber = `GT-${Date.now()}`;

    const { data: booking, error: bookingError } = await window.GTStore.client
      .from("bookings")
      .insert({
        user_id: session.user.id,
        order_number: orderNumber,
        total_amount: totals.total,
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
    }));

    await window.GTStore.client.from("booking_items").insert(itemsPayload);

    await window.GTStore.client.from("payments").insert({
      user_id: session.user.id,
      booking_id: booking.id,
      transaction_id: `COD-${orderNumber}`,
      amount: totals.total,
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
      // Notification failures should not block checkout.
    }

    try {
      await updateCatalogStock(items);
    } catch (error) {
      setStatus("Order placed, but stock sync failed. Update it from admin stocks.", true);
    }

    await window.GTStore.client.from("cart_items").delete().eq("user_id", session.user.id);
    localStorage.removeItem("gt_cart");
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
    renderItems(items);
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
