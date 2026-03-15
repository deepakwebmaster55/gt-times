(() => {
  const listEl = document.querySelector("[data-cart-items]");
  const subtotalEl = document.querySelector("[data-cart-subtotal]");
  const shippingEl = document.querySelector("[data-cart-shipping]");
  const totalEl = document.querySelector("[data-cart-total]");
  const checkoutBtn = document.querySelector("[data-cart-checkout]");
  const emptyNote = document.querySelector("[data-cart-empty]");
  const addressSelect = document.querySelector("[data-address-select]");
  const addressNote = document.querySelector("[data-address-note]");
  const statusEl = document.querySelector("[data-cart-status]");
  const loginPrompt = document.querySelector("[data-login-prompt]");

  const formatPrice = (value) => `Rs. ${Number(value || 0).toLocaleString()}`;

  const setStatus = (message, isError) => {
    if (!statusEl) return;
    statusEl.textContent = message;
    statusEl.style.color = isError ? "#c13a2e" : "";
  };

  const calcTotals = (items) => {
    const subtotal = items.reduce((sum, item) => sum + Number(item.price || 0) * Number(item.quantity || 0), 0);
    const shipping = subtotal >= 5000 ? 0 : items.length ? 199 : 0;
    const total = subtotal + shipping;
    return { subtotal, shipping, total };
  };

  const renderItems = (items) => {
    if (!listEl) return;
    listEl.innerHTML = "";

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
          <div class=\"cart-actions\">
            <div class=\"qty-box\">
              <button type=\"button\" data-qty-minus>-</button>
              <input type=\"number\" min=\"1\" max=\"10\" value=\"${item.quantity || 1}\" data-qty-input />
              <button type=\"button\" data-qty-plus>+</button>
            </div>
            <button class=\"btn btn-outline\" type=\"button\" data-remove>Remove</button>
          </div>
        </div>
        <div class=\"cart-price\">${formatPrice(item.price || 0)}</div>
      `;

      const minus = row.querySelector("[data-qty-minus]");
      const plus = row.querySelector("[data-qty-plus]");
      const input = row.querySelector("[data-qty-input]");
      const remove = row.querySelector("[data-remove]");
      const key = item.id || item.local_id;

      if (minus && plus && input) {
        minus.addEventListener("click", async () => {
          const qty = Math.max(1, Number(input.value || 1) - 1);
          input.value = String(qty);
          await window.GTStore.updateCartItem(key, { quantity: qty });
          await refresh();
        });
        plus.addEventListener("click", async () => {
          const qty = Math.min(10, Number(input.value || 1) + 1);
          input.value = String(qty);
          await window.GTStore.updateCartItem(key, { quantity: qty });
          await refresh();
        });
        input.addEventListener("change", async () => {
          const qty = Math.max(1, Math.min(10, Number(input.value || 1)));
          input.value = String(qty);
          await window.GTStore.updateCartItem(key, { quantity: qty });
          await refresh();
        });
      }
      if (remove) {
        remove.addEventListener("click", async () => {
          await window.GTStore.removeCartItem(key);
          await refresh();
        });
      }
      listEl.appendChild(row);
    });
    updateSummary(items);
  };

  const updateSummary = (items) => {
    const totals = calcTotals(items);
    if (subtotalEl) subtotalEl.textContent = formatPrice(totals.subtotal);
    if (shippingEl) shippingEl.textContent = totals.shipping === 0 ? "Free" : formatPrice(totals.shipping);
    if (totalEl) totalEl.textContent = formatPrice(totals.total);

    if (checkoutBtn) {
      checkoutBtn.classList.toggle("is-disabled", items.length === 0);
    }
  };

  const loadAddresses = async () => {
    if (!addressSelect || !window.GTStore?.client) return;
    const session = await window.GTStore.getSession();
    if (!session) {
      addressSelect.innerHTML = "<option value=\"\">Select address</option>";
      if (addressNote) addressNote.textContent = "Login to choose a saved address.";
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
  };

  const handleCheckout = async (items) => {
    const session = await window.GTStore.getSession();
    if (!session) {
      try {
        const checkoutUrl = new URL("checkout.html", window.location.href).href;
        sessionStorage.setItem("gt_return_to", checkoutUrl);
      } catch (error) {
        sessionStorage.setItem("gt_return_to", "checkout.html");
      }
      if (loginPrompt) loginPrompt.style.display = "block";
      setStatus("Login required to continue.", true);
      return;
    }
    if (loginPrompt) loginPrompt.style.display = "none";
    if (!items.length) return;
    window.location.href = "checkout.html";
  };

  const refresh = async () => {
    const items = await window.GTStore.loadCart();
    renderItems(items);
    await loadAddresses();
  };

  if (checkoutBtn) {
    checkoutBtn.addEventListener("click", async (event) => {
      event.preventDefault();
      const items = await window.GTStore.loadCart();
      await handleCheckout(items);
    });
  }

  if (loginPrompt) {
    const authLinks = loginPrompt.querySelectorAll("a");
    authLinks.forEach((link) => {
      link.addEventListener("click", () => {
        try {
          const checkoutUrl = new URL("checkout.html", window.location.href).href;
          sessionStorage.setItem("gt_return_to", checkoutUrl);
        } catch (error) {
          sessionStorage.setItem("gt_return_to", "checkout.html");
        }
      });
    });
  }

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", refresh);
  } else {
    refresh();
  }
})();
