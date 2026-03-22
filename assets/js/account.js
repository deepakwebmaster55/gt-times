(() => {
  const statusEl = document.querySelector("[data-account-status]");
  const authSection = document.querySelector("[data-auth-section]");
  const profileSection = document.querySelector("[data-profile-section]");
  const bookingsSection = document.querySelector("[data-booking-section]");
  const paymentsSection = document.querySelector("[data-payment-section]");
  const addressSection = document.querySelector("[data-address-section]");
  const addressModeEl = document.querySelector("[data-address-form-mode]");
  const addressForm = document.querySelector("[data-address-form]");
  const addressSubmitBtn = document.querySelector("[data-address-submit]");
  const addressCancelBtn = document.querySelector("[data-address-cancel]");
  const profileForm = document.querySelector("[data-profile-form]");
  const phoneVerifyForm = document.querySelector("[data-phone-verify-form]");
  const phoneSummaryEl = document.querySelector("[data-phone-verify-summary]");
  const phoneBadgeEl = document.querySelector("[data-phone-verify-badge]");
  const sendOtpBtn = document.querySelector("[data-send-phone-otp]");
  let editingAddressId = "";
  let currentProfile = null;
  let phoneOtpRequestedFor = "";

  const setStatus = (text, isError) => {
    if (!statusEl) return;
    statusEl.textContent = text;
    statusEl.classList.toggle("is-error", !!isError);
    statusEl.classList.toggle("is-success", !isError);
  };

  const getClient = () => window.GTStore && window.GTStore.client;

  const normalizePhone = (value) => {
    const digits = String(value || "").replace(/\D/g, "");
    if (!digits) return "";
    if (digits.startsWith("91") && digits.length === 12) return `+${digits}`;
    if (digits.length === 10) return `+91${digits}`;
    if (digits.length >= 11 && digits.length <= 15) return `+${digits}`;
    return "";
  };

  const getOtpFunctionUrl = () => {
    const url = window.GT_CONFIG?.supabase3?.url || "";
    return url ? `${url}/functions/v1/phone-verification` : "";
  };

  const callPhoneVerification = async (session, payload) => {
    const endpoint = getOtpFunctionUrl();
    if (!endpoint) {
      throw new Error("Supabase 3 URL missing in assets/js/config.js");
    }
    const response = await fetch(endpoint, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${session.access_token}`
      },
      body: JSON.stringify(payload)
    });
    const result = await response.json().catch(() => ({}));
    if (!response.ok) {
      throw new Error(result?.error || "Phone verification request failed.");
    }
    return result;
  };

  const getAddressFormValues = () => {
    if (!addressForm) return null;
    return {
      addressId: addressForm.querySelector("[name=\"address_id\"]")?.value?.trim() || "",
      label: addressForm.querySelector("[name=\"label\"]")?.value?.trim() || "",
      line1: addressForm.querySelector("[name=\"line1\"]")?.value?.trim() || "",
      line2: addressForm.querySelector("[name=\"line2\"]")?.value?.trim() || "",
      city: addressForm.querySelector("[name=\"city\"]")?.value?.trim() || "",
      state: addressForm.querySelector("[name=\"state\"]")?.value?.trim() || "",
      postal_code: addressForm.querySelector("[name=\"postal_code\"]")?.value?.trim() || "",
      country: addressForm.querySelector("[name=\"country\"]")?.value?.trim() || "India",
      is_default: !!addressForm.querySelector("[name=\"is_default\"]")?.checked
    };
  };

  const resetAddressForm = () => {
    if (!addressForm) return;
    addressForm.reset();
    const hiddenInput = addressForm.querySelector("[name=\"address_id\"]");
    if (hiddenInput) hiddenInput.value = "";
    editingAddressId = "";
    if (addressModeEl) addressModeEl.textContent = "Add a new address";
    if (addressSubmitBtn) addressSubmitBtn.textContent = "Add Address";
    if (addressCancelBtn) addressCancelBtn.style.display = "none";
  };

  const startAddressEdit = (address) => {
    if (!addressForm) return;
    editingAddressId = String(address.id || "");
    const hiddenInput = addressForm.querySelector("[name=\"address_id\"]");
    if (hiddenInput) hiddenInput.value = editingAddressId;
    addressForm.querySelector("[name=\"label\"]").value = address.label || "";
    addressForm.querySelector("[name=\"line1\"]").value = address.line1 || "";
    addressForm.querySelector("[name=\"line2\"]").value = address.line2 || "";
    addressForm.querySelector("[name=\"city\"]").value = address.city || "";
    addressForm.querySelector("[name=\"state\"]").value = address.state || "";
    addressForm.querySelector("[name=\"postal_code\"]").value = address.postal_code || "";
    addressForm.querySelector("[name=\"country\"]").value = address.country || "India";
    addressForm.querySelector("[name=\"is_default\"]").checked = !!address.is_default;
    if (addressModeEl) addressModeEl.textContent = `Editing: ${address.label || "Address"}`;
    if (addressSubmitBtn) addressSubmitBtn.textContent = "Update Address";
    if (addressCancelBtn) addressCancelBtn.style.display = "inline-flex";
    addressForm.scrollIntoView({ behavior: "smooth", block: "nearest" });
  };

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

  const initLogout = () => {
    const logoutBtn = document.querySelector("[data-logout]");
    if (!logoutBtn) return;
    logoutBtn.addEventListener("click", async () => {
      const client = requireClient();
      if (!client) return;
      const { error } = await client.auth.signOut();
      if (error) {
        setStatus(error.message, true);
        return;
      }
      setStatus("Logged out successfully.", false);
      window.location.href = "login.html";
    });
  };

  const fillProfile = (profile, session) => {
    const nameInput = document.querySelector("#profile-name");
    const phoneInput = document.querySelector("#profile-phone");
    const emailInput = document.querySelector("#profile-email");
    if (nameInput) nameInput.value = profile?.full_name || "";
    if (phoneInput) phoneInput.value = profile?.phone || "";
    if (emailInput) emailInput.value = session?.user?.email || profile?.email || "";
    renderPhoneVerification(profile);
  };

  const renderPhoneVerification = (profile) => {
    currentProfile = profile || null;
    const formPhone = profileForm?.querySelector("#profile-phone")?.value?.trim() || profile?.phone || "";
    const normalized = normalizePhone(formPhone);
    const isVerified = !!(profile?.phone_verified && normalized && normalized === profile?.phone_e164);
    phoneOtpRequestedFor = isVerified ? normalized : phoneOtpRequestedFor;

    if (phoneBadgeEl) {
      phoneBadgeEl.textContent = isVerified ? "Verified" : "Not verified";
      phoneBadgeEl.classList.toggle("success", isVerified);
      phoneBadgeEl.classList.toggle("danger", !isVerified && !!normalized);
      phoneBadgeEl.classList.toggle("info", !normalized);
    }

    if (phoneSummaryEl) {
      if (!normalized) {
        phoneSummaryEl.textContent = "Add a valid mobile number in your profile first.";
      } else if (isVerified) {
        const verifiedDate = profile?.phone_verified_at
          ? new Date(profile.phone_verified_at).toLocaleDateString()
          : "";
        phoneSummaryEl.textContent = verifiedDate
          ? `Your number ${normalized} is verified and linked to this account since ${verifiedDate}.`
          : `Your number ${normalized} is verified and linked to this account.`;
      } else if (profile?.verified_phone && profile.verified_phone !== normalized) {
        phoneSummaryEl.textContent = `You changed your phone to ${normalized}. Verify this new number before booking.`;
      } else {
        phoneSummaryEl.textContent = `Verify ${normalized} once with OTP. After that, future bookings will not ask again.`;
      }
    }

    if (sendOtpBtn) {
      sendOtpBtn.textContent = isVerified ? "Verified" : "Send OTP";
      sendOtpBtn.disabled = isVerified || !normalized;
    }

    const otpInput = phoneVerifyForm?.querySelector("[name=\"otp\"]");
    if (otpInput) {
      otpInput.disabled = isVerified || !normalized;
      if (isVerified) otpInput.value = "";
    }
    const verifyBtn = phoneVerifyForm?.querySelector("[data-confirm-phone-otp]");
    if (verifyBtn) {
      verifyBtn.disabled = isVerified || !normalized;
    }
  };

  const extractProfileDefaults = (session, overrides = {}) => {
    const meta = session?.user?.user_metadata || {};
    const phone = overrides.phone || meta.phone || "";
    return {
      full_name: overrides.full_name || meta.full_name || meta.name || "",
      phone,
      phone_e164: normalizePhone(phone),
      email: overrides.email || session?.user?.email || ""
    };
  };

  const ensureProfile = async (client, session, overrides = {}) => {
    if (!session?.user?.id) return null;
    const defaults = extractProfileDefaults(session, overrides);
    const { data } = await client.from("profiles").select("*").eq("id", session.user.id).maybeSingle();
    if (!data) {
      const profile = {
        id: session.user.id,
        full_name: defaults.full_name,
        phone: defaults.phone,
        phone_e164: defaults.phone_e164,
        email: defaults.email,
        phone_verified: false,
        verified_phone: null,
        phone_verified_at: null
      };
      await client.from("profiles").upsert(profile);
      return profile;
    }
    return data;
  };

  const loadProfile = async (client, session) => ensureProfile(client, session);

  const saveProfile = async (client, session) => {
    const fullName = profileForm?.querySelector("#profile-name")?.value.trim() || "";
    const phone = profileForm?.querySelector("#profile-phone")?.value.trim() || "";
    const email = profileForm?.querySelector("#profile-email")?.value.trim() || "";
    const phoneE164 = normalizePhone(phone);
    const verifiedPhone = currentProfile?.verified_phone || null;
    const keepVerified = !!(currentProfile?.phone_verified && verifiedPhone && verifiedPhone === phoneE164);
    const payload = {
      id: session.user.id,
      full_name: fullName,
      phone,
      phone_e164: phoneE164 || null,
      email,
      phone_verified: keepVerified,
      verified_phone: keepVerified ? verifiedPhone : null,
      phone_verified_at: keepVerified ? currentProfile?.phone_verified_at || new Date().toISOString() : null
    };
    const { data, error } = await client.from("profiles").upsert(payload).select("*").maybeSingle();
    if (error) {
      throw error;
    }
    currentProfile = data || payload;
    renderPhoneVerification(currentProfile);
    return currentProfile;
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
        <div class="address-actions">
          <button class="btn btn-outline" type="button" data-edit-address>Edit</button>
          <button class="btn btn-secondary" type="button" data-default-address>Default</button>
          <button class="btn btn-outline" type="button" data-remove-address>Remove</button>
        </div>
      `;
      const editBtn = card.querySelector("[data-edit-address]");
      const defaultBtn = card.querySelector("[data-default-address]");
      const removeBtn = card.querySelector("[data-remove-address]");
      if (editBtn) {
        editBtn.addEventListener("click", () => startAddressEdit(address));
      }
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
          if (editingAddressId && String(address.id) === editingAddressId) {
            resetAddressForm();
          }
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
      const statusLabel = window.GTTracking?.getOrderLabel(row.status) || row.status || "Pending";
      item.innerHTML = `
        <div>
          <strong>${row.order_number || "Order"}</strong>
          <p>${date} · ${statusLabel}</p>
        </div>
        <div class="history-amount">Rs. ${Number(row.total_amount || 0).toLocaleString()}</div>
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
      const statusLabel = window.GTTracking?.getPaymentLabel(row.status) || row.status || "Pending";
      item.innerHTML = `
        <div>
          <strong>${row.transaction_id || "Transaction"}</strong>
          <p>${date} · ${statusLabel}</p>
        </div>
        <div class="history-amount">Rs. ${Number(row.amount || 0).toLocaleString()}</div>
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
    if (!profileForm) return;
    const phoneInput = profileForm.querySelector("#profile-phone");
    phoneInput?.addEventListener("input", () => {
      renderPhoneVerification({
        ...(currentProfile || {}),
        phone: phoneInput.value.trim(),
        phone_e164: normalizePhone(phoneInput.value.trim())
      });
    });

    profileForm.addEventListener("submit", async (event) => {
      event.preventDefault();
      const client = requireClient();
      if (!client) return;
      const session = await window.GTStore.getSession();
      if (!session) return;
      try {
        const profile = await saveProfile(client, session);
        const changedVerification = !!(profile.phone && !profile.phone_verified);
        setStatus(
          changedVerification
            ? "Profile updated. Verify this phone number before booking."
            : "Profile updated.",
          false
        );
      } catch (error) {
        setStatus(error.message || "Unable to update profile.", true);
      }
    });
  };

  const initPhoneVerification = () => {
    if (!phoneVerifyForm) return;

    sendOtpBtn?.addEventListener("click", async () => {
      const client = requireClient();
      if (!client) return;
      const session = await window.GTStore.getSession();
      if (!session) return;
      try {
        const profile = await saveProfile(client, session);
        const normalizedPhone = normalizePhone(profile?.phone || "");
        if (!normalizedPhone) {
          setStatus("Enter a valid mobile number and save it first.", true);
          return;
        }
        await callPhoneVerification(session, { action: "send", phone: normalizedPhone });
        phoneOtpRequestedFor = normalizedPhone;
        setStatus(`OTP sent to ${normalizedPhone}. Enter it below to complete verification.`, false);
      } catch (error) {
        setStatus(error.message || "Unable to send OTP.", true);
      }
    });

    phoneVerifyForm.addEventListener("submit", async (event) => {
      event.preventDefault();
      const client = requireClient();
      if (!client) return;
      const session = await window.GTStore.getSession();
      if (!session) return;
      const otp = phoneVerifyForm.querySelector("[name=\"otp\"]")?.value?.trim() || "";
      const normalizedPhone = normalizePhone(profileForm?.querySelector("#profile-phone")?.value?.trim() || "");
      if (!normalizedPhone) {
        setStatus("Enter a valid mobile number first.", true);
        return;
      }
      if (phoneOtpRequestedFor && phoneOtpRequestedFor !== normalizedPhone) {
        setStatus("Phone number changed. Please send a new OTP.", true);
        return;
      }
      try {
        const result = await callPhoneVerification(session, {
          action: "verify",
          phone: normalizedPhone,
          otp
        });
        const { data } = await client.from("profiles").select("*").eq("id", session.user.id).maybeSingle();
        currentProfile = data || {
          ...(currentProfile || {}),
          phone: normalizedPhone,
          phone_e164: normalizedPhone,
          phone_verified: true,
          verified_phone: normalizedPhone,
          phone_verified_at: result.verified_at || new Date().toISOString()
        };
        renderPhoneVerification(currentProfile);
        phoneVerifyForm.reset();
        setStatus("Phone number verified. Future bookings on this number will not ask again.", false);
      } catch (error) {
        setStatus(error.message || "OTP verification failed.", true);
      }
    });
  };

  const initAddressForm = () => {
    if (!addressForm) return;
    if (addressCancelBtn) {
      addressCancelBtn.addEventListener("click", () => {
        resetAddressForm();
        setStatus("Address edit cancelled.", false);
      });
    }
    addressForm.addEventListener("submit", async (event) => {
      event.preventDefault();
      const client = requireClient();
      if (!client) return;
      const session = await window.GTStore.getSession();
      if (!session) return;
      const formValues = getAddressFormValues();
      const payload = {
        user_id: session.user.id,
        label: formValues.label,
        line1: formValues.line1,
        line2: formValues.line2,
        city: formValues.city,
        state: formValues.state,
        postal_code: formValues.postal_code,
        country: formValues.country,
        is_default: formValues.is_default
      };
      if (!payload.label || !payload.line1) {
        setStatus("Please add address label and line 1.", true);
        return;
      }
      if (payload.is_default) {
        await client.from("addresses").update({ is_default: false }).eq("user_id", session.user.id);
      }
      let error = null;
      if (formValues.addressId) {
        ({ error } = await client.from("addresses").update(payload).eq("id", formValues.addressId).eq("user_id", session.user.id));
      } else {
        ({ error } = await client.from("addresses").insert(payload));
      }
      if (error) {
        setStatus(error.message, true);
        return;
      }
      setStatus(formValues.addressId ? "Address updated." : "Address added.", false);
      resetAddressForm();
      await loadAddresses();
    });
  };

  const boot = async () => {
    const client = getClient();
    initProfileForm();
    initPhoneVerification();
    initAddressForm();
    initLogout();

    const session = await window.GTStore.getSession();
    if (session && client) {
      if (maybeRedirect()) return;
      toggleSections(true);
      const profile = await loadProfile(client, session);
      currentProfile = profile;
      fillProfile(profile, session);
      resetAddressForm();
      await loadAddresses();
      await loadHistory();
    } else {
      toggleSections(false);
      setStatus("You are not logged in.", true);
    }

    if (client) {
      client.auth.onAuthStateChange(async (_event, sessionNext) => {
        if (sessionNext) {
          if (maybeRedirect()) return;
          toggleSections(true);
          const profile = await loadProfile(client, sessionNext);
          currentProfile = profile;
          fillProfile(profile, sessionNext);
          resetAddressForm();
          await loadAddresses();
          await loadHistory();
        } else {
          toggleSections(false);
          currentProfile = null;
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
