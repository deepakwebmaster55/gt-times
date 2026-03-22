(() => {
  const statusEl = document.querySelector("[data-phone-page-status]");
  const summaryEl = document.querySelector("[data-phone-page-summary]");
  const sendForm = document.querySelector("[data-phone-page-send-form]");
  const verifyForm = document.querySelector("[data-phone-page-verify-form]");
  const resendBtn = document.querySelector("[data-phone-page-resend]");
  const sendBtn = document.querySelector("[data-phone-page-send-btn]");
  const phoneInput = document.querySelector("#verify-phone-number");
  const otpInputs = Array.from(document.querySelectorAll(".otp-box"));
  const storageKey = "gt_phone_verify_state";
  let requestedPhone = "";
  let requestedLogId = "";

  const setStatus = (text, isError) => {
    if (!statusEl) return;
    statusEl.textContent = text;
    statusEl.classList.toggle("is-error", !!isError);
    statusEl.classList.toggle("is-success", !isError);
  };

  const getClient = () => window.GTStore?.client || null;

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

  const getOtpValue = () => otpInputs.map((input) => input.value.trim()).join("");

  const clearOtpInputs = () => {
    otpInputs.forEach((input) => {
      input.value = "";
    });
  };

  const saveState = () => {
    try {
      sessionStorage.setItem(storageKey, JSON.stringify({
        requestedPhone,
        requestedLogId,
        phoneInput: phoneInput?.value || ""
      }));
    } catch (_error) {
    }
  };

  const clearState = () => {
    requestedPhone = "";
    requestedLogId = "";
    try {
      sessionStorage.removeItem(storageKey);
    } catch (_error) {
    }
  };

  const loadState = () => {
    try {
      const raw = sessionStorage.getItem(storageKey);
      const parsed = raw ? JSON.parse(raw) : null;
      if (!parsed || typeof parsed !== "object") return;
      requestedPhone = String(parsed.requestedPhone || "");
      requestedLogId = String(parsed.requestedLogId || "");
      if (phoneInput && parsed.phoneInput) {
        phoneInput.value = String(parsed.phoneInput);
      }
    } catch (_error) {
    }
  };

  const showVerifyForm = (visible) => {
    if (verifyForm) verifyForm.style.display = visible ? "block" : "none";
    if (resendBtn) resendBtn.disabled = !visible;
  };

  const syncSummary = (phone) => {
    if (!summaryEl) return;
    summaryEl.textContent = phone
      ? `We've sent a 6-digit verification code to ${phone}.`
      : "We will send a 6-digit verification code to your phone.";
  };

  const ensureProfilePhone = async (client, session, originalPhone, normalizedPhone) => {
    const { error } = await client.from("profiles").upsert({
      id: session.user.id,
      phone: originalPhone,
      phone_e164: normalizedPhone,
      phone_verified: false,
      phone_verified_at: null,
      verified_phone: null,
      email: session.user.email || null
    });
    if (error) throw error;
  };

  const sendOtp = async (phone, session, client) => {
    const normalizedPhone = normalizePhone(phone);
    if (!normalizedPhone) {
      throw new Error("Enter a valid mobile number.");
    }
    await ensureProfilePhone(client, session, phone, normalizedPhone);
    const result = await callPhoneVerification(session, { action: "send", phone: normalizedPhone });
    requestedPhone = normalizedPhone;
    requestedLogId = String(result?.log_id || "").trim();
    if (phoneInput) phoneInput.value = phone;
    saveState();
    syncSummary(normalizedPhone);
    showVerifyForm(true);
    clearOtpInputs();
    if (otpInputs[0]) otpInputs[0].focus();
    setStatus(`OTP sent to ${normalizedPhone}.`, false);
  };

  const boot = async () => {
    const client = getClient();
    if (!client || !window.GTStore?.getSession) {
      setStatus("Supabase auth is not configured correctly.", true);
      return;
    }

    const session = await window.GTStore.getSession();
    if (!session) {
      sessionStorage.setItem("gt_return_to", "verify-phone.html");
      window.location.href = "login.html";
      return;
    }

    const { data: profile } = await client
      .from("profiles")
      .select("phone, phone_e164, phone_verified")
      .eq("id", session.user.id)
      .maybeSingle();

    const savedPhone = profile?.phone || profile?.phone_e164 || "";
    const normalizedPhone = normalizePhone(savedPhone);
    loadState();
    if (phoneInput && savedPhone) {
      phoneInput.value = savedPhone;
      if (!requestedPhone) requestedPhone = normalizedPhone;
    }
    syncSummary(requestedPhone || normalizedPhone);
    showVerifyForm(!!requestedLogId);
    if (profile?.phone_verified && normalizedPhone) {
      clearState();
      showVerifyForm(false);
      setStatus(`This number is already verified: ${normalizedPhone}`, false);
      if (summaryEl) {
        summaryEl.textContent = `Your verified number ${normalizedPhone} is already linked to this account.`;
      }
    }
  };

  sendForm?.addEventListener("submit", async (event) => {
    event.preventDefault();
    const client = getClient();
    const session = await window.GTStore.getSession();
    if (!client || !session) return;
    if (sendBtn) sendBtn.disabled = true;
    try {
      await sendOtp(phoneInput?.value || "", session, client);
    } catch (error) {
      setStatus(error.message || "Unable to send OTP.", true);
    } finally {
      if (sendBtn) sendBtn.disabled = false;
    }
  });

  resendBtn?.addEventListener("click", async () => {
    const client = getClient();
    const session = await window.GTStore.getSession();
    if (!client || !session) return;
    resendBtn.disabled = true;
    try {
      await sendOtp(phoneInput?.value || requestedPhone, session, client);
    } catch (error) {
      setStatus(error.message || "Unable to resend OTP.", true);
    } finally {
      resendBtn.disabled = false;
    }
  });

  verifyForm?.addEventListener("submit", async (event) => {
    event.preventDefault();
    const client = getClient();
    const session = await window.GTStore.getSession();
    if (!client || !session) return;

    const rawPhone = phoneInput?.value || requestedPhone;
    const normalizedPhone = normalizePhone(rawPhone);
    const otp = getOtpValue().replace(/\D/g, "");
    if (!normalizedPhone) {
      setStatus("Enter a valid mobile number first.", true);
      return;
    }
    if (otp.length !== 6) {
      setStatus("Enter the full 6-digit OTP.", true);
      return;
    }
    if (!requestedLogId) {
      setStatus("Please request a fresh OTP first.", true);
      return;
    }

    try {
      await callPhoneVerification(session, {
        action: "verify",
        phone: normalizedPhone,
        otp,
        log_id: requestedLogId
      });
      clearOtpInputs();
      clearState();
      showVerifyForm(false);
      setStatus("Phone number verified. Redirecting to your account...", false);
      if (summaryEl) {
        summaryEl.textContent = `Your number ${normalizedPhone} is now verified and ready for COD orders.`;
      }
      setTimeout(() => {
        window.location.href = "account.html";
      }, 900);
    } catch (error) {
      setStatus(error.message || "OTP verification failed.", true);
    }
  });

  otpInputs.forEach((input, index) => {
    input.addEventListener("input", () => {
      input.value = input.value.replace(/\D/g, "").slice(0, 1);
      if (input.value && index < otpInputs.length - 1) {
        otpInputs[index + 1].focus();
      }
    });
    input.addEventListener("keydown", (event) => {
      if (event.key === "Backspace" && !input.value && index > 0) {
        otpInputs[index - 1].focus();
      }
    });
    input.addEventListener("paste", (event) => {
      const pasted = (event.clipboardData?.getData("text") || "").replace(/\D/g, "").slice(0, otpInputs.length);
      if (!pasted) return;
      event.preventDefault();
      pasted.split("").forEach((digit, digitIndex) => {
        if (otpInputs[digitIndex]) {
          otpInputs[digitIndex].value = digit;
        }
      });
      const targetIndex = Math.min(pasted.length, otpInputs.length) - 1;
      if (otpInputs[targetIndex]) otpInputs[targetIndex].focus();
    });
  });

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", boot);
  } else {
    boot();
  }
})();
