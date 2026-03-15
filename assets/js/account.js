(() => {
  const statusEl = document.querySelector("[data-account-status]");
  const authSection = document.querySelector("[data-auth-section]");
  const profileSection = document.querySelector("[data-profile-section]");
  const bookingsSection = document.querySelector("[data-booking-section]");
  const paymentsSection = document.querySelector("[data-payment-section]");
  const addressSection = document.querySelector("[data-address-section]");

  const setStatus = (text, isError) => {
    if (!statusEl) return;
    statusEl.textContent = text;
    statusEl.classList.toggle("is-error", !!isError);
    statusEl.classList.toggle("is-success", !isError);
  };

  const getClient = () => window.GTStore && window.GTStore.client;

  const requireClient = () => {
    const client = getClient();
    if (!client) {
      setStatus("Supabase 3 keys missing in assets/js/config.js", true);
      return null;
    }
    return client;
  };

  const toggleSections = (authed) => {
    if (authSection) authSection.style.display = authed ? "none" : "block";
    if (profileSection) profileSection.style.display = authed ? "block" : "none";
    if (addressSection) addressSection.style.display = authed ? "block" : "none";
    if (bookingsSection) bookingsSection.style.display = authed ? "block" : "none";
    if (paymentsSection) paymentsSection.style.display = authed ? "block" : "none";
  };

  const getReturnTo = () => {
    const stored = sessionStorage.getItem("gt_return_to");
    if (!stored) return "";
    if (stored.includes("login.html") || stored.includes("signup.html") || stored.includes("account.html")) {
      return "";
    }
    return stored;
  };

  const maybeRedirect = () => {
    const target = getReturnTo();
    if (!target) return false;
    sessionStorage.removeItem("gt_return_to");
    window.location.href = target;
    return true;
  };

  const fillProfile = (profile, session) => {
    const nameInput = document.querySelector("#profile-name");
    const phoneInput = document.querySelector("#profile-phone");
    const emailInput = document.querySelector("#profile-email");
    if (nameInput) nameInput.value = profile?.full_name || "";
    if (phoneInput) phoneInput.value = profile?.phone || "";
    if (emailInput) emailInput.value = session?.user?.email || profile?.email || "";
  };

  const extractProfileDefaults = (session, overrides = {}) => {
    const meta = session?.user?.user_metadata || {};
    return {
      full_name: overrides.full_name || meta.full_name || meta.name || "",
      phone: overrides.phone || meta.phone || "",
      email: overrides.email || session?.user?.email || ""
    };
  };

  const ensureProfile = async (client, session, overrides = {}) => {
    if (!session?.user?.id) return null;
    const defaults = extractProfileDefaults(session, overrides);
    const { data } = await client.from("profiles").select("*").eq("id", session.user.id).maybeSingle();
    if (!data) {
      await client.from("profiles").upsert({
        id: session.user.id,
        full_name: defaults.full_name,
        phone: defaults.phone,
        email: defaults.email
      });
      return defaults;
    }
    return data;
  };

  const loadProfile = async (client, session) => {
    return ensureProfile(client, session);
  };

  const renderAddresses = (addresses) => {
    const list = document.querySelector("[data-address-list]");
    if (!list) return;
    list.innerHTML = "";
    if (!addresses.length) {
      list.innerHTML = "<p class=\"empty-note\">No saved addresses yet.</p>";
      return;
    }
    addresses.forEach((address) => {
      const card = document.createElement("div");
      card.className = "address-card";
      card.innerHTML = `
        <div>
          <h4>${address.label || "Address"}</h4>
          <p>${address.line1 || ""}${address.line2 ? ", " + address.line2 : ""}</p>
          <p>${address.city || ""}${address.state ? ", " + address.state : ""} ${address.postal_code || ""}</p>
          <p>${address.country || ""}</p>
        </div>
        <div class=\"address-actions\">
          <button class=\"btn btn-secondary\" type=\"button\" data-default-address>Default</button>
          <button class=\"btn btn-outline\" type=\"button\" data-remove-address>Remove</button>
        </div>
      `;
      const defaultBtn = card.querySelector("[data-default-address]");
      const removeBtn = card.querySelector("[data-remove-address]");
      if (defaultBtn) {
        defaultBtn.disabled = !!address.is_default;
        defaultBtn.textContent = address.is_default ? "Default" : "Set Default";
        defaultBtn.addEventListener("click", async () => {
          const client = requireClient();
          if (!client) return;
          await client.from("addresses").update({ is_default: false }).eq("user_id", address.user_id);
          await client.from("addresses").update({ is_default: true }).eq("id", address.id);
          await loadAddresses();
        });
      }
      if (removeBtn) {
        removeBtn.addEventListener("click", async () => {
          const client = requireClient();
          if (!client) return;
          await client.from("addresses").delete().eq("id", address.id);
          await loadAddresses();
        });
      }
      list.appendChild(card);
    });
  };

  const loadAddresses = async () => {
    const client = requireClient();
    if (!client) return;
    const session = await window.GTStore.getSession();
    if (!session) return;
    const { data, error } = await client
      .from("addresses")
      .select("*")
      .eq("user_id", session.user.id)
      .order("created_at", { ascending: true });
    if (error) {
      setStatus(error.message, true);
      return;
    }
    renderAddresses(data || []);
  };

  const renderBookings = (rows) => {
    const list = document.querySelector("[data-booking-list]");
    if (!list) return;
    list.innerHTML = "";
    if (!rows.length) {
      list.innerHTML = "<p class=\"empty-note\">No bookings yet.</p>";
      return;
    }
    rows.forEach((row) => {
      const item = document.createElement("div");
      item.className = "history-row";
      const date = row.created_at ? new Date(row.created_at).toLocaleDateString() : "";
      item.innerHTML = `
        <div>
          <strong>${row.order_number || "Order"}</strong>
          <p>${date} · ${row.status || ""}</p>
        </div>
        <div class=\"history-amount\">Rs. ${Number(row.total_amount || 0).toLocaleString()}</div>
      `;
      list.appendChild(item);
    });
  };

  const renderPayments = (rows) => {
    const list = document.querySelector("[data-payment-list]");
    if (!list) return;
    list.innerHTML = "";
    if (!rows.length) {
      list.innerHTML = "<p class=\"empty-note\">No payments yet.</p>";
      return;
    }
    rows.forEach((row) => {
      const item = document.createElement("div");
      item.className = "history-row";
      const date = row.created_at ? new Date(row.created_at).toLocaleDateString() : "";
      item.innerHTML = `
        <div>
          <strong>${row.transaction_id || "Transaction"}</strong>
          <p>${date} · ${row.status || ""}</p>
        </div>
        <div class=\"history-amount\">Rs. ${Number(row.amount || 0).toLocaleString()}</div>
      `;
      list.appendChild(item);
    });
  };

  const loadHistory = async () => {
    const client = requireClient();
    if (!client) return;
    const session = await window.GTStore.getSession();
    if (!session) return;
    const { data: bookings } = await client.from("bookings").select("*").eq("user_id", session.user.id).order("created_at", { ascending: false });
    const { data: payments } = await client.from("payments").select("*").eq("user_id", session.user.id).order("created_at", { ascending: false });
    renderBookings(bookings || []);
    renderPayments(payments || []);
  };

  const initProfileForm = () => {
    const profileForm = document.querySelector("[data-profile-form]");
    if (!profileForm) return;
    profileForm.addEventListener("submit", async (event) => {
      event.preventDefault();
      const client = requireClient();
      if (!client) return;
      const session = await window.GTStore.getSession();
      if (!session) return;
      const fullName = profileForm.querySelector("#profile-name").value.trim();
      const phone = profileForm.querySelector("#profile-phone").value.trim();
      const email = profileForm.querySelector("#profile-email").value.trim();
      await client.from("profiles").upsert({
        id: session.user.id,
        full_name: fullName,
        phone,
        email
      });
      setStatus("Profile updated.", false);
    });
  };

  const initAddressForm = () => {
    const addressForm = document.querySelector("[data-address-form]");
    if (!addressForm) return;
    addressForm.addEventListener("submit", async (event) => {
      event.preventDefault();
      const client = requireClient();
      if (!client) return;
      const session = await window.GTStore.getSession();
      if (!session) return;
      const payload = {
        user_id: session.user.id,
        label: addressForm.querySelector("[name=\"label\"]").value.trim(),
        line1: addressForm.querySelector("[name=\"line1\"]").value.trim(),
        line2: addressForm.querySelector("[name=\"line2\"]").value.trim(),
        city: addressForm.querySelector("[name=\"city\"]").value.trim(),
        state: addressForm.querySelector("[name=\"state\"]").value.trim(),
        postal_code: addressForm.querySelector("[name=\"postal_code\"]").value.trim(),
        country: addressForm.querySelector("[name=\"country\"]").value.trim() || "India",
        is_default: addressForm.querySelector("[name=\"is_default\"]").checked
      };
      if (!payload.label || !payload.line1) {
        setStatus("Please add address label and line 1.", true);
        return;
      }
      if (payload.is_default) {
        await client.from("addresses").update({ is_default: false }).eq("user_id", session.user.id);
      }
      const { error } = await client.from("addresses").insert(payload);
      if (error) {
        setStatus(error.message, true);
        return;
      }
      addressForm.reset();
      await loadAddresses();
    });
  };

  const boot = async () => {
    const client = getClient();
    initProfileForm();
    initAddressForm();

    const session = await window.GTStore.getSession();
    if (session && client) {
      if (maybeRedirect()) return;
      toggleSections(true);
      const profile = await loadProfile(client, session);
      fillProfile(profile, session);
      await loadAddresses();
      await loadHistory();
    } else {
      toggleSections(false);
      setStatus("You are not logged in.", true);
    }

    if (client) {
      client.auth.onAuthStateChange(async (event, sessionNext) => {
        if (sessionNext) {
          if (maybeRedirect()) return;
          toggleSections(true);
          const profile = await loadProfile(client, sessionNext);
          fillProfile(profile, sessionNext);
          await loadAddresses();
          await loadHistory();
        } else {
          toggleSections(false);
          setStatus("You are not logged in.", true);
        }
      });
    }
  };

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", boot);
  } else {
    boot();
  }
})();
